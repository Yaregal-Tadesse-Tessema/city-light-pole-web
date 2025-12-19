import { useState } from 'react';
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
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import axios from 'axios';

// Categories will be loaded dynamically from API

export default function InventoryListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [lowStock, setLowStock] = useState<boolean | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search, categoryId, lowStock],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (categoryId) params.append('categoryId', categoryId);
      if (lowStock !== null) params.append('lowStock', lowStock.toString());

      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/inventory?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

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
    if (item.currentStock <= item.minimumThreshold) {
      return { color: 'red', label: 'Low Stock' };
    }
    if (item.currentStock <= item.minimumThreshold * 1.5) {
      return { color: 'yellow', label: 'Warning' };
    }
    return { color: 'green', label: 'In Stock' };
  };

  const paginatedItems = data?.items || [];
  const totalItems = data?.total || 0;
  const itemsPerPage = data?.limit || 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Inventory Management</Title>
        {user?.role === 'ADMIN' && (
          <Button onClick={() => navigate('/inventory/new')} size="md">
            Add Inventory Item
          </Button>
        )}
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
                { value: 'true', label: 'Low Stock' },
                { value: 'false', label: 'In Stock' },
              ]}
              value={lowStock !== null ? lowStock.toString() : null}
              onChange={(value) => {
                setLowStock(value === null ? null : value === 'true');
                setPage(1);
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
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Current Stock</Table.Th>
                <Table.Th>Min Threshold</Table.Th>
                <Table.Th>Status</Table.Th>
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
              ) : paginatedItems.length === 0 ? (
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
                        {item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : 'N/A'}
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
            Showing {paginatedItems.length > 0 ? ((page - 1) * itemsPerPage + 1) : 0} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems} items
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


