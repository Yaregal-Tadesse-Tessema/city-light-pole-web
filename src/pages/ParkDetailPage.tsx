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
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { MapPicker } from '../components/MapPicker';

export default function ParkDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [mapOpen, setMapOpen] = useState(false);

  const { data: park, isLoading } = useQuery({
    queryKey: ['park', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/parks/${code}`, {
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
      const res = await axios.post(`http://localhost:3011/api/v1/parks/${code}/qr`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['park', code] });
      notifications.show({
        title: 'Success',
        message: 'QR code generated successfully',
        color: 'green',
      });
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
  if (!park) return <Container>Park not found</Container>;

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb={{ base: 'md', sm: 'xl' }}>
        <Title size={{ base: 'h2', sm: 'h1' }}>Park Details: {park.code}</Title>
        <Group wrap="wrap">
          {isAdmin && (
            <Button 
              onClick={() => navigate(`/parks/${code}/edit`)}
              size="md"
            >
              Edit
            </Button>
          )}
          <Button 
            variant="light" 
            onClick={() => navigate('/parks')}
            size="md"
          >
            Back to List
          </Button>
        </Group>
      </Stack>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="qr">QR Code</Tabs.Tab>
          <Tabs.Tab value="issues">
            Recent Issues {park?.counts?.openIssues > 0 && `(${park.counts.openIssues} open)`}
          </Tabs.Tab>
          <Tabs.Tab value="maintenance">
            Recent Maintenance {park?.counts?.totalMaintenanceSchedules > 0 && `(${park.counts.totalMaintenanceSchedules})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              <Group>
                <Text fw={700}>Status:</Text>
                <Badge color={getStatusColor(park.status)}>{park.status}</Badge>
              </Group>
              <Group>
                <Text fw={700}>Name:</Text>
                <Text>{park.name}</Text>
              </Group>
              <Group>
                <Text fw={700}>Subcity:</Text>
                <Text>{park.district}</Text>
              </Group>
              <Group>
                <Text fw={700}>Street:</Text>
                <Text>{park.street}</Text>
              </Group>
              {park.gpsLat && park.gpsLng && (
                <Group>
                  <Text fw={700}>GPS:</Text>
                  <Button variant="subtle" size="xs" onClick={() => setMapOpen(true)}>
                    {park.gpsLat}, {park.gpsLng}
                  </Button>
                </Group>
              )}
              <Group>
                <Text fw={700}>Type:</Text>
                <Text>{park.parkType}</Text>
              </Group>
              <Group>
                <Text fw={700}>Area:</Text>
                <Text>{park.areaHectares} hectares</Text>
              </Group>
              <Group>
                <Text fw={700}>Paid Entrance:</Text>
                <Text>{park.hasPaidEntrance ? 'Yes' : 'No'}</Text>
              </Group>
              {park.hasPaidEntrance && park.entranceFee && (
                <Group>
                  <Text fw={700}>Entrance Fee:</Text>
                  <Text>{parseFloat(park.entranceFee.toString()).toFixed(2)} ETB</Text>
                </Group>
              )}
              {park.description && (
                <Group>
                  <Text fw={700}>Description:</Text>
                  <Text>{park.description}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="qr" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              {park.qrImageUrl ? (
                <>
                  <Image src={park.qrImageUrl} alt="QR Code" maw={300} />
                  <Button
                    component="a"
                    href={park.qrImageUrl}
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
            {park.counts && (
              <Group>
                <Badge size="lg" variant="light">
                  Total Issues: {park.counts.totalIssues}
                </Badge>
                <Badge size="lg" color="orange" variant="light">
                  Open Issues: {park.counts.openIssues}
                </Badge>
              </Group>
            )}
            <Paper p="md" withBorder>
              {park.latestIssues && park.latestIssues.length > 0 ? (
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
                    {park.latestIssues.map((issue: any) => (
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
                <Text>No issues reported for this park.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="xl">
          <Stack>
            {park.counts && (
              <Badge size="lg" variant="light">
                Total Maintenance Records: {park.counts.totalMaintenanceSchedules || 0}
              </Badge>
            )}
            <Paper p="md" withBorder>
              {park.latestMaintenanceSchedules && park.latestMaintenanceSchedules.length > 0 ? (
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
                    {park.latestMaintenanceSchedules.map((schedule: any) => (
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
                            ? `$${parseFloat(schedule.cost).toFixed(2)}`
                            : schedule.estimatedCost && schedule.estimatedCost > 0
                            ? `$${parseFloat(schedule.estimatedCost).toFixed(2)}`
                            : '-'}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No maintenance records for this park.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={mapOpen}
        onClose={() => setMapOpen(false)}
        title="Park Location"
        size="xl"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Click on the map to view/update coordinates.
          </Text>
          <MapPicker
            value={{ lat: park.gpsLat, lng: park.gpsLng }}
            onChange={(lat, lng) => {
              park.gpsLat = lat;
              park.gpsLng = lng;
            }}
            currentPoleCode={park.code}
            showAllPoles={true}
          />
        </Stack>
      </Modal>
    </Container>
  );
}

