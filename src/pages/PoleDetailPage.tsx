import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Image,
  Stack,
  Table,
  Tabs,
  Modal,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { MapPicker } from '../components/MapPicker';
import PoleComponentModal from '../components/PoleComponentModal';
import { poleComponentsApi } from '../api/components';

export default function PoleDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const canManageComponents = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const [mapOpen, setMapOpen] = useState(false);
  const [componentModalOpened, { open: openComponentModal, close: closeComponentModal }] = useDisclosure(false);
  const [componentModalMode, setComponentModalMode] = useState<'add' | 'addBulk' | 'edit' | 'remove'>('add');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const { data: poleComponents, isLoading: componentsLoading } = useQuery({
    queryKey: ['pole-components', code],
    queryFn: () => poleComponentsApi.list(code!, { includeRemoved: true }),
    enabled: !!code,
  });

  const components = Array.isArray(poleComponents) ? poleComponents : poleComponents?.items ?? poleComponents ?? [];

  const { data: pole, isLoading } = useQuery({
    queryKey: ['pole', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/poles/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:3011/api/v1/poles/${code}/qr`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pole', code] });
      notifications.show({
        title: 'Success',
        message: 'QR code generated successfully',
        color: 'green',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'green';
      case 'FAULT_DAMAGED':
        return 'red';
      case 'UNDER_MAINTENANCE':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  if (isLoading) return <Container>Loading...</Container>;
  if (!pole) return <Container>Pole not found</Container>;

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb={{ base: 'md', sm: 'xl' }}>
        <Title order={1}>Pole Details: {pole.code}</Title>
        <Group wrap="wrap">
          {isAdmin && (
            <Button 
              onClick={() => navigate(`/poles/${code}/edit`)}
              size="md"
            >
              Edit
            </Button>
          )}
          <Button 
            variant="light" 
            onClick={() => navigate('/poles')}
            size="md"
          >
            Back to List
          </Button>
        </Group>
      </Stack>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="components">
            Components {components.length > 0 ? `(${components.length})` : '(Add/Manage)'}
          </Tabs.Tab>
          <Tabs.Tab value="qr">QR Code</Tabs.Tab>
          <Tabs.Tab value="issues">
            Recent Issues {pole?.counts?.openIssues > 0 && `(${pole.counts.openIssues} open)`}
          </Tabs.Tab>
          <Tabs.Tab value="maintenance">
            Recent Maintenance {pole?.counts?.totalMaintenanceSchedules > 0 && `(${pole.counts.totalMaintenanceSchedules})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              <Group>
                <Text fw={700}>Status:</Text>
                <Badge color={getStatusColor(pole.status)}>{pole.status}</Badge>
              </Group>
              <Group>
                <Text fw={700}>Subcity:</Text>
                <Text>{pole.subcity}</Text>
              </Group>
              <Group>
                <Text fw={700}>Street:</Text>
                <Text>{pole.street}</Text>
              </Group>
              {pole.gpsLat && pole.gpsLng && (
                <Group>
                  <Text fw={700}>GPS:</Text>
                  <Button variant="subtle" size="xs" onClick={() => setMapOpen(true)}>
                    {pole.gpsLat}, {pole.gpsLng}
                  </Button>
                </Group>
              )}
              <Group>
                <Text fw={700}>Type:</Text>
                <Text>{pole.poleType}</Text>
              </Group>
              <Group>
                <Text fw={700}>Height:</Text>
                <Text>{pole.heightMeters}m</Text>
              </Group>
              <Group>
                <Text fw={700}>Lamp Type:</Text>
                <Text>{pole.lampType}</Text>
              </Group>
              {pole.structure && (
                <Group>
                  <Text fw={700}>Structure:</Text>
                  <Text>{pole.structure}</Text>
                </Group>
              )}
              {pole.polePosition && (
                <Group>
                  <Text fw={700}>Status (Up/Down/Middle):</Text>
                  <Text>{pole.polePosition}</Text>
                </Group>
              )}
              {pole.condition && (
                <Group>
                  <Text fw={700}>Condition:</Text>
                  <Text>{pole.condition}</Text>
                </Group>
              )}
              {pole.district && (
                <Group>
                  <Text fw={700}>District:</Text>
                  <Text>{pole.district}</Text>
                </Group>
              )}
              <Group>
                <Text fw={700}>Power Rating:</Text>
                <Text>{pole.powerRatingWatt}W</Text>
              </Group>
              {pole.numberOfPoles && (
                <Group>
                  <Text fw={700}>Number of Bulbs:</Text>
                  <Text>{pole.numberOfPoles}</Text>
                </Group>
              )}
              {pole.poleInstallationDate && (
                <Group>
                  <Text fw={700}>Pole Installation Date:</Text>
                  <Text>{new Date(pole.poleInstallationDate).toLocaleDateString()}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="components" pt="xl">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Installed Components</Title>
              {canManageComponents && (
                <Group>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => {
                      setComponentModalMode('add');
                      setSelectedAssignment(null);
                      openComponentModal();
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => {
                      setComponentModalMode('addBulk');
                      setSelectedAssignment(null);
                      openComponentModal();
                    }}
                  >
                    Bulk Add
                  </Button>
                </Group>
              )}
            </Group>
            {componentsLoading ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : components.length === 0 ? (
              <Stack gap="md" py="md">
                <Text c="dimmed">No components installed on this pole.</Text>
                {canManageComponents && (
                  <Group>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={() => {
                        setComponentModalMode('add');
                        setSelectedAssignment(null);
                        openComponentModal();
                      }}
                    >
                      Add Component
                    </Button>
                    <Button
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => {
                        setComponentModalMode('addBulk');
                        setSelectedAssignment(null);
                        openComponentModal();
                      }}
                    >
                      Bulk Add Components
                    </Button>
                  </Group>
                )}
              </Stack>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Component</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Installed</Table.Th>
                    {canManageComponents && <Table.Th>Actions</Table.Th>}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {components.map((a: any) => (
                    <Table.Tr key={a.id}>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => navigate(`/components/${a.component?.id || a.componentId}`)}
                        >
                          {a.component?.name || '—'}
                        </Button>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {a.component?.type?.replace(/_/g, ' ') || '—'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{a.quantity}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            a.status === 'INSTALLED' ? 'green' :
                            a.status === 'REMOVED' ? 'gray' :
                            a.status === 'UNDER_MAINTENANCE' ? 'yellow' :
                            a.status === 'DAMAGED' ? 'red' : 'gray'
                          }
                          size="sm"
                        >
                          {a.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {a.installationDate ? new Date(a.installationDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      {canManageComponents && (
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => {
                                setComponentModalMode('edit');
                                setSelectedAssignment(a);
                                openComponentModal();
                              }}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => {
                                setComponentModalMode('remove');
                                setSelectedAssignment(a);
                                openComponentModal();
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="qr" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              {pole.qrImageUrl ? (
                <>
                  <Image src={pole.qrImageUrl} alt="QR Code" maw={300} />
                  <Button
                    component="a"
                    href={pole.qrImageUrl}
                    download
                    variant="light"
                  >
                    Download QR Code
                  </Button>
                </>
              ) : (
                <>
                  <Text>No QR code generated yet.</Text>
                  {isAdmin && (
                    <Button onClick={() => generateQRMutation.mutate()}>
                      Generate QR Code
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="issues" pt="xl">
          <Stack>
            {pole.counts && (
              <Group>
                <Badge size="lg" variant="light">
                  Total Issues: {pole.counts.totalIssues}
                </Badge>
                <Badge size="lg" color="orange" variant="light">
                  Open Issues: {pole.counts.openIssues}
                </Badge>
              </Group>
            )}
            <Paper p="md" withBorder>
              {pole.latestIssues && pole.latestIssues.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Severity</Table.Th>
                      <Table.Th>Reported By</Table.Th>
                      <Table.Th>Created</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pole.latestIssues.map((issue: any) => (
                      <Table.Tr key={issue.id}>
                        <Table.Td>{issue.description}</Table.Td>
                        <Table.Td>
                          <Badge>{issue.status}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="orange">{issue.severity}</Badge>
                        </Table.Td>
                        <Table.Td>
                          {issue.reportedBy?.fullName || 'Unknown'}
                        </Table.Td>
                        <Table.Td>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No issues reported for this pole.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="xl">
          <Stack>
            {pole.counts && (
              <Badge size="lg" variant="light">
                Total Maintenance Records: {pole.counts.totalMaintenanceSchedules || 0}
              </Badge>
            )}
            <Paper p="md" withBorder>
              {pole.latestMaintenanceSchedules && pole.latestMaintenanceSchedules.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Start Date</Table.Th>
                      <Table.Th>End Date</Table.Th>
                      <Table.Th>Performed By</Table.Th>
                      <Table.Th>Cost</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pole.latestMaintenanceSchedules.map((schedule: any) => (
                      <Table.Tr key={schedule.id}>
                        <Table.Td>{schedule.description}</Table.Td>
                        <Table.Td>
                          <Badge>{schedule.status}</Badge>
                        </Table.Td>
                        <Table.Td>
                          {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '-'}
                        </Table.Td>
                        <Table.Td>
                          {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '-'}
                        </Table.Td>
                        <Table.Td>
                          {schedule.performedBy?.fullName || 'Unknown'}
                        </Table.Td>
                        <Table.Td>
                          {schedule.cost && schedule.cost > 0
                            ? `${parseFloat(schedule.cost).toFixed(2)}`
                            : schedule.estimatedCost && schedule.estimatedCost > 0
                            ? `${parseFloat(schedule.estimatedCost).toFixed(2)}`
                            : '-'}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No maintenance records for this pole.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={mapOpen}
        onClose={() => setMapOpen(false)}
        title="Pole Location"
        size="xl"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Click on the map to view/update coordinates.
          </Text>
          <MapPicker
            value={{ lat: pole.gpsLat, lng: pole.gpsLng }}
            onChange={(lat, lng) => {
              // For detail view we just show updated coordinates locally
              // (no persistence here)
              pole.gpsLat = lat;
              pole.gpsLng = lng;
            }}
            currentPoleCode={pole.code}
            showAllPoles={true}
          />
        </Stack>
      </Modal>

      <PoleComponentModal
        opened={componentModalOpened}
        onClose={closeComponentModal}
        poleCode={code!}
        mode={componentModalMode}
        assignment={selectedAssignment}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['pole-components', code] });
          queryClient.invalidateQueries({ queryKey: ['pole', code] });
        }}
      />
    </Container>
  );
}


