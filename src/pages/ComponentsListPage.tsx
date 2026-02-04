import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Table,
  TextInput,
  Select,
  Button,
  Group,
  Badge,
  Title,
  Pagination,
  ActionIcon,
  Modal,
  Text,
  Stack,
  Loader,
  Center,
  Checkbox,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconEye, IconPlus, IconRefresh } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { componentsApi, COMPONENT_TYPES } from '../api/components';

export default function ComponentsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [componentToDelete, setComponentToDelete] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const { data: componentsData, isLoading } = useQuery({
    queryKey: ['components', page, limit, typeFilter, manufacturerFilter, countryFilter, searchFilter, includeInactive],
    queryFn: () =>
      componentsApi.list({
        page,
        limit,
        type: typeFilter || undefined,
        manufacturer: manufacturerFilter || undefined,
        manufacturerCountry: countryFilter || undefined,
        search: searchFilter || undefined,
        isActive: includeInactive ? undefined : true, // If not including inactive, only fetch active
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => componentsApi.delete(id),
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Component deleted', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['components'] });
      closeDeleteModal();
      setComponentToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete component',
        color: 'red',
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => componentsApi.update(id, { isActive: true }),
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Component reactivated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to reactivate component',
        color: 'red',
      });
    },
  });

  const items = componentsData?.items ?? componentsData?.data ?? componentsData ?? [];
  
  // Sort current page: inactive first, then active
  const sortedItems = useMemo(() => {
    return [...items].sort((a: any, b: any) => {
      // Inactive first (false before true)
      if (a.isActive === b.isActive) return 0;
      if (!a.isActive && b.isActive) return -1;
      if (a.isActive && !b.isActive) return 1;
      return 0;
    });
  }, [items]);
  
  const total = componentsData?.total ?? componentsData?.meta?.total ?? sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRecord = total > 0 ? (page - 1) * limit + 1 : 0;
  const endRecord = Math.min(page * limit, total);

  const typeOptions = COMPONENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }));

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb="xl">
        <Title order={1}>Components</Title>
        {isAdmin && (
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/components/new')}>
            Add Component
          </Button>
        )}
      </Group>

      <Paper withBorder p="md" mb="md">
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.currentTarget.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Type"
            data={typeOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            style={{ width: 180 }}
          />
          <TextInput
            placeholder="Manufacturer"
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.currentTarget.value)}
            style={{ width: 180 }}
          />
          <TextInput
            placeholder="Country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.currentTarget.value)}
            style={{ width: 140 }}
          />
          <Checkbox
            label="Include inactive"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.currentTarget.checked);
              setPage(1);
            }}
          />
          <Button
            variant="light"
            color="gray"
            onClick={() => {
              setTypeFilter(null);
              setManufacturerFilter('');
              setCountryFilter('');
              setSearchFilter('');
              setIncludeInactive(false);
              setPage(1);
            }}
          >
            Clear
          </Button>
        </Group>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Model</Table.Th>
                <Table.Th>Manufacturer</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Center py="xl">
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : sortedItems.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="xl">
                      No components found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                sortedItems.map((c: any) => (
                  <Table.Tr
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/components/${c.id}`)}
                  >
                    <Table.Td>
                      <Text fw={500}>{c.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{c.type?.replace(/_/g, ' ')}</Badge>
                    </Table.Td>
                    <Table.Td>{c.model || '—'}</Table.Td>
                    <Table.Td>{c.manufacturerName || '—'}</Table.Td>
                    <Table.Td>
                      <Badge color={c.isActive ? 'green' : 'gray'} variant="light">
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => navigate(`/components/${c.id}`)}
                          title="View"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        {isAdmin && (
                          <>
                            <ActionIcon
                              variant="light"
                              color="gray"
                              onClick={() => navigate(`/components/${c.id}/edit`)}
                              title="Edit"
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            {!c.isActive && (
                              <ActionIcon
                                variant="light"
                                color="green"
                                onClick={() => reactivateMutation.mutate(c.id)}
                                loading={reactivateMutation.isPending}
                                title="Reactivate"
                              >
                                <IconRefresh size={16} />
                              </ActionIcon>
                            )}
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => {
                                setComponentToDelete({ id: c.id, name: c.name });
                                openDeleteModal();
                              }}
                              title="Delete"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
            <Table.Caption>
              <Group justify="flex-end" align="center" gap="md" wrap="wrap" p="md">
                <Text size="sm" c="dimmed">
                  Showing {startRecord}-{endRecord} of {total} components
                </Text>
                <Text size="sm" c="dimmed">
                  Page {page} of {totalPages}
                </Text>
                <Select
                  label="Per page"
                  value={limit.toString()}
                  onChange={(value) => {
                    setLimit(Number(value) || 10);
                    setPage(1);
                  }}
                  data={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                  style={{ width: 100 }}
                />
                {totalPages > 1 && (
                  <Pagination value={page} onChange={setPage} total={totalPages} />
                )}
              </Group>
            </Table.Caption>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          closeDeleteModal();
          setComponentToDelete(null);
        }}
        title="Delete Component"
        centered
      >
        <Text>
          Are you sure you want to delete "{componentToDelete?.name}"? This will soft-delete the component.
        </Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            onClick={() => componentToDelete && deleteMutation.mutate(componentToDelete.id)}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
