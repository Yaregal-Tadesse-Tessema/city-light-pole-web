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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { MapPicker } from '../components/MapPicker';

export default function RiverSideProjectDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [mapOpen, setMapOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['river-side-project', code],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`http://localhost:3011/api/v1/river-side-projects/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch river side project:', error.response?.status || error.message);
        return null;
      }
    },
    retry: false,
    enabled: !!code,
  });

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:3011/api/v1/river-side-projects/${code}/qr`, {}, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['river-side-project', code] });
      notifications.show({ title: 'Success', message: 'QR code generated successfully', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to generate QR code', color: 'red' });
    },
  });

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return 'green';
      case 'FAULT_DAMAGED':
        return 'red';
      case 'UNDER_MAINTENANCE':
        return 'yellow';
      case 'OPERATIONAL':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (isLoading) return <Container>Loading...</Container>;
  if (!project) return <Container>River side project not found</Container>;

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb={{ base: 'md', sm: 'xl' }}>
        <Title order={1}>River Side Project Details: {project.code}</Title>
        <Group wrap="wrap">
          {isAdmin && (
            <Button onClick={() => navigate(`/river-side-projects/${code}/edit`)} size="md">
              Edit
            </Button>
          )}
          <Button variant="light" onClick={() => navigate('/river-side-projects')} size="md">
            Back to List
          </Button>
        </Group>
      </Stack>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="qr">QR Code</Tabs.Tab>
          <Tabs.Tab value="issues">
            Recent Issues {project?.counts?.openIssues > 0 && `(${project.counts.openIssues} open)`}
          </Tabs.Tab>
          <Tabs.Tab value="maintenance">
            Recent Maintenance {project?.counts?.totalMaintenanceSchedules > 0 && `(${project.counts.totalMaintenanceSchedules})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              <Group>
                <Text fw={700}>Status:</Text>
                <Badge color={getStatusColor(project.status)}>{project.status}</Badge>
              </Group>
              <Group>
                <Text fw={700}>Name:</Text>
                <Text>{project.name}</Text>
              </Group>
              <Group>
                <Text fw={700}>Subcity:</Text>
                <Text>{project.district}</Text>
              </Group>
              <Group>
                <Text fw={700}>Street:</Text>
                <Text>{project.street}</Text>
              </Group>
              {project.gpsLat && project.gpsLng && (
                <Group>
                  <Text fw={700}>GPS:</Text>
                  <Button variant="subtle" size="xs" onClick={() => setMapOpen(true)}>
                    {project.gpsLat}, {project.gpsLng}
                  </Button>
                </Group>
              )}
              {project.projectType && (
                <Group>
                  <Text fw={700}>Type:</Text>
                  <Text>{project.projectType}</Text>
                </Group>
              )}
              {project.description && (
                <Group>
                  <Text fw={700}>Description:</Text>
                  <Text>{project.description}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="qr" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              {project.qrImageUrl ? (
                <>
                  <Image src={project.qrImageUrl} alt="QR Code" maw={300} />
                  <Button component="a" href={project.qrImageUrl} download variant="light">
                    Download QR Code
                  </Button>
                </>
              ) : (
                <>
                  <Text>No QR code generated yet.</Text>
                  {isAdmin && <Button onClick={() => generateQRMutation.mutate()}>Generate QR Code</Button>}
                </>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="issues" pt="xl">
          <Stack>
            {project.counts && (
              <Group>
                <Badge size="lg" variant="light">
                  Total Issues: {project.counts.totalIssues}
                </Badge>
                <Badge size="lg" color="orange" variant="light">
                  Open Issues: {project.counts.openIssues}
                </Badge>
              </Group>
            )}
            <Paper p="md" withBorder>
              {project.latestIssues && project.latestIssues.length > 0 ? (
                <Table.ScrollContainer minWidth={600}>
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
                      {project.latestIssues.map((issue: any) => (
                        <Table.Tr key={issue.id}>
                          <Table.Td>{issue.description}</Table.Td>
                          <Table.Td>
                            <Badge>{issue.status}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="orange">{issue.severity}</Badge>
                          </Table.Td>
                          <Table.Td>{issue.reportedBy?.fullName || 'Unknown'}</Table.Td>
                          <Table.Td>{new Date(issue.createdAt).toLocaleDateString()}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              ) : (
                <Text>No issues reported for this river side project.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="xl">
          <Stack>
            {project.counts && (
              <Badge size="lg" variant="light">
                Total Maintenance Records: {project.counts.totalMaintenanceSchedules || 0}
              </Badge>
            )}
            <Paper p="md" withBorder>
              {project.latestMaintenanceSchedules && project.latestMaintenanceSchedules.length > 0 ? (
                <Table.ScrollContainer minWidth={600}>
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
                      {project.latestMaintenanceSchedules.map((schedule: any) => (
                        <Table.Tr key={schedule.id}>
                          <Table.Td>{schedule.description}</Table.Td>
                          <Table.Td>
                            <Badge>{schedule.status}</Badge>
                          </Table.Td>
                          <Table.Td>
                            {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '-'}
                          </Table.Td>
                          <Table.Td>{schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '-'}</Table.Td>
                          <Table.Td>{schedule.performedBy?.fullName || 'Unknown'}</Table.Td>
                          <Table.Td>
                            {schedule.cost && schedule.cost > 0
                              ? `$${parseFloat(schedule.cost).toFixed(2)}`
                              : schedule.estimatedCost && schedule.estimatedCost > 0
                              ? `$${parseFloat(schedule.estimatedCost).toFixed(2)}`
                              : '-'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              ) : (
                <Text>No maintenance records for this river side project.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={mapOpen} onClose={() => setMapOpen(false)} title="River Side Project Location" size="xl" centered>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Click on the map to view/update coordinates.
          </Text>
          <MapPicker
            value={{ lat: project.gpsLat, lng: project.gpsLng }}
            onChange={(lat, lng) => {
              project.gpsLat = lat;
              project.gpsLng = lng;
            }}
            currentPoleCode={project.code}
            showAllPoles={true}
          />
        </Stack>
      </Modal>
    </Container>
  );
}


