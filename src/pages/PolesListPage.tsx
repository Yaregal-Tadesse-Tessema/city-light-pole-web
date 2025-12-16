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

export default function PolesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [poleToDelete, setPoleToDelete] = useState<string | null>(null);
  const [historyModalOpened, { open: openHistoryModal, close: closeHistoryModal }] = useDisclosure(false);
  const [selectedPoleCode, setSelectedPoleCode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['poles', page, search, district, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (district) params.append('district', district);
      if (status) params.append('status', status);

      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/poles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: maintenanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['maintenance-history', selectedPoleCode],
    queryFn: async () => {
      if (!selectedPoleCode) return [];
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/poles/${selectedPoleCode}/maintenance-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    enabled: !!selectedPoleCode && historyModalOpened,
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient.delete(`poles/${code}`);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Pole deleted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['poles'] });
      closeDeleteModal();
      setPoleToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete pole',
        color: 'red',
      });
    },
  });

  const handleDeleteClick = (code: string) => {
    setPoleToDelete(code);
    openDeleteModal();
  };

  const handleDeleteConfirm = () => {
    if (poleToDelete) {
      deleteMutation.mutate(poleToDelete);
    }
  };

  const handleShowHistory = (code: string) => {
    setSelectedPoleCode(code);
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
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Light Poles</Title>
        {isAdmin && (
          <Button onClick={() => navigate('/poles/new')}>Register Light Pole</Button>
        )}
      </Group>

      <Paper p="md" withBorder mb="md">
        <Group>
          <TextInput
            placeholder="Search by code, street, or subcity"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page when search changes
            }}
            style={{ flex: 1 }}
          />
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
              setPage(1); // Reset to first page when filter changes
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
              setPage(1); // Reset to first page when filter changes
            }}
            clearable
          />
        </Group>
      </Paper>

      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Subcity</Table.Th>
              <Table.Th>Street</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>LED Display</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={6}>Loading...</Table.Td>
              </Table.Tr>
            ) : data?.items?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>No poles found</Table.Td>
              </Table.Tr>
            ) : (
              data?.items?.map((pole: any) => (
                <Table.Tr 
                  key={pole.code}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/poles/${pole.code}`)}
                >
                  <Table.Td>{pole.code}</Table.Td>
                  <Table.Td>{pole.subcity || pole.district}</Table.Td>
                  <Table.Td>{pole.street}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(pole.status)}>
                      {pole.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {pole.hasLedDisplay ? (
                      <Badge color="blue" variant="light">Yes</Badge>
                    ) : (
                      <Badge color="gray" variant="light">No</Badge>
                    )}
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => navigate(`/poles/${pole.code}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconHistory size={14} />}
                        onClick={() => handleShowHistory(pole.code)}
                      >
                        Show History
                      </Button>
                      {isAdmin && (
                        <>
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => navigate(`/poles/${pole.code}/edit`)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => handleDeleteClick(pole.code)}
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
      </Paper>

      {data && Math.ceil(data.total / (data.limit || 10)) > 1 && (
        <Pagination
          value={page}
          onChange={setPage}
          total={Math.ceil(data.total / (data.limit || 10))}
          mt="md"
        />
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Light Pole"
        centered
      >
        <Text>Are you sure you want to delete this light pole? This action cannot be undone.</Text>
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
          setSelectedPoleCode(null);
        }}
        title={`Maintenance History - ${selectedPoleCode}`}
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
                      ? `$${parseFloat(log.estimatedCost).toFixed(2)}`
                      : log.cost && parseFloat(log.cost) > 0
                      ? `$${parseFloat(log.cost).toFixed(2)}`
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
            No maintenance history found for this pole.
          </Text>
        )}
      </Modal>
    </Container>
  );
}


