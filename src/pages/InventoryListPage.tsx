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
import { useTranslation } from 'react-i18next';

// Categories will be loaded dynamically from API

export default function InventoryListPage() {
  const { t } = useTranslation('inventoryList');
  const { t: tCommon } = useTranslation('common');
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
        title: t('notifications.deleteSuccessTitle'),
        message: t('notifications.deleteSuccessMessage'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      closeDeleteModal();
      setItemToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.deleteErrorTitle'),
        message: error.response?.data?.message || t('notifications.deleteErrorMessage'),
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
      return { color: 'red', label: t('status.lowStock') };
    }
    if (currentStock <= minThreshold * 1.5) {
      console.log(`Showing WARNING: ${currentStock} <= ${minThreshold * 1.5}`);
      return { color: 'yellow', label: t('status.warning') };
    }
    console.log(`Showing IN STOCK: ${currentStock} > ${minThreshold * 1.5}`);
    return { color: 'green', label: t('status.inStock') };
  };


  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>{t('title')}</Title>
        <Group>
          {hasActiveFilters && (
            <Button
              variant="light"
              color="red"
              size="md"
              onClick={resetFilters}
            >
              {t('actions.clearFilters')}
            </Button>
          )}
          {user?.role === 'ADMIN' && (
            <Button onClick={() => navigate('/inventory/new')} size="md">
              {t('actions.addItem')}
            </Button>
          )}
        </Group>
      </Group>

      <Paper p={{ base: 'xs', sm: 'md' }} withBorder mb="md">
        <Stack gap="md">
          <TextInput
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Group grow>
            <Select
              placeholder={t('filters.categoryPlaceholder')}
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
              placeholder={t('filters.stockStatusPlaceholder')}
              data={[
                { value: 'low', label: t('status.lowStock') },
                { value: 'warning', label: t('status.warning') },
                { value: 'in_stock', label: t('status.inStock') },
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('code')}>
                      {t('table.code')}
                    </Text>
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
                            <Text size="sm" fw={500}>{t('filters.codeLabel')}</Text>
                            <TextInput
                              placeholder={t('filters.codePlaceholder')}
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
                                {t('actions.clear')}
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                      {t('table.name')}
                    </Text>
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
                            <Text size="sm" fw={500}>{t('filters.nameLabel')}</Text>
                            <TextInput
                              placeholder={t('filters.namePlaceholder')}
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
                                {t('actions.clear')}
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>
                      {t('table.category')}
                    </Text>
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
                            <Text size="sm" fw={500}>{t('filters.categoryLabel')}</Text>
                            <TextInput
                              placeholder={t('filters.categoryPlaceholderInput')}
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
                                {t('actions.clear')}
                              </Button>
                            )}
                          </Stack>
                        </Popover.Dropdown>
                      </Popover>
                    </Group>
                  </Group>
                </Table.Th>
                <Table.Th>{t('table.currentStock')}</Table.Th>
                <Table.Th>{t('table.minThreshold')}</Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                      {t('table.status')}
                    </Text>
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
                            <Text size="sm" fw={500}>{t('filters.statusLabel')}</Text>
                            <Select
                              placeholder={t('filters.statusPlaceholder')}
                              data={[t('status.inStock'), t('status.warning'), t('status.lowStock')]}
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
                <Table.Th>{t('table.unitCost')}</Table.Th>
                {user?.role === 'ADMIN' && <Table.Th>{t('table.actions')}</Table.Th>}
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
                    <Text c="dimmed" ta="center">{t('emptyState')}</Text>
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
                      <Table.Td>{item.category?.name || t('labels.noCategory')}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>{item.currentStock} {item.unitOfMeasure}</Text>
                      </Table.Td>
                      <Table.Td>{item.minimumThreshold} {item.unitOfMeasure}</Table.Td>
                      <Table.Td>
                        <Badge color={stockStatus.color}>{stockStatus.label}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {item.unitCost ? `${Number(item.unitCost).toFixed(2)}` : t('labels.notAvailable')}
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
            {t('pagination.showing', {
              start: paginatedItems.length > 0 ? (page - 1) * 10 + 1 : 0,
              end: Math.min(page * 10, totalItems),
              total: totalItems,
            })}
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
        title={t('deleteModal.title')}
        centered
      >
        <Text>{t('deleteModal.confirmation')}</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={closeDeleteModal}>
            {tCommon('actions.cancel')}
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
            {t('actions.delete')}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
