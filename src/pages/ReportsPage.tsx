import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Title,
  Group,
  Button,
  Select,
  TextInput,
  Table,
  Text,
  Stack,
  Card,
  Grid,
  Badge,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconDownload,
  IconCalendar,
  IconMapPin,
  IconBuilding,
  IconReceipt,
  IconFilter,
  IconRefresh,
} from '@tabler/icons-react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

interface MaintenanceSchedule {
  id: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  frequency: string;
  cost?: number;
  estimatedCost?: number;
  poleCode: string;
  pole?: {
    code: string;
    street: string;
    subcity: string;
    poleType: string;
    lampType: string;
  };
  createdAt: string;
}

interface ReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  street: string;
  subcity: string;
  status: string;
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: null,
    endDate: null,
    street: '',
    subcity: '',
    status: '',
  });

  // Fetch all maintenance schedules
  const { data: schedulesData, isLoading, refetch } = useQuery({
    queryKey: ['maintenance-reports'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const url = 'http://localhost:3011/api/v1/maintenance/schedules?limit=10000&type=pole';
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const items = Array.isArray(res.data) ? res.data : res.data.items || [];
      return items as MaintenanceSchedule[];
    },
  });

  // Get unique streets and subcities for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!schedulesData) return { streets: [], subcities: [] };

    const streets = new Set<string>();
    const subcities = new Set<string>();

    schedulesData.forEach((schedule) => {
      if (schedule.pole?.street) streets.add(schedule.pole.street);
      if (schedule.pole?.subcity) subcities.add(schedule.pole.subcity);
    });

    return {
      streets: [
        { value: '', label: 'All Streets' },
        ...Array.from(streets).sort().map(street => ({ value: street, label: street }))
      ],
      subcities: [
        { value: '', label: 'All Subcities' },
        ...Array.from(subcities).sort().map(subcity => ({ value: subcity, label: subcity }))
      ],
    };
  }, [schedulesData]);

  // Filter and calculate totals
  const { filteredSchedules, totals } = useMemo(() => {
    if (!schedulesData) return { filteredSchedules: [], totals: { count: 0, totalCost: 0 } };

    const filtered = schedulesData.filter((schedule) => {
      const scheduleDate = new Date(schedule.startDate);

      // Date range filter
      if (filters.startDate && scheduleDate < filters.startDate) return false;
      if (filters.endDate && scheduleDate > filters.endDate) return false;

      // Street filter
      if (filters.street && schedule.pole?.street !== filters.street) return false;

      // Subcity filter
      if (filters.subcity && schedule.pole?.subcity !== filters.subcity) return false;

      // Status filter
      if (filters.status) {
        if (filters.status === 'in_progress' && !['STARTED', 'PARTIALLY_STARTED', 'PAUSED'].includes(schedule.status)) return false;
        if (filters.status === 'completed' && schedule.status !== 'COMPLETED') return false;
      }

      return true;
    });

    const totalCost = filtered.reduce((sum, schedule) => {
      const cost = Number(schedule.cost || schedule.estimatedCost || 0);
      return sum + cost;
    }, 0);

    return {
      filteredSchedules: filtered,
      totals: {
        count: filtered.length,
        totalCost: totalCost,
      },
    };
  }, [schedulesData, filters]);

  const handleExport = () => {
    const csvContent = [
      ['Asset Code', 'Street', 'Subcity', 'Pole Details', 'Description', 'Start Date', 'End Date', 'Status', 'Cost'],
      ...filteredSchedules.map(schedule => [
        schedule.poleCode,
        schedule.pole?.street || 'N/A',
        schedule.pole?.subcity || 'N/A',
        schedule.pole ? `${schedule.pole.poleType} • ${schedule.pole.lampType}` : 'N/A',
        schedule.description,
        new Date(schedule.startDate).toLocaleDateString(),
        schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : 'N/A',
        schedule.status,
        Number(schedule.cost || schedule.estimatedCost || 0).toFixed(2),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: 'Export Successful',
      message: 'Report has been downloaded',
      color: 'green',
    });
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      street: '',
      subcity: '',
      status: '',
    });
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Maintenance Reports</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExport}
            disabled={filteredSchedules.length === 0}
          >
            Export CSV
          </Button>
        </Group>
      </Group>

      {/* Summary Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total Records
                </Text>
                <Text size="xl" fw={700}>
                  {totals.count}
                </Text>
              </div>
              <IconReceipt size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total Cost
                </Text>
                <Text size="xl" fw={700}>
                  {Number(totals.totalCost).toFixed(2)}
                </Text>
              </div>
              <IconReceipt size={24} style={{ color: 'var(--mantine-color-green-6)' }} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  In Progress
                </Text>
                <Text size="xl" fw={700}>
                  {filteredSchedules.filter(s => ['STARTED', 'PARTIALLY_STARTED', 'PAUSED'].includes(s.status)).length}
                </Text>
              </div>
              <IconReceipt size={24} style={{ color: 'var(--mantine-color-orange-6)' }} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Completed
                </Text>
                <Text size="xl" fw={700}>
                  {filteredSchedules.filter(s => s.status === 'COMPLETED').length}
                </Text>
              </div>
              <IconReceipt size={24} style={{ color: 'var(--mantine-color-teal-6)' }} />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Filters */}
      <Card withBorder radius="md" mb="xl">
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <Text fw={600}>Filters</Text>
            <Button variant="subtle" size="xs" onClick={clearFilters}>
              Clear All
            </Button>
          </Group>
        </Card.Section>

        <Card.Section inheritPadding py="md">
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <DatePickerInput
                label="Start Date"
                placeholder="Select start date"
                value={filters.startDate}
                onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                leftSection={
                  <IconCalendar
                    size={18}
                    style={{
                      color: '#667eea',
                      filter: 'drop-shadow(0 0 4px rgba(102, 126, 234, 0.3))'
                    }}
                  />
                }
                clearable
                nextIcon={null}
                previousIcon={null}
                hideOutsideDates={false}
                styles={{
                  input: {
                    height: '48px',
                    borderRadius: '12px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)',
                    },
                    '&:focus': {
                      borderColor: '#667eea',
                      background: 'rgba(255, 255, 255, 0.98)',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                    '&::placeholder': {
                      color: '#9CA3AF',
                      fontWeight: 400,
                    },
                  },
                  label: {
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '8px',
                    letterSpacing: '0.025em',
                  },
                  dropdown: {
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    '& .mantine-DatePickerInput-calendarHeaderLevel': {
                      display: 'none !important',
                    },
                    '& .mantine-DatePickerInput-calendarHeaderControl': {
                      display: 'none !important',
                    },
                  },
                }}
                dropdownProps={{
                  styles: {
                    dropdown: {
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      padding: '16px',
                      minWidth: '280px',
                      '& .mantine-DatePickerInput-calendar': {
                        fontSize: '14px',
                      },
                      '& .mantine-DatePickerInput-weekday': {
                        height: '32px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6B7280',
                      },
                      '& .mantine-DatePickerInput-day': {
                        width: '32px',
                        height: '32px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        margin: '2px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#EBF4FF',
                          color: '#2563EB',
                        },
                        '&[data-selected]': {
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          fontWeight: 600,
                        },
                        '&[data-in-range]': {
                          backgroundColor: '#DBEAFE',
                          color: '#1D4ED8',
                        },
                        '&[data-first-in-range]': {
                          backgroundColor: '#3B82F6',
                          color: 'white',
                        },
                        '&[data-last-in-range]': {
                          backgroundColor: '#3B82F6',
                          color: 'white',
                        },
                      },
                      '& .mantine-DatePickerInput-calendarHeader': {
                        marginBottom: '12px',
                      },
                      '& .mantine-DatePickerInput-calendarHeaderLevel': {
                        display: 'none',
                      },
                      '& .mantine-DatePickerInput-calendarHeaderControl': {
                        display: 'none',
                      },
                    },
                  },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <DatePickerInput
                label="End Date"
                placeholder="Select end date"
                value={filters.endDate}
                onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                leftSection={
                  <IconCalendar
                    size={18}
                    style={{
                      color: '#667eea',
                      filter: 'drop-shadow(0 0 4px rgba(102, 126, 234, 0.3))'
                    }}
                  />
                }
                clearable
                nextIcon={null}
                previousIcon={null}
                hideOutsideDates={false}
                styles={{
                  input: {
                    height: '48px',
                    borderRadius: '12px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)',
                    },
                    '&:focus': {
                      borderColor: '#667eea',
                      background: 'rgba(255, 255, 255, 0.98)',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                    '&::placeholder': {
                      color: '#9CA3AF',
                      fontWeight: 400,
                    },
                  },
                  label: {
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '8px',
                    letterSpacing: '0.025em',
                  },
                  dropdown: {
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    '& .mantine-DatePickerInput-calendarHeaderLevel': {
                      display: 'none !important',
                    },
                    '& .mantine-DatePickerInput-calendarHeaderControl': {
                      display: 'none !important',
                    },
                  },
                }}
                dropdownProps={{
                  styles: {
                    dropdown: {
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      padding: '16px',
                      minWidth: '280px',
                      '& .mantine-DatePickerInput-calendar': {
                        fontSize: '14px',
                      },
                      '& .mantine-DatePickerInput-weekday': {
                        height: '32px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6B7280',
                      },
                      '& .mantine-DatePickerInput-day': {
                        width: '32px',
                        height: '32px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        margin: '2px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#EBF4FF',
                          color: '#2563EB',
                        },
                        '&[data-selected]': {
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          fontWeight: 600,
                        },
                        '&[data-in-range]': {
                          backgroundColor: '#DBEAFE',
                          color: '#1D4ED8',
                        },
                        '&[data-first-in-range]': {
                          backgroundColor: '#3B82F6',
                          color: 'white',
                        },
                        '&[data-last-in-range]': {
                          backgroundColor: '#3B82F6',
                          color: 'white',
                        },
                      },
                      '& .mantine-DatePickerInput-calendarHeader': {
                        marginBottom: '12px',
                      },
                      '& .mantine-DatePickerInput-calendarHeaderLevel': {
                        display: 'none',
                      },
                      '& .mantine-DatePickerInput-calendarHeaderControl': {
                        display: 'none',
                      },
                    },
                  },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Select
                label="Subcity"
                placeholder="Select subcity"
                data={filterOptions.subcities}
                value={filters.subcity}
                onChange={(value) => setFilters(prev => ({ ...prev, subcity: value || '' }))}
                leftSection={<IconBuilding size={16} />}
                clearable
                searchable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Select
                label="Street"
                placeholder="Select street"
                data={filterOptions.streets}
                value={filters.street}
                onChange={(value) => setFilters(prev => ({ ...prev, street: value || '' }))}
                leftSection={<IconMapPin size={16} />}
                clearable
                searchable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Select
                label="Status"
                placeholder="Select status"
                data={[
                  { value: '', label: 'All Statuses' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
                leftSection={<IconFilter size={16} />}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Card.Section>
      </Card>

      {/* Results Table */}
      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={1000}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Asset Code</Table.Th>
                <Table.Th>Street</Table.Th>
                <Table.Th>Subcity</Table.Th>
                <Table.Th>Pole Details</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Start Date</Table.Th>
                <Table.Th>End Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Cost</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredSchedules.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9} ta="center" py="xl">
                    <Text c="dimmed">No maintenance records found matching the filters</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <Table.Tr key={schedule.id}>
                    <Table.Td fw={600}>{schedule.poleCode}</Table.Td>
                    <Table.Td>{schedule.pole?.street || 'N/A'}</Table.Td>
                    <Table.Td>{schedule.pole?.subcity || 'N/A'}</Table.Td>
                    <Table.Td>
                      {schedule.pole ? `${schedule.pole.poleType} • ${schedule.pole.lampType}` : 'N/A'}
                    </Table.Td>
                    <Table.Td>
                      <Text lineClamp={2}>{schedule.description}</Text>
                    </Table.Td>
                    <Table.Td>{new Date(schedule.startDate).toLocaleDateString()}</Table.Td>
                    <Table.Td>
                      {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          schedule.status === 'COMPLETED'
                            ? 'green'
                            : schedule.status === 'STARTED'
                            ? 'blue'
                            : schedule.status === 'PAUSED'
                            ? 'orange'
                            : 'gray'
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={600}>
                      {Number(schedule.cost || schedule.estimatedCost || 0).toFixed(2)}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Container>
  );
}
