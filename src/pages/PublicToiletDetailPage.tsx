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

export default function PublicToiletDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [mapOpen, setMapOpen] = useState(false);

  const { data: toilet, isLoading } = useQuery({
    queryKey: ['public-toilet', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/public-toilets/${code}`, {
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
      const res = await axios.post(`http://localhost:3011/api/v1/public-toilets/${code}/qr`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-toilet', code] });
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
  if (!toilet) return <Container>Public toilet not found</Container>;

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb={{ base: 'md', sm: 'xl' }}>
        <Title order={1}>Public Toilet Details: {toilet.code}</Title>
        <Group wrap="wrap">
          {isAdmin && (
            <Button 
              onClick={() => navigate(`/public-toilets/${code}/edit`)}
              size="md"
            >
              Edit
            </Button>
          )}
          <Button 
            variant="light" 
            onClick={() => navigate('/public-toilets')}
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
            Recent Issues {toilet?.counts?.openIssues > 0 && `(${toilet.counts.openIssues} open)`}
          </Tabs.Tab>
          <Tabs.Tab value="maintenance">
            Recent Maintenance {toilet?.counts?.totalMaintenanceSchedules > 0 && `(${toilet.counts.totalMaintenanceSchedules})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              <Group>
                <Text fw={700}>Status:</Text>
                <Badge color={getStatusColor(toilet.status)}>{toilet.status}</Badge>
              </Group>
              <Group>
                <Text fw={700}>Subcity:</Text>
                <Text>{toilet.district}</Text>
              </Group>
              <Group>
                <Text fw={700}>Street:</Text>
                <Text>{toilet.street}</Text>
              </Group>
              {toilet.gpsLat && toilet.gpsLng && (
                <Group>
                  <Text fw={700}>GPS:</Text>
                  <Button variant="subtle" size="xs" onClick={() => setMapOpen(true)}>
                    {toilet.gpsLat}, {toilet.gpsLng}
                  </Button>
                </Group>
              )}
              {toilet.toiletType && (
                <Group>
                  <Text fw={700}>Type:</Text>
                  <Text>{toilet.toiletType}</Text>
                </Group>
              )}
              {toilet.hasPaidAccess !== undefined && (
                <Group>
                  <Text fw={700}>Paid Access:</Text>
                  <Text>{toilet.hasPaidAccess ? 'Yes' : 'No'}</Text>
                </Group>
              )}
              {toilet.description && (
                <Group>
                  <Text fw={700}>Description:</Text>
                  <Text>{toilet.description}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="qr" pt="xl">
          <Paper p="md" withBorder>
            <Stack>
              {toilet.qrImageUrl ? (
                <>
                  <Image src={toilet.qrImageUrl} alt="QR Code" maw={300} />
                  <Button
                    component="a"
                    href={toilet.qrImageUrl}
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
            {toilet.counts && (
              <Group>
                <Badge size="lg" variant="light">
                  Total Issues: {toilet.counts.totalIssues}
                </Badge>
                <Badge size="lg" color="orange" variant="light">
                  Open Issues: {toilet.counts.openIssues}
                </Badge>
              </Group>
            )}
            <Paper p="md" withBorder>
              {toilet.latestIssues && toilet.latestIssues.length > 0 ? (
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
                      {toilet.latestIssues.map((issue: any) => (
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
                </Table.ScrollContainer>
              ) : (
                <Text>No issues reported for this public toilet.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="maintenance" pt="xl">
          <Stack>
            {toilet.counts && (
              <Badge size="lg" variant="light">
                Total Maintenance Records: {toilet.counts.totalMaintenanceSchedules || 0}
              </Badge>
            )}
            <Paper p="md" withBorder>
              {toilet.latestMaintenanceSchedules && toilet.latestMaintenanceSchedules.length > 0 ? (
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
                      {toilet.latestMaintenanceSchedules.map((schedule: any) => (
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
                </Table.ScrollContainer>
              ) : (
                <Text>No maintenance records for this public toilet.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={mapOpen}
        onClose={() => setMapOpen(false)}
        title="Public Toilet Location"
        size="xl"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Click on the map to view/update coordinates.
          </Text>
          <MapPicker
            value={{ lat: toilet.gpsLat, lng: toilet.gpsLng }}
            onChange={(lat, lng) => {
              toilet.gpsLat = lat;
              toilet.gpsLng = lng;
            }}
            currentPoleCode={toilet.code}
            showAllPoles={true}
          />
        </Stack>
      </Modal>
    </Container>
  );
}

