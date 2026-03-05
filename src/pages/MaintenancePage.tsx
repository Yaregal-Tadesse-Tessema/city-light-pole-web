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
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const SCHEDULE_STATUSES = ['REQUESTED', 'PARTIALLY_STARTED', 'STARTED', 'PAUSED', 'COMPLETED'];

function getScheduleStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'REQUESTED':
      return 'yellow'; // Waiting/pending status
    case 'PARTIALLY_STARTED':
      return 'orange'; // Partially started - some materials delivered
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


// Get sort icon for a column
const getSortIcon = (field: string) => {
  return <IconArrowsUpDown size={16} />;
};


// TextTruncate component for showing truncated text with "show more" functionality
function TextTruncate({
  text,
  maxLength = 50,
  showMoreLabel,
  showLessLabel,
}: {
  text: string;
  maxLength?: number;
  showMoreLabel: string;
  showLessLabel: string;
}) {
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
        {expanded ? showLessLabel : showMoreLabel}
      </Button>
    </div>
  );
}
function getScheduleType(schedule: any): string {
  return 'pole'; // Always pole since we only have light poles
}

function getScheduleAsset(schedule: any) {
  return schedule?.pole || null;
}


export default function MaintenancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const filterType = (searchParams.get('type') || 'pole').toLowerCase(); // default: light poles
  const { t } = useTranslation('maintenance');
  const { t: tCommon } = useTranslation('common');
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
  const [maintenanceCodeFilter, setMaintenanceCodeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [streetFilter, setStreetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFrom, setStartDateFrom] = useState<Date | null>(null);

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
  const [startDateTo, setStartDateTo] = useState<Date | null>(null);
  const [endDateFrom, setEndDateFrom] = useState<Date | null>(null);
  const [endDateTo, setEndDateTo] = useState<Date | null>(null);

  const statusOptions = useMemo(
    () => SCHEDULE_STATUSES.map(status => ({ value: status, label: t(`statuses.${status}`) })),
    [t],
  );

  const getStatusLabel = (status?: string) =>
    status ? t(`statuses.${status}`, { defaultValue: status }) : t('labels.none');

  const getSeverityLabel = (severity?: string) =>
    severity ? t(`severity.${severity}`, { defaultValue: severity }) : t('labels.none');

  const getFrequencyLabel = (frequency?: string) =>
    frequency ? t(`frequency.${frequency}`, { defaultValue: frequency }) : t('labels.none');

  const getScheduleAssetCode = (schedule: any): string => schedule?.poleCode || t('labels.none');
  const getAssetNameByType = (type: string, asset: any): string =>
    asset ? t('assetNames.lightPole') : t('labels.none');
  const getAssetDistrictByType = (type: string, asset: any): string => asset?.subcity || t('labels.none');
  const getAssetStreet = (asset: any): string => asset?.street || t('labels.none');
  const getAssetInfoLabel = (type: string): string => t('tableHeaders.assetInfo');
  const getAssetInfo = (type: string, asset: any): string => {
    if (!asset) return t('labels.none');
    const poleType = asset?.poleType || t('labels.none');
    const lampType = asset?.lampType || t('labels.none');
    const heightValue = asset?.heightMeters ?? null;
    const heightDisplay = heightValue === null || heightValue === undefined ? t('labels.none') : `${heightValue}m`;
    return `${poleType} / ${lampType} / ${heightDisplay}`;
  };

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
      console.log('🔄 Receiving material request:', materialRequestId, 'with notes:', notes);
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error(t('errors.authTokenMissing'));
      }

      if (!materialRequestId) {
        throw new Error(t('errors.materialRequestIdRequired'));
      }

      console.log('🔗 Making API call to:', `http://localhost:3011/api/v1/material-requests/${materialRequestId}/receive`);

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
      console.log('✅ Material request received successfully:', response.data);
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.materialReceived'),
        color: 'green',
      });
      setReceiveModalOpened(false);
      setSelectedScheduleForReceive(null);
      setReceiveNotes('');
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      refetchSchedules();
    },
    onError: (error: any) => {
      console.error('❌ Receive material request failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          t('notifications.materialReceiveFailed');

      notifications.show({
        title: t('notifications.receiveErrorTitle'),
        message: errorMessage,
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

    if (maintenanceCodeFilter) {
      filtered = filtered.filter(schedule =>
        schedule.maintenanceCode?.toLowerCase().includes(maintenanceCodeFilter.toLowerCase())
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
        case 'maintenanceCode':
          aValue = a.maintenanceCode || '';
          bValue = b.maintenanceCode || '';
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
      const assetCode = issue?.pole?.code || issue?.poleCode || t('labels.na');
      const description = issue.description || t('labels.noDescription');
      const label = t('issueOptionLabel', {
        asset: t('assetNames.lightPole'),
        code: assetCode,
        description,
      });

      return {
        value: issue.id,
        label: label,
        code: assetCode,
      };
    });

    return options;
  }, [issuesForType, t]);

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
          ? t('validation.remarkRequired')
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
            title: t('notifications.errorTitle'),
            message: t('notifications.selectIssue'),
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
            title: t('notifications.errorTitle'),
            message: t('notifications.selectPoleForDirect'),
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
        title: t('notifications.successTitle'),
        message: t('notifications.scheduleCreated'),
        color: 'green',
      });
      setCreateScheduleOpened(false);
      scheduleForm.reset();
      // Invalidate specific maintenance schedules query instead of all maintenance queries
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
      refetchSchedules();
    } catch (error: any) {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.createFailed'),
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
      editScheduleForm.setFieldError('remark', t('validation.remarkRequired'));
      return;
    }
    
    // Check if trying to start maintenance - need material/purchase request completion
    if (values.status === 'STARTED' && (selectedSchedule.status === 'REQUESTED' || selectedSchedule.status === 'PARTIALLY_STARTED')) {
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
            title: t('notifications.materialRequestRequiredTitle'),
            message: t('notifications.materialRequestApprovalRequired'),
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
            title: t('notifications.materialRequestRequiredTitle'),
            message: t('notifications.materialRequestRequired'),
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
        title: t('notifications.successTitle'),
        message: t('notifications.scheduleUpdated'),
        color: 'green',
      });
      setEditScheduleOpened(false);
      setSelectedSchedule(null);
      editScheduleForm.reset();
      refetchSchedules();
    } catch (error: any) {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.updateFailed'),
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
          title: t('notifications.errorTitle'),
          message: t('notifications.authTokenMissing'),
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
        title: t('notifications.successTitle'),
        message: t('notifications.scheduleDeleted'),
        color: 'green',
      });
      setDeleteModalOpened(false);
      setScheduleToDelete(null);
      refetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || error.message || t('notifications.deleteFailed'),
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title size="h2">
          {t('title')}
          {filterType === 'park' && ` - ${t('titleSuffixes.park')}`}
          {filterType === 'pole' && ` - ${t('titleSuffixes.pole')}`}
          {filterType === 'parking' && ` - ${t('titleSuffixes.parking')}`}
          {filterType === 'museum' && ` - ${t('titleSuffixes.museum')}`}
          {filterType === 'toilet' && ` - ${t('titleSuffixes.toilet')}`}
          {filterType === 'football' && ` - ${t('titleSuffixes.football')}`}
          {filterType === 'river' && ` - ${t('titleSuffixes.river')}`}
        </Title>
        <Group>
          {hasActiveFilters && (
            <Button
              variant="light"
              color="red"
              size="md"
              onClick={resetFilters}
            >
              {t('actions.clearFilters')}
            </Button>
          )}
          <Button
            variant="light"
            onClick={() => setCreateScheduleOpened(true)}
            size="md"
          >
            {t('actions.createSchedule')}
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="schedules">
        <Tabs.List>
          <Tabs.Tab value="schedules">{t('tabs.schedules')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="schedules" pt={{ base: 'md', sm: 'xl' }}>
          <Paper withBorder>
            <Table.ScrollContainer minWidth={1200}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('assetCode')}>
                        {t('tableHeaders.assetCode')}
                      </Text>
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
                              <Text size="sm" fw={500}>{t('filters.assetCode.label')}</Text>
                              <TextInput
                                placeholder={t('filters.assetCode.placeholder')}
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
                                  {t('filters.clear')}
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
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('maintenanceCode')}>
                        {t('tableHeaders.maintenanceCode')}
                      </Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => handleSort('maintenanceCode')}
                        >
                          {getSortIcon('maintenanceCode')}
                        </ActionIcon>
                        <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <ActionIcon
                              variant="subtle"
                              color={maintenanceCodeFilter ? 'blue' : 'gray'}
                              size="sm"
                            >
                              <IconFilter size={16} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="sm">
                              <Text size="sm" fw={500}>{t('filters.maintenanceCode.label')}</Text>
                              <TextInput
                                placeholder={t('filters.maintenanceCode.placeholder')}
                                value={maintenanceCodeFilter}
                                onChange={(e) => setMaintenanceCodeFilter(e.currentTarget.value)}
                                size="sm"
                              />
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => {
                                  setMaintenanceCodeFilter('');
                                }}
                                disabled={!maintenanceCodeFilter}
                              >
                                {t('filters.clear')}
                              </Button>
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('subcity')}>
                        {t('tableHeaders.subcity')}
                      </Text>
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
                              <Text size="sm" fw={500}>{t('filters.subcity.label')}</Text>
                              <Select
                                placeholder={t('filters.subcity.placeholder')}
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
                                  {t('filters.clear')}
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
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('street')}>
                        {t('tableHeaders.street')}
                      </Text>
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
                              <Text size="sm" fw={500}>{t('filters.street.label')}</Text>
                              <Select
                                placeholder={t('filters.street.placeholder')}
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
                                  {t('filters.clear')}
                                </Button>
                              )}
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Table.Th>
                  <Table.Th>{getAssetInfoLabel(filterType)}</Table.Th>
                  <Table.Th w={200}>{t('tableHeaders.maintenance')}</Table.Th>
                  <Table.Th>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('frequency')}>
                        {t('tableHeaders.frequency')}
                      </Text>
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
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('startDate')}>
                        {t('tableHeaders.startDate')}
                      </Text>
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
                              <Text size="sm" fw={500}>{t('filters.startDate.label')}</Text>
                              <TextInput
                                label={t('filters.from')}
                                placeholder={t('filters.startDate.fromPlaceholder')}
                                type="date"
                                value={startDateFrom ? startDateFrom.toISOString().split('T')[0] : ''}
                                onChange={(e) => setStartDateFrom(e.target.value ? new Date(e.target.value) : null)}
                                size="sm"
                              />
                              <TextInput
                                label={t('filters.to')}
                                placeholder={t('filters.startDate.toPlaceholder')}
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
                                  {t('filters.clear')}
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
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('endDate')}>
                        {t('tableHeaders.endDate')}
                      </Text>
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
                              <Text size="sm" fw={500}>{t('filters.endDate.label')}</Text>
                              <TextInput
                                label={t('filters.from')}
                                placeholder={t('filters.endDate.fromPlaceholder')}
                                type="date"
                                value={endDateFrom ? endDateFrom.toISOString().split('T')[0] : ''}
                                onChange={(e) => setEndDateFrom(e.target.value ? new Date(e.target.value) : null)}
                                size="sm"
                              />
                              <TextInput
                                label={t('filters.to')}
                                placeholder={t('filters.endDate.toPlaceholder')}
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
                                  {t('filters.clear')}
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
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                        {t('tableHeaders.status')}
                      </Text>
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
                              <Text size="sm" fw={500}>{t('filters.status.label')}</Text>
                              <Select
                                placeholder={t('filters.status.placeholder')}
                                data={statusOptions}
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
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('cost')}>
                        {t('tableHeaders.cost')}
                      </Text>
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
                  <Table.Th>{t('tableHeaders.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedulesLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={12}>{tCommon('loading')}</Table.Td>
                  </Table.Tr>
                ) : schedules?.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={12}>{t('tableStates.empty')}</Table.Td>
                  </Table.Tr>
                ) : (
                  schedules?.map((schedule: any) => (
                    (() => {
                      const type = getScheduleType(schedule);
                      const asset = getScheduleAsset(schedule);
                      return (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>{getScheduleAssetCode(schedule)}</Table.Td>
                      <Table.Td>
                        <Text fw={500} size="sm" c="blue">
                          {schedule.maintenanceCode}
                        </Text>
                      </Table.Td>
                      <Table.Td>{getAssetDistrictByType(type, asset)}</Table.Td>
                      <Table.Td>{getAssetStreet(asset)}</Table.Td>
                      <Table.Td>{getAssetInfo(type, asset)}</Table.Td>
                      <Table.Td>
                        <TextTruncate
                          text={schedule.description}
                          maxLength={50}
                          showMoreLabel={t('labels.showMore')}
                          showLessLabel={t('labels.showLess')}
                        />
                      </Table.Td>
                      <Table.Td>{getFrequencyLabel(schedule.frequency)}</Table.Td>
                      <Table.Td>
                        {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : t('labels.none')}
                      </Table.Td>
                      <Table.Td>
                        {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : t('labels.none')}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getScheduleStatusColor(schedule.status)}>{getStatusLabel(schedule.status)}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {schedule.cost && schedule.cost > 0
                          ? `${parseFloat(schedule.cost).toFixed(2)}`
                          : schedule.estimatedCost && schedule.estimatedCost > 0
                          ? `${parseFloat(schedule.estimatedCost).toFixed(2)}`
                          : t('labels.none')}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => navigate(`/maintenance/${schedule.id}`)}
                            title={t('actionTitles.viewDetails')}
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
                                title={t('actionTitles.requestMaterials')}
                              >
                                <IconPackage size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                variant="light"
                                onClick={() => handleDeleteClick(schedule)}
                                title={t('actionTitles.deleteSchedule')}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </>
                          )}
                          {['REQUESTED', 'PARTIALLY_STARTED', 'STARTED', 'PAUSED'].includes(schedule.status) && (
                            <ActionIcon
                              color="orange"
                              variant="light"
                              onClick={() => handleEditScheduleClick(schedule)}
                              title={
                                schedule.status === 'STARTED' ||
                                schedule.status === 'PAUSED' ||
                                schedule.status === 'PARTIALLY_STARTED'
                                  ? t('actionTitles.updateStatus')
                                  : t('actionTitles.editSchedule')
                              }
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          )}
                          {schedule.materialRequests?.some((mr: any) => mr.status === 'AWAITING_DELIVERY') && (
                            <Tooltip label={t('actionTitles.receiveMaterials')}>
                              <ActionIcon
                                color="purple"
                                variant="light"
                                onClick={() => {
                                  console.log('📦 Receive button clicked for schedule:', schedule.maintenanceCode);
                                  console.log('📋 Material requests:', schedule.materialRequests);
                                  const awaitingRequests = schedule.materialRequests?.filter((mr: any) => mr.status === 'AWAITING_DELIVERY') || [];
                                  console.log('⏳ Awaiting delivery requests:', awaitingRequests);

                                  if (awaitingRequests.length > 0) {
                                    setSelectedScheduleForReceive(schedule);
                                    setReceiveModalOpened(true);
                                    setReceiveNotes('');
                                  } else {
                                    notifications.show({
                                      title: t('notifications.noMaterialsAwaitingTitle'),
                                      message: t('notifications.noMaterialsAwaitingMessage'),
                                      color: 'orange',
                                    });
                                  }
                                }}
                              >
                                <IconPackage size={16} />
                              </ActionIcon>
                            </Tooltip>
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
                {t('pagination.showing', {
                  from: schedules.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0,
                  to: Math.min(currentPage * pageSize, totalSchedules),
                  total: totalSchedules,
                })}
              </Text>
            </Group>

            <Group gap="sm">
              <Group gap="xs">
                <Text size="sm">{t('pagination.rowsPerPage')}</Text>
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
        title={t('modals.createTitle')}
        size="lg"
        centered
      >
        <form onSubmit={scheduleForm.onSubmit(handleCreateSchedule)}>
          <Stack>
            <Select
              label={t('form.maintenanceType')}
              data={[
                { value: 'issue', label: t('maintenanceType.issue') },
                { value: 'direct', label: t('maintenanceType.direct') },
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
                  label={t('form.issueLabel')}
                  placeholder={t('form.issuePlaceholder')}
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
                  {t('form.availableIssues', { count: issueOptions.length })}
                </Text>
              </>
            ) : (
              <Select
                label={t('form.poleCodeLabel')}
                placeholder={t('form.poleCodePlaceholder')}
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
              label={t('form.descriptionLabel')}
              placeholder={t('form.descriptionPlaceholder')}
              required
              {...scheduleForm.getInputProps('description')}
            />
            <TextInput
              label={t('form.startDateLabel')}
              type="date"
              required
              {...scheduleForm.getInputProps('startDate')}
            />
            <TextInput
              label={t('form.endDateLabel')}
              type="date"
              {...scheduleForm.getInputProps('endDate')}
            />
            <Select
              label={t('form.statusLabel')}
              data={statusOptions}
              required
              {...scheduleForm.getInputProps('status')}
            />
            <NumberInput
              label={t('form.estimatedCostLabel')}
              placeholder={t('form.estimatedCostPlaceholder')}
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
                {t('form.cancel')}
              </Button>
              <Button type="submit">{t('form.create')}</Button>
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
        title={t('modals.editTitle')}
        size="lg"
        centered
      >
        <form onSubmit={editScheduleForm.onSubmit(handleEditScheduleSubmit)}>
          <Stack>
            {selectedSchedule && (
              <Group gap="xs">
                <Badge color="blue">{selectedSchedule.poleCode || selectedSchedule.parkCode || t('labels.none')}</Badge>
                <Badge>{getFrequencyLabel(selectedSchedule.frequency)}</Badge>
              </Group>
            )}
            <TextInput
              label={t('form.descriptionLabel')}
              required
              {...editScheduleForm.getInputProps('description')}
            />
            <TextInput
              label={t('form.startDateLabel')}
              type="date"
              required
              {...editScheduleForm.getInputProps('startDate')}
            />
            <TextInput
              label={t('form.endDateLabel')}
              type="date"
              {...editScheduleForm.getInputProps('endDate')}
            />
            <Select
              label={t('form.statusLabel')}
              data={statusOptions}
              required
              {...editScheduleForm.getInputProps('status')}
            />
            <NumberInput
              label={t('form.estimatedCostLabel')}
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
              label={t('form.remarkLabel')}
              placeholder={t('form.remarkPlaceholder')}
              {...editScheduleForm.getInputProps('remark')}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => { setEditScheduleOpened(false); setSelectedSchedule(null); }}>
                {t('form.cancel')}
              </Button>
              <Button type="submit">{t('form.update')}</Button>
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
        title={t('modals.issueTitle')}
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
                <Text fw={700}>{t('issueDetails.assetCode')}:</Text>
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
                    t('labels.na')}
                </Badge>
              </Group>
              <Group mb="xs">
                <Text fw={700}>{t('issueDetails.severity')}:</Text>
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
                  {getSeverityLabel(selectedIssue.severity)}
                </Badge>
              </Group>
              <Text fw={700} mb="xs">{t('issueDetails.description')}:</Text>
              <Text mb="xs">{selectedIssue.description}</Text>
              {selectedIssue.resolutionNotes && (
                <>
                  <Text fw={700} mb="xs">{t('issueDetails.resolutionNotes')}:</Text>
                  <Text mb="xs">{selectedIssue.resolutionNotes}</Text>
                </>
              )}
              <Group mt="xs">
                <Text fw={700}>{t('issueDetails.reportedBy')}:</Text>
                <Text>{selectedIssue.reportedBy?.fullName || t('labels.na')}</Text>
              </Group>
              <Group mt="xs">
                <Text fw={700}>{t('issueDetails.created')}:</Text>
                <Text>{new Date(selectedIssue.createdAt).toLocaleDateString()}</Text>
              </Group>
              {selectedIssue.updatedAt && (
                <Group mt="xs">
                  <Text fw={700}>{t('issueDetails.updated')}:</Text>
                  <Text>{new Date(selectedIssue.updatedAt).toLocaleDateString()}</Text>
                </Group>
              )}
            </Paper>
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => {
                setIssueModalOpened(false);
                setSelectedIssueId(null);
              }}>
                {t('issueDetails.close')}
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" p="xl">
            {t('issueDetails.notFound')}
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
        title={t('modals.deleteTitle')}
        centered
      >
        <Stack>
          <Text>
            {t('delete.confirm')}
          </Text>
          {scheduleToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>{t('delete.assetCode')}:</Text>
              <Text size="sm">{getScheduleAssetCode(scheduleToDelete)}</Text>
              <Text size="sm" fw={700} mt="xs">{t('delete.description')}:</Text>
              <Text size="sm">{scheduleToDelete.description}</Text>
              <Text size="sm" fw={700} mt="xs">{t('delete.status')}:</Text>
              <Badge color={getScheduleStatusColor(scheduleToDelete.status)}>
                {getStatusLabel(scheduleToDelete.status)}
              </Badge>
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
              {t('delete.cancel')}
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              {t('delete.confirmButton')}
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
        title={t('modals.receiveTitle')}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t('receive.description')}
          </Text>
          {selectedScheduleForReceive && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={600}>{t('receive.assetCode')}:</Text>
              <Text size="sm">{getScheduleAssetCode(selectedScheduleForReceive) || t('labels.na')}</Text>
              <Text size="sm" fw={600} mt="xs">{t('receive.poleDetails')}:</Text>
              <Text size="sm">
                {getAssetNameByType(filterType, getScheduleAsset(selectedScheduleForReceive)) || t('labels.na')}
              </Text>
              <Text size="sm" fw={600} mt="xs">{t('receive.awaitingDelivery')}:</Text>
              <Text size="sm">
                {t('receive.materialRequests', {
                  count:
                    selectedScheduleForReceive.materialRequests?.filter((mr: any) => mr.status === 'AWAITING_DELIVERY').length || 0,
                })}
              </Text>
            </Paper>
          )}
          <Textarea
            label={t('receive.deliveryNotesLabel')}
            placeholder={t('receive.deliveryNotesPlaceholder')}
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
              {t('receive.cancel')}
            </Button>
            <Button
              color="purple"
              onClick={() => {
                console.log('🎯 Mark as Received button clicked');

                if (!selectedScheduleForReceive) {
                  console.error('❌ No schedule selected for receive');
                  notifications.show({
                    title: t('notifications.errorTitle'),
                    message: t('notifications.noScheduleSelected'),
                    color: 'red',
                  });
                  return;
                }

                const awaitingRequests = selectedScheduleForReceive?.materialRequests?.filter((mr: any) => mr.status === 'AWAITING_DELIVERY') || [];
                console.log('📋 Available awaiting requests:', awaitingRequests);

                if (awaitingRequests.length === 0) {
                  console.warn('⚠️ No materials awaiting delivery');
                  notifications.show({
                    title: t('notifications.noMaterialsAwaitingTitle'),
                    message: t('notifications.noMaterialsAwaitingMessage'),
                    color: 'orange',
                  });
                  return;
                }

                // For now, receive the first awaiting request
                // TODO: Allow selecting which request to receive if multiple exist
                const awaitingRequest = awaitingRequests[0];
                console.log('📦 Receiving material request:', awaitingRequest);
                console.log('📦 Material request ID:', awaitingRequest.id);
                console.log('📦 Material request maintenanceScheduleId:', awaitingRequest.maintenanceScheduleId);
                console.log('📦 Selected schedule ID:', selectedScheduleForReceive.id);

                if (!awaitingRequest.id) {
                  console.error('❌ Material request has no ID');
                  notifications.show({
                    title: t('notifications.errorTitle'),
                    message: t('notifications.materialRequestIdMissing'),
                    color: 'red',
                  });
                  return;
                }

                try {
                  receiveMutation.mutate({
                    materialRequestId: awaitingRequest.id,
                    notes: receiveNotes.trim() || undefined,
                  });
                } catch (syncError) {
                  console.error('❌ Synchronous error in receive mutation:', syncError);
                  notifications.show({
                    title: t('notifications.errorTitle'),
                    message: t('notifications.unexpectedError'),
                    color: 'red',
                  });
                }
              }}
              loading={receiveMutation.isPending}
            >
              {t('receive.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
