import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IconEye, IconTrash, IconPackage, IconEdit, IconFilter, IconArrowsUpDown } from '@tabler/icons-react';
import MaterialRequestModal from '../components/MaterialRequestModal';
import {
  Container,
  Paper,
  Table,
  Title,
  Tabs,
  Badge,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Stack,
  Select,
  Textarea,
  ActionIcon,
  Loader,
  Center,
  Pagination,
  Popover,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

const SCHEDULE_STATUSES = ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'];

function getScheduleStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'REQUESTED':
      return 'yellow'; // Waiting/pending status
    case 'STARTED':
      return 'blue'; // Active/in progress
    case 'PAUSED':
      return 'red'; // Blocked/needs attention
    case 'COMPLETED':
      return 'green'; // Successfully finished
    default:
      return 'gray';
  }
}

// Sorting handler
const handleSort = (field: string) => {
  if (sortBy === field) {
    // Toggle sort order if same field
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  } else {
    // New field, default to DESC
    setSortBy(field);
    setSortOrder('DESC');
  }
  setCurrentPage(1); // Reset to first page when sorting changes
};

// Get sort icon for a column
const getSortIcon = (field: string) => {
  return <IconArrowsUpDown size={16} />;
};


// TextTruncate component for showing truncated text with "show more" functionality
function TextTruncate({ text, maxLength = 50 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= maxLength) {
    return <span>{text}</span>;
  }

  const truncatedText = expanded ? text : `${text.substring(0, maxLength)}...`;

  return (
    <div>
      <span>{truncatedText}</span>
      <Button
        variant="subtle"
        size="xs"
        onClick={() => setExpanded(!expanded)}
        style={{ marginLeft: 8, fontSize: '0.75rem' }}
      >
        {expanded ? 'Show Less' : 'Show More'}
      </Button>
    </div>
  );
}
function getScheduleType(schedule: any): string {
  return 'pole'; // Always pole since we only have light poles
}

function getScheduleAssetCode(schedule: any): string {
  return schedule?.poleCode || '—';
}

function getScheduleAsset(schedule: any) {
  return schedule?.pole || null;
}

function getAssetNameByType(type: string, asset: any): string {
  return asset ? 'Light Pole' : '—';
}

function getAssetDistrictByType(type: string, asset: any): string {
  return asset?.subcity || '—';
}

function getAssetStreet(asset: any): string {
  return asset?.street || '—';
}

function getAssetInfoLabel(type: string): string {
  return 'Pole Details';
}

function getAssetInfo(type: string, asset: any): string {
  if (!asset) return '—';
  return `${asset?.poleType || '—'} • ${asset?.lampType || '—'} • ${asset?.heightMeters ?? '—'}m`;
}

export default function MaintenancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const filterType = (searchParams.get('type') || 'pole').toLowerCase(); // default: light poles
  console.log('MaintenancePage filterType:', filterType);
  const [createScheduleOpened, setCreateScheduleOpened] = useState(false);
  const [editScheduleOpened, setEditScheduleOpened] = useState(false);
  const [issueModalOpened, setIssueModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);
  const [materialRequestModalOpened, setMaterialRequestModalOpened] = useState(false);
  const [selectedScheduleForMaterial, setSelectedScheduleForMaterial] = useState<any>(null);
  const [receiveModalOpened, setReceiveModalOpened] = useState(false);
  const [selectedScheduleForReceive, setSelectedScheduleForReceive] = useState<any>(null);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [issuesSearch, setIssuesSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filtering state
  const [assetCodeFilter, setAssetCodeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [streetFilter, setStreetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFrom, setStartDateFrom] = useState<Date | null>(null);
  const [startDateTo, setStartDateTo] = useState<Date | null>(null);
  const [endDateFrom, setEndDateFrom] = useState<Date | null>(null);
  const [endDateTo, setEndDateTo] = useState<Date | null>(null);

  // Check if any filters are active
  const hasActiveFilters = assetCodeFilter || districtFilter || streetFilter || statusFilter || startDateFrom || startDateTo || endDateFrom || endDateTo;

  // Get unique subcities from current schedules
  const getUniqueSubcities = () => {
    const subcities = new Set<string>();
    allSchedules.forEach(schedule => {
      const subcity = getAssetDistrictByType(filterType, getScheduleAsset(schedule));
      if (subcity) {
        subcities.add(subcity);
      }
    });
    return Array.from(subcities).sort();
  };

  // Get unique streets from current schedules
  const getUniqueStreets = () => {
    const streets = new Set<string>();
    allSchedules.forEach(schedule => {
      const street = getAssetStreet(getScheduleAsset(schedule));
      if (street) {
        streets.add(street);
      }
    });
    return Array.from(streets).sort();
  };

  // Reset filters function
  const resetFilters = () => {
    setAssetCodeFilter('');
    setDistrictFilter('');
    setStreetFilter('');
    setStatusFilter('');
    setStartDateFrom(null);
    setStartDateTo(null);
    setEndDateFrom(null);
    setEndDateTo(null);
    setCurrentPage(1);
  };

  const { data: schedulesData, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['maintenance', 'schedules', filterType, assetCodeFilter, districtFilter, streetFilter, statusFilter, startDateFrom, startDateTo, endDateFrom, endDateTo, sortBy, sortOrder],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return { total: 0, items: [] };
      }

      const url = `http://localhost:3011/api/v1/maintenance/schedules?type=${filterType}&limit=10000`;
      console.log('Fetching maintenance schedules from:', url);

      try {
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('API Response:', res.data);

        // Handle both array response and paginated response
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        console.log('Extracted items:', items.length, 'records');

        setAllSchedules(items);

        return {
          total: items.length,
          items: items,
        };
      } catch (error: any) {
        console.error('Error fetching maintenance schedules:', error.response?.data || error.message);
        return { total: 0, items: [] };
      }
    },
  });

  // Receive material request mutation
  const receiveMutation = useMutation({
    mutationFn: async ({ materialRequestId, notes }: { materialRequestId: string; notes?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/material-requests/${materialRequestId}/receive`,
        { notes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Material request marked as received successfully',
        color: 'green',
      });
      setReceiveModalOpened(false);
      setSelectedScheduleForReceive(null);
      setReceiveNotes('');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      refetchSchedules();
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to mark material request as received',
        color: 'red',
      });
    },
  });

  // Apply client-side filtering, sorting, and pagination
  const filteredAndSortedSchedules = useMemo(() => {
    let filtered = [...allSchedules];

    // Apply filters
    if (assetCodeFilter) {
      filtered = filtered.filter(schedule =>
        getScheduleAssetCode(schedule)?.toLowerCase().includes(assetCodeFilter.toLowerCase())
      );
    }

    if (districtFilter) {
      filtered = filtered.filter(schedule =>
        getAssetDistrictByType(filterType, getScheduleAsset(schedule))?.toLowerCase().includes(districtFilter.toLowerCase())
      );
    }

    if (streetFilter) {
      filtered = filtered.filter(schedule =>
        getAssetStreet(getScheduleAsset(schedule))?.toLowerCase().includes(streetFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(schedule =>
        schedule.status?.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }


    if (startDateFrom) {
      filtered = filtered.filter(schedule => {
        const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
        return startDate && startDate >= startDateFrom;
      });
    }

    if (startDateTo) {
      filtered = filtered.filter(schedule => {
        const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
        return startDate && startDate <= startDateTo;
      });
    }

    if (endDateFrom) {
      filtered = filtered.filter(schedule => {
        const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
        return endDate && endDate >= endDateFrom;
      });
    }

    if (endDateTo) {
      filtered = filtered.filter(schedule => {
        const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
        return endDate && endDate <= endDateTo;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'assetCode':
          aValue = getScheduleAssetCode(a) || '';
          bValue = getScheduleAssetCode(b) || '';
          break;
        case 'subcity':
          aValue = getAssetDistrictByType(filterType, getScheduleAsset(a)) || '';
          bValue = getAssetDistrictByType(filterType, getScheduleAsset(b)) || '';
          break;
        case 'street':
          aValue = getAssetStreet(getScheduleAsset(a)) || '';
          bValue = getAssetStreet(getScheduleAsset(b)) || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'frequency':
          aValue = a.frequency || '';
          bValue = b.frequency || '';
          break;
        case 'startDate':
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case 'endDate':
          aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
          bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        case 'cost':
          aValue = parseFloat(a.estimatedCost || '0') || 0;
          bValue = parseFloat(b.estimatedCost || '0') || 0;
          break;
        default:
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    allSchedules,
    assetCodeFilter,
    districtFilter,
    streetFilter,
    statusFilter,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    sortBy,
    sortOrder,
    filterType
  ]);

  // Apply pagination to filtered and sorted results
  const totalSchedules = filteredAndSortedSchedules.length;
  const totalPages = Math.ceil(totalSchedules / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const schedules = filteredAndSortedSchedules.slice(startIndex, endIndex);

  // Reset to page 1 when filter type changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [assetCodeFilter, districtFilter, streetFilter, statusFilter, startDateFrom, startDateTo, endDateFrom, endDateTo, sortBy, sortOrder]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(issuesSearch);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [issuesSearch]);

  const { data: issuesForType } = useQuery({
    queryKey: ['issues', 'for-maintenance', debouncedSearch],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
      });

      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }

      const res = await axios.get(`http://localhost:3011/api/v1/issues?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both array and paginated response
      return Array.isArray(res.data) ? res.data : (res.data?.items || []);
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: selectedIssue, isLoading: issueLoading } = useQuery({
    queryKey: ['issue', selectedIssueId, selectedIssueType],
    queryFn: async () => {
      if (!selectedIssueId) return null;
      const token = localStorage.getItem('access_token');
      const type = (selectedIssueType || filterType || 'pole').toLowerCase();
      const endpoints: Record<string, string> = {
        pole: `http://localhost:3011/api/v1/issues/${selectedIssueId}`,
        park: `http://localhost:3011/api/v1/park-issues/${selectedIssueId}`,
        parking: `http://localhost:3011/api/v1/parking-lot-issues/${selectedIssueId}`,
        museum: `http://localhost:3011/api/v1/museum-issues/${selectedIssueId}`,
        toilet: `http://localhost:3011/api/v1/toilet-issues/${selectedIssueId}`,
        football: `http://localhost:3011/api/v1/football-field-issues/${selectedIssueId}`,
        river: `http://localhost:3011/api/v1/river-issues/${selectedIssueId}`,
      };
      try {
        const res = await axios.get(endpoints[type] || endpoints.pole, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { ...res.data, type };
      } catch {
        return null;
      }
    },
    enabled: !!selectedIssueId && issueModalOpened,
  });

  const issueOptions = useMemo(() => {
    const allIssues = issuesForType || [];

    // Filter issues that are not closed and belong to light poles
    const poleIssues = allIssues.filter(
      (issue: any) => issue?.status !== 'CLOSED' && (issue?.poleCode || issue?.pole),
    );

    // Create options for pole issues
    const options = poleIssues.map((issue: any) => {
      const assetCode = issue?.pole?.code || issue?.poleCode || 'N/A';
      const label = `Light Pole ${assetCode} – ${issue.description || 'No description'}`;

      return {
        value: issue.id,
        label: label,
        code: assetCode,
      };
    });

    return options;
  }, [issuesForType]);

  const { data: polesData } = useQuery({
    queryKey: ['poles', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/poles?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const poleOptions = polesData?.items?.map((pole: any) => ({
    value: pole.code,
    label: `${pole.code} - ${pole.street}, ${pole.subcity}`,
  })) || [];

  const assetOptionsByType: Record<string, any[]> = {
    pole: poleOptions,
  };

  const scheduleForm = useForm({
    initialValues: {
      poleCode: '',
      issueId: '',
      frequency: 'MONTHLY', // kept as default and hidden from UI
      description: '',
      startDate: '',
      endDate: '',
      status: 'REQUESTED',
      estimatedCost: undefined as number | undefined,
      remark: '',
      maintenanceType: 'issue', // 'issue' or 'direct'
    },
  });


  const editScheduleForm = useForm({
    initialValues: {
      description: '',
      startDate: '',
      endDate: '',
      status: 'REQUESTED',
      estimatedCost: undefined as number | undefined,
      remark: '',
    },
    validate: {
      remark: (value, values) =>
        ['PAUSED', 'COMPLETED'].includes(values.status) && !value?.trim()
          ? 'Remark is required when status is PAUSED or COMPLETED'
          : null,
    },
  });

  const handleCreateSchedule = async (values: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        frequency: values.frequency || 'MONTHLY',
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        status: values.status || 'REQUESTED',
        estimatedCost:
          values.estimatedCost === undefined || values.estimatedCost === null || values.estimatedCost === ''
            ? undefined
            : Number(values.estimatedCost),
        remark: values.remark?.trim() || undefined,
      };


      // Add issueId if maintenance type is 'issue'
      if (values.maintenanceType === 'issue') {
        if (!values.issueId) {
          notifications.show({
            title: 'Error',
            message: 'Please select an issue',
            color: 'red',
          });
          return;
        }
        payload.issueId = values.issueId;
        // For issues, poleCode is set automatically from the selected issue
        payload.poleCode = values.poleCode;
      } else {
        // Direct maintenance - require a pole code
        if (!values.poleCode) {
          notifications.show({
            title: 'Error',
            message: 'Please select a light pole for direct maintenance',
            color: 'red',
          });
          return;
        }
        payload.poleCode = values.poleCode;
      }

      const endpoint = 'http://localhost:3011/api/v1/maintenance/schedules';

      // Transform payload for poles only
      const newPayload: any = {
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        frequency: payload.frequency,
        status: payload.status,
        estimatedCost: payload.estimatedCost,
        remark: payload.remark,
        issueId: payload.issueId,
        poleCode: payload.poleCode,
      };
      
      await axios.post(endpoint, newPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Maintenance schedule created',
        color: 'green',
      });
      setCreateScheduleOpened(false);
      scheduleForm.reset();
      refetchSchedules();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create schedule',
        color: 'red',
      });
    }
  };


  const handleEditScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    editScheduleForm.setValues({
      description: schedule.description || '',
      startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
      endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
      status: schedule.status || 'REQUESTED',
      estimatedCost: schedule.estimatedCost ?? undefined,
      remark: schedule.remark || '',
    });
    setEditScheduleOpened(true);
  };

  const handleEditScheduleSubmit = async (values: any) => {
    if (!selectedSchedule) return;
    if (['PAUSED', 'COMPLETED'].includes(values.status) && !values.remark?.trim()) {
      editScheduleForm.setFieldError('remark', 'Remark is required when status is PAUSED or COMPLETED');
      return;
    }
    
    // Check if trying to start maintenance - need material request approval
    if (values.status === 'STARTED' && selectedSchedule.status === 'REQUESTED') {
      try {
        const token = localStorage.getItem('access_token');
        const materialRequestRes = await axios.get(
          `http://localhost:3011/api/v1/material-requests/maintenance/${selectedSchedule.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        
        const materialRequest = materialRequestRes.data;
        if (!materialRequest || materialRequest.status !== 'APPROVED') {
          notifications.show({
            title: 'Material Request Required',
            message: 'Please request and get approval for materials before starting maintenance',
            color: 'orange',
          });
          setEditScheduleOpened(false);
          setSelectedScheduleForMaterial(selectedSchedule);
          setMaterialRequestModalOpened(true);
          return;
        }
      } catch (error: any) {
        // If material request doesn't exist (404), show modal
        if (error.response?.status === 404 || !error.response) {
          notifications.show({
            title: 'Material Request Required',
            message: 'Please request materials before starting maintenance',
            color: 'orange',
          });
          setEditScheduleOpened(false);
          setSelectedScheduleForMaterial(selectedSchedule);
          setMaterialRequestModalOpened(true);
          return;
        }
        // For other errors, throw to be caught by outer try-catch
        throw error;
      }
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        ...values,
        estimatedCost:
          values.estimatedCost === undefined || values.estimatedCost === null || values.estimatedCost === ''
            ? undefined
            : Number(values.estimatedCost),
        remark: values.remark?.trim() || undefined,
      };
      
      const scheduleType = getScheduleType(selectedSchedule);
      const endpoint = 'http://localhost:3011/api/v1/maintenance/schedules';
      
      await axios.patch(
        `${endpoint}/${selectedSchedule.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      notifications.show({
        title: 'Success',
        message: 'Schedule updated',
        color: 'green',
      });
      setEditScheduleOpened(false);
      setSelectedSchedule(null);
      editScheduleForm.reset();
      refetchSchedules();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update schedule',
        color: 'red',
      });
    }
  };

  const handleDeleteClick = (schedule: any) => {
    setScheduleToDelete(schedule);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        notifications.show({
          title: 'Error',
          message: 'Authentication token not found',
          color: 'red',
        });
        return;
      }

      const scheduleType = getScheduleType(scheduleToDelete);
      const endpoint = 'http://localhost:3011/api/v1/maintenance/schedules';
      
      await axios.delete(`${endpoint}/${scheduleToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      notifications.show({
        title: 'Success',
        message: 'Maintenance schedule deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setScheduleToDelete(null);
      refetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to delete maintenance schedule',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title size="h2">
          Maintenance
          {filterType === 'park' && ' - Parks'}
          {filterType === 'pole' && ' - Light Poles'}
          {filterType === 'parking' && ' - Parking Lots'}
          {filterType === 'museum' && ' - Museums'}
          {filterType === 'toilet' && ' - Public Toilets'}
          {filterType === 'football' && ' - Football Fields'}
          {filterType === 'river' && ' - River Side Projects'}
        </Title>
        <Group>
          {hasActiveFilters && (
            <Button
              variant="light"
              color="red"
              size="md"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          )}
          <Button
            variant="light"
            onClick={() => setCreateScheduleOpened(true)}
            size="md"
          >
            Create Schedule
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="schedules">
        <Tabs.List>
          <Tabs.Tab value="schedules">Maintenance History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="schedules" pt={{ base: 'md', sm: 'xl' }}>
          <Paper withBorder>
            <Table.ScrollContainer minWidth={1200}>
              <Table>
                <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('assetCode')}>Asset Code</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('assetCode')}
                        >
                          {getSortIcon('assetCode')}
                        </ActionIcon>
                        <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={assetCodeFilter ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>Filter by Asset Code</Text>
                              <TextInput
                                placeholder="Enter asset code..."
                                value={assetCodeFilter}
                                onChange={(e) => setAssetCodeFilter(e.currentTarget.value)}
                                size="sm"
                              />
                              {assetCodeFilter && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => setAssetCodeFilter('')}
                                >
                                  Clear
                                </Button>
                              )}
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('subcity')}>Subcity</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('subcity')}
                        >
                          {getSortIcon('subcity')}
                        </ActionIcon>
                        <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={districtFilter ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>Filter by Subcity</Text>
                              <Select
                                placeholder="Select subcity..."
                                data={getUniqueSubcities()}
                                value={districtFilter}
                                onChange={(value) => setDistrictFilter(value || '')}
                                clearable
                                searchable
                                size="sm"
                              />
                              {districtFilter && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => setDistrictFilter('')}
                                >
                                  Clear
                                </Button>
                              )}
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('street')}>Street</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('street')}
                        >
                          {getSortIcon('street')}
                        </ActionIcon>
                        <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={streetFilter ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>Filter by Street</Text>
                              <Select
                                placeholder="Select street..."
                                data={getUniqueStreets()}
                                value={streetFilter}
                                onChange={(value) => setStreetFilter(value || '')}
                                clearable
                                searchable
                                size="sm"
                              />
                              {streetFilter && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => setStreetFilter('')}
                                >
                                  Clear
                                </Button>
                              )}
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>{getAssetInfoLabel(filterType)}</Table.Th>
                  <Table.Th w={200}>Maintenance</Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('frequency')}>Frequency</Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleSort('frequency')}
                      >
                        {getSortIcon('frequency')}
                      </ActionIcon>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('startDate')}>Start Date</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('startDate')}
                        >
                          {getSortIcon('startDate')}
                        </ActionIcon>
                        <Popover width={350} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={(startDateFrom || startDateTo) ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>Filter by Start Date</Text>
                              <TextInput
                                label="From"
                                placeholder="Select start date"
                                type="date"
                                value={startDateFrom ? startDateFrom.toISOString().split('T')[0] : ''}
                                onChange={(e) => setStartDateFrom(e.target.value ? new Date(e.target.value) : null)}
                                size="sm"
                              />
                              <TextInput
                                label="To"
                                placeholder="Select end date"
                                type="date"
                                value={startDateTo ? startDateTo.toISOString().split('T')[0] : ''}
                                onChange={(e) => setStartDateTo(e.target.value ? new Date(e.target.value) : null)}
                                size="sm"
                              />
                              {(startDateFrom || startDateTo) && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => {
                                    setStartDateFrom(null);
                                    setStartDateTo(null);
                                  }}
                                >
                                  Clear
                                </Button>
                              )}
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('endDate')}>End Date</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('endDate')}
                        >
                          {getSortIcon('endDate')}
                        </ActionIcon>
                        <Popover width={350} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={(endDateFrom || endDateTo) ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>Filter by End Date</Text>
                              <TextInput
                                label="From"
                                placeholder="Select start date"
                                type="date"
                                value={endDateFrom ? endDateFrom.toISOString().split('T')[0] : ''}
                                onChange={(e) => setEndDateFrom(e.target.value ? new Date(e.target.value) : null)}
                                size="sm"
                              />
                              <TextInput
                                label="To"
                                placeholder="Select end date"
                                type="date"
                                value={endDateTo ? endDateTo.toISOString().split('T')[0] : ''}
                                onChange={(e) => setEndDateTo(e.target.value ? new Date(e.target.value) : null)}
                                size="sm"
                              />
                              {(endDateFrom || endDateTo) && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => {
                                    setEndDateFrom(null);
                                    setEndDateTo(null);
                                  }}
                                >
                                  Clear
                                </Button>
                              )}
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('status')}
                        >
                          {getSortIcon('status')}
                        </ActionIcon>
                        <Popover width={250} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={statusFilter ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>Filter by Status</Text>
                              <Select
                                placeholder="Select status"
                                data={['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED']}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value || '')}
                                clearable
                                size="sm"
                              />
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('cost')}>Cost</Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleSort('cost')}
                      >
                        {getSortIcon('cost')}
                      </ActionIcon>
                    </Group>
                  </Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedulesLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={12}>Loading...</Table.Td>
                  </Table.Tr>
                ) : schedules?.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={12}>No maintenance records found</Table.Td>
                  </Table.Tr>
                ) : (
                  schedules?.map((schedule: any) => (
                    (() => {
                      const type = getScheduleType(schedule);
                      const asset = getScheduleAsset(schedule);
                      return (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>{getScheduleAssetCode(schedule)}</Table.Td>
                      <Table.Td>{getAssetDistrictByType(type, asset)}</Table.Td>
                      <Table.Td>{getAssetStreet(asset)}</Table.Td>
                      <Table.Td>{getAssetInfo(type, asset)}</Table.Td>
                      <Table.Td>
                        <TextTruncate text={schedule.description} maxLength={50} />
                      </Table.Td>
                      <Table.Td>{schedule.frequency}</Table.Td>
                      <Table.Td>
                        {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getScheduleStatusColor(schedule.status)}>{schedule.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {schedule.cost && schedule.cost > 0
                          ? `$${parseFloat(schedule.cost).toFixed(2)}`
                          : schedule.estimatedCost && schedule.estimatedCost > 0
                          ? `$${parseFloat(schedule.estimatedCost).toFixed(2)}`
                          : '-'}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => navigate(`/maintenance/${schedule.id}`)}
                            title="View Details"
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          {schedule.status !== 'COMPLETED' && (
                            <>
                              <ActionIcon
                                color="green"
                                variant="light"
                                onClick={() => {
                                  setSelectedScheduleForMaterial(schedule);
                                  setMaterialRequestModalOpened(true);
                                }}
                                title="Request Materials"
                              >
                                <IconPackage size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                variant="light"
                                onClick={() => handleDeleteClick(schedule)}
                                title="Delete Schedule"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </>
                          )}
                          {['REQUESTED', 'STARTED', 'PAUSED'].includes(schedule.status) && (
                            <ActionIcon
                              color="orange"
                              variant="light"
                              onClick={() => handleEditScheduleClick(schedule)}
                              title={schedule.status === 'STARTED' || schedule.status === 'PAUSED' ? 'Update Status' : 'Edit Schedule'}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          )}
                          {schedule.materialRequests?.some((mr: any) => mr.status === 'AWAITING_DELIVERY') && (
                            <ActionIcon
                              color="purple"
                              variant="light"
                              onClick={() => {
                                const awaitingRequest = schedule.materialRequests.find((mr: any) => mr.status === 'AWAITING_DELIVERY');
                                if (awaitingRequest) {
                                  setSelectedScheduleForReceive(schedule);
                                  setReceiveModalOpened(true);
                                  setReceiveNotes('');
                                }
                              }}
                              title="Receive Materials"
                            >
                              <IconPackage size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                      );
                    })()
                  ))
                )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {/* Pagination Controls */}
          <Group justify="space-between" align="center" mt="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Showing {schedules.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalSchedules)} of {totalSchedules} schedules
              </Text>
            </Group>

            <Group gap="sm">
              <Group gap="xs">
                <Text size="sm">Rows per page:</Text>
                <NumberInput
                  value={pageSize}
                  onChange={(value) => {
                    const newSize = Number(value);
                    if (newSize >= 5 && newSize <= 50) {
                      setPageSize(newSize);
                      setCurrentPage(1); // Reset to first page when changing page size
                    }
                  }}
                  min={5}
                  max={50}
                  step={5}
                  size="xs"
                  w={70}
                />
              </Group>

              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                size="sm"
                withEdges
              />
            </Group>
          </Group>
        </Tabs.Panel>

      </Tabs>

      {/* Create Schedule Modal */}
      <Modal
        opened={createScheduleOpened}
        onClose={() => {
          setCreateScheduleOpened(false);
          scheduleForm.reset();
        }}
        title="Create Maintenance Schedule"
        size="lg"
        centered
      >
        <form onSubmit={scheduleForm.onSubmit(handleCreateSchedule)}>
          <Stack>
            <Select
              label="Maintenance Type"
              data={[
                { value: 'issue', label: 'Related to Issue' },
                { value: 'direct', label: 'Direct Maintenance (No Issue)' },
              ]}
              value={scheduleForm.values.maintenanceType}
              onChange={(value) => {
                scheduleForm.setFieldValue('maintenanceType', value || 'issue');
                // Clear related fields when switching type
                if (value === 'direct') {
                  scheduleForm.setFieldValue('issueId', '');
                } else {
                  scheduleForm.setFieldValue('poleCode', '');
                  scheduleForm.setFieldValue('parkCode', '');
                  scheduleForm.setFieldValue('parkingLotCode', '');
                  scheduleForm.setFieldValue('museumCode', '');
                  scheduleForm.setFieldValue('publicToiletCode', '');
                  scheduleForm.setFieldValue('footballFieldCode', '');
                  scheduleForm.setFieldValue('riverSideProjectCode', '');
                }
              }}
            />

            {scheduleForm.values.maintenanceType === 'issue' ? (
              <>
                <Select
                  label="Issue"
                  placeholder="Type to search issues by pole code..."
                  data={issueOptions}
                  searchable
                  clearable
                  required
                  value={scheduleForm.values.issueId}
                  onSearchChange={(value) => {
                    setIssuesSearch(value || '');
                  }}
                  onChange={(value) => {
                    scheduleForm.setFieldValue('issueId', value || '');
                    // set asset code field based on selected issue
                    const selected = issueOptions.find((opt: any) => opt.value === value);
                    const code = selected?.code || '';
                    scheduleForm.setFieldValue('poleCode', code);
                  }}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Available issues: {issueOptions.length}
                </Text>
              </>
            ) : (
              <Select
                label="Light Pole Code"
                placeholder="Select light pole"
                data={assetOptionsByType.pole || []}
                searchable
                required
                value={scheduleForm.values.poleCode}
                onChange={(value) => {
                  scheduleForm.setFieldValue('poleCode', value || '');
                }}
              />
            )}
            <TextInput
              label="Description"
              placeholder="Monthly inspection"
              required
              {...scheduleForm.getInputProps('description')}
            />
            <TextInput
              label="Start Date"
              type="date"
              required
              {...scheduleForm.getInputProps('startDate')}
            />
            <TextInput
              label="End Date (optional)"
              type="date"
              {...scheduleForm.getInputProps('endDate')}
            />
            <Select
              label="Status"
              data={SCHEDULE_STATUSES}
              required
              {...scheduleForm.getInputProps('status')}
            />
            <NumberInput
              label="Estimated Cost (optional)"
              placeholder="100"
              min={0}
              value={
                scheduleForm.values.estimatedCost === undefined || scheduleForm.values.estimatedCost === null
                  ? undefined
                  : Number(scheduleForm.values.estimatedCost)
              }
              onChange={(value) => {
                if (value === '' || value === null) {
                  scheduleForm.setFieldValue('estimatedCost', undefined);
                } else {
                  scheduleForm.setFieldValue('estimatedCost', Number(value));
                }
              }}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setCreateScheduleOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        opened={editScheduleOpened}
        onClose={() => {
          setEditScheduleOpened(false);
          setSelectedSchedule(null);
        }}
        title="Edit Maintenance Schedule"
        size="lg"
        centered
      >
        <form onSubmit={editScheduleForm.onSubmit(handleEditScheduleSubmit)}>
          <Stack>
            {selectedSchedule && (
              <Group gap="xs">
                <Badge color="blue">{selectedSchedule.poleCode || selectedSchedule.parkCode || '—'}</Badge>
                <Badge>{selectedSchedule.frequency}</Badge>
              </Group>
            )}
            <TextInput
              label="Description"
              required
              {...editScheduleForm.getInputProps('description')}
            />
            <TextInput
              label="Start Date"
              type="date"
              required
              {...editScheduleForm.getInputProps('startDate')}
            />
            <TextInput
              label="End Date (optional)"
              type="date"
              {...editScheduleForm.getInputProps('endDate')}
            />
            <Select
              label="Status"
              data={SCHEDULE_STATUSES}
              required
              {...editScheduleForm.getInputProps('status')}
            />
            <NumberInput
              label="Estimated Cost (optional)"
              min={0}
              value={
                editScheduleForm.values.estimatedCost === undefined || editScheduleForm.values.estimatedCost === null
                  ? undefined
                  : Number(editScheduleForm.values.estimatedCost)
              }
              onChange={(value) => {
                if (value === '' || value === null) {
                  editScheduleForm.setFieldValue('estimatedCost', undefined);
                } else {
                  editScheduleForm.setFieldValue('estimatedCost', Number(value));
                }
              }}
            />
            <Textarea
              label="Remark"
              placeholder="Add remark (required for Paused/Completed)"
              {...editScheduleForm.getInputProps('remark')}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => { setEditScheduleOpened(false); setSelectedSchedule(null); }}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View Issue Modal */}
      <Modal
        opened={issueModalOpened}
        onClose={() => {
          setIssueModalOpened(false);
          setSelectedIssueId(null);
          setSelectedIssueType(null);
        }}
        title="Associated Issue"
        size="lg"
        centered
      >
        {issueLoading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : selectedIssue ? (
          <Stack>
            <Paper p="md" withBorder>
              <Group mb="xs">
                <Text fw={700}>Asset Code:</Text>
                <Badge color="blue">
                  {selectedIssue.pole?.code ||
                    selectedIssue.poleCode ||
                    selectedIssue.park?.code ||
                    selectedIssue.parkCode ||
                    selectedIssue.parkingLot?.code ||
                    selectedIssue.parkingLotCode ||
                    selectedIssue.museum?.code ||
                    selectedIssue.museumCode ||
                    selectedIssue.publicToilet?.code ||
                    selectedIssue.publicToiletCode ||
                    selectedIssue.footballField?.code ||
                    selectedIssue.footballFieldCode ||
                    selectedIssue.riverSideProject?.code ||
                    selectedIssue.riverSideProjectCode ||
                    'N/A'}
                </Badge>
              </Group>
              <Group mb="xs">
                <Text fw={700}>Severity:</Text>
                <Badge
                  color={
                    selectedIssue.severity === 'LOW'
                      ? 'green'
                      : selectedIssue.severity === 'MEDIUM'
                      ? 'yellow'
                      : selectedIssue.severity === 'HIGH'
                      ? 'orange'
                      : 'red'
                  }
                >
                  {selectedIssue.severity}
                </Badge>
              </Group>
              <Text fw={700} mb="xs">Description:</Text>
              <Text mb="xs">{selectedIssue.description}</Text>
              {selectedIssue.resolutionNotes && (
                <>
                  <Text fw={700} mb="xs">Resolution Notes:</Text>
                  <Text mb="xs">{selectedIssue.resolutionNotes}</Text>
                </>
              )}
              <Group mt="xs">
                <Text fw={700}>Reported By:</Text>
                <Text>{selectedIssue.reportedBy?.fullName || 'N/A'}</Text>
              </Group>
              <Group mt="xs">
                <Text fw={700}>Created:</Text>
                <Text>{new Date(selectedIssue.createdAt).toLocaleDateString()}</Text>
              </Group>
              {selectedIssue.updatedAt && (
                <Group mt="xs">
                  <Text fw={700}>Updated:</Text>
                  <Text>{new Date(selectedIssue.updatedAt).toLocaleDateString()}</Text>
                </Group>
              )}
            </Paper>
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => {
                setIssueModalOpened(false);
                setSelectedIssueId(null);
              }}>
                Close
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" p="xl">
            Issue not found
          </Text>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setScheduleToDelete(null);
        }}
        title="Delete Maintenance Schedule"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this maintenance schedule?
          </Text>
          {scheduleToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Asset Code:</Text>
              <Text size="sm">{getScheduleAssetCode(scheduleToDelete)}</Text>
              <Text size="sm" fw={700} mt="xs">Description:</Text>
              <Text size="sm">{scheduleToDelete.description}</Text>
              <Text size="sm" fw={700} mt="xs">Status:</Text>
              <Badge color={getScheduleStatusColor(scheduleToDelete.status)}>{scheduleToDelete.status}</Badge>
            </Paper>
          )}
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setScheduleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Material Request Modal */}
      {selectedScheduleForMaterial && (
        <MaterialRequestModal
          opened={materialRequestModalOpened}
          onClose={() => {
            setMaterialRequestModalOpened(false);
            setSelectedScheduleForMaterial(null);
          }}
          maintenanceScheduleId={selectedScheduleForMaterial.id}
          onSuccess={() => {
            refetchSchedules();
          }}
        />
      )}

      {/* Receive Materials Modal */}
      <Modal
        opened={receiveModalOpened}
        onClose={() => {
          setReceiveModalOpened(false);
          setSelectedScheduleForReceive(null);
          setReceiveNotes('');
        }}
        title="Receive Materials"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Confirm that you have received the materials for this maintenance schedule. This will mark the material request as delivered and start the maintenance work.
          </Text>
          {selectedScheduleForReceive && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={600}>Asset Code:</Text>
              <Text size="sm">{getScheduleAssetCode(selectedScheduleForReceive) || 'N/A'}</Text>
              <Text size="sm" fw={600} mt="xs">Pole Details:</Text>
              <Text size="sm">{getAssetNameByType(filterType, getScheduleAsset(selectedScheduleForReceive)) || 'N/A'}</Text>
              <Text size="sm" fw={600} mt="xs">Awaiting Delivery:</Text>
              <Text size="sm">
                {selectedScheduleForReceive.materialRequests?.filter((mr: any) => mr.status === 'AWAITING_DELIVERY').length || 0} material request(s)
              </Text>
            </Paper>
          )}
          <Textarea
            label="Delivery Notes (Optional)"
            placeholder="Add any notes about the delivery..."
            value={receiveNotes}
            onChange={(event) => setReceiveNotes(event.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
              onClick={() => {
                setReceiveModalOpened(false);
                setSelectedScheduleForReceive(null);
                setReceiveNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              color="purple"
              onClick={() => {
                const awaitingRequest = selectedScheduleForReceive?.materialRequests?.find((mr: any) => mr.status === 'AWAITING_DELIVERY');
                if (awaitingRequest) {
                  receiveMutation.mutate({
                    materialRequestId: awaitingRequest.id,
                    notes: receiveNotes.trim() || undefined,
                  });
                }
              }}
              loading={receiveMutation.isPending}
            >
              Mark as Received
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

