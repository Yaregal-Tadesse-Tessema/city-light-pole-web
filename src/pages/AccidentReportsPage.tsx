// @ts-nocheck
import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Card,
  Text,
  Table,
  Select,
  TextInput,
  Grid,
  Badge,
  ActionIcon,
  Menu,
  Stack,
  NumberInput,
} from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { DateInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import {
  IconDownload,
  IconFilter,
  IconSearch,
  IconCalendar,
  IconFileText,
  IconChartBar,
  IconTrendingUp,
  IconCurrencyDollar,
  IconCarCrash,
  IconMapPin,
  IconAlertTriangle,
  IconFileTypePdf,
  IconFileTypeXls,
} from '@tabler/icons-react';

interface Accident {
  id: string;
  incidentId: string;
  accidentType: string;
  accidentDate: string;
  status: string;
  claimStatus: string;
  estimatedCost?: number;
  costBreakdown?: any;
  damagedComponents?: any[];
  reportedBy?: any;
  pole?: any;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  vehiclePlateNumber?: string;
  driverName?: string;
  insuranceCompany?: string;
  claimReferenceNumber?: string;
  createdAt: string;
}

export default function AccidentReportsPage() {
  const { t } = useTranslation('accidentReports');
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const statusLabels: Record<string, string> = {
    REPORTED: t('status.reported'),
    INSPECTED: t('status.inspected'),
    SUPERVISOR_REVIEW: t('status.supervisorReview'),
    APPROVED: t('status.approved'),
    UNDER_REPAIR: t('status.underRepair'),
    COMPLETED: t('status.completed'),
    REJECTED: t('status.rejected'),
  };
  const claimStatusLabels: Record<string, string> = {
    NOT_SUBMITTED: t('claimStatus.notSubmitted'),
    SUBMITTED: t('claimStatus.submitted'),
    APPROVED: t('claimStatus.approved'),
    REJECTED: t('claimStatus.rejected'),
  };
  const formatStatus = (status: string) => statusLabels[status] || status;
  const formatClaimStatus = (status: string) => claimStatusLabels[status] || status;

  // Fetch all accidents for reporting
  const { data: accidents, isLoading, error } = useQuery({
    queryKey: ['accidents-reports', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/accidents?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data || [];
    },
  });

  // Filter accidents based on search and filters
  const filteredAccidents = useMemo(() => {
    if (!accidents) return [];

    return accidents.filter((accident: Accident) => {
      // Search filter
      const matchesSearch =
        accident.incidentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accident.accidentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (accident.vehiclePlateNumber && accident.vehiclePlateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (accident.driverName && accident.driverName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = !statusFilter || accident.status === statusFilter;

      // Date filter
      const accidentDate = new Date(accident.accidentDate);
      const matchesDateFrom = !dateFrom || accidentDate >= dateFrom;
      const matchesDateTo = !dateTo || accidentDate <= dateTo;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [accidents, searchTerm, statusFilter, dateFrom, dateTo]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredAccidents.length;
    const byStatus = filteredAccidents.reduce((acc: any, accident: Accident) => {
      acc[accident.status] = (acc[accident.status] || 0) + 1;
      return acc;
    }, {});

    const totalEstimatedCost = filteredAccidents.reduce((sum: number, accident: Accident) => {
      const cost = typeof accident.estimatedCost === 'number' ? accident.estimatedCost : parseFloat(accident.estimatedCost) || 0;
      return sum + cost;
    }, 0);

    const byType = filteredAccidents.reduce((acc: any, accident: Accident) => {
      acc[accident.accidentType] = (acc[accident.accidentType] || 0) + 1;
      return acc;
    }, {});

    // Calculate incidents by subcity (using location description as proxy for subcity)
    const bySubcity = filteredAccidents.reduce((acc: any, accident: Accident) => {
      // Extract subcity from location or use default
      const location = accident.locationDescription || t('labels.unknown');
      // For demo, we'll use some Addis Ababa subcities
      const subcities = ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura'];
      const subcity = subcities.find(s => location.toLowerCase().includes(s.toLowerCase())) || t('labels.other');
      acc[subcity] = (acc[subcity] || 0) + 1;
      return acc;
    }, {});

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = filteredAccidents.reduce((acc: any, accident: Accident) => {
      const date = new Date(accident.accidentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byStatus,
      totalEstimatedCost,
      byType,
      bySubcity,
      monthlyTrend,
    };
  }, [filteredAccidents]);

  const formatCurrency = (amount: number) => {
    const numAmount = isNaN(amount) ? 0 : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'blue';
      case 'INSPECTED':
        return 'orange';
      case 'SUPERVISOR_REVIEW':
        return 'yellow';
      case 'APPROVED':
        return 'green';
      case 'UNDER_REPAIR':
        return 'cyan';
      case 'COMPLETED':
        return 'teal';
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text(t('export.pdfTitle'), 14, 22);

    // Add summary info
    doc.setFontSize(12);
    doc.text(`${t('export.totalAccidents')}: ${summaryStats.total}`, 14, 35);
    doc.text(
      `${t('export.totalEstimatedCost')}: ${formatCurrency(summaryStats.totalEstimatedCost)}`,
      14,
      42,
    );
    doc.text(`${t('export.reportGenerated')}: ${new Date().toLocaleDateString()}`, 14, 49);

    // Prepare table data
    const tableData = filteredAccidents.map((accident: Accident) => [
      accident.incidentId,
      formatDate(accident.accidentDate),
      accident.accidentType.replace(/_/g, ' '),
      formatStatus(accident.status),
      accident.poleId || t('labels.notAvailable'),
      accident.locationDescription || t('labels.notAvailable'),
      accident.vehiclePlateNumber || t('labels.notAvailable'),
      accident.driverName || t('labels.notAvailable'),
      formatCurrency(accident.estimatedCost || 0),
    ]);

    // Add table
    (doc as any).autoTable({
      head: [[
        t('table.incidentId'),
        t('table.date'),
        t('table.type'),
        t('table.status'),
        t('table.poleId'),
        t('table.location'),
        t('table.vehiclePlate'),
        t('table.driver'),
        t('table.estimatedCost'),
      ]],
      body: tableData,
      startY: 60,
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
    doc.save(`accident-reports-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = filteredAccidents.map((accident: Accident) => ({
      [t('table.incidentId')]: accident.incidentId,
      [t('table.date')]: formatDate(accident.accidentDate),
      [t('table.time')]: accident.accidentTime,
      [t('table.type')]: accident.accidentType.replace(/_/g, ' '),
      [t('table.status')]: formatStatus(accident.status),
      [t('table.poleId')]: accident.poleId || t('labels.notAvailable'),
      [t('table.subcity')]: accident.pole?.subcity || t('labels.notAvailable'),
      [t('table.street')]: accident.pole?.street || t('labels.notAvailable'),
      [t('table.latitude')]: accident.latitude || t('labels.notAvailable'),
      [t('table.longitude')]: accident.longitude || t('labels.notAvailable'),
      [t('table.location')]: accident.locationDescription || t('labels.notAvailable'),
      [t('table.vehiclePlate')]: accident.vehiclePlateNumber || t('labels.notAvailable'),
      [t('table.driver')]: accident.driverName || t('labels.notAvailable'),
      [t('table.insurance')]: accident.insuranceCompany || t('labels.notAvailable'),
      [t('table.claimReference')]: accident.claimReferenceNumber || t('labels.notAvailable'),
      [t('table.claimStatus')]: formatClaimStatus(accident.claimStatus),
      [t('table.damageLevel')]: accident.damageLevel || t('labels.notAvailable'),
      [t('table.damageDescription')]: accident.damageDescription || t('labels.notAvailable'),
      [t('table.safetyRisk')]: accident.safetyRisk ? t('labels.yes') : t('labels.no'),
      [t('table.estimatedCost')]: accident.estimatedCost || 0,
      [t('table.reportedBy')]: accident.reportedBy?.fullName || t('labels.notAvailable'),
      [t('table.inspectedBy')]: accident.inspectedBy?.fullName || t('labels.notAvailable'),
      [t('table.supervisor')]: accident.supervisorApprovedBy?.fullName || t('labels.notAvailable'),
      [t('table.finance')]: accident.financeApprovedBy?.fullName || t('labels.notAvailable'),
      [t('table.reportedDate')]: formatDate(accident.createdAt),
      [t('table.updatedDate')]: formatDate(accident.updatedAt),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('export.sheetName'));

    // Add summary sheet
    const summaryData = [
      { [t('export.summary.metric')]: t('export.summary.totalAccidents'), [t('export.summary.value')]: summaryStats.total },
      { [t('export.summary.metric')]: t('export.summary.totalEstimatedCost'), [t('export.summary.value')]: formatCurrency(summaryStats.totalEstimatedCost) },
      { [t('export.summary.metric')]: t('export.summary.averageCost'), [t('export.summary.value')]: summaryStats.total > 0 ? formatCurrency(summaryStats.totalEstimatedCost / summaryStats.total) : formatCurrency(0) },
      { [t('export.summary.metric')]: t('export.summary.reportGenerated'), [t('export.summary.value')]: new Date().toLocaleDateString() },
    ];

    // Add status breakdown
    summaryData.push({ [t('export.summary.metric')]: '', [t('export.summary.value')]: '' });
    summaryData.push({ [t('export.summary.metric')]: t('export.summary.statusBreakdown'), [t('export.summary.value')]: '' });
    Object.entries(summaryStats.byStatus).forEach(([status, count]) => {
      summaryData.push({ [t('export.summary.metric')]: formatStatus(status), [t('export.summary.value')]: count });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, t('export.summarySheetName'));

    // Save the Excel file
    const fileName = `accident-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_SUBMITTED':
        return 'gray';
      case 'SUBMITTED':
        return 'blue';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };


  if (isLoading) {
    return (
      <Container size="xl">
        <Text>{t('loading')}</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Text c="red">{t('error')}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title mb="lg">{t('title')}</Title>

      {/* Summary Statistics */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconCarCrash size={24} color="blue" />
              <div>
                <Text size="sm" c="dimmed">{t('summary.totalAccidents')}</Text>
                <Text size="xl" fw={700}>{summaryStats.total}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconCurrencyDollar size={24} color="green" />
              <div>
                <Text size="sm" c="dimmed">{t('summary.totalEstimatedCost')}</Text>
                <Text size="xl" fw={700}>{formatCurrency(summaryStats.totalEstimatedCost)}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconTrendingUp size={24} color="orange" />
              <div>
                <Text size="sm" c="dimmed">{t('summary.averageCost')}</Text>
                <Text size="xl" fw={700}>
                  {summaryStats.total > 0
                    ? formatCurrency(summaryStats.totalEstimatedCost / summaryStats.total)
                    : formatCurrency(0)
                  }
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconChartBar size={24} color="purple" />
              <div>
                <Text size="sm" c="dimmed">{t('summary.activeCases')}</Text>
                <Text size="xl" fw={700}>
                  {summaryStats.byStatus.UNDER_REPAIR || 0}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Charts Section */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder>
            <Card.Section withBorder inheritPadding py="sm">
              <Group>
                <IconMapPin size={20} />
                <Title order={5}>{t('charts.bySubcity')}</Title>
              </Group>
            </Card.Section>
            <div style={{ height: '300px', padding: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(summaryStats.bySubcity).map(([subcity, count]) => ({
                    subcity: subcity.length > 12 ? subcity.substring(0, 12) + '...' : subcity,
                    incidents: count as number,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subcity"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis width={60} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ background: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <Text fw={500}>{label}</Text>
                            <Text size="sm" c="blue">
                              {t('charts.incidentsLabel')}: {payload[0].value}
                            </Text>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="incidents" fill="#228be6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder style={{ height: 'fit-content' }}>
            <Card.Section withBorder inheritPadding py="sm">
              <Group>
                <IconAlertTriangle size={20} />
                <Title order={5}>{t('charts.byStatus')}</Title>
              </Group>
            </Card.Section>
            <Stack p="md" gap="xs">
              {Object.entries(summaryStats.byStatus).map(([status, count]) => (
                <Group key={status} justify="space-between">
                  <Badge color={getStatusColor(status)} size="sm">{formatStatus(status)}</Badge>
                  <Text fw={500}>{count}</Text>
                </Group>
              ))}
            </Stack>
          </Card>

          <Card withBorder style={{ marginTop: '16px' }}>
            <Card.Section withBorder inheritPadding py="sm">
              <Group>
                <IconCarCrash size={20} />
                <Title order={5}>{t('charts.byType')}</Title>
              </Group>
            </Card.Section>
            <Stack p="md" gap="xs">
              {Object.entries(summaryStats.byType).map(([type, count]) => (
                <Group key={type} justify="space-between">
                  <Text size="sm">{type.replace(/_/g, ' ')}</Text>
                  <Text fw={500}>{count}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Monthly Trend Chart */}
      <Card withBorder mb="lg">
        <Card.Section withBorder inheritPadding py="sm">
          <Group>
            <IconTrendingUp size={20} />
            <Title order={5}>{t('charts.monthlyTrends')}</Title>
          </Group>
        </Card.Section>
        <div style={{ height: '250px', padding: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={Object.entries(summaryStats.monthlyTrend)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6) // Last 6 months
                .map(([month, count]) => ({
                  month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                  incidents: count as number,
                }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                fontSize={12}
              />
              <YAxis width={40} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ background: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                        <Text fw={500}>{label}</Text>
                        <Text size="sm" c="red">
                          {t('charts.incidentsLabel')}: {payload[0].value}
                        </Text>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke="#fa5252"
                strokeWidth={2}
                dot={{ fill: '#fa5252', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters */}
      <Card withBorder mb="lg">
        <Card.Section withBorder inheritPadding py="sm">
          <Title order={5}>{t('filters.title')}</Title>
        </Card.Section>
        <Grid p="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              placeholder={t('filters.searchPlaceholder')}
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select
              placeholder={t('filters.statusPlaceholder')}
              data={[
                { value: 'REPORTED', label: t('status.reported') },
                { value: 'INSPECTED', label: t('status.inspected') },
                { value: 'SUPERVISOR_REVIEW', label: t('status.supervisorReview') },
                { value: 'APPROVED', label: t('status.approved') },
                { value: 'UNDER_REPAIR', label: t('status.underRepair') },
                { value: 'COMPLETED', label: t('status.completed') },
                { value: 'REJECTED', label: t('status.rejected') },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <DateInput
              placeholder={t('filters.fromDate')}
              leftSection={<IconCalendar size={16} />}
              value={dateFrom}
              onChange={setDateFrom}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <DateInput
              placeholder={t('filters.toDate')}
              leftSection={<IconCalendar size={16} />}
              value={dateTo}
              onChange={setDateTo}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Export Options */}
      <Group justify="flex-end" mb="lg">
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
      </Group>

      {/* Detailed Reports Table */}
      <Card withBorder>
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <Title order={5}>
              {t('table.title', { count: filteredAccidents.length })}
            </Title>
            <Text size="sm" c="dimmed">
              {t('table.showing', { shown: filteredAccidents.length, total: accidents?.length || 0 })}
            </Text>
          </Group>
        </Card.Section>
        <div style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('table.incidentId')}</Table.Th>
                <Table.Th>{t('table.type')}</Table.Th>
                <Table.Th>{t('table.date')}</Table.Th>
                <Table.Th>{t('table.status')}</Table.Th>
                <Table.Th>{t('table.claimStatus')}</Table.Th>
                <Table.Th>{t('table.estimatedCost')}</Table.Th>
                <Table.Th>{t('table.vehicle')}</Table.Th>
                <Table.Th>{t('table.driver')}</Table.Th>
                <Table.Th>{t('table.insurance')}</Table.Th>
                <Table.Th>{t('table.location')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAccidents.map((accident: Accident) => (
                <Table.Tr key={accident.id}>
                  <Table.Td>
                    <Text fw={500}>{accident.incidentId}</Text>
                  </Table.Td>
                  <Table.Td>{accident.accidentType?.replace(/_/g, ' ') || t('labels.notAvailable')}</Table.Td>
                  <Table.Td>{formatDate(accident.accidentDate)}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(accident.status)}>
                      {formatStatus(accident.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getClaimStatusColor(accident.claimStatus)}>
                      {formatClaimStatus(accident.claimStatus)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {accident.estimatedCost ? formatCurrency(accident.estimatedCost) : t('labels.notAvailable')}
                  </Table.Td>
                  <Table.Td>{accident.vehiclePlateNumber || t('labels.notAvailable')}</Table.Td>
                  <Table.Td>{accident.driverName || t('labels.notAvailable')}</Table.Td>
                  <Table.Td>{accident.insuranceCompany || t('labels.notAvailable')}</Table.Td>
                  <Table.Td>{accident.locationDescription || t('labels.notAvailable')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
}
