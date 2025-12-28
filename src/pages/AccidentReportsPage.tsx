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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

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
      const location = accident.locationDescription || 'Unknown';
      // For demo, we'll use some Addis Ababa subcities
      const subcities = ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura'];
      const subcity = subcities.find(s => location.toLowerCase().includes(s.toLowerCase())) || 'Other';
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
    doc.text('Accident Reports', 14, 22);

    // Add summary info
    doc.setFontSize(12);
    doc.text(`Total Accidents: ${summaryStats.total}`, 14, 35);
    doc.text(`Total Estimated Cost: ${formatCurrency(summaryStats.totalEstimatedCost)}`, 14, 42);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 49);

    // Prepare table data
    const tableData = filteredAccidents.map((accident: Accident) => [
      accident.incidentId,
      formatDate(accident.accidentDate),
      accident.accidentType.replace(/_/g, ' '),
      accident.status,
      accident.poleId || 'N/A',
      accident.locationDescription || 'N/A',
      accident.vehiclePlateNumber || 'N/A',
      accident.driverName || 'N/A',
      formatCurrency(accident.estimatedCost || 0),
    ]);

    // Add table
    (doc as any).autoTable({
      head: [['Incident ID', 'Date', 'Type', 'Status', 'Pole ID', 'Location', 'Vehicle Plate', 'Driver', 'Estimated Cost']],
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
      'Incident ID': accident.incidentId,
      'Date': formatDate(accident.accidentDate),
      'Time': accident.accidentTime,
      'Type': accident.accidentType.replace(/_/g, ' '),
      'Status': accident.status,
      'Pole ID': accident.poleId || 'N/A',
      'Subcity': accident.pole?.subcity || 'N/A',
      'Street': accident.pole?.street || 'N/A',
      'Latitude': accident.latitude || 'N/A',
      'Longitude': accident.longitude || 'N/A',
      'Location Description': accident.locationDescription || 'N/A',
      'Vehicle Plate': accident.vehiclePlateNumber || 'N/A',
      'Driver Name': accident.driverName || 'N/A',
      'Insurance Company': accident.insuranceCompany || 'N/A',
      'Claim Reference': accident.claimReferenceNumber || 'N/A',
      'Claim Status': accident.claimStatus.replace(/_/g, ' '),
      'Damage Level': accident.damageLevel || 'N/A',
      'Damage Description': accident.damageDescription || 'N/A',
      'Safety Risk': accident.safetyRisk ? 'Yes' : 'No',
      'Estimated Cost': accident.estimatedCost || 0,
      'Reported By': accident.reportedBy?.fullName || 'N/A',
      'Inspected By': accident.inspectedBy?.fullName || 'N/A',
      'Supervisor': accident.supervisorApprovedBy?.fullName || 'N/A',
      'Finance': accident.financeApprovedBy?.fullName || 'N/A',
      'Reported Date': formatDate(accident.createdAt),
      'Updated Date': formatDate(accident.updatedAt),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accident Reports');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Accidents', 'Value': summaryStats.total },
      { 'Metric': 'Total Estimated Cost', 'Value': formatCurrency(summaryStats.totalEstimatedCost) },
      { 'Metric': 'Average Cost per Accident', 'Value': summaryStats.total > 0 ? formatCurrency(summaryStats.totalEstimatedCost / summaryStats.total) : '$0.00' },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleDateString() },
    ];

    // Add status breakdown
    summaryData.push({ 'Metric': '', 'Value': '' });
    summaryData.push({ 'Metric': 'Status Breakdown', 'Value': '' });
    Object.entries(summaryStats.byStatus).forEach(([status, count]) => {
      summaryData.push({ 'Metric': status, 'Value': count });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

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
        <Text>Loading accident reports...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Text c="red">Error loading accident reports</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title mb="lg">Incident Reports Dashboard</Title>

      {/* Summary Statistics */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconCarCrash size={24} color="blue" />
              <div>
                <Text size="sm" c="dimmed">Total Accidents</Text>
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
                <Text size="sm" c="dimmed">Total Estimated Cost</Text>
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
                <Text size="sm" c="dimmed">Average Cost</Text>
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
                <Text size="sm" c="dimmed">Active Cases</Text>
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
                <Title order={5}>Incidents by Subcity</Title>
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
                            <Text size="sm" c="blue">Incidents: {payload[0].value}</Text>
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
                <Title order={5}>Incidents by Status</Title>
              </Group>
            </Card.Section>
            <Stack p="md" gap="xs">
              {Object.entries(summaryStats.byStatus).map(([status, count]) => (
                <Group key={status} justify="space-between">
                  <Badge color={getStatusColor(status)} size="sm">{status.replace(/_/g, ' ')}</Badge>
                  <Text fw={500}>{count}</Text>
                </Group>
              ))}
            </Stack>
          </Card>

          <Card withBorder style={{ marginTop: '16px' }}>
            <Card.Section withBorder inheritPadding py="sm">
              <Group>
                <IconCarCrash size={20} />
                <Title order={5}>Incident Types</Title>
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
            <Title order={5}>Monthly Incident Trends</Title>
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
                        <Text size="sm" c="red">Incidents: {payload[0].value}</Text>
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
          <Title order={5}>Filters & Search</Title>
        </Card.Section>
        <Grid p="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              placeholder="Search by ID, type, vehicle, driver..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select
              placeholder="Status"
              data={[
                { value: 'REPORTED', label: 'Reported' },
                { value: 'INSPECTED', label: 'Inspected' },
                { value: 'SUPERVISOR_REVIEW', label: 'Supervisor Review' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'UNDER_REPAIR', label: 'Under Repair' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <DateInput
              placeholder="From Date"
              leftSection={<IconCalendar size={16} />}
              value={dateFrom}
              onChange={setDateFrom}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <DateInput
              placeholder="To Date"
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
              Export Data
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconFileTypePdf size={16} />}
              onClick={exportToPDF}
            >
              Export as PDF
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFileTypeXls size={16} />}
              onClick={exportToExcel}
            >
              Export as Excel
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Detailed Reports Table */}
      <Card withBorder>
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <Title order={5}>Detailed Incident Reports ({filteredAccidents.length})</Title>
            <Text size="sm" c="dimmed">
              Showing {filteredAccidents.length} of {accidents?.length || 0} total incidents
            </Text>
          </Group>
        </Card.Section>
        <div style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Incident ID</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Claim Status</Table.Th>
                <Table.Th>Estimated Cost</Table.Th>
                <Table.Th>Vehicle</Table.Th>
                <Table.Th>Driver</Table.Th>
                <Table.Th>Insurance</Table.Th>
                <Table.Th>Location</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAccidents.map((accident: Accident) => (
                <Table.Tr key={accident.id}>
                  <Table.Td>
                    <Text fw={500}>{accident.incidentId}</Text>
                  </Table.Td>
                  <Table.Td>{accident.accidentType?.replace(/_/g, ' ') || '-'}</Table.Td>
                  <Table.Td>{formatDate(accident.accidentDate)}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(accident.status)}>
                      {accident.status?.replace(/_/g, ' ') || '-'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getClaimStatusColor(accident.claimStatus)}>
                      {accident.claimStatus?.replace(/_/g, ' ') || '-'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {accident.estimatedCost ? formatCurrency(accident.estimatedCost) : '-'}
                  </Table.Td>
                  <Table.Td>{accident.vehiclePlateNumber || '-'}</Table.Td>
                  <Table.Td>{accident.driverName || '-'}</Table.Td>
                  <Table.Td>{accident.insuranceCompany || '-'}</Table.Td>
                  <Table.Td>{accident.locationDescription || '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
}
