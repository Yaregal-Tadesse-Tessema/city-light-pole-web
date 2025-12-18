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

export default function FootballFieldDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [mapOpen, setMapOpen] = useState(false);

  const { data: field, isLoading } = useQuery({
    queryKey: ['football-field', code],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`http://localhost:3011/api/v1/football-fields/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch football field:', error.response?.status || error.message);
        return null;
      }
    },
    retry: false,
    enabled: !!code,
  });

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:3011/api/v1/football-fields/${code}/qr`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['football-field', code] });
      notifications.show({ title: 'Success', message: 'QR code generated successfully', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to generate QR code', color: 'red' });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
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
  if (!field) return <Container>Football field not found</Container>;

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb={{ base: 'md', sm: 'xl' }}>
        <Title order={1}>Football Field Details: {field.code}</Title>
        <Group wrap="wrap">
          {isAdmin && (
            <Button onClick={() => navigate(`/football-fields/${code}/edit`)} size="md">
              Edit
            </Button>
          )}
          <Button variant="light" onClick={() => navigate('/football-fields')} size="md">
            Back to List
          </Button>
        </Group>
      </Stack>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="qr">QR Code</Tabs.Tab>
          <Tabs.Tab value="issues">
            Recent Issues {field?.counts?.openIssues > 0 && `(${field.counts.openIssues} open)`}
          </Tabs.Tab>
          <Tabs.Tab value="maintenance">
            Recent Maintenance {field?.counts?.totalMaintenanceSchedules > 0 && `(${field.counts.totalMaintenanceSchedules})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              <Group>
                <Text fw={700}>Status:</Text>
                <Badge color={getStatusColor(field.status)}>{field.status}</Badge>
              </Group>
              <Group>
                <Text fw={700}>Name:</Text>
                <Text>{field.name}</Text>
              </Group>
              <Group>
                <Text fw={700}>Subcity:</Text>
                <Text>{field.district}</Text>
              </Group>
              <Group>
                <Text fw={700}>Street:</Text>
                <Text>{field.street}</Text>
              </Group>
              {field.gpsLat && field.gpsLng && (
                <Group>
                  <Text fw={700}>GPS:</Text>
                  <Button variant="subtle" size="xs" onClick={() => setMapOpen(true)}>
                    {field.gpsLat}, {field.gpsLng}
                  </Button>
                </Group>
              )}
              {field.fieldType && (
                <Group>
                  <Text fw={700}>Type:</Text>
                  <Text>{field.fieldType}</Text>
                </Group>
              )}
              {field.description && (
                <Group>
                  <Text fw={700}>Description:</Text>
                  <Text>{field.description}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="qr" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              {field.qrImageUrl ? (
                <>
                  <Image src={field.qrImageUrl} alt="QR Code" maw={300} />
                  <Button component="a" href={field.qrImageUrl} download variant="light">
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
            {field.counts && (
              <Group>
                <Badge size="lg" variant="light">
                  Total Issues: {field.counts.totalIssues}
                </Badge>
                <Badge size="lg" color="orange" variant="light">
                  Open Issues: {field.counts.openIssues}
                </Badge>
              </Group>
            )}
            <Paper p="md" withBorder>
              {field.latestIssues && field.latestIssues.length > 0 ? (
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
                      {field.latestIssues.map((issue: any) => (
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
                <Text>No issues reported for this football field.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="xl">
          <Stack>
            {field.counts && (
              <Badge size="lg" variant="light">
                Total Maintenance Records: {field.counts.totalMaintenanceSchedules || 0}
              </Badge>
            )}
            <Paper p="md" withBorder>
              {field.latestMaintenanceSchedules && field.latestMaintenanceSchedules.length > 0 ? (
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
                      {field.latestMaintenanceSchedules.map((schedule: any) => (
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
                <Text>No maintenance records for this football field.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={mapOpen} onClose={() => setMapOpen(false)} title="Football Field Location" size="xl" centered>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Click on the map to view/update coordinates.
          </Text>
          <MapPicker
            value={{ lat: field.gpsLat, lng: field.gpsLng }}
            onChange={(lat, lng) => {
              field.gpsLat = lat;
              field.gpsLng = lng;
            }}
            currentPoleCode={field.code}
            showAllPoles={true}
          />
        </Stack>
      </Modal>
    </Container>
  );
}


