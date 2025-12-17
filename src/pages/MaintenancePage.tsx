import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { IconEye, IconTrash } from '@tabler/icons-react';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

const SCHEDULE_STATUSES = ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'];
const ASSET_TYPES = [
  { value: 'pole', label: 'Light Poles' },
  { value: 'park', label: 'Public Parks' },
  { value: 'parking', label: 'Car Parking Lots' },
  { value: 'museum', label: 'Museums' },
  { value: 'toilet', label: 'Public Toilets' },
  { value: 'football', label: 'Football Fields' },
  { value: 'river', label: 'River Side Projects' },
];

function getScheduleType(schedule: any): string {
  if (schedule?.poleCode) return 'pole';
  if (schedule?.parkCode) return 'park';
  if (schedule?.parkingLotCode) return 'parking';
  if (schedule?.museumCode) return 'museum';
  if (schedule?.publicToiletCode) return 'toilet';
  if (schedule?.footballFieldCode) return 'football';
  if (schedule?.riverSideProjectCode) return 'river';
  return 'pole';
}

function getScheduleAssetCode(schedule: any): string {
  return (
    schedule?.poleCode ||
    schedule?.parkCode ||
    schedule?.parkingLotCode ||
    schedule?.museumCode ||
    schedule?.publicToiletCode ||
    schedule?.footballFieldCode ||
    schedule?.riverSideProjectCode ||
    '—'
  );
}

function getScheduleAsset(schedule: any) {
  const type = getScheduleType(schedule);
  if (type === 'pole') return schedule?.pole || null;
  if (type === 'park') return schedule?.park || null;
  if (type === 'parking') return schedule?.parkingLot || null;
  if (type === 'museum') return schedule?.museum || null;
  if (type === 'toilet') return schedule?.publicToilet || null;
  if (type === 'football') return schedule?.footballField || null;
  if (type === 'river') return schedule?.riverSideProject || null;
  return null;
}

function getAssetNameByType(type: string, asset: any): string {
  if (!asset) return '—';
  if (type === 'pole') return 'Light Pole';
  return asset?.name || '—';
}

function getAssetDistrictByType(type: string, asset: any): string {
  if (!asset) return '—';
  if (type === 'pole') return asset?.subcity || '—';
  return asset?.district || '—';
}

function getAssetStreet(asset: any): string {
  return asset?.street || '—';
}

function getAssetInfoLabel(type: string): string {
  if (type === 'pole') return 'Pole Details';
  if (type === 'park') return 'Park Details';
  if (type === 'parking') return 'Parking Details';
  if (type === 'museum') return 'Museum Type';
  if (type === 'toilet') return 'Toilet Details';
  if (type === 'football') return 'Field Details';
  if (type === 'river') return 'Project Type';
  return 'Asset Info';
}

function getAssetInfo(type: string, asset: any): string {
  if (!asset) return '—';
  if (type === 'pole') return `${asset?.poleType || '—'} • ${asset?.lampType || '—'} • ${asset?.heightMeters ?? '—'}m`;
  if (type === 'park') return `${asset?.parkType || '—'} • ${asset?.areaHectares ?? '—'} ha`;
  if (type === 'parking')
    return `${asset?.parkingType || '—'} • cap ${asset?.capacity ?? '—'} • ${asset?.hasPaidParking ? 'paid' : 'free'}`;
  if (type === 'museum') return asset?.museumType || '—';
  if (type === 'toilet') return `${asset?.toiletType || '—'} • ${asset?.hasPaidAccess ? 'paid' : 'free'}`;
  if (type === 'football') return `${asset?.fieldType || '—'} • cap ${asset?.capacity ?? '—'}`;
  if (type === 'river') return asset?.projectType || '—';
  return '—';
}

export default function MaintenancePage() {
  const [searchParams] = useSearchParams();
  const filterType = (searchParams.get('type') || 'pole').toLowerCase(); // default: light poles
  const [createScheduleOpened, setCreateScheduleOpened] = useState(false);
  const [editScheduleOpened, setEditScheduleOpened] = useState(false);
  const [issueModalOpened, setIssueModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);

  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['maintenance', 'schedules', filterType],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const maintenanceEndpoints: Record<string, string> = {
        pole: 'http://localhost:3011/api/v1/maintenance/schedules?type=pole',
        park: 'http://localhost:3011/api/v1/parks/maintenance',
        parking: 'http://localhost:3011/api/v1/parking-lots/maintenance',
        museum: 'http://localhost:3011/api/v1/museums/maintenance',
        toilet: 'http://localhost:3011/api/v1/public-toilets/maintenance',
        football: 'http://localhost:3011/api/v1/football-fields/maintenance',
        river: 'http://localhost:3011/api/v1/river-side-projects/maintenance',
      };
      const url = maintenanceEndpoints[filterType] || maintenanceEndpoints.pole;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: issuesForType } = useQuery({
    queryKey: ['issues', 'for-maintenance', filterType],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const baseHeaders = { Authorization: `Bearer ${token}` };
        const endpoints: Record<string, string> = {
          pole: 'http://localhost:3011/api/v1/issues',
          park: 'http://localhost:3011/api/v1/park-issues',
          parking: 'http://localhost:3011/api/v1/parking-lot-issues',
          museum: 'http://localhost:3011/api/v1/museum-issues',
          toilet: 'http://localhost:3011/api/v1/toilet-issues',
          football: 'http://localhost:3011/api/v1/football-field-issues',
          river: 'http://localhost:3011/api/v1/river-issues',
        };
        const url = endpoints[filterType] || endpoints.pole;
        const res = await axios.get(url, { headers: baseHeaders });
        return Array.isArray(res.data) ? res.data : [];
      } catch (error: any) {
        console.warn('Failed to fetch issues:', error.response?.status || error.message);
        return [];
      }
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
    const issues = (issuesForType || []).filter(
      (issue: any) => issue?.status !== 'CLOSED' && issue?.status !== 'IN_PROGRESS',
    );
    const type = filterType;
    return issues.map((issue: any) => {
      const code =
        issue?.pole?.code ||
        issue?.poleCode ||
        issue?.park?.code ||
        issue?.parkCode ||
        issue?.parkingLot?.code ||
        issue?.parkingLotCode ||
        issue?.museum?.code ||
        issue?.museumCode ||
        issue?.publicToilet?.code ||
        issue?.publicToiletCode ||
        issue?.footballField?.code ||
        issue?.footballFieldCode ||
        issue?.riverSideProject?.code ||
        issue?.riverSideProjectCode ||
        'N/A';
      const typeLabel = ASSET_TYPES.find((t) => t.value === type)?.label || 'Asset';
      return {
        value: issue.id,
        label: `${typeLabel.replace(/s$/, '')} ${code} – ${issue.description}`,
        issueType: type,
        code,
      };
    });
  }, [issuesForType, filterType]);

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

  const { data: parksData } = useQuery({
    queryKey: ['parks', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/parks?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: parkingLotsData } = useQuery({
    queryKey: ['parking-lots', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/parking-lots?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: museumsData } = useQuery({
    queryKey: ['museums', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/museums?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: toiletsData } = useQuery({
    queryKey: ['public-toilets', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/public-toilets?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: footballFieldsData } = useQuery({
    queryKey: ['football-fields', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/football-fields?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: riverSideProjectsData } = useQuery({
    queryKey: ['river-side-projects', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/river-side-projects?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const poleOptions = polesData?.items?.map((pole: any) => ({
    value: pole.code,
    label: `${pole.code} - ${pole.street}, ${pole.subcity || pole.district}`,
  })) || [];

  const parkOptions = parksData?.items?.map((park: any) => ({
    value: park.code,
    label: `${park.code} - ${park.street}, ${park.district}`,
  })) || [];

  const parkingLotOptions =
    parkingLotsData?.items?.map((lot: any) => ({
      value: lot.code,
      label: `${lot.code} - ${lot.street}, ${lot.district}`,
    })) || [];

  const museumOptions =
    museumsData?.items?.map((m: any) => ({
      value: m.code,
      label: `${m.code} - ${m.street}, ${m.district}`,
    })) || [];

  const toiletOptions =
    toiletsData?.items?.map((t: any) => ({
      value: t.code,
      label: `${t.code} - ${t.street}, ${t.district}`,
    })) || [];

  const footballFieldOptions =
    footballFieldsData?.items?.map((f: any) => ({
      value: f.code,
      label: `${f.code} - ${f.street}, ${f.district}`,
    })) || [];

  const riverSideProjectOptions =
    riverSideProjectsData?.items?.map((p: any) => ({
      value: p.code,
      label: `${p.code} - ${p.street}, ${p.district}`,
    })) || [];

  const assetOptionsByType: Record<string, any[]> = {
    pole: poleOptions,
    park: parkOptions,
    parking: parkingLotOptions,
    museum: museumOptions,
    toilet: toiletOptions,
    football: footballFieldOptions,
    river: riverSideProjectOptions,
  };

  const scheduleForm = useForm({
    initialValues: {
      poleCode: '',
      parkCode: '',
      parkingLotCode: '',
      museumCode: '',
      publicToiletCode: '',
      footballFieldCode: '',
      riverSideProjectCode: '',
      issueId: '',
      frequency: 'MONTHLY', // kept as default and hidden from UI
      description: '',
      startDate: '',
      endDate: '',
      status: 'REQUESTED',
      estimatedCost: undefined as number | undefined,
      remark: '',
      maintenanceType: 'issue', // 'issue' or 'direct'
      assetType: filterType,
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

      const clearAssetCodes = () => {
        delete payload.poleCode;
        delete payload.parkCode;
        delete payload.parkingLotCode;
        delete payload.museumCode;
        delete payload.publicToiletCode;
        delete payload.footballFieldCode;
        delete payload.riverSideProjectCode;
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
        clearAssetCodes();
        // Set correct code field based on current filter type
        if (filterType === 'park') payload.parkCode = values.parkCode;
        else if (filterType === 'pole') payload.poleCode = values.poleCode;
        else if (filterType === 'parking') payload.parkingLotCode = values.parkingLotCode;
        else if (filterType === 'museum') payload.museumCode = values.museumCode;
        else if (filterType === 'toilet') payload.publicToiletCode = values.publicToiletCode;
        else if (filterType === 'football') payload.footballFieldCode = values.footballFieldCode;
        else if (filterType === 'river') payload.riverSideProjectCode = values.riverSideProjectCode;
      } else {
        // Direct maintenance - require a code based on assetType
        clearAssetCodes();
        const t = (values.assetType || filterType || 'pole').toLowerCase();
        if (t === 'pole' && values.poleCode) payload.poleCode = values.poleCode;
        else if (t === 'park' && values.parkCode) payload.parkCode = values.parkCode;
        else if (t === 'parking' && values.parkingLotCode) payload.parkingLotCode = values.parkingLotCode;
        else if (t === 'museum' && values.museumCode) payload.museumCode = values.museumCode;
        else if (t === 'toilet' && values.publicToiletCode) payload.publicToiletCode = values.publicToiletCode;
        else if (t === 'football' && values.footballFieldCode) payload.footballFieldCode = values.footballFieldCode;
        else if (t === 'river' && values.riverSideProjectCode) payload.riverSideProjectCode = values.riverSideProjectCode;
        else {
          notifications.show({
            title: 'Error',
            message: 'Please select an asset for direct maintenance',
            color: 'red',
          });
          return;
        }
      }

      const maintenanceEndpoints: Record<string, string> = {
        pole: 'http://localhost:3011/api/v1/maintenance/schedules',
        park: 'http://localhost:3011/api/v1/parks/maintenance',
        parking: 'http://localhost:3011/api/v1/parking-lots/maintenance',
        museum: 'http://localhost:3011/api/v1/museums/maintenance',
        toilet: 'http://localhost:3011/api/v1/public-toilets/maintenance',
        football: 'http://localhost:3011/api/v1/football-fields/maintenance',
        river: 'http://localhost:3011/api/v1/river-side-projects/maintenance',
      };
      const assetType = (values.assetType || filterType || 'pole').toLowerCase();
      const endpoint = maintenanceEndpoints[assetType] || maintenanceEndpoints.pole;
      
      // Transform payload for new endpoints (remove old multi-asset fields, use single asset field)
      const newPayload: any = {
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        frequency: payload.frequency,
        status: payload.status,
        estimatedCost: payload.estimatedCost,
        remark: payload.remark,
        issueId: payload.issueId,
        district: payload.district,
      };
      
      if (assetType === 'park' && payload.parkCode) {
        newPayload.parkCode = payload.parkCode;
      } else if (assetType === 'parking' && payload.parkingLotCode) {
        newPayload.parkingLotCode = payload.parkingLotCode;
      } else if (assetType === 'museum' && payload.museumCode) {
        newPayload.museumCode = payload.museumCode;
      } else if (assetType === 'toilet' && payload.publicToiletCode) {
        newPayload.publicToiletCode = payload.publicToiletCode;
      } else if (assetType === 'football' && payload.footballFieldCode) {
        newPayload.footballFieldCode = payload.footballFieldCode;
      } else if (assetType === 'river' && payload.riverSideProjectCode) {
        newPayload.riverSideProjectCode = payload.riverSideProjectCode;
      } else if (assetType === 'pole' && payload.poleCode) {
        newPayload.poleCode = payload.poleCode;
      }
      
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
      const maintenanceEndpoints: Record<string, string> = {
        pole: 'http://localhost:3011/api/v1/maintenance/schedules',
        park: 'http://localhost:3011/api/v1/parks/maintenance',
        parking: 'http://localhost:3011/api/v1/parking-lots/maintenance',
        museum: 'http://localhost:3011/api/v1/museums/maintenance',
        toilet: 'http://localhost:3011/api/v1/public-toilets/maintenance',
        football: 'http://localhost:3011/api/v1/football-fields/maintenance',
        river: 'http://localhost:3011/api/v1/river-side-projects/maintenance',
      };
      const endpoint = maintenanceEndpoints[scheduleType] || maintenanceEndpoints.pole;
      
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
      const maintenanceEndpoints: Record<string, string> = {
        pole: 'http://localhost:3011/api/v1/maintenance/schedules',
        park: 'http://localhost:3011/api/v1/parks/maintenance',
        parking: 'http://localhost:3011/api/v1/parking-lots/maintenance',
        museum: 'http://localhost:3011/api/v1/museums/maintenance',
        toilet: 'http://localhost:3011/api/v1/public-toilets/maintenance',
        football: 'http://localhost:3011/api/v1/football-fields/maintenance',
        river: 'http://localhost:3011/api/v1/river-side-projects/maintenance',
      };
      const endpoint = maintenanceEndpoints[scheduleType] || maintenanceEndpoints.pole;
      
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
                  <Table.Th>Asset Code</Table.Th>
                  <Table.Th>Asset Name</Table.Th>
                  <Table.Th>District</Table.Th>
                  <Table.Th>Street</Table.Th>
                  <Table.Th>{getAssetInfoLabel(filterType)}</Table.Th>
                  <Table.Th>Maintenance</Table.Th>
                  <Table.Th>Frequency</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th>End Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Cost</Table.Th>
                  <Table.Th>Issue Detail</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedulesLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={13}>Loading...</Table.Td>
                  </Table.Tr>
                ) : schedules?.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={13}>No maintenance records found</Table.Td>
                  </Table.Tr>
                ) : (
                  schedules?.map((schedule: any) => (
                    (() => {
                      const type = getScheduleType(schedule);
                      const asset = getScheduleAsset(schedule);
                      return (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>{getScheduleAssetCode(schedule)}</Table.Td>
                      <Table.Td>{getAssetNameByType(type, asset)}</Table.Td>
                      <Table.Td>{getAssetDistrictByType(type, asset)}</Table.Td>
                      <Table.Td>{getAssetStreet(asset)}</Table.Td>
                      <Table.Td>{getAssetInfo(type, asset)}</Table.Td>
                      <Table.Td>{schedule.description}</Table.Td>
                      <Table.Td>{schedule.frequency}</Table.Td>
                      <Table.Td>
                        {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        <Badge>{schedule.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {schedule.cost && schedule.cost > 0
                          ? `$${parseFloat(schedule.cost).toFixed(2)}`
                          : schedule.estimatedCost && schedule.estimatedCost > 0
                          ? `$${parseFloat(schedule.estimatedCost).toFixed(2)}`
                          : '-'}
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => {
                            if (schedule.issueId) {
                              setSelectedIssueId(schedule.issueId);
                              setSelectedIssueType(getScheduleType(schedule));
                              setIssueModalOpened(true);
                            } else {
                              notifications.show({
                                title: 'No Issue',
                                message: 'This maintenance record has no associated issue',
                                color: 'gray',
                              });
                            }
                          }}
                          title={schedule.issueId ? "View Issue" : "No associated issue"}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {schedule.status === 'REQUESTED' && (
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteClick(schedule)}
                              title="Delete Schedule"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                          {['REQUESTED', 'STARTED', 'PAUSED'].includes(schedule.status) && (
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => handleEditScheduleClick(schedule)}
                            >
                              {schedule.status === 'STARTED' || schedule.status === 'PAUSED' ? 'Update Status' : 'Edit'}
                            </Button>
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
              <Select
                label="Issue"
                placeholder="Select related issue"
                data={issueOptions}
                searchable
                required
                value={scheduleForm.values.issueId}
                onChange={(value) => {
                  scheduleForm.setFieldValue('issueId', value || '');
                  // set asset code field based on current page type
                  const selected = issueOptions.find((opt: any) => opt.value === value);
                  const code = selected?.code || '';
                  scheduleForm.setFieldValue('poleCode', '');
                  scheduleForm.setFieldValue('parkCode', '');
                  scheduleForm.setFieldValue('parkingLotCode', '');
                  scheduleForm.setFieldValue('museumCode', '');
                  scheduleForm.setFieldValue('publicToiletCode', '');
                  scheduleForm.setFieldValue('footballFieldCode', '');
                  scheduleForm.setFieldValue('riverSideProjectCode', '');
                  if (filterType === 'pole') scheduleForm.setFieldValue('poleCode', code);
                  else if (filterType === 'park') scheduleForm.setFieldValue('parkCode', code);
                  else if (filterType === 'parking') scheduleForm.setFieldValue('parkingLotCode', code);
                  else if (filterType === 'museum') scheduleForm.setFieldValue('museumCode', code);
                  else if (filterType === 'toilet') scheduleForm.setFieldValue('publicToiletCode', code);
                  else if (filterType === 'football') scheduleForm.setFieldValue('footballFieldCode', code);
                  else if (filterType === 'river') scheduleForm.setFieldValue('riverSideProjectCode', code);
                }}
              />
            ) : (
              <>
                <Select
                  label="Select Type"
                  data={ASSET_TYPES}
                  value={scheduleForm.values.assetType}
                  onChange={(value) => {
                    scheduleForm.setFieldValue('assetType', value || filterType);
                    scheduleForm.setFieldValue('poleCode', '');
                    scheduleForm.setFieldValue('parkCode', '');
                    scheduleForm.setFieldValue('parkingLotCode', '');
                    scheduleForm.setFieldValue('museumCode', '');
                    scheduleForm.setFieldValue('publicToiletCode', '');
                    scheduleForm.setFieldValue('footballFieldCode', '');
                    scheduleForm.setFieldValue('riverSideProjectCode', '');
                  }}
                  required
                />
                <Select
                  label="Asset Code"
                  placeholder="Select asset"
                  data={assetOptionsByType[scheduleForm.values.assetType] || []}
                  searchable
                  required
                  value={
                    scheduleForm.values.poleCode ||
                    scheduleForm.values.parkCode ||
                    scheduleForm.values.parkingLotCode ||
                    scheduleForm.values.museumCode ||
                    scheduleForm.values.publicToiletCode ||
                    scheduleForm.values.footballFieldCode ||
                    scheduleForm.values.riverSideProjectCode ||
                    ''
                  }
                  onChange={(value) => {
                    const t = (scheduleForm.values.assetType || filterType).toLowerCase();
                    scheduleForm.setFieldValue('poleCode', '');
                    scheduleForm.setFieldValue('parkCode', '');
                    scheduleForm.setFieldValue('parkingLotCode', '');
                    scheduleForm.setFieldValue('museumCode', '');
                    scheduleForm.setFieldValue('publicToiletCode', '');
                    scheduleForm.setFieldValue('footballFieldCode', '');
                    scheduleForm.setFieldValue('riverSideProjectCode', '');
                    if (t === 'pole') scheduleForm.setFieldValue('poleCode', value || '');
                    else if (t === 'park') scheduleForm.setFieldValue('parkCode', value || '');
                    else if (t === 'parking') scheduleForm.setFieldValue('parkingLotCode', value || '');
                    else if (t === 'museum') scheduleForm.setFieldValue('museumCode', value || '');
                    else if (t === 'toilet') scheduleForm.setFieldValue('publicToiletCode', value || '');
                    else if (t === 'football') scheduleForm.setFieldValue('footballFieldCode', value || '');
                    else if (t === 'river') scheduleForm.setFieldValue('riverSideProjectCode', value || '');
                  }}
                />
              </>
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
              <Badge>{scheduleToDelete.status}</Badge>
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
    </Container>
  );
}

