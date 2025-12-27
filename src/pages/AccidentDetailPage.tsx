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
                  {canInspect && (
                    <Button
                      fullWidth
                      leftSection={<IconEdit size={16} />}
                      onClick={openDamageAssessment}
                    >
                      Perform Damage Assessment
                    </Button>
                  )}

                  {(canApproveSupervisor || canApproveFinance) && (
                    <Button
                      fullWidth
                      leftSection={<IconCheck size={16} />}
                      color="green"
                      onClick={openApproval}
                    >
                      Process Approval
                    </Button>
                  )}

                  {canCompleteRepair && (
                    <Button
                      fullWidth
                      leftSection={<IconSettings size={16} />}
                      color="blue"
                      onClick={openApproval}
                    >
                      Complete Repairs
                    </Button>
                  )}

                  <Button
                    fullWidth
                    variant="light"
                    leftSection={<IconCamera size={16} />}
                    onClick={openPhotoUpload}
                  >
                    Add Photos
                  </Button>

                  <Button
                    fullWidth
                    variant="light"
                    leftSection={<IconFileText size={16} />}
                    onClick={openAttachmentUpload}
                  >
                    Add Attachments
                  </Button>
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
                        <Title order={5}>Cost Breakdown</Title>
                      </Card.Section>
                      <Stack p="md" gap="xs">
                        {Object.entries(accident.costBreakdown).map(([key, value]) => (
                          <Group justify="space-between" key={key}>
                            <Text size="sm">{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                            <Text size="sm" fw={500}>{formatCurrency(value as number)}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Card>
                  )}
                </>
              ) : (
                <Alert color="blue">
                  {isAdmin && ' As an admin, you can perform all actions in the workflow.'}
                  {!isAdmin && accident?.status === 'REPORTED' && canInspect && ' Click the "Perform Damage Assessment" button to get started.'}
                  {!isAdmin && accident?.status === 'INSPECTED' && (canApproveSupervisor || canApproveFinance) && ' Click the "Process Approval" button to continue the workflow.'}
                  {!isAdmin && accident?.status === 'SUPERVISOR_REVIEW' && canApproveFinance && ' Click the "Process Approval" button for final finance approval.'}
                  {!isAdmin && accident?.status === 'APPROVED' && ' Accident has been approved. Repairs can begin and insurance claims can be filed.'}
                  {!isAdmin && accident?.status === 'UNDER_REPAIR' && canCompleteRepair && ' Repairs are in progress. Click the "Complete Repairs" button when finished. Insurance claims can be managed in the Claims tab.'}
                  {!isAdmin && accident?.status === 'COMPLETED' && ' Accident repairs have been completed. Insurance claims can be managed in the Claims tab.'}
                  {!isAdmin && accident?.status === 'REJECTED' && ' This accident report has been rejected.'}
                </Alert>
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
                      <Card key={photo.id} withBorder>
                        <Card.Section>
                          {photo.isVideo ? (
                            <video
                              src={`/uploads/accidents/${photo.filename}`}
                              controls
                              style={{ width: '100%', maxHeight: '200px' }}
                            />
                          ) : (
                            <Image
                              src={`/uploads/accidents/${photo.filename}`}
                              height={200}
                              alt={photo.description || 'Accident photo'}
                              fit="cover"
                            />
                          )}
                        </Card.Section>
                        <Stack p="sm" gap="xs">
                          <Text size="sm">{photo.description || 'No description'}</Text>
                          <Text size="xs" c="dimmed">
                            Uploaded: {formatDate(photo.createdAt)}
                          </Text>
                        </Stack>
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

              <Alert color="blue">
                <Text size="sm">
                  Insurance claims can be filed as soon as the accident is approved by finance.
                  Claims processing is independent of repair status and can happen in parallel with repairs.
                  Finance team can update claim status as it progresses through the insurance workflow.
                </Text>
              </Alert>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Damage Assessment Modal */}
      <Modal
        opened={damageAssessmentOpened}
        onClose={closeDamageAssessment}
        title="Damage Assessment"
        size="lg"
      >
        <form onSubmit={damageForm.onSubmit(handleDamageAssessment)}>
          <Stack gap="md">
            <Select
              label="Damage Level"
              placeholder="Select damage level"
              data={DAMAGE_LEVELS}
              required
              {...damageForm.getInputProps('damageLevel')}
            />

            <Textarea
              label="Damage Description"
              placeholder="Describe the damage in detail"
              required
              minRows={4}
              {...damageForm.getInputProps('damageDescription')}
            />

            <Checkbox
              label="Safety Risk - Does this pose an immediate safety risk?"
              {...damageForm.getInputProps('safetyRisk', { type: 'checkbox' })}
            />

            <Text fw={500}>Damaged Components</Text>
            <Checkbox.Group {...damageForm.getInputProps('damagedComponents')}>
              <Group mt="xs">
                {DAMAGED_COMPONENTS.map((component) => (
                  <Checkbox
                    key={component.value}
                    value={component.value}
                    label={component.label}
                  />
                ))}
              </Group>
            </Checkbox.Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeDamageAssessment}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
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
