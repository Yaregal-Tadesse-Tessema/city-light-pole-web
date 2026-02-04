import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Table,
  Tabs,
  Loader,
  Center,
  Grid,
} from '@mantine/core';
import { IconEdit, IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { componentsApi } from '../api/components';

export default function ComponentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: component, isLoading } = useQuery({
    queryKey: ['component', id],
    queryFn: () => componentsApi.get(id!),
    enabled: !!id,
  });

  const { data: installationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['component-installation-history', id],
    queryFn: () => componentsApi.getInstallationHistory(id!),
    enabled: !!id,
  });

  const { data: polesData, isLoading: polesLoading } = useQuery({
    queryKey: ['component-poles', id],
    queryFn: () => componentsApi.getPoles(id!, { includeRemoved: true }),
    enabled: !!id,
  });

  const historyItems = Array.isArray(installationHistory) ? installationHistory : installationHistory?.items ?? [];
  const poles = Array.isArray(polesData) ? polesData : polesData?.items ?? polesData ?? [];

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!component) {
    return (
      <Container size="md" py="xl">
        <Text>Component not found</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/components')}
        >
          Back to Components
        </Button>
        {user?.role === 'ADMIN' && (
          <Button leftSection={<IconEdit size={16} />} onClick={() => navigate(`/components/${id}/edit`)}>
            Edit
          </Button>
        )}
      </Group>

      <Title order={2} mb="lg">
        {component.name}
      </Title>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="history">Installation History</Tabs.Tab>
          <Tabs.Tab value="poles">Poles</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group>
                <Text fw={700}>Type:</Text>
                <Badge variant="light">{component.type?.replace(/_/g, ' ')}</Badge>
              </Group>
              <Group>
                <Text fw={700}>Status:</Text>
                <Badge color={component.isActive ? 'green' : 'gray'}>{component.isActive ? 'Active' : 'Inactive'}</Badge>
              </Group>
              {component.model && (
                <Group>
                  <Text fw={700}>Model:</Text>
                  <Text>{component.model}</Text>
                </Group>
              )}
              {component.partNumber && (
                <Group>
                  <Text fw={700}>Part Number:</Text>
                  <Text>{component.partNumber}</Text>
                </Group>
              )}
              {component.description && (
                <Group>
                  <Text fw={700}>Description:</Text>
                  <Text>{component.description}</Text>
                </Group>
              )}
              {(component.manufacturerName || component.manufacturerPhone || component.manufacturerEmail) && (
                <Stack gap="xs">
                  <Text fw={700}>Manufacturer Information</Text>
                  {component.manufacturerName && (
                    <Group>
                      <Text fw={500} c="dimmed">Name:</Text>
                      <Text>{component.manufacturerName}</Text>
                    </Group>
                  )}
                  {component.manufacturerPhone && (
                    <Group>
                      <Text fw={500} c="dimmed">Phone:</Text>
                      <Text>{component.manufacturerPhone}</Text>
                    </Group>
                  )}
                  {component.manufacturerEmail && (
                    <Group>
                      <Text fw={500} c="dimmed">Email:</Text>
                      <Text>{component.manufacturerEmail}</Text>
                    </Group>
                  )}
                  {(component.manufacturerContact && !component.manufacturerPhone && !component.manufacturerEmail) && (
                    <Group>
                      <Text fw={500} c="dimmed">Contact:</Text>
                      <Text>{component.manufacturerContact}</Text>
                    </Group>
                  )}
                </Stack>
              )}
              {component.manufacturerCountry && (
                <Group>
                  <Text fw={700}>Manufacturer Country:</Text>
                  <Text>{component.manufacturerCountry}</Text>
                </Group>
              )}
              {component.powerUsageWatt != null && (
                <Group>
                  <Text fw={700}>Power (W):</Text>
                  <Text>{component.powerUsageWatt}W</Text>
                </Group>
              )}
              {component.serialNumber && (
                <Group>
                  <Text fw={700}>Serial Number:</Text>
                  <Text>{component.serialNumber}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="xl">
          <Paper p="md" withBorder>
            {historyLoading ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : historyItems.length === 0 ? (
              <Text c="dimmed">No installation history</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Pole</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Installed</Table.Th>
                    <Table.Th>Removed</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {historyItems.map((h: any) => (
                    <Table.Tr key={h.id}>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => navigate(`/poles/${h.pole?.code || h.poleCode}`)}
                        >
                          {h.pole?.code || h.poleCode || h.poleId}
                        </Button>
                      </Table.Td>
                      <Table.Td>{h.quantity}</Table.Td>
                      <Table.Td>
                        <Badge size="sm">{h.status}</Badge>
                      </Table.Td>
                      <Table.Td>{h.installationDate ? new Date(h.installationDate).toLocaleDateString() : '—'}</Table.Td>
                      <Table.Td>{h.removedDate ? new Date(h.removedDate).toLocaleDateString() : '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="poles" pt="xl">
          <Paper p="md" withBorder>
            {polesLoading ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : poles.length === 0 ? (
              <Text c="dimmed">Not installed on any poles</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Pole Code</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Installation Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {poles.map((p: any) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => navigate(`/poles/${p.pole?.code || p.poleCode}`)}
                        >
                          {p.pole?.code || p.poleCode || p.poleId}
                        </Button>
                      </Table.Td>
                      <Table.Td>{p.quantity}</Table.Td>
                      <Table.Td>
                        <Badge size="sm">{p.status}</Badge>
                      </Table.Td>
                      <Table.Td>{p.installationDate ? new Date(p.installationDate).toLocaleDateString() : '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
