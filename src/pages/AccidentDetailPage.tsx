import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Badge,
  Text,
  Group,
  Button,
  Stack,
  Card,
  Grid,
  Image,
  Modal,
  Select,
  TextInput,
  Textarea,
  Checkbox,
  Alert,
  Tabs,
  Timeline,
  FileInput,
  ActionIcon,
  Tooltip,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconEye,
  IconEdit,
  IconFileDownload,
  IconCheck,
  IconX,
  IconUpload,
  IconTrash,
  IconMapPin,
  IconCar,
  IconFileText,
  IconCamera,
  IconClock,
  IconUser,
  IconBuilding,
  IconSettings,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../hooks/useAuth';

const DAMAGE_LEVELS = [
  { value: 'MINOR', label: 'Minor Damage' },
  { value: 'MODERATE', label: 'Moderate Damage' },
  { value: 'SEVERE', label: 'Severe Damage' },
  { value: 'TOTAL_LOSS', label: 'Total Loss' },
];

const DAMAGED_COMPONENTS = [
  { value: 'POLE', label: 'Pole' },
  { value: 'LUMINAIRE', label: 'Luminaire' },
  { value: 'ARM_BRACKET', label: 'Arm & Bracket' },
  { value: 'FOUNDATION', label: 'Foundation' },
  { value: 'CABLE', label: 'Cable' },
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

export default function AccidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Modal states
  const [damageAssessmentOpened, { open: openDamageAssessment, close: closeDamageAssessment }] = useDisclosure(false);
  const [approvalOpened, { open: openApproval, close: closeApproval }] = useDisclosure(false);
  const [photoUploadOpened, { open: openPhotoUpload, close: closePhotoUpload }] = useDisclosure(false);
  const [attachmentUploadOpened, { open: openAttachmentUpload, close: closeAttachmentUpload }] = useDisclosure(false);
  const [editOpened, { open: openEditModal, close: closeEdit }] = useDisclosure(false);

  // Custom openEdit function that populates form with current data
  const openEdit = () => {
    if (accident) {
      editForm.setValues({
        accidentType: accident.accidentType || '',
        accidentDate: accident.accidentDate ? new Date(accident.accidentDate).toISOString().split('T')[0] : '',
        accidentTime: accident.accidentTime || '',
        poleId: accident.poleId || '',
        latitude: accident.latitude || null,
        longitude: accident.longitude || null,
        locationDescription: accident.locationDescription || '',
        vehiclePlateNumber: accident.vehiclePlateNumber || '',
        driverName: accident.driverName || '',
        insuranceCompany: accident.insuranceCompany || '',
        claimReferenceNumber: accident.claimReferenceNumber || '',
      });
    }
    openEditModal();
  };

  // Custom openDamageAssessment function that populates form with existing damage assessment data
  const openDamageAssessmentModal = () => {
    // Always include Labour Cost and Transport Cost components
    const alwaysIncludedComponents = damagedComponentsData?.filter(component =>
      component.name === 'Labour Cost' || component.name === 'Transport Cost'
    ).map(component => component.id) || [];

    if (accident) {
      const existingComponents = accident.damagedComponents?.map(dc => dc.damagedComponentId) || [];
      const combinedComponents = [...new Set([...existingComponents, ...alwaysIncludedComponents])];

      damageForm.setValues({
        damageLevel: accident.damageLevel || '',
        damageDescription: accident.damageDescription || '',
        safetyRisk: accident.safetyRisk || false,
        damagedComponents: combinedComponents,
      });
    } else {
      // For new assessments, still include the default components
      damageForm.setValues({
        damageLevel: '',
        damageDescription: '',
        safetyRisk: false,
        damagedComponents: alwaysIncludedComponents,
      });
    }
    openDamageAssessment();
  };

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);

  // Fetch accident details
  const { data: accident, isLoading, error, refetch } = useQuery({
    queryKey: ['accident', id],
    queryFn: () => {
      const token = localStorage.getItem('access_token');
      return axios.get(`http://localhost:3011/api/v1/accidents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(res => res.data);
    },
    enabled: !!id,
  });

  // Damage assessment form
  const damageForm = useForm({
    initialValues: {
      damageLevel: '',
      damageDescription: '',
      safetyRisk: false,
      damagedComponents: [] as string[],
    },
  });

  // Approval form
  const approvalForm = useForm({
    initialValues: {
      action: '',
      comments: '',
    },
  });

  // Edit accident form
  const editForm = useForm({
    initialValues: {
      accidentType: '',
      accidentDate: '',
      accidentTime: '',
      poleId: '',
      latitude: null as number | null,
      longitude: null as number | null,
      locationDescription: '',
      vehiclePlateNumber: '',
      driverName: '',
      insuranceCompany: '',
      claimReferenceNumber: '',
    },
    validate: {
      accidentType: (value) => !value && 'Accident type is required',
      accidentDate: (value) => !value && 'Accident date is required',
      accidentTime: (value) => !value && 'Accident time is required',
      locationDescription: (value) => !value && 'Location description is required',
      latitude: (value) => {
        if (value !== null && value !== undefined && value !== '') {
          const num = Number(value);
          if (isNaN(num)) return 'Latitude must be a valid number';
          if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
        }
        return null;
      },
      longitude: (value) => {
        if (value !== null && value !== undefined && value !== '') {
          const num = Number(value);
          if (isNaN(num)) return 'Longitude must be a valid number';
          if (num < -180 || num > 180) return 'Longitude must be between -180 and 180';
        }
        return null;
      },
    },
  });

  // Update accident mutation (damage assessment)
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(`http://localhost:3011/api/v1/accidents/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Damage assessment completed successfully',
        color: 'green',
      });
      closeDamageAssessment();
      damageForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update accident',
        color: 'red',
      });
    },
  });

  // Fetch poles for edit dropdown
  const { data: polesData } = useQuery({
    queryKey: ['poles', 'all'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/poles?limit=10000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Fetch damaged components for damage assessment
  const { data: damagedComponentsData } = useQuery({
    queryKey: ['damaged-components', 'active'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/damaged-components?activeOnly=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Create a mapping of component IDs to names for display
  const componentNameMap = damagedComponentsData?.reduce((map: { [key: string]: string }, component: any) => {
    map[component.id] = component.name;
    return map;
  }, {}) || {};

  // Format poles for Select component
  const poleOptions = polesData?.items?.map((pole: any) => ({
    value: pole.code,
    label: `${pole.code} - ${pole.subcity}, ${pole.street}`,
  })) || [];

  // Edit accident mutation
  const editMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(`http://localhost:3011/api/v1/accidents/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Accident details updated successfully',
        color: 'green',
      });
      closeEdit();
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update accident',
        color: 'red',
      });
    },
  });

  // Approval mutation
  const approveMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.post(`http://localhost:3011/api/v1/accidents/${id}/approve`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Approval processed successfully',
        color: 'green',
      });
      closeApproval();
      approvalForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to process approval',
        color: 'red',
      });
    },
  });

  // Claim status update mutation
  const claimUpdateMutation = useMutation({
    mutationFn: (claimStatus: string) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(`http://localhost:3011/api/v1/accidents/${id}/status`, { claimStatus }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Claim status updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update claim status',
        color: 'red',
      });
    },
  });

  // Photo upload mutation
  const photoUploadMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      return axios.post(`http://localhost:3011/api/v1/accidents/${id}/photos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Photos uploaded successfully',
        color: 'green',
      });
      closePhotoUpload();
      setSelectedPhotos([]);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: 'Failed to upload photos',
        color: 'red',
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => {
      const token = localStorage.getItem('access_token');
      return axios.delete(`http://localhost:3011/api/v1/accidents/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Photo deleted successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete photo',
        color: 'red',
      });
    },
  });

  // Attachment upload mutation
  const attachmentUploadMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      return axios.post(`http://localhost:3011/api/v1/accidents/${id}/attachments`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: 'Success',
        message: 'Attachments uploaded successfully',
        color: 'green',
      });
      closeAttachmentUpload();
      setSelectedAttachments([]);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: 'Failed to upload attachments',
        color: 'red',
      });
    },
  });

  // Download report mutation
  const downloadReportMutation = useMutation({
    mutationFn: (type: string) => {
      const token = localStorage.getItem('access_token');
      return axios.get(`http://localhost:3011/api/v1/accidents/${id}/reports/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });
    },
    onSuccess: (data, type) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to download report',
        color: 'red',
      });
    },
  });

  const handleDamageAssessment = (values: any) => {
    console.log('🎯 Submitting damage assessment:', values);
    updateMutation.mutate({
      damageLevel: values.damageLevel,
      damageDescription: values.damageDescription,
      safetyRisk: values.safetyRisk,
      damagedComponents: values.damagedComponents,
    });
  };

  const handleApproval = (values: any) => {
    approveMutation.mutate(values);
  };

  const handleEdit = (values: any) => {
    console.log('🎯 Updating accident details:', values);

    // Clean up the data before sending
    const cleanedValues = {
      ...values,
      latitude: values.latitude === '' || values.latitude === null ? undefined : Number(values.latitude),
      longitude: values.longitude === '' || values.longitude === null ? undefined : Number(values.longitude),
    };

    editMutation.mutate(cleanedValues);
  };

  const handlePhotoUpload = () => {
    if (selectedPhotos.length === 0) return;

    const formData = new FormData();
    selectedPhotos.forEach(photo => {
      formData.append('files', photo);
    });

    photoUploadMutation.mutate(formData);
  };

  const handleAttachmentUpload = () => {
    if (selectedAttachments.length === 0) return;

    const formData = new FormData();
    selectedAttachments.forEach(attachment => {
      formData.append('files', attachment);
    });
    formData.append('attachmentType', 'OTHER');

    attachmentUploadMutation.mutate(formData);
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      deletePhotoMutation.mutate(photoId);
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

  // Admin users can do all actions
  const isAdmin = user?.role === 'ADMIN';
  const canInspect = isAdmin || (user?.role === 'INSPECTOR' && accident?.status === 'REPORTED');
  const canApproveSupervisor = isAdmin || (user?.role === 'SUPERVISOR' && accident?.status === 'INSPECTED');
  const canApproveFinance = isAdmin || (user?.role === 'FINANCE' && accident?.status === 'SUPERVISOR_REVIEW');
  const canCompleteRepair = isAdmin || ((user?.role === 'SUPERVISOR' || user?.role === 'INSPECTOR') && accident?.status === 'UNDER_REPAIR');

  // Debug logging
  console.log('User:', user);
  console.log('Accident:', accident);
  console.log('canInspect:', canInspect, 'canApproveSupervisor:', canApproveSupervisor, 'canApproveFinance:', canApproveFinance);

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (error || !accident) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error">
          Failed to load accident details. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{accident.incidentId}</Title>
          <Text c="dimmed">
            Reported on {formatDate(accident.createdAt)} by {accident.reportedBy?.fullName}
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<IconFileDownload size={16} />}
            onClick={() => downloadReportMutation.mutate('incident')}
            loading={downloadReportMutation.isPending}
          >
            Incident Report
          </Button>
          <Button
            variant="light"
            leftSection={<IconFileDownload size={16} />}
            onClick={() => downloadReportMutation.mutate('damage-assessment')}
            loading={downloadReportMutation.isPending}
          >
            Damage Assessment
          </Button>
          <Button
            variant="light"
            leftSection={<IconFileDownload size={16} />}
            onClick={() => downloadReportMutation.mutate('cost-estimate')}
            loading={downloadReportMutation.isPending}
          >
            Cost Estimate
          </Button>
        </Group>
      </Group>

      {/* Status Badges */}
      <Group mb="lg">
        <Badge color={getAccidentStatusColor(accident.status)} size="lg">
          {accident.status.replace(/_/g, ' ')}
        </Badge>
        <Badge color={getClaimStatusColor(accident.claimStatus)} size="lg">
          Claim: {accident.claimStatus.replace(/_/g, ' ')}
        </Badge>
        {accident.estimatedCost && (
          <Badge color="blue" size="lg">
            Estimated Cost: {formatCurrency(accident.estimatedCost)}
          </Badge>
        )}
      </Group>

      {/* Back Button */}
      <Group mt="md" mb="md">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/accidents')}
        >
          Back to Accidents List
        </Button>
      </Group>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Incident Details</Tabs.Tab>
          <Tabs.Tab value="assessment">Damage Assessment</Tabs.Tab>
          <Tabs.Tab value="photos">Photos & Evidence</Tabs.Tab>
          <Tabs.Tab value="approvals">Approval History</Tabs.Tab>
          {(isAdmin || accident?.status === 'APPROVED' || accident?.status === 'UNDER_REPAIR' || accident?.status === 'COMPLETED') && (
            <Tabs.Tab value="claims">Insurance Claims</Tabs.Tab>
          )}
        </Tabs.List>

        {/* Incident Details Tab */}
        <Tabs.Panel value="details" pt="xl">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>Incident Information</Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Accident Type</Text>
                      <Text>{accident.accidentType.replace(/_/g, ' ')}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Date & Time</Text>
                      <Text>{formatDate(accident.accidentDate)} {accident.accidentTime}</Text>
                    </Grid.Col>
                  </Grid>

                  <Divider />

                  <div>
                    <Text fw={500}>Location</Text>
                    <Text>{accident.locationDescription}</Text>
                    {accident.latitude && accident.longitude && (
                      <Text size="sm" c="dimmed">
                        Coordinates: {accident.latitude}, {accident.longitude}
                      </Text>
                    )}
                  </div>

                  <Divider />

                  <div>
                    <Text fw={500}>Pole Information</Text>
                    <Text>Pole ID: {accident.poleId || 'Not specified'}</Text>
                  </div>
                </Stack>
              </Card>

              <Card withBorder>
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>
                    <IconCar size={16} style={{ marginRight: 8 }} />
                    Vehicle & Insurance Information
                  </Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Vehicle Plate Number</Text>
                      <Text>{accident.vehiclePlateNumber || 'Not provided'}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Driver Name</Text>
                      <Text>{accident.driverName || 'Not provided'}</Text>
                    </Grid.Col>
                  </Grid>

                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Insurance Company</Text>
                      <Text>{accident.insuranceCompany || 'Not provided'}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Claim Reference</Text>
                      <Text>{accident.claimReferenceNumber || 'Not provided'}</Text>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              {/* Action Buttons */}
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>Actions</Title>
                </Card.Section>
                <Stack p="md" gap="sm">
                  {accident?.status === 'REPORTED' && (
                    <Button
                      fullWidth
                      leftSection={<IconEdit size={16} />}
                      onClick={openEdit}
                      variant="light"
                    >
                      Edit Incident Details
                    </Button>
                  )}

                  {canInspect && (
                    <Button
                      fullWidth
                      leftSection={<IconEdit size={16} />}
                      onClick={openDamageAssessmentModal}
                    >
                      Perform Damage Assessment
                    </Button>
                  )}

                  {(canApproveSupervisor || canApproveFinance) && accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconCheck size={16} />}
                      color="green"
                      onClick={openApproval}
                    >
                      Process Approval
                    </Button>
                  )}

                  {(canApproveSupervisor || canApproveFinance) && accident?.status === 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconCheck size={16} />}
                      color="green"
                      disabled
                    >
                      Approval Completed
                    </Button>
                  )}

                  {canCompleteRepair && accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconSettings size={16} />}
                      color="blue"
                      onClick={openApproval}
                    >
                      Complete Repairs
                    </Button>
                  )}

                  {canCompleteRepair && accident?.status === 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconSettings size={16} />}
                      color="blue"
                      disabled
                    >
                      Repairs Completed
                    </Button>
                  )}

                  {accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      variant="light"
                      leftSection={<IconCamera size={16} />}
                      onClick={openPhotoUpload}
                    >
                      Add Photos
                    </Button>
                  )}

                  {accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      variant="light"
                      leftSection={<IconFileText size={16} />}
                      onClick={openAttachmentUpload}
                    >
                      Add Attachments
                    </Button>
                  )}

                  {accident?.status === 'APPROVED' && (
                    <>
                      <Button
                        fullWidth
                        variant="light"
                        leftSection={<IconCamera size={16} />}
                        disabled
                      >
                        Photos Locked
                      </Button>

                      <Button
                        fullWidth
                        variant="light"
                        leftSection={<IconFileText size={16} />}
                        disabled
                      >
                        Attachments Locked
                      </Button>
                    </>
                  )}
                </Stack>
              </Card>

              {/* Quick Stats */}
              <Card withBorder>
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>Quick Stats</Title>
                </Card.Section>
                <Stack p="md" gap="sm">
                  <div>
                    <Text size="sm" c="dimmed">Photos</Text>
                    <Text fw={500}>{accident.photos?.length || 0}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Attachments</Text>
                    <Text fw={500}>{accident.attachments?.length || 0}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Approval Steps</Text>
                    <Text fw={500}>{accident.approvals?.length || 0}</Text>
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Damage Assessment Tab */}
        <Tabs.Panel value="assessment" pt="xl">
          <Card withBorder>
            <Card.Section withBorder inheritPadding py="sm">
              <Title order={4}>Damage Assessment</Title>
            </Card.Section>
            <Stack p="md" gap="md">
              {accident.damageLevel ? (
                <>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Damage Level</Text>
                      <Badge color="red">{accident.damageLevel}</Badge>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>Safety Risk</Text>
                      <Badge color={accident.safetyRisk ? 'red' : 'green'}>
                        {accident.safetyRisk ? 'Yes' : 'No'}
                      </Badge>
                    </Grid.Col>
                  </Grid>

                  <div>
                    <Text fw={500}>Damage Description</Text>
                    <Text>{accident.damageDescription}</Text>
                  </div>

                  {accident.estimatedCost && (
                    <div>
                      <Text fw={500}>Estimated Cost</Text>
                      <Text size="lg" fw={600} c="green">{formatCurrency(accident.estimatedCost)}</Text>
                    </div>
                  )}

                  {accident.costBreakdown && (
                    <Card withBorder>
                      <Card.Section withBorder inheritPadding py="sm">
                        <Title order={5}>Detailed Cost Breakdown</Title>
                      </Card.Section>
                      <Stack p="md" gap="xs">
                        {/* Calculate displayed components count for total */}
                        {(() => {
                          const displayedComponents = accident.damagedComponents?.filter((damagedComponent) => {
                            const componentName = componentNameMap[damagedComponent.damagedComponentId];
                            return componentName !== 'Labour Cost' && componentName !== 'Transport Cost';
                          }) || [];

                          return (
                            <>
                              {/* Show costs for damaged components (excluding Labour and Transport) */}
                              {displayedComponents.map((damagedComponent, index) => {
                                const componentName = componentNameMap[damagedComponent.damagedComponentId];

                                return (
                                  <Group key={index} justify="space-between">
                                    <Text size="sm">{componentName || damagedComponent.damagedComponentId}:</Text>
                                    <Text size="sm" fw={500}>{formatCurrency(2000.00)}</Text>
                                  </Group>
                                );
                              })}

                              {/* Show labor and transport costs */}
                              {accident.costBreakdown?.labor && (
                                <Group justify="space-between">
                                  <Text size="sm">Labor Cost:</Text>
                                  <Text size="sm" fw={500}>{formatCurrency(accident.costBreakdown.labor)}</Text>
                                </Group>
                              )}

                              {accident.costBreakdown?.transport && (
                                <Group justify="space-between">
                                  <Text size="sm">Transport Cost:</Text>
                                  <Text size="sm" fw={500}>{formatCurrency(accident.costBreakdown.transport)}</Text>
                                </Group>
                              )}

                              {/* Show total loss cost */}
                              <Divider />
                              <Group justify="space-between">
                                <Text size="sm" fw={600}>Total Loss Cost:</Text>
                                <Text size="sm" fw={600}>
                                  {formatCurrency(displayedComponents.length * 2000.00)}
                                </Text>
                              </Group>
                            </>
                          );
                        })()}
                      </Stack>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {canInspect ? (
                    <Group justify="center">
                      <Button
                        leftSection={<IconEdit size={16} />}
                        onClick={openDamageAssessmentModal}
                      >
                        Perform Damage Assessment
                      </Button>
                    </Group>
                  ) : (
                    <Alert color="blue">
                      {isAdmin && ' As an admin, you can perform all actions in the workflow.'}
                      {!isAdmin && accident?.status === 'REPORTED' && !canInspect && ' Click the "Perform Damage Assessment" button to get started.'}
                      {!isAdmin && accident?.status === 'INSPECTED' && (canApproveSupervisor || canApproveFinance) && ' Click the "Process Approval" button to continue the workflow.'}
                      {!isAdmin && accident?.status === 'SUPERVISOR_REVIEW' && canApproveFinance && ' Click the "Process Approval" button for final finance approval.'}
                      {!isAdmin && accident?.status === 'APPROVED' && ' Accident has been approved. Repairs can begin and insurance claims can be filed.'}
                      {!isAdmin && accident?.status === 'UNDER_REPAIR' && canCompleteRepair && ' Repairs are in progress. Click the "Complete Repairs" button when finished. Insurance claims can be managed in the Claims tab.'}
                      {!isAdmin && accident?.status === 'COMPLETED' && ' Accident repairs have been completed. Insurance claims can be managed in the Claims tab.'}
                      {!isAdmin && accident?.status === 'REJECTED' && ' This accident report has been rejected.'}
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Photos & Evidence Tab */}
        <Tabs.Panel value="photos" pt="xl">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>Photos ({accident.photos?.length || 0})</Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  {accident.photos?.length > 0 ? (
                    accident.photos.map((photo: any) => (
                      <Card
                        key={photo.id}
                        withBorder
                        style={{ position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={() => {
                          const iconsDiv = document.querySelector(`[data-photo-id="${photo.id}"]`) as HTMLElement;
                          if (iconsDiv) iconsDiv.style.opacity = '1';
                        }}
                        onMouseLeave={() => {
                          const iconsDiv = document.querySelector(`[data-photo-id="${photo.id}"]`) as HTMLElement;
                          if (iconsDiv) iconsDiv.style.opacity = '0';
                        }}
                      >
                        <Card.Section style={{ position: 'relative' }}>
                          {photo.isVideo ? (
                            <video
                              src={photo.path}
                              controls
                              style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                            />
                          ) : (
                            <Image
                              src={photo.path}
                              height={250}
                              alt={photo.description || 'Accident photo'}
                              fit="cover"
                              style={{
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              onClick={() => window.open(photo.path, '_blank')}
                            />
                          )}

                          {/* Action Icons */}
                          <div
                            data-photo-id={photo.id}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              display: 'flex',
                              gap: '4px',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              pointerEvents: 'auto'
                            }}
                          >
                            <ActionIcon
                              variant="filled"
                              color="blue"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(photo.path, '_blank');
                              }}
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="filled"
                              color="red"
                              size="sm"
                              disabled={accident?.status === 'APPROVED'}
                              onClick={(e) => {
                                if (accident?.status === 'APPROVED') return;
                                e.stopPropagation();
                                handleDeletePhoto(photo.id);
                              }}
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </div>

                          {/* Hover overlay for upload date */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0, 0, 0, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              pointerEvents: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0';
                            }}
                          >
                            <Text size="sm" c="white" fw={500}>
                              Uploaded: {formatDate(photo.createdAt)}
                            </Text>
                          </div>
                        </Card.Section>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed">No photos uploaded yet.</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>Attachments ({accident.attachments?.length || 0})</Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  {accident.attachments?.length > 0 ? (
                    accident.attachments.map((attachment: any) => (
                      <Card key={attachment.id} withBorder>
                        <Group justify="space-between" p="sm">
                          <div>
                            <Text fw={500}>{attachment.originalName}</Text>
                            <Text size="sm" c="dimmed">
                              Type: {attachment.attachmentType.replace(/_/g, ' ')}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Uploaded: {formatDate(attachment.createdAt)}
                            </Text>
                          </div>
                          <Button
                            variant="light"
                            size="xs"
                            component="a"
                            href={`/uploads/accidents/${attachment.filename}`}
                            target="_blank"
                          >
                            View
                          </Button>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed">No attachments uploaded yet.</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Approval History Tab */}
        <Tabs.Panel value="approvals" pt="xl">
          <Card withBorder>
            <Card.Section withBorder inheritPadding py="sm">
              <Title order={4}>Approval History</Title>
            </Card.Section>
            <Stack p="md" gap="md">
              {accident.approvals?.length > 0 ? (
                <Timeline>
                  {accident.approvals.map((approval: any) => (
                    <Timeline.Item
                      key={approval.id}
                      bullet={approval.action === 'APPROVE' ? <IconCheck size={12} /> : <IconX size={12} />}
                      title={`${approval.stage.replace(/_/g, ' ')} - ${approval.action}`}
                      lineVariant="dashed"
                    >
                      <Text size="sm" c="dimmed">
                        {formatDate(approval.createdAt)} by {approval.approvedBy?.fullName}
                      </Text>
                      {approval.comments && (
                        <Text size="sm" mt="xs">
                          {approval.comments}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed" mt="xs">
                        Status changed from {approval.previousStatus.replace(/_/g, ' ')} to {approval.newStatus.replace(/_/g, ' ')}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text c="dimmed">No approval actions have been taken yet.</Text>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Claims Tab */}
        <Tabs.Panel value="claims" pt="xl">
          <Stack gap="md">
            {/* First: Insurance Claims */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>Insurance Claims</Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={500}>Claim Status</Text>
                    <Badge
                      color={
                        accident.claimStatus === 'PAID' ? 'green' :
                        accident.claimStatus === 'APPROVED' ? 'blue' :
                        accident.claimStatus === 'SUBMITTED' ? 'yellow' :
                        accident.claimStatus === 'REJECTED' ? 'red' : 'gray'
                      }
                    >
                      {accident.claimStatus?.replace(/_/g, ' ') || 'NOT SUBMITTED'}
                    </Badge>
                  </div>
                  {(isAdmin || user?.role === 'FINANCE') && (
                    <Select
                      placeholder="Update claim status"
                      data={[
                        { value: 'NOT_SUBMITTED', label: 'Not Submitted' },
                        { value: 'SUBMITTED', label: 'Submitted' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'REJECTED', label: 'Rejected' },
                        { value: 'PAID', label: 'Paid' },
                      ]}
                      onChange={(value) => {
                        console.log('🎯 Claim status change selected:', value);
                        if (value) {
                          const payload = { claimStatus: value };
                          console.log('🎯 Sending payload:', payload);
                          console.log('🎯 Full API URL:', `http://localhost:3011/api/v1/accidents/${id}/status`);
                          claimUpdateMutation.mutate(value);
                        }
                      }}
                      disabled={claimUpdateMutation.isPending}
                    />
                  )}
                </Group>

                {accident.insuranceCompany && (
                  <div>
                    <Text fw={500}>Insurance Company</Text>
                    <Text>{accident.insuranceCompany}</Text>
                  </div>
                )}

                {accident.claimReferenceNumber && (
                  <div>
                    <Text fw={500}>Claim Reference Number</Text>
                    <Text>{accident.claimReferenceNumber}</Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Second: Cost Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>Cost Information</Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Estimated Cost</Text>
                    <Text>{accident.estimatedCost ? formatCurrency(accident.estimatedCost) : 'Not estimated yet'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Safety Risk</Text>
                    <Badge color={accident.safetyRisk ? 'red' : 'green'}>
                      {accident.safetyRisk ? 'High Risk' : 'Safe'}
                    </Badge>
                  </Grid.Col>
                </Grid>

                {accident.damageLevel && (
                  <div>
                    <Text fw={500}>Damage Level</Text>
                    <Text>{accident.damageLevel.replace(/_/g, ' ')}</Text>
                  </div>
                )}

                {accident.damageDescription && (
                  <div>
                    <Text fw={500}>Damage Description</Text>
                    <Text>{accident.damageDescription}</Text>
                  </div>
                )}

                {accident.damagedComponents && accident.damagedComponents.length > 0 && (
                  <div>
                    <Text fw={500}>Damaged Components</Text>
                    <Group gap="xs">
                      {accident.damagedComponents.map((damagedComponent, index) => (
                        <Badge key={index} variant="light">
                          {componentNameMap[damagedComponent.damagedComponentId] || damagedComponent.damagedComponentId}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}

                {/* Detailed Cost Breakdown */}
                {accident.costBreakdown && (
                  <div>
                    <Divider my="md" />
                    <Text fw={500} mb="md">Detailed Cost Breakdown</Text>
                    <Stack gap="xs">
                      {/* Show costs for damaged components only */}
                      {accident.damagedComponents?.map((damagedComponent, index) => {
                        const componentName = componentNameMap[damagedComponent.damagedComponentId];

                        return (
                          <Group key={index} justify="space-between">
                            <Text size="sm">{componentName || damagedComponent.damagedComponentId}:</Text>
                            <Text size="sm" fw={500}>{formatCurrency(2000.00)}</Text>
                          </Group>
                        );
                      }).filter(Boolean)}

                      {/* Show total loss cost */}
                      <Divider />
                      <Group justify="space-between">
                        <Text size="sm" fw={600}>Total Loss Cost:</Text>
                        <Text size="sm" fw={600}>
                          {formatCurrency((accident.damagedComponents?.length || 0) * 2000.00)}
                        </Text>
                      </Group>
                    </Stack>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Third: Incident Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>Incident Information</Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Accident Type</Text>
                    <Text>{accident.accidentType.replace(/_/g, ' ')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Date & Time</Text>
                    <Text>{formatDate(accident.accidentDate)} {accident.accidentTime}</Text>
                  </Grid.Col>
                </Grid>

                <Divider />

                <div>
                  <Text fw={500}>Location</Text>
                  <Text>{accident.locationDescription}</Text>
                  {accident.latitude && accident.longitude && (
                    <Text size="sm" c="dimmed">
                      Coordinates: {accident.latitude}, {accident.longitude}
                    </Text>
                  )}
                </div>

                <Divider />

                <div>
                  <Text fw={500}>Pole Information</Text>
                  <Text>Pole ID: {accident.poleId || 'Not specified'}</Text>
                </div>
              </Stack>
            </Card>

            {/* Fourth: Vehicle & Insurance Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconCar size={16} style={{ marginRight: 8 }} />
                  Vehicle & Insurance Information
                </Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Vehicle Plate Number</Text>
                    <Text>{accident.vehiclePlateNumber || 'Not provided'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Driver Name</Text>
                    <Text>{accident.driverName || 'Not provided'}</Text>
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Insurance Company</Text>
                    <Text>{accident.insuranceCompany || 'Not provided'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>Claim Reference</Text>
                    <Text>{accident.claimReferenceNumber || 'Not provided'}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            {/* Information Alert */}
            <Alert color="blue">
              <Text size="sm">
                Insurance claims can be filed as soon as the accident is approved by finance.
                Claims processing is independent of repair status and can happen in parallel with repairs.
                Finance team can update claim status as it progresses through the insurance workflow.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Edit Accident Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title="Edit Accident Details"
        size="lg"
      >
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack gap="md">
            <Select
              label="Accident Type"
              placeholder="Select accident type"
              data={[
                { value: 'VEHICLE_COLLISION', label: 'Vehicle Collision' },
                { value: 'NATURAL_DISASTER', label: 'Natural Disaster' },
                { value: 'VANDALISM', label: 'Vandalism' },
                { value: 'TECHNICAL_FAILURE', label: 'Technical Failure' },
                { value: 'OTHER', label: 'Other' },
              ]}
              required
              {...editForm.getInputProps('accidentType')}
            />

            <Group grow>
              <TextInput
                label="Accident Date"
                type="date"
                required
                {...editForm.getInputProps('accidentDate')}
              />
              <TextInput
                label="Accident Time"
                type="time"
                required
                {...editForm.getInputProps('accidentTime')}
              />
            </Group>

            <Select
              label="Pole ID"
              placeholder="Select pole (optional)"
              data={poleOptions}
              clearable
              {...editForm.getInputProps('poleId')}
            />

            <Textarea
              label="Location Description"
              placeholder="Describe the accident location"
              required
              minRows={3}
              {...editForm.getInputProps('locationDescription')}
            />

            <Group grow>
              <TextInput
                label="Latitude"
                type="number"
                step="any"
                placeholder="Optional (-90 to 90)"
                min={-90}
                max={90}
                {...editForm.getInputProps('latitude')}
              />
              <TextInput
                label="Longitude"
                type="number"
                step="any"
                placeholder="Optional (-180 to 180)"
                min={-180}
                max={180}
                {...editForm.getInputProps('longitude')}
              />
            </Group>

            <Divider />

            <Title order={4}>Vehicle & Insurance Information</Title>

            <Group grow>
              <TextInput
                label="Vehicle Plate Number"
                placeholder="Enter plate number"
                {...editForm.getInputProps('vehiclePlateNumber')}
              />
              <TextInput
                label="Driver Name"
                placeholder="Enter driver name"
                {...editForm.getInputProps('driverName')}
              />
            </Group>

            <Group grow>
              <TextInput
                label="Insurance Company"
                placeholder="Enter insurance company"
                {...editForm.getInputProps('insuranceCompany')}
              />
              <TextInput
                label="Claim Reference Number"
                placeholder="Enter claim reference"
                {...editForm.getInputProps('claimReferenceNumber')}
              />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeEdit}>
                Cancel
              </Button>
              <Button type="submit" loading={editMutation.isPending}>
                Update Accident
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Damage Assessment Modal */}
      <Modal
        opened={damageAssessmentOpened}
        onClose={closeDamageAssessment}
        title={accident?.status === 'APPROVED' ? 'Damage Assessment (Approved - View Only)' : 'Damage Assessment'}
        size="lg"
      >
        <form onSubmit={damageForm.onSubmit(handleDamageAssessment)}>
          <Stack gap="md">
            {accident?.status === 'APPROVED' && (
              <Alert color="blue" variant="light">
                This accident has been approved. The damage assessment is now view-only.
              </Alert>
            )}

            <Select
              label="Damage Level"
              placeholder="Select damage level"
              data={DAMAGE_LEVELS}
              required
              disabled={accident?.status === 'APPROVED'}
              {...damageForm.getInputProps('damageLevel')}
            />

            <Textarea
              label="Damage Description"
              placeholder="Describe the damage in detail"
              required
              minRows={4}
              disabled={accident?.status === 'APPROVED'}
              {...damageForm.getInputProps('damageDescription')}
            />

            <Checkbox
              label="Safety Risk - Does this pose an immediate safety risk?"
              disabled={accident?.status === 'APPROVED'}
              {...damageForm.getInputProps('safetyRisk', { type: 'checkbox' })}
            />

            <Text fw={500}>Damaged Components</Text>
            <Checkbox.Group {...damageForm.getInputProps('damagedComponents')}>
              <Group mt="xs">
                {damagedComponentsData?.map((component: any) => (
                  <Checkbox
                    key={component.id}
                    value={component.id}
                    label={component.name}
                    disabled={accident?.status === 'APPROVED'}
                  />
                ))}
              </Group>
            </Checkbox.Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeDamageAssessment}>
                {accident?.status === 'APPROVED' ? 'Close' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                loading={updateMutation.isPending}
                disabled={accident?.status === 'APPROVED'}
              >
                Complete Assessment
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Approval Modal */}
      <Modal
        opened={approvalOpened}
        onClose={closeApproval}
        title="Process Approval"
        size="md"
      >
        <form onSubmit={approvalForm.onSubmit(handleApproval)}>
          <Stack gap="md">
            <Select
              label="Action"
              placeholder="Select approval action"
              data={[
                { value: 'APPROVE', label: 'Approve' },
                { value: 'REJECT', label: 'Reject' },
              ]}
              required
              {...approvalForm.getInputProps('action')}
            />

            <Textarea
              label="Comments"
              placeholder="Add any comments or notes"
              minRows={3}
              {...approvalForm.getInputProps('comments')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeApproval}>
                Cancel
              </Button>
              <Button type="submit" loading={approveMutation.isPending}>
                Submit Approval
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        opened={photoUploadOpened}
        onClose={closePhotoUpload}
        title="Upload Additional Photos"
        size="md"
      >
        <Stack gap="md">
          <FileInput
            label="Select Photos"
            placeholder="Choose photos to upload"
            multiple
            accept="image/*,video/*"
            onChange={(files) => setSelectedPhotos(files || [])}
          />

          {selectedPhotos.length > 0 && (
            <Text size="sm" c="dimmed">
              {selectedPhotos.length} file(s) selected
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closePhotoUpload}>
              Cancel
            </Button>
            <Button
              onClick={handlePhotoUpload}
              loading={photoUploadMutation.isPending}
              disabled={selectedPhotos.length === 0}
            >
              Upload Photos
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Attachment Upload Modal */}
      <Modal
        opened={attachmentUploadOpened}
        onClose={closeAttachmentUpload}
        title="Upload Attachments"
        size="md"
      >
        <Stack gap="md">
          <FileInput
            label="Select Files"
            placeholder="Choose documents to upload"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(files) => setSelectedAttachments(files || [])}
          />

          {selectedAttachments.length > 0 && (
            <Text size="sm" c="dimmed">
              {selectedAttachments.length} file(s) selected
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeAttachmentUpload}>
              Cancel
            </Button>
            <Button
              onClick={handleAttachmentUpload}
              loading={attachmentUploadMutation.isPending}
              disabled={selectedAttachments.length === 0}
            >
              Upload Attachments
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
