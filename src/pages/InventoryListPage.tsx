import { useState, useMemo, useEffect } from 'react';
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
  Popover,
} from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconEye, IconFilter, IconArrowsUpDown } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import axios from 'axios';

// Categories will be loaded dynamically from API

export default function InventoryListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [lowStock, setLowStock] = useState<'low' | 'warning' | 'in_stock' | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Initialize filters from URL parameters
  useEffect(() => {
    const lowStockParam = searchParams.get('lowStock');
    if (lowStockParam) {
      if (lowStockParam === 'true') {
        setLowStock('low');
      } else {
        setLowStock(lowStockParam as 'low' | 'warning' | 'in_stock');
      }
    } else {
      setLowStock(null);
    }
  }, [searchParams]);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Filtering state
  const [codeFilter, setCodeFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
    setCodeFilter('');
    setNameFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = codeFilter || nameFilter || categoryFilter || statusFilter;

  const { data: allInventoryData, isLoading } = useQuery({
    queryKey: ['inventory', 'all', search, categoryId, lowStock],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Fetch all items for client-side filtering
      });
      if (search) params.append('search', search);
      if (categoryId) params.append('categoryId', categoryId);
      if (lowStock !== null) params.append('lowStock', lowStock);

      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/inventory?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  // Apply client-side filtering, sorting, and pagination
  const filteredAndSortedInventory = useMemo(() => {
    if (!allInventoryData?.items) return [];

    let filtered = [...allInventoryData.items];

    // Apply filters
    if (codeFilter) {
      filtered = filtered.filter(item =>
        item.code?.toLowerCase().includes(codeFilter.toLowerCase())
      );
    }

    if (nameFilter) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(item =>
        item.category?.name?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(item => {
        const stockStatus = getStockStatus(item);
        return stockStatus.label.toLowerCase().includes(statusFilter.toLowerCase());
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'code':
          aValue = a.code || '';
          bValue = b.code || '';
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'category':
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
          break;
        case 'status':
          aValue = getStockStatus(a).label;
          bValue = getStockStatus(b).label;
          break;
        default:
          aValue = a.code || '';
          bValue = b.code || '';
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
  }, [
    allInventoryData?.items,
    codeFilter,
    nameFilter,
    categoryFilter,
    statusFilter,
    sortBy,
    sortOrder
  ]);

  // Apply pagination to filtered and sorted results
  const totalItems = filteredAndSortedInventory.length;
  const totalPages = Math.ceil(totalItems / 10);
  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedItems = filteredAndSortedInventory.slice(startIndex, endIndex);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
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

  const categoryOptions = categories?.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient.delete(`inventory/${code}`);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Inventory item deleted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      closeDeleteModal();
      setItemToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete inventory item',
        color: 'red',
      });
    },
  });

  const handleDeleteClick = (code: string) => {
    setItemToDelete(code);
    openDeleteModal();
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const getStockStatus = (item: any) => {
    const currentStock = Number(item.currentStock);
    const minThreshold = Number(item.minimumThreshold);

    console.log(`Checking stock status for ${item.name}: currentStock=${currentStock} (${typeof item.currentStock}), minThreshold=${minThreshold} (${typeof item.minimumThreshold})`);

    if (currentStock <= minThreshold) {
      console.log(`Showing LOW STOCK: ${currentStock} <= ${minThreshold}`);
      return { color: 'red', label: 'Low Stock' };
    }
    if (currentStock <= minThreshold * 1.5) {
      console.log(`Showing WARNING: ${currentStock} <= ${minThreshold * 1.5}`);
      return { color: 'yellow', label: 'Warning' };
    }
    console.log(`Showing IN STOCK: ${currentStock} > ${minThreshold * 1.5}`);
    return { color: 'green', label: 'In Stock' };
  };


  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Inventory Management</Title>
        <Group>
          {hasActiveFilters && (
            <Button
              variant="light"
              color="red"
              size="md"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          )}
          {user?.role === 'ADMIN' && (
            <Button onClick={() => navigate('/inventory/new')} size="md">
              Add Inventory Item
            </Button>
          )}
        </Group>
      </Group>

      <Paper p={{ base: 'xs', sm: 'md' }} withBorder mb="md">
        <Stack gap="md">
          <TextInput
            placeholder="Search by code, name, or description"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Group grow>
            <Select
              placeholder="Category"
              data={categoryOptions}
              value={categoryId}
              onChange={(value) => {
                setCategoryId(value);
                setPage(1);
              }}
              clearable
              disabled={categoriesLoading}
            />
            <Select
              placeholder="Stock Status"
              data={[
                { value: 'low', label: 'Low Stock' },
                { value: 'warning', label: 'Warning' },
                { value: 'in_stock', label: 'In Stock' },
              ]}
              value={lowStock}
              onChange={(value) => {
                setLowStock(value as 'low' | 'warning' | 'in_stock' | null);
                setPage(1);
                // Update URL parameters
                const newSearchParams = new URLSearchParams(searchParams);
                if (value) {
                  newSearchParams.set('lowStock', value);
                } else {
                  newSearchParams.delete('lowStock');
                }
                setSearchParams(newSearchParams);
              }}
              clearable
            />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('code')}>Code</Text>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleSort('code')}
                      >
                        {getSortIcon('code')}
                      </ActionIcon>
                      <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <ActionIcon
                            variant="subtle"
                            color={codeFilter ? 'blue' : 'gray'}
                            size="sm"
                          >
                            <IconFilter size={16} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Stack gap="sm">
                            <Text size="sm" fw={500}>Filter by Code</Text>
                            <TextInput
                              placeholder="Enter code..."
                              value={codeFilter}
                              onChange={(e) => setCodeFilter(e.currentTarget.value)}
                              size="sm"
                            />
                            {codeFilter && (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => setCodeFilter('')}
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
                              placeholder="Enter name..."
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
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>Category</Text>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleSort('category')}
                      >
                        {getSortIcon('category')}
                      </ActionIcon>
                      <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <ActionIcon
                            variant="subtle"
                            color={categoryFilter ? 'blue' : 'gray'}
                            size="sm"
                          >
                            <IconFilter size={16} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Stack gap="sm">
                            <Text size="sm" fw={500}>Filter by Category</Text>
                            <TextInput
                              placeholder="Enter category..."
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.currentTarget.value)}
                              size="sm"
                            />
                            {categoryFilter && (
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => setCategoryFilter('')}
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
                <Table.Th>Current Stock</Table.Th>
                <Table.Th>Min Threshold</Table.Th>
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
                              data={['In Stock', 'Warning', 'Low Stock']}
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
                <Table.Th>Unit Cost</Table.Th>
                {user?.role === 'ADMIN' && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={user?.role === 'ADMIN' ? 8 : 7}>
                    <Loader size="sm" />
                  </Table.Td>
                </Table.Tr>
              ) : paginatedItems?.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={user?.role === 'ADMIN' ? 8 : 7}>
                    <Text c="dimmed" ta="center">No inventory items found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedItems.map((item: any) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <Table.Tr
                      key={item.code}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/inventory/${item.code}`)}
                    >
                      <Table.Td>{item.code}</Table.Td>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td>{item.category?.name || 'No category'}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>{item.currentStock} {item.unitOfMeasure}</Text>
                      </Table.Td>
                      <Table.Td>{item.minimumThreshold} {item.unitOfMeasure}</Table.Td>
                      <Table.Td>
                        <Badge color={stockStatus.color}>{stockStatus.label}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {item.unitCost ? `${Number(item.unitCost).toFixed(2)}` : 'N/A'}
                      </Table.Td>
                      {user?.role === 'ADMIN' && (
                        <Table.Td onClick={(e) => e.stopPropagation()}>
                          <Group gap="xs">
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={() => navigate(`/inventory/${item.code}`)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={() => navigate(`/inventory/${item.code}/edit`)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteClick(item.code)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {totalPages > 0 && (
        <Group justify="space-between" align="center" mt="md">
          <Text size="sm" c="dimmed">
            Showing {paginatedItems.length > 0 ? ((page - 1) * 10 + 1) : 0} - {Math.min(page * 10, totalItems)} of {totalItems} items
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
          />
        </Group>
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Inventory Item"
        centered
      >
        <Text>Are you sure you want to delete this inventory item? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}


