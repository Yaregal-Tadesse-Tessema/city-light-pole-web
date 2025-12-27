import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  IconEye,
  IconTrash,
  IconPlus,
  IconFilter,
  IconFileDownload,
  IconCheck,
  IconX,
  IconClock,
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
  Stack,
  Select,
  ActionIcon,
  Loader,
  Center,
  Pagination,
  Tooltip,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

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
        title: 'Success',
        message: 'Accident report deleted successfully',
        color: 'green',
      });
      setDeleteModalOpen(false);
      setAccidentToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete accident report',
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
        title: 'Error',
        message: 'Failed to download report',
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
        <Alert color="red" title="Error">
          Failed to load accident reports. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Accident Management</Title>
        {(user?.role === 'ADMIN' || user?.role === 'INSPECTOR') && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/accidents/create')}
          >
            Report Accident
          </Button>
        )}
      </Group>

      {/* Filters */}
      <Paper p="md" mb="md" withBorder>
        <Title order={4} mb="md">
          Filters
        </Title>
        <Group grow>
          <TextInput
            placeholder="Search by incident ID, pole ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            leftSection={<IconFilter size={16} />}
          />
          <Select
            placeholder="Accident Type"
            data={ACCIDENT_TYPES.map(type => ({
              value: type,
              label: type.replace(/_/g, ' '),
            }))}
            value={filters.accidentType}
            onChange={(value) => setFilters({ ...filters, accidentType: value || '', page: 1 })}
            clearable
          />
          <Select
            placeholder="Status"
            data={ACCIDENT_STATUSES.map(status => ({
              value: status,
              label: status.replace(/_/g, ' '),
            }))}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value || '', page: 1 })}
            clearable
          />
          <Select
            placeholder="Claim Status"
            data={CLAIM_STATUSES.map(status => ({
              value: status,
              label: status.replace(/_/g, ' '),
            }))}
            value={filters.claimStatus}
            onChange={(value) => setFilters({ ...filters, claimStatus: value || '', page: 1 })}
            clearable
          />
          <TextInput
            placeholder="Pole ID"
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
              <Table.Th>Incident ID</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Pole ID</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Claim Status</Table.Th>
              <Table.Th>Estimated Cost</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Center>
                    <Loader size="lg" />
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : accidentsData?.data?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text c="dimmed">No accident reports found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              accidentsData?.data?.map((accident: any) => (
                <Table.Tr key={accident.id}>
                  <Table.Td>
                    <Text fw={500}>{accident.incidentId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{accident.accidentType.replace(/_/g, ' ')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{formatDate(accident.accidentDate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{accident.poleId || 'N/A'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getAccidentStatusColor(accident.status)}>
                      {accident.status.replace(/_/g, ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getClaimStatusColor(accident.claimStatus)}>
                      {accident.claimStatus.replace(/_/g, ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text>
                      {accident.estimatedCost ? formatCurrency(accident.estimatedCost) : 'N/A'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="light"
                          onClick={() => navigate(`/accidents/${accident.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Download Incident Report">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          loading={downloadReportMutation.isPending}
                          onClick={() => handleDownloadReport(accident.id, 'incident')}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Download Damage Assessment">
                        <ActionIcon
                          variant="light"
                          color="orange"
                          loading={downloadReportMutation.isPending}
                          onClick={() => handleDownloadReport(accident.id, 'damage-assessment')}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Download Cost Estimate">
                        <ActionIcon
                          variant="light"
                          color="green"
                          loading={downloadReportMutation.isPending}
                          onClick={() => handleDownloadReport(accident.id, 'cost-estimate')}
                        >
                          <IconFileDownload size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Delete">
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
        title="Confirm Delete"
        centered
      >
        <Text>Are you sure you want to delete this accident report? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={confirmDelete}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
