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

export default function PoleDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [mapOpen, setMapOpen] = useState(false);

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
  if (!pole) return <Container>Pole not found</Container>;

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Pole Details: {pole.code}</Title>
        <Group>
          {isAdmin && (
            <Button onClick={() => navigate(`/poles/${code}/edit`)}>
              Edit
            </Button>
          )}
          <Button variant="light" onClick={() => navigate('/poles')}>
            Back to List
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="qr">QR Code</Tabs.Tab>
          <Tabs.Tab value="issues">
            Recent Issues {pole?.counts?.openIssues > 0 && `(${pole.counts.openIssues} open)`}
          </Tabs.Tab>
          <Tabs.Tab value="maintenance">
            Recent Maintenance {pole?.counts?.totalMaintenanceLogs > 0 && `(${pole.counts.totalMaintenanceLogs})`}
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
                <Text fw={700}>District:</Text>
                <Text>{pole.district}</Text>
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
              <Group>
                <Text fw={700}>Power Rating:</Text>
                <Text>{pole.powerRatingWatt}W</Text>
              </Group>
              {pole.hasLedDisplay && (
                <Group>
                  <Text fw={700}>LED Model:</Text>
                  <Text>{pole.ledModel}</Text>
                </Group>
              )}
            </Stack>
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
                Total Maintenance Logs: {pole.counts.totalMaintenanceLogs}
              </Badge>
            )}
            <Paper p="md" withBorder>
              {pole.latestMaintenanceLogs && pole.latestMaintenanceLogs.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Scheduled Date</Table.Th>
                      <Table.Th>Completed Date</Table.Th>
                      <Table.Th>Performed By</Table.Th>
                      <Table.Th>Cost</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pole.latestMaintenanceLogs.map((log: any) => (
                      <Table.Tr key={log.id}>
                        <Table.Td>{log.description}</Table.Td>
                        <Table.Td>
                          <Badge>{log.status}</Badge>
                        </Table.Td>
                        <Table.Td>
                          {new Date(log.scheduledDate).toLocaleDateString()}
                        </Table.Td>
                        <Table.Td>
                          {log.completedDate ? new Date(log.completedDate).toLocaleDateString() : '-'}
                        </Table.Td>
                        <Table.Td>
                          {log.performedBy?.fullName || 'Unknown'}
                        </Table.Td>
                        <Table.Td>
                          {log.cost ? `$${log.cost.toFixed(2)}` : '-'}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text>No maintenance logs for this pole.</Text>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={mapOpen} onClose={() => setMapOpen(false)} title="Pole Location">
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
          />
        </Stack>
      </Modal>
    </Container>
  );
}


