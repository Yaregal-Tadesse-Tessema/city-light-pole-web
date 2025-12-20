import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Card,
  Grid,
  Alert,
  Modal,
  Textarea,
  NumberInput,
  TextInput,
  Select,
  ActionIcon,
  Loader,
  Center,
  Tabs,
  Table,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconEdit,
  IconPackage,
  IconEye,
  IconCheck,
  IconX,
  IconCalendar,
  IconMapPin,
  IconTools,
  IconAlertTriangle,
} from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const SCHEDULE_STATUSES = ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'];

function getStatusColor(status: string) {
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

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [materialRequestModalOpened, setMaterialRequestModalOpened] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueModalOpened, setIssueModalOpened] = useState(false);

  // Fetch maintenance schedule details
  const { data: schedule, isLoading, refetch } = useQuery({
    queryKey: ['maintenance', 'schedule', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/maintenance/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch related material requests
  const { data: materialRequests } = useQuery({
    queryKey: ['material-requests', 'maintenance', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/material-requests?maintenanceScheduleId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data || [];
    },
    enabled: !!id,
  });

  // Fetch related issue if exists
  const { data: relatedIssue, isLoading: issueLoading } = useQuery({
    queryKey: ['issue', schedule?.issueId],
    queryFn: async () => {
      if (!schedule?.issueId) return null;
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/issues/${schedule.issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!schedule?.issueId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `http://localhost:3011/api/v1/maintenance/schedules/${id}`,
        data,
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
        message: 'Maintenance schedule updated successfully',
        color: 'green',
      });
      setEditModalOpened(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update maintenance schedule',
        color: 'red',
      });
    },
  });

  const materialRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:3011/api/v1/material-requests',
        data,
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
        message: 'Material request created successfully',
        color: 'green',
      });
      setMaterialRequestModalOpened(false);
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create material request',
        color: 'red',
      });
    },
  });

  const canEdit = (schedule: any) => {
    return user?.role === 'ADMIN' && schedule?.status === 'REQUESTED';
  };

  const canRequestMaterials = (schedule: any) => {
    return user?.role === 'ADMIN' && ['REQUESTED', 'STARTED', 'PAUSED'].includes(schedule?.status || '');
  };

  const handleEdit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleMaterialRequest = (data: any) => {
    materialRequestMutation.mutate({
      ...data,
      maintenanceScheduleId: id,
    });
  };

  const getAssetInfo = (schedule: any) => {
    if (!schedule) return '—';

    if (schedule.pole) {
      return `${schedule.pole.poleType || '—'} • ${schedule.pole.lampType || '—'} • ${schedule.pole.heightMeters ?? '—'}m`;
    } else if (schedule.park) {
      return `${schedule.park.parkType || '—'} • ${schedule.park.areaHectares ?? '—'} ha`;
    } else if (schedule.parkingLot) {
      return `${schedule.parkingLot.parkingType || '—'} • cap ${schedule.parkingLot.capacity ?? '—'}`;
    } else if (schedule.museum) {
      return schedule.museum.museumType || '—';
    } else if (schedule.publicToilet) {
      return `${schedule.publicToilet.toiletType || '—'} • ${schedule.publicToilet.hasPaidAccess ? 'paid' : 'free'}`;
    } else if (schedule.footballField) {
      return `${schedule.footballField.fieldType || '—'} • cap ${schedule.footballField.capacity ?? '—'}`;
    } else if (schedule.riverSideProject) {
      return schedule.riverSideProject.projectType || '—';
    }

    return '—';
  };

  const getAssetDistrict = (schedule: any) => {
    if (!schedule) return '—';

    if (schedule.pole) return schedule.pole.subcity || '—';
    return schedule.park?.district ||
           schedule.parkingLot?.district ||
           schedule.museum?.district ||
           schedule.publicToilet?.district ||
           schedule.footballField?.district ||
           schedule.riverSideProject?.district ||
           '—';
  };

  const getAssetStreet = (schedule: any) => {
    if (!schedule) return '—';

    return schedule.pole?.street ||
           schedule.park?.street ||
           schedule.parkingLot?.street ||
           schedule.museum?.street ||
           schedule.publicToilet?.street ||
           schedule.footballField?.street ||
           schedule.riverSideProject?.street ||
           '—';
  };

  const getAssetCode = (schedule: any) => {
    return schedule?.poleCode ||
           schedule?.parkCode ||
           schedule?.parkingLotCode ||
           schedule?.museumCode ||
           schedule?.publicToiletCode ||
           schedule?.footballFieldCode ||
           schedule?.riverSideProjectCode ||
           '—';
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

  if (!schedule) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error">
          Maintenance schedule not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group mb="xl">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/maintenance')}
        >
          Back to Maintenance
        </Button>
      </Group>

      <Stack gap="lg">
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Title order={2}>Maintenance Schedule Details</Title>
            <Group>
              {canEdit(schedule) && (
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setEditModalOpened(true)}
                >
                  Edit Schedule
                </Button>
              )}
              {canRequestMaterials(schedule) && (
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconPackage size={16} />}
                  onClick={() => setMaterialRequestModalOpened(true)}
                >
                  Request Materials
                </Button>
              )}
            </Group>
          </Group>

          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Group>
                  <Text fw={600}>Asset Code:</Text>
                  <Badge color="blue">{getAssetCode(schedule)}</Badge>
                </Group>

                <Group>
                  <Text fw={600}>District:</Text>
                  <Text>{getAssetDistrict(schedule)}</Text>
                </Group>

                <Group>
                  <Text fw={600}>Street:</Text>
                  <Text>{getAssetStreet(schedule)}</Text>
                </Group>

                <Group>
                  <Text fw={600}>Asset Details:</Text>
                  <Text>{getAssetInfo(schedule)}</Text>
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Stack gap="sm">
                <Group>
                  <Text fw={600}>Maintenance:</Text>
                  <Text>{schedule.description}</Text>
                </Group>

                <Group>
                  <Text fw={600}>Frequency:</Text>
                  <Text>{schedule.frequency}</Text>
                </Group>

                <Group>
                  <Text fw={600}>Start Date:</Text>
                  <Text>{schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '—'}</Text>
                </Group>

                <Group>
                  <Text fw={600}>End Date:</Text>
                  <Text>{schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '—'}</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>

          <Group mt="md">
            <Text fw={600}>Status:</Text>
            <Badge color={getStatusColor(schedule.status)} size="lg">
              {schedule.status}
            </Badge>
          </Group>

          {schedule.remark && (
            <Group mt="md">
              <Text fw={600}>Remark:</Text>
              <Text>{schedule.remark}</Text>
            </Group>
          )}
        </Paper>

        <Tabs defaultValue="materials">
          <Tabs.List>
            <Tabs.Tab value="materials">Material Requests</Tabs.Tab>
            {schedule.issueId && (
              <Tabs.Tab value="issue">Related Issue</Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="materials" pt="xl">
            <Paper withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Request ID</Table.Th>
                    <Table.Th>Items Count</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Request Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {materialRequests?.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>No material requests found</Table.Td>
                    </Table.Tr>
                  ) : (
                    materialRequests?.map((request: any) => (
                      <Table.Tr key={request.id}>
                        <Table.Td>{request.id.substring(0, 8)}...</Table.Td>
                        <Table.Td>{request.items?.length || 0} items</Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(request.status)}>{request.status}</Badge>
                        </Table.Td>
                        <Table.Td>{new Date(request.createdAt).toLocaleDateString()}</Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => navigate(`/material-requests/${request.id}`)}
                          >
                            View Details
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {schedule.issueId && (
            <Tabs.Panel value="issue" pt="xl">
              <Paper withBorder p="lg">
                {issueLoading ? (
                  <Center>
                    <Loader />
                  </Center>
                ) : relatedIssue ? (
                  <Stack>
                    <Group>
                      <Text fw={600}>Issue ID:</Text>
                      <Badge color="red">{relatedIssue.id.substring(0, 8)}...</Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>Asset Code:</Text>
                      <Badge color="blue">
                        {relatedIssue.pole?.code ||
                         relatedIssue.park?.code ||
                         relatedIssue.parkingLot?.code ||
                         relatedIssue.museum?.code ||
                         relatedIssue.publicToilet?.code ||
                         relatedIssue.footballField?.code ||
                         relatedIssue.riverSideProject?.code ||
                         'N/A'}
                      </Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>Severity:</Text>
                      <Badge
                        color={
                          relatedIssue.severity === 'LOW'
                            ? 'green'
                            : relatedIssue.severity === 'MEDIUM'
                            ? 'yellow'
                            : relatedIssue.severity === 'HIGH'
                            ? 'orange'
                            : 'red'
                        }
                      >
                        {relatedIssue.severity}
                      </Badge>
                    </Group>

                    <div>
                      <Text fw={600} mb="xs">Description:</Text>
                      <Text>{relatedIssue.description}</Text>
                    </div>

                    {relatedIssue.resolutionNotes && (
                      <div>
                        <Text fw={600} mb="xs">Resolution Notes:</Text>
                        <Text>{relatedIssue.resolutionNotes}</Text>
                      </div>
                    )}

                    <Group>
                      <Text fw={600}>Status:</Text>
                      <Badge color={getStatusColor(relatedIssue.status)}>{relatedIssue.status}</Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>Reported By:</Text>
                      <Text>{relatedIssue.reportedBy?.fullName || 'Unknown'}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>Created:</Text>
                      <Text>{new Date(relatedIssue.createdAt).toLocaleDateString()}</Text>
                    </Group>

                    {relatedIssue.updatedAt && (
                      <Group>
                        <Text fw={600}>Updated:</Text>
                        <Text>{new Date(relatedIssue.updatedAt).toLocaleDateString()}</Text>
                      </Group>
                    )}
                  </Stack>
                ) : (
                  <Alert color="yellow">
                    Issue details not found
                  </Alert>
                )}
              </Paper>
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>

      {/* Edit Schedule Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Edit Maintenance Schedule"
        size="lg"
        centered
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const data = {
            description: formData.get('description'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate') || null,
            status: formData.get('status'),
            estimatedCost: formData.get('estimatedCost') ? Number(formData.get('estimatedCost')) : undefined,
            remark: formData.get('remark'),
          };
          handleEdit(data);
        }}>
          <Stack>
            <TextInput
              label="Description"
              name="description"
              required
              defaultValue={schedule.description}
            />

            <TextInput
              label="Start Date"
              name="startDate"
              type="date"
              required
              defaultValue={schedule.startDate ? schedule.startDate.split('T')[0] : ''}
            />

            <TextInput
              label="End Date (optional)"
              name="endDate"
              type="date"
              defaultValue={schedule.endDate ? schedule.endDate.split('T')[0] : ''}
            />

            <Select
              label="Status"
              name="status"
              data={SCHEDULE_STATUSES}
              required
              defaultValue={schedule.status}
            />

            <NumberInput
              label="Estimated Cost (optional)"
              name="estimatedCost"
              min={0}
              defaultValue={schedule.estimatedCost || ''}
            />

            <Textarea
              label="Remark"
              name="remark"
              defaultValue={schedule.remark || ''}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setEditModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Schedule
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Material Request Modal - Placeholder */}
      <Modal
        opened={materialRequestModalOpened}
        onClose={() => setMaterialRequestModalOpened(false)}
        title="Request Materials"
        size="lg"
        centered
      >
        <Alert color="info" mb="md">
          Material request functionality will be implemented here. For now, you can create material requests from the Material Requests page.
        </Alert>

        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setMaterialRequestModalOpened(false)}>
            Close
          </Button>
          <Button onClick={() => navigate('/material-requests')}>
            Go to Material Requests
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
