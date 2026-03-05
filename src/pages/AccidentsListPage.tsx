// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  IconEye,
  IconTrash,
  IconPlus,
  IconFilter,
  IconFileDownload,
  IconDownload,
  IconFileText,
  IconFileTypePdf,
  IconFileTypeXls,
  IconX,
} from '@tabler/icons-react';
import {
  Container,
  Paper,
  Table,
  Title,
  Badge,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Loader,
  Center,
  Pagination,
  Tooltip,
  Alert,
  Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const ACCIDENT_TYPES = [
  'VEHICLE_COLLISION',
  'FALLING_POLE',
  'VANDALISM',
  'NATURAL_DISASTER',
  'ELECTRICAL_FAULT',
  'OTHER',
];

const ACCIDENT_STATUSES = [
  'REPORTED',
  'INSPECTED',
  'SUPERVISOR_REVIEW',
  'FINANCE_REVIEW',
  'APPROVED',
  'REJECTED',
  'UNDER_REPAIR',
  'COMPLETED',
];

const CLAIM_STATUSES = [
  'NOT_SUBMITTED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PAID',
];

const REPORTER_TYPES = ['INTERNAL', 'EXTERNAL'] as const;

function getAccidentStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'REPORTED':
      return 'gray';
    case 'INSPECTED':
      return 'blue';
    case 'SUPERVISOR_REVIEW':
      return 'orange';
    case 'FINANCE_REVIEW':
      return 'yellow';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'UNDER_REPAIR':
      return 'purple';
    case 'COMPLETED':
      return 'teal';
    default:
      return 'gray';
  }
}

function getClaimStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'NOT_SUBMITTED':
      return 'gray';
    case 'SUBMITTED':
      return 'blue';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'PAID':
      return 'teal';
    default:
      return 'gray';
  }
}

export default function AccidentsListPage() {
  const { t } = useTranslation('accidentsList');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Debug logging
  console.log('AccidentsListPage User:', user);
  console.log('User role check for create button:', (user?.role === 'ADMIN' || user?.role === 'INSPECTOR'));

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    accidentType: '',
    status: '',
    claimStatus: '',
    reporterType: '',
    poleId: '',
    page: 1,
    limit: 10,
  });

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState<string | null>(null);

  // Fetch accidents
  const { data: accidentsData, isLoading, error } = useQuery({
    queryKey: ['accidents', filters],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await axios.get(`http://localhost:3011/api/v1/accidents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem('access_token');
      return axios.delete(`http://localhost:3011/api/v1/accidents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.deleteSuccess'),
        color: 'green',
      });
      setDeleteModalOpen(false);
      setAccidentToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.deleteError'),
        color: 'red',
      });
    },
  });

  // Download report mutation
  const downloadReportMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => {
      const token = localStorage.getItem('access_token');
      return axios.get(`http://localhost:3011/api/v1/accidents/${id}/reports/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });
    },
    onSuccess: (data, { id, type }) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.downloadError'),
        color: 'red',
      });
    },
  });

  const handleDelete = (id: string) => {
    setAccidentToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (accidentToDelete) {
      deleteMutation.mutate(accidentToDelete);
    }
  };

  const handleDownloadReport = (id: string, type: string) => {
    downloadReportMutation.mutate({ id, type });
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      accidentType: null,
      status: null,
      claimStatus: null,
      reporterType: null,
      poleId: '',
      page: 1,
      limit: 10,
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.accidentType || filters.status || filters.claimStatus || filters.reporterType || filters.poleId;
  };

  // Export functions
  const exportToPDF = async () => {
    // Get all filtered data without pagination
    const token = localStorage.getItem('access_token');
    const { page, limit, ...exportFilters } = filters; // Exclude pagination

    const params = new URLSearchParams();
    Object.entries(exportFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    console.log('PDF Export - Filter params:', Object.fromEntries(params));
    console.log('PDF Export - Full URL:', `http://localhost:3011/api/v1/accidents?${params}`);

    try {
      const response = await axios.get(`http://localhost:3011/api/v1/accidents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const accidents = response.data.data || [];
      console.log('PDF Export - Accidents data:', accidents);

      if (!accidents || accidents.length === 0) {
        notifications.show({
          title: t('notifications.noDataTitle'),
          message: t('notifications.noDataMessage'),
          color: 'orange',
        });
        return;
      }

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text(t('export.pdfTitle'), 14, 22);

      // Add summary info
      doc.setFontSize(12);
      doc.text(`${t('export.totalAccidents')}: ${accidents.length}`, 14, 35);
      doc.text(`${t('export.reportGenerated')}: ${new Date().toLocaleDateString()}`, 14, 42);

      // Prepare table data with error handling
      const tableData = accidents.map((accident: any) => {
        try {
          return [
            accident?.incidentId || t('labels.notAvailable'),
            accident?.accidentDate ? formatDate(accident.accidentDate) : t('labels.notAvailable'),
            accident?.accidentType ? accident.accidentType.replace(/_/g, ' ') : t('labels.notAvailable'),
            accident?.status ? t(`status.${accident.status.toLowerCase()}`) : t('labels.notAvailable'),
            accident?.poleId || t('labels.notAvailable'),
            accident?.vehiclePlateNumber || t('labels.notAvailable'),
            accident?.driverName || t('labels.notAvailable'),
            accident?.estimatedCost ? formatCurrency(accident.estimatedCost) : formatCurrency(0),
          ];
        } catch (error) {
          console.error('Error processing accident:', accident, error);
          return ['ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR'];
        }
      });

      console.log('PDF Export - Table data:', tableData);

      // Add table
      autoTable(doc, {
        head: [[
          t('table.incidentId'),
          t('table.date'),
          t('table.type'),
          t('table.status'),
          t('table.poleId'),
          t('table.vehicle'),
          t('table.driver'),
          t('table.cost'),
        ]],
        body: tableData,
        startY: 55,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Save the PDF
      doc.save(`accidents-${new Date().toISOString().split('T')[0]}.pdf`);

      notifications.show({
        title: t('notifications.exportSuccessTitle'),
        message: t('notifications.exportSuccessMessage', { count: accidents.length }),
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: t('notifications.exportErrorTitle'),
        message: t('notifications.exportErrorMessage'),
        color: 'red',
      });
    }
  };

  const exportToExcel = async () => {
    // Get all filtered data without pagination
    const token = localStorage.getItem('access_token');
    const { page, limit, ...exportFilters } = filters; // Exclude pagination

    const params = new URLSearchParams();
    Object.entries(exportFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    console.log('Excel Export - Filter params:', Object.fromEntries(params));
    console.log('Excel Export - Full URL:', `http://localhost:3011/api/v1/accidents?${params}`);

    try {
      const response = await axios.get(`http://localhost:3011/api/v1/accidents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const accidents = response.data.data || [];

      if (!accidents || accidents.length === 0) {
        notifications.show({
          title: t('notifications.noDataTitle'),
          message: t('notifications.noDataMessage'),
          color: 'orange',
        });
        return;
      }

      // Prepare data for Excel
      const excelData = accidents.map((accident: any) => ({
        [t('table.incidentId')]: accident?.incidentId || t('labels.notAvailable'),
        [t('table.date')]: accident?.accidentDate ? formatDate(accident.accidentDate) : t('labels.notAvailable'),
        [t('table.time')]: accident?.accidentTime || t('labels.notAvailable'),
        [t('table.type')]: accident?.accidentType ? accident.accidentType.replace(/_/g, ' ') : t('labels.notAvailable'),
        [t('table.status')]: accident?.status ? t(`status.${accident.status.toLowerCase()}`) : t('labels.notAvailable'),
        [t('table.poleId')]: accident?.poleId || t('labels.notAvailable'),
        [t('table.latitude')]: accident?.latitude || t('labels.notAvailable'),
        [t('table.longitude')]: accident?.longitude || t('labels.notAvailable'),
        [t('table.location')]: accident?.locationDescription || t('labels.notAvailable'),
        [t('table.vehicle')]: accident?.vehiclePlateNumber || t('labels.notAvailable'),
        [t('table.driver')]: accident?.driverName || t('labels.notAvailable'),
        [t('table.insurance')]: accident?.insuranceCompany || t('labels.notAvailable'),
        [t('table.claimReference')]: accident?.claimReferenceNumber || t('labels.notAvailable'),
        [t('table.claimStatus')]: accident?.claimStatus ? t(`claimStatus.${accident.claimStatus.toLowerCase()}`) : t('labels.notAvailable'),
        [t('table.damageLevel')]: accident?.damageLevel || t('labels.notAvailable'),
        [t('table.damageDescription')]: accident?.damageDescription || t('labels.notAvailable'),
        [t('table.safetyRisk')]: accident?.safetyRisk ? t('labels.yes') : t('labels.no'),
        [t('table.estimatedCost')]: accident?.estimatedCost || 0,
        [t('table.reportedBy')]: accident?.reportedBy?.fullName || t('labels.notAvailable'),
        [t('table.reportedDate')]: accident?.createdAt ? formatDate(accident.createdAt) : t('labels.notAvailable'),
        [t('table.updatedDate')]: accident?.updatedAt ? formatDate(accident.updatedAt) : t('labels.notAvailable'),
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Accidents');

      // Save the Excel file
      const fileName = `accidents-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      notifications.show({
        title: t('notifications.exportSuccessTitle'),
        message: t('notifications.exportSuccessMessage', { count: accidents.length }),
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: t('notifications.exportErrorTitle'),
        message: t('notifications.exportErrorMessage'),
        color: 'red',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title={t('error.title')}>
          {t('error.message')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>{t('title')}</Title>
        <Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                rightSection={<IconFileText size={14} />}
              >
                {t('actions.exportData')}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconFileTypePdf size={16} />}
                onClick={exportToPDF}
              >
                {t('actions.exportPdf')}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileTypeXls size={16} />}
                onClick={exportToExcel}
              >
                {t('actions.exportExcel')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {(user?.role === 'ADMIN' || user?.role === 'INSPECTOR') && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/accidents/create')}
            >
              {t('actions.reportAccident')}
            </Button>
          )}
        </Group>
      </Group>

      {/* Filters */}
      <Paper p="md" mb="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>
            {t('filters.title')}
          </Title>
          {hasActiveFilters() && (
            <Button
              variant="light"
              color="red"
              size="sm"
              leftSection={<IconX size={16} />}
              onClick={resetFilters}
            >
              {t('actions.resetFilters')}
            </Button>
          )}
        </Group>
        <Group grow>
          <TextInput
            placeholder={t('filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            leftSection={<IconFilter size={16} />}
          />
          <Select
            placeholder={t('filters.accidentType')}
            data={ACCIDENT_TYPES.map(type => ({
              value: type,
              label: t(`types.${type.toLowerCase()}`),
            }))}
            value={filters.accidentType}
            onChange={(value) => setFilters({ ...filters, accidentType: value || null, page: 1 })}
            clearable
          />
          <Select
            placeholder={t('filters.status')}
            data={ACCIDENT_STATUSES.map(status => ({
              value: status,
              label: t(`status.${status.toLowerCase()}`),
            }))}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value || null, page: 1 })}
            clearable
          />
          <Select
            placeholder={t('filters.claimStatus')}
            data={CLAIM_STATUSES.map(status => ({
              value: status,
              label: t(`claimStatus.${status.toLowerCase()}`),
            }))}
            value={filters.claimStatus}
            onChange={(value) => setFilters({ ...filters, claimStatus: value || null, page: 1 })}
            clearable
          />
          <Select
            placeholder={t('filters.reporterType')}
            data={REPORTER_TYPES.map((value) => ({
              value,
              label: t(`reporterType.${value.toLowerCase()}`),
            }))}
            value={filters.reporterType}
            onChange={(value) => setFilters({ ...filters, reporterType: value || null, page: 1 })}
            clearable
          />
          <TextInput
            placeholder={t('filters.poleId')}
            value={filters.poleId}
            onChange={(e) => setFilters({ ...filters, poleId: e.target.value, page: 1 })}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('table.incidentId')}</Table.Th>
              <Table.Th>{t('table.type')}</Table.Th>
              <Table.Th>{t('table.date')}</Table.Th>
              <Table.Th>{t('table.poleId')}</Table.Th>
              <Table.Th>{t('table.status')}</Table.Th>
              <Table.Th>{t('table.claimStatus')}</Table.Th>
              <Table.Th>{t('table.reporterType')}</Table.Th>
              <Table.Th>{t('table.estimatedCost')}</Table.Th>
              <Table.Th>{t('table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Center>
                    <Loader size="lg" />
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : accidentsData?.data?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text c="dimmed">{t('emptyState')}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              accidentsData?.data?.map((accident: any) => (
                <Table.Tr key={accident.id}>
                  <Table.Td>
                    <Text fw={500}>{accident.incidentId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{t(`types.${accident.accidentType.toLowerCase()}`)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{formatDate(accident.accidentDate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{accident.poleId || t('labels.notAvailable')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getAccidentStatusColor(accident.status)}>
                      {t(`status.${accident.status.toLowerCase()}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getClaimStatusColor(accident.claimStatus)}>
                      {t(`claimStatus.${accident.claimStatus.toLowerCase()}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={(accident.reporterType || accident.reportedByType || (accident.reportedBy ? 'INTERNAL' : 'EXTERNAL')) === 'EXTERNAL' ? 'orange' : 'blue'}>
                      {t(`reporterType.${(accident.reporterType || accident.reportedByType || (accident.reportedBy ? 'INTERNAL' : 'EXTERNAL')).toLowerCase()}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text>
                      {accident.estimatedCost ? formatCurrency(accident.estimatedCost) : t('labels.notAvailable')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label={t('actions.viewDetails')}>
                        <ActionIcon
                          variant="light"
                          onClick={() => navigate(`/accidents/${accident.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label={t('actions.downloadIncidentReport')}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          loading={downloadReportMutation.isPending}
                          onClick={() => handleDownloadReport(accident.id, 'incident')}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label={t('actions.downloadDamageAssessment')}>
                        <ActionIcon
                          variant="light"
                          color="orange"
                          loading={downloadReportMutation.isPending}
                          onClick={() => handleDownloadReport(accident.id, 'damage-assessment')}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label={t('actions.downloadCostEstimate')}>
                        <ActionIcon
                          variant="light"
                          color="green"
                          loading={downloadReportMutation.isPending}
                          onClick={() => handleDownloadReport(accident.id, 'cost-estimate')}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label={t('actions.delete')}>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(accident.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination */}
        {accidentsData && accidentsData.total > filters.limit && (
          <Group justify="center" p="md">
            <Pagination
              total={Math.ceil(accidentsData.total / filters.limit)}
              value={filters.page}
              onChange={(page) => setFilters({ ...filters, page })}
              size="sm"
            />
          </Group>
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('deleteModal.title')}
        centered
      >
        <Text>{t('deleteModal.confirmation')}</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setDeleteModalOpen(false)}>
            {tCommon('actions.cancel')}
          </Button>
          <Button
            color="red"
            onClick={confirmDelete}
            loading={deleteMutation.isPending}
          >
            {t('actions.delete')}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
