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
import { useTranslation } from 'react-i18next';

export default function ComponentDetailPage() {
  const { t } = useTranslation('componentDetail');
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
        <Text>{t('state.notFound')}</Text>
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
          {t('actions.backToComponents')}
        </Button>
        {user?.role === 'ADMIN' && (
          <Button leftSection={<IconEdit size={16} />} onClick={() => navigate(`/components/${id}/edit`)}>
            {t('actions.edit')}
          </Button>
        )}
      </Group>

      <Title order={2} mb="lg">
        {component.name}
      </Title>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">{t('tabs.details')}</Tabs.Tab>
          <Tabs.Tab value="history">{t('tabs.installationHistory')}</Tabs.Tab>
          <Tabs.Tab value="poles">{t('tabs.poles')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="xl">
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group>
                <Text fw={700}>{t('fields.type')}:</Text>
                <Badge variant="light">{component.type?.replace(/_/g, ' ')}</Badge>
              </Group>
              <Group>
                <Text fw={700}>{t('fields.status')}:</Text>
                <Badge color={component.isActive ? 'green' : 'gray'}>
                  {component.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
              </Group>
              {component.model && (
                <Group>
                  <Text fw={700}>{t('fields.model')}:</Text>
                  <Text>{component.model}</Text>
                </Group>
              )}
              {component.partNumber && (
                <Group>
                  <Text fw={700}>{t('fields.partNumber')}:</Text>
                  <Text>{component.partNumber}</Text>
                </Group>
              )}
              {component.description && (
                <Group>
                  <Text fw={700}>{t('fields.description')}:</Text>
                  <Text>{component.description}</Text>
                </Group>
              )}
              {(component.manufacturerName || component.manufacturerPhone || component.manufacturerEmail) && (
                <Stack gap="xs">
                  <Text fw={700}>{t('sections.manufacturerInfo')}</Text>
                  {component.manufacturerName && (
                    <Group>
                      <Text fw={500} c="dimmed">{t('fields.manufacturerName')}:</Text>
                      <Text>{component.manufacturerName}</Text>
                    </Group>
                  )}
                  {component.manufacturerPhone && (
                    <Group>
                      <Text fw={500} c="dimmed">{t('fields.manufacturerPhone')}:</Text>
                      <Text>{component.manufacturerPhone}</Text>
                    </Group>
                  )}
                  {component.manufacturerEmail && (
                    <Group>
                      <Text fw={500} c="dimmed">{t('fields.manufacturerEmail')}:</Text>
                      <Text>{component.manufacturerEmail}</Text>
                    </Group>
                  )}
                  {(component.manufacturerContact && !component.manufacturerPhone && !component.manufacturerEmail) && (
                    <Group>
                      <Text fw={500} c="dimmed">{t('fields.manufacturerContact')}:</Text>
                      <Text>{component.manufacturerContact}</Text>
                    </Group>
                  )}
                </Stack>
              )}
              {component.manufacturerCountry && (
                <Group>
                  <Text fw={700}>{t('fields.manufacturerCountry')}:</Text>
                  <Text>{component.manufacturerCountry}</Text>
                </Group>
              )}
              {component.powerUsageWatt != null && (
                <Group>
                  <Text fw={700}>{t('fields.power')}:</Text>
                  <Text>{t('units.watts', { value: component.powerUsageWatt })}</Text>
                </Group>
              )}
              {component.serialNumber && (
                <Group>
                  <Text fw={700}>{t('fields.serialNumber')}:</Text>
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
              <Text c="dimmed">{t('history.empty')}</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('history.table.pole')}</Table.Th>
                    <Table.Th>{t('history.table.quantity')}</Table.Th>
                    <Table.Th>{t('history.table.status')}</Table.Th>
                    <Table.Th>{t('history.table.installed')}</Table.Th>
                    <Table.Th>{t('history.table.removed')}</Table.Th>
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
                      <Table.Td>{h.installationDate ? new Date(h.installationDate).toLocaleDateString() : t('labels.none')}</Table.Td>
                      <Table.Td>{h.removedDate ? new Date(h.removedDate).toLocaleDateString() : t('labels.none')}</Table.Td>
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
              <Text c="dimmed">{t('poles.empty')}</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('poles.table.poleCode')}</Table.Th>
                    <Table.Th>{t('poles.table.quantity')}</Table.Th>
                    <Table.Th>{t('poles.table.status')}</Table.Th>
                    <Table.Th>{t('poles.table.installationDate')}</Table.Th>
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
                      <Table.Td>{p.installationDate ? new Date(p.installationDate).toLocaleDateString() : t('labels.none')}</Table.Td>
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

