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
import { IconEdit, IconTrash, IconHistory } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import axios from 'axios';

export default function PublicToiletsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [toiletToDelete, setToiletToDelete] = useState<string | null>(null);
  const [historyModalOpened, { open: openHistoryModal, close: closeHistoryModal }] = useDisclosure(false);
  const [selectedToiletCode, setSelectedToiletCode] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['public-toilets', page, search, district, status],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        });
        if (search) params.append('search', search);
        if (district) params.append('district', district);
        if (status) params.append('status', status);

        const token = localStorage.getItem('access_token');
        const res = await axios.get(`http://localhost:3011/api/v1/public-toilets?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (error: any) {
        console.error('Failed to fetch public toilets:', error.response?.status || error.message);
        return { items: [], total: 0, limit: 10 };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const displayData = data || { items: [], total: 0, limit: 10 };

  const { data: maintenanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['toilet-maintenance-history', selectedToiletCode],
    queryFn: async () => {
      if (!selectedToiletCode) return [];
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/public-toilets/${selectedToiletCode}/maintenance-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    enabled: !!selectedToiletCode && historyModalOpened,
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient.delete(`public-toilets/${code}`);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Public toilet deleted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['public-toilets'] });
      closeDeleteModal();
      setToiletToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete public toilet',
        color: 'red',
      });
    },
  });

  const handleDeleteClick = (code: string) => {
    setToiletToDelete(code);
    openDeleteModal();
  };

  const handleDeleteConfirm = () => {
    if (toiletToDelete) {
      deleteMutation.mutate(toiletToDelete);
    }
  };

  const handleShowHistory = (code: string) => {
    setSelectedToiletCode(code);
    openHistoryModal();
  };

  const isAdmin = user?.role === 'ADMIN';

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

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title size={{ base: 'h2', sm: 'h1' }}>Public Toilets</Title>
        {isAdmin && (
          <Button 
            onClick={() => navigate('/public-toilets/new')}
            size="md"
          >
            Register Public Toilet
          </Button>
        )}
      </Group>

      <Paper p={{ base: 'xs', sm: 'md' }} withBorder mb="md">
        <Stack gap="md">
          <TextInput
            placeholder="Search by code, street, or subcity"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Group grow>
            <Select
              placeholder="Subcity"
              data={[
                'Addis Ketema',
                'Akaky Kaliti',
                'Arada',
                'Bole',
                'Gullele',
                'Kirkos',
                'Kolfe Keranio',
                'Lideta',
                'Nifas Silk-Lafto',
                'Yeka',
                'Lemi Kura',
              ]}
              value={district}
              onChange={(value) => {
                setDistrict(value);
                setPage(1);
              }}
              clearable
              searchable
            />
            <Select
              placeholder="Status"
              data={['ACTIVE', 'FAULT_DAMAGED', 'UNDER_MAINTENANCE', 'OPERATIONAL']}
              value={status}
              onChange={(value) => {
                setStatus(value);
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
                <Table.Th>Subcity</Table.Th>
                <Table.Th>Street</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>Loading...</Table.Td>
                </Table.Tr>
              ) : !displayData.items || displayData.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>No public toilets found</Table.Td>
                </Table.Tr>
              ) : (
                displayData.items.map((toilet: any) => (
                  <Table.Tr 
                    key={toilet.code}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/public-toilets/${toilet.code}`)}
                  >
                    <Table.Td>{toilet.code}</Table.Td>
                    <Table.Td>{toilet.district}</Table.Td>
                    <Table.Td>{toilet.street}</Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(toilet.status)}>
                        {toilet.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => navigate(`/public-toilets/${toilet.code}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconHistory size={14} />}
                          onClick={() => handleShowHistory(toilet.code)}
                        >
                          Show History
                        </Button>
                        {isAdmin && (
                          <>
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={() => navigate(`/public-toilets/${toilet.code}/edit`)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteClick(toilet.code)}
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

      {displayData.total && displayData.total > 0 && Math.ceil(displayData.total / (displayData.limit || 10)) > 1 && (
        <Pagination
          value={page}
          onChange={setPage}
          total={Math.ceil(displayData.total / (displayData.limit || 10))}
          mt="md"
        />
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Public Toilet"
        centered
      >
        <Text>Are you sure you want to delete this public toilet? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={historyModalOpened}
        onClose={() => {
          closeHistoryModal();
          setSelectedToiletCode(null);
        }}
        title={`Maintenance History - ${selectedToiletCode}`}
        size="xl"
        centered
      >
        {historyLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : maintenanceHistory && maintenanceHistory.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Cost</Table.Th>
                <Table.Th>Start Date</Table.Th>
                <Table.Th>End Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {maintenanceHistory.map((log: any) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{log.description}</Table.Td>
                  <Table.Td>
                    <Badge>{log.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                      {log.estimatedCost && parseFloat(log.estimatedCost) > 0
                        ? `${parseFloat(log.estimatedCost).toFixed(2)}`
                        : log.cost && parseFloat(log.cost) > 0
                        ? `${parseFloat(log.cost).toFixed(2)}`
                        : '-'}
                  </Table.Td>
                  <Table.Td>
                    {log.startDate
                      ? new Date(log.startDate).toLocaleDateString()
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    {log.completedDate
                      ? new Date(log.completedDate).toLocaleDateString()
                      : log.endDate
                      ? new Date(log.endDate).toLocaleDateString()
                      : '-'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" p="xl">
            No maintenance history found for this public toilet.
          </Text>
        )}
      </Modal>
    </Container>
  );
}

