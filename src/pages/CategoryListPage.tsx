import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  Title,
  Button,
  Group,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Text,
  Modal,
  TextInput,
  Stack,
  Popover,
  Select,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconEye, IconFilter, IconArrowsUpDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function CategoryListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Filtering state
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // New field, default to ASC
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Get sort icon for a column
  const getSortIcon = (field: string) => {
    return <IconArrowsUpDown size={16} />;
  };

  // Reset filters function
  const resetFilters = () => {
    setNameFilter('');
    setStatusFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = nameFilter || statusFilter;

  const { data: allCategories, isLoading, refetch } = useQuery({
    queryKey: ['categories', nameFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Apply client-side filtering and sorting
  const filteredAndSortedCategories = useMemo(() => {
    if (!allCategories) return [];

    let filtered = [...allCategories];

    // Apply filters
    if (nameFilter) {
      filtered = filtered.filter(category =>
        category.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === 'ACTIVE';
      filtered = filtered.filter(category =>
        category.isActive === isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'status':
          aValue = a.isActive ? 'Active' : 'Inactive';
          bValue = b.isActive ? 'Active' : 'Inactive';
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allCategories, nameFilter, statusFilter, sortBy, sortOrder]);

  // For backward compatibility, keep categories as filteredAndSortedCategories
  const categories = filteredAndSortedCategories;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:3011/api/v1/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Category deleted successfully',
        color: 'green',
      });
      refetch();
      setDeleteModalOpened(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete category',
        color: 'red',
      });
    },
  });

  const handleDeleteClick = (category: any) => {
    setSelectedCategory(category);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Categories</Title>
        <Group>
          {hasActiveFilters && (
            <Button
              variant="light"
              color="red"
              size="sm"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          )}
          {isAdmin && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/categories/new')}
            >
              Add Category
            </Button>
          )}
        </Group>
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name</Text>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleSort('name')}
                      >
                        {getSortIcon('name')}
                      </ActionIcon>
                      <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <ActionIcon
                            variant="subtle"
                            color={nameFilter ? 'blue' : 'gray'}
                            size="sm"
                          >
                            <IconFilter size={16} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Stack gap="sm">
                            <Text size="sm" fw={500}>Filter by Name</Text>
                            <TextInput
                              placeholder="Enter category name..."
                              value={nameFilter}
                              onChange={(e) => setNameFilter(e.currentTarget.value)}
                              size="sm"
                            />
                            {nameFilter && (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => setNameFilter('')}
                              >
                                Clear
                              </Button>
                            )}
                          </Stack>
                        </Popover.Dropdown>
                      </Popover>
                    </Group>
                  </Group>
                </Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status</Text>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleSort('status')}
                      >
                        {getSortIcon('status')}
                      </ActionIcon>
                      <Popover width={250} trapFocus position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <ActionIcon
                            variant="subtle"
                            color={statusFilter ? 'blue' : 'gray'}
                            size="sm"
                          >
                            <IconFilter size={16} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Stack gap="sm">
                            <Text size="sm" fw={500}>Filter by Status</Text>
                            <Select
                              placeholder="Select status"
                              data={[
                                { value: 'ACTIVE', label: 'Active' },
                                { value: 'INACTIVE', label: 'Inactive' }
                              ]}
                              value={statusFilter}
                              onChange={(value) => setStatusFilter(value || '')}
                              clearable
                              size="sm"
                            />
                          </Stack>
                        </Popover.Dropdown>
                      </Popover>
                    </Group>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Created</Text>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('createdAt')}
                    >
                      {getSortIcon('createdAt')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Center>
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : !categories || categories.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center">No categories found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                categories.map((category: any) => (
                  <Table.Tr key={category.id}>
                    <Table.Td>
                      <Text fw={600}>{category.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
                        {category.description || 'No description'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={category.isActive ? 'green' : 'red'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => navigate(`/categories/${category.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        {isAdmin && (
                          <>
                            <ActionIcon
                              variant="light"
                              color="orange"
                              onClick={() => navigate(`/categories/${category.id}/edit`)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteClick(category)}
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
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedCategory(null);
        }}
        title="Delete Category"
        size="sm"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete the category "{selectedCategory?.name}"?
            This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setSelectedCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

