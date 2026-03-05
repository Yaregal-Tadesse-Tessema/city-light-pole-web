// @ts-nocheck
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
  ThemeIcon,
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
  IconShoppingCart,
  IconBox,
} from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import MaterialRequestModal from '../components/MaterialRequestModal';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('maintenanceDetail');

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [materialRequestModalOpened, setMaterialRequestModalOpened] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueModalOpened, setIssueModalOpened] = useState(false);

  // Material request state
  const [selectedScheduleForMaterial, setSelectedScheduleForMaterial] = useState<any>(null);

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

  // Fetch related purchase requests for this maintenance schedule
  const { data: purchaseRequests } = useQuery({
    queryKey: ['purchase-requests', 'maintenance', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');

      // Get purchase requests filtered by maintenanceScheduleId on the backend
      const res = await axios.get(`http://localhost:3011/api/v1/purchase-requests?maintenanceScheduleId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Purchase requests for maintenance schedule', id, ':', res.data);
      return res.data || [];
    },
    enabled: !!id,
  });

  // Fetch available inventory items
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data || [];
    },
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
        title: t('notifications.successTitle'),
        message: t('notifications.updateSuccess'),
        color: 'green',
      });
      setEditModalOpened(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.updateError'),
        color: 'red',
      });
    },
  });

  // Create material request mutation
  const createMaterialRequestMutation = useMutation({
    mutationFn: async (data: { items: Array<{itemId: string, requestedQuantity: number}>, description: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:3011/api/v1/material-requests',
        {
          ...data,
          maintenanceScheduleId: id,
        },
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
        title: t('notifications.successTitle'),
        message: t('notifications.materialRequestSuccess'),
        color: 'green',
      });
      setMaterialRequestModalOpened(false);
      setMaterialRequestItems([]);
      setSelectedItemId('');
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.materialRequestError'),
        color: 'red',
      });
    },
  });

  const canEdit = (schedule: any) => {
    return user?.role === 'ADMIN' && schedule?.status === 'REQUESTED';
  };

  const canRequestMaterials = (schedule: any) => {
    return schedule?.status !== 'COMPLETED';
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
    if (!schedule) return t('labels.none');

    if (schedule.pole) {
      return `${schedule.pole.poleType || t('labels.none')} - ${schedule.pole.lampType || t('labels.none')} - ${schedule.pole.heightMeters ?? t('labels.none')}m`;
    } else if (schedule.park) {
      return `${schedule.park.parkType || t('labels.none')} - ${schedule.park.areaHectares ?? t('labels.none')} ha`;
    } else if (schedule.parkingLot) {
      return `${schedule.parkingLot.parkingType || t('labels.none')} - ${t('labels.capacity')} ${schedule.parkingLot.capacity ?? t('labels.none')}`;
    } else if (schedule.museum) {
      return schedule.museum.museumType || t('labels.none');
    } else if (schedule.publicToilet) {
      return `${schedule.publicToilet.toiletType || t('labels.none')} - ${schedule.publicToilet.hasPaidAccess ? t('labels.paid') : t('labels.free')}`;
    } else if (schedule.footballField) {
      return `${schedule.footballField.fieldType || t('labels.none')} - ${t('labels.capacity')} ${schedule.footballField.capacity ?? t('labels.none')}`;
    } else if (schedule.riverSideProject) {
      return schedule.riverSideProject.projectType || t('labels.none');
    }

    return t('labels.none');
  };

  const getAssetDistrict = (schedule: any) => {
    if (!schedule) return t('labels.none');

    if (schedule.pole) return schedule.pole.subcity || t('labels.none');
    return schedule.park?.district ||
           schedule.parkingLot?.district ||
           schedule.museum?.district ||
           schedule.publicToilet?.district ||
           schedule.footballField?.district ||
           schedule.riverSideProject?.district ||
           t('labels.none');
  };

  const getAssetStreet = (schedule: any) => {
    if (!schedule) return t('labels.none');

    return schedule.pole?.street ||
           schedule.park?.street ||
           schedule.parkingLot?.street ||
           schedule.museum?.street ||
           schedule.publicToilet?.street ||
           schedule.footballField?.street ||
           schedule.riverSideProject?.street ||
           t('labels.none');
  };

  const getAssetCode = (schedule: any) => {
    return schedule?.poleCode ||
           schedule?.parkCode ||
           schedule?.parkingLotCode ||
           schedule?.museumCode ||
           schedule?.publicToiletCode ||
           schedule?.footballFieldCode ||
           schedule?.riverSideProjectCode ||
           t('labels.none');
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
        <Alert color="red" title={t('error.title')}>
          {t('error.notFound')}
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
          {t('actions.backToMaintenance')}
        </Button>
      </Group>

      <Stack gap="lg">
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Title order={2}>{t('title')}</Title>
            <Group>
              {canEdit(schedule) && (
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setEditModalOpened(true)}
                >
                  {t('actions.editSchedule')}
                </Button>
              )}
              {canRequestMaterials(schedule) && (
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconPackage size={16} />}
                  onClick={() => {
                    setSelectedScheduleForMaterial(schedule);
                    setMaterialRequestModalOpened(true);
                  }}
                >
                  {t('actions.requestMaterials')}
                </Button>
              )}
            </Group>
          </Group>

          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Group>
                  <Text fw={600}>{t('fields.assetCode')}:</Text>
                  <Badge color="blue">{getAssetCode(schedule)}</Badge>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.maintenanceCode')}:</Text>
                  <Badge color="green">{schedule.maintenanceCode}</Badge>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.district')}:</Text>
                  <Text>{getAssetDistrict(schedule)}</Text>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.street')}:</Text>
                  <Text>{getAssetStreet(schedule)}</Text>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.assetDetails')}:</Text>
                  <Text>{getAssetInfo(schedule)}</Text>
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Stack gap="sm">
                <Group>
                  <Text fw={600}>{t('fields.maintenance')}:</Text>
                  <Text>{schedule.description}</Text>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.frequency')}:</Text>
                  <Text>{t(`frequency.${schedule.frequency}`, schedule.frequency)}</Text>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.startDate')}:</Text>
                  <Text>{schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : t('labels.none')}</Text>
                </Group>

                <Group>
                  <Text fw={600}>{t('fields.endDate')}:</Text>
                  <Text>{schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : t('labels.none')}</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>

          <Group mt="md">
            <Text fw={600}>{t('fields.status')}:</Text>
            <Badge color={getStatusColor(schedule.status)} size="lg">
              {schedule.status}
            </Badge>
          </Group>

          {schedule.remark && (
            <Group mt="md">
              <Text fw={600}>{t('fields.remark')}:</Text>
              <Text>{schedule.remark}</Text>
            </Group>
          )}
        </Paper>

        <Tabs defaultValue="materials">
          <Tabs.List>
            <Tabs.Tab value="materials">{t('tabs.materialRequests')}</Tabs.Tab>
            <Tabs.Tab value="all-requests">{t('tabs.purchaseRequests')}</Tabs.Tab>
            {schedule.issueId && (
              <Tabs.Tab value="issue">{t('tabs.relatedIssue')}</Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="materials" pt="xl">
            <Paper withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.headers.code')}</Table.Th>
                    <Table.Th>{t('table.headers.itemsCount')}</Table.Th>
                    <Table.Th>{t('table.headers.status')}</Table.Th>
                    <Table.Th>{t('table.headers.requestDate')}</Table.Th>
                    <Table.Th>{t('table.headers.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {materialRequests?.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>{t('table.empty.materialRequests')}</Table.Td>
                    </Table.Tr>
                  ) : (
                    materialRequests?.map((request: any) => (
                      <Table.Tr key={request.id}>
                        <Table.Td>{request.code ?? t('labels.none')}</Table.Td>
                        <Table.Td>{t('table.items', { count: request.items?.length || 0 })}</Table.Td>
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
                            {t('actions.viewDetails')}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="all-requests" pt="xl">
            <Paper withBorder>
              <Group mb="md">
                <IconShoppingCart size={20} color="var(--mantine-color-green-6)" />
                <Title order={4} c="green">{t('sections.purchaseRequests')}</Title>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.headers.requestId')}</Table.Th>
                    <Table.Th>{t('table.headers.itemsCount')}</Table.Th>
                    <Table.Th>{t('table.headers.totalCost')}</Table.Th>
                    <Table.Th>{t('table.headers.status')}</Table.Th>
                    <Table.Th>{t('table.headers.requestDate')}</Table.Th>
                    <Table.Th>{t('table.headers.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {purchaseRequests?.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>{t('table.empty.purchaseRequests')}</Table.Td>
                    </Table.Tr>
                  ) : (
                    purchaseRequests?.map((request: any) => (
                      <Table.Tr key={request.id}>
                        <Table.Td>{request.id.substring(0, 8)}...</Table.Td>
                        <Table.Td>{t('table.items', { count: request.items?.length || 0 })}</Table.Td>
                        <Table.Td>${(() => {
                          const total = request.items?.reduce((sum: number, item: any) => {
                            const cost = typeof item.totalCost === 'number' ? item.totalCost : 0;
                            return sum + cost;
                          }, 0) || 0;
                          return total.toFixed(2);
                        })()}</Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(request.status)}>{request.status}</Badge>
                        </Table.Td>
                        <Table.Td>{new Date(request.createdAt).toLocaleDateString()}</Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => navigate('/purchase-requests')}
                          >
                            {t('actions.viewAll')}
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
                      <Text fw={600}>{t('issue.fields.issueId')}:</Text>
                      <Badge color="red">{relatedIssue.id.substring(0, 8)}...</Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>{t('issue.fields.assetCode')}:</Text>
                      <Badge color="blue">
                        {relatedIssue.pole?.code ||
                         relatedIssue.park?.code ||
                         relatedIssue.parkingLot?.code ||
                         relatedIssue.museum?.code ||
                         relatedIssue.publicToilet?.code ||
                         relatedIssue.footballField?.code ||
                         relatedIssue.riverSideProject?.code ||
                         t('labels.na')}
                      </Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>{t('issue.fields.severity')}:</Text>
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
                      <Text fw={600} mb="xs">{t('issue.fields.description')}:</Text>
                      <Text>{relatedIssue.description}</Text>
                    </div>

                    {relatedIssue.resolutionNotes && (
                      <div>
                        <Text fw={600} mb="xs">{t('issue.fields.resolutionNotes')}:</Text>
                        <Text>{relatedIssue.resolutionNotes}</Text>
                      </div>
                    )}

                    <Group>
                      <Text fw={600}>{t('issue.fields.status')}:</Text>
                      <Badge color={getStatusColor(relatedIssue.status)}>{relatedIssue.status}</Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>{t('issue.fields.reportedBy')}:</Text>
                      <Text>{relatedIssue.reportedBy?.fullName || t('labels.unknown')}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>{t('issue.fields.created')}:</Text>
                      <Text>{new Date(relatedIssue.createdAt).toLocaleDateString()}</Text>
                    </Group>

                    {relatedIssue.updatedAt && (
                      <Group>
                        <Text fw={600}>{t('issue.fields.updated')}:</Text>
                        <Text>{new Date(relatedIssue.updatedAt).toLocaleDateString()}</Text>
                      </Group>
                    )}
                  </Stack>
                ) : (
                  <Alert color="yellow">
                    {t('issue.notFound')}
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
        title={t('modal.title')}
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
              label={t('form.description')}
              name="description"
              required
              defaultValue={schedule.description}
            />

            <TextInput
              label={t('form.startDate')}
              name="startDate"
              type="date"
              required
              defaultValue={schedule.startDate ? schedule.startDate.split('T')[0] : ''}
            />

            <TextInput
              label={t('form.endDateOptional')}
              name="endDate"
              type="date"
              defaultValue={schedule.endDate ? schedule.endDate.split('T')[0] : ''}
            />

            <Select
              label={t('form.status')}
              name="status"
              data={SCHEDULE_STATUSES}
              required
              defaultValue={schedule.status}
            />

            <NumberInput
              label={t('form.estimatedCostOptional')}
              name="estimatedCost"
              min={0}
              defaultValue={schedule.estimatedCost || ''}
            />

            <Textarea
              label={t('form.remark')}
              name="remark"
              defaultValue={schedule.remark || ''}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setEditModalOpened(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                {t('actions.updateSchedule')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Material Request Modal - Using shared component */}
      {selectedScheduleForMaterial && (
        <MaterialRequestModal
          opened={materialRequestModalOpened}
          onClose={() => {
            setMaterialRequestModalOpened(false);
            setSelectedScheduleForMaterial(null);
          }}
          maintenanceScheduleId={selectedScheduleForMaterial.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['material-requests'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
          }}
        />
      )}
    </Container>
  );
}






