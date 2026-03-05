import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Table,
  Title,
  Select,
  Badge,
  Group,
  Button,
  Text,
  Modal,
  Textarea,
  Stack,
  Loader,
  Center,
  Alert,
  NumberInput,
  Popover,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck, IconX, IconPackage, IconFilter, IconArrowsUpDown, IconSortAscending, IconSortDescending, IconBox } from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const STATUS_VALUES = ['PENDING', 'APPROVED', 'REJECTED', 'WAITING_FOR_PURCHASE', 'IN_STOCK', 'DELIVERED'] as const;

export default function PurchaseRequestsPage() {
  const { t } = useTranslation('purchaseRequests');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [approveModalOpened, setApproveModalOpened] = useState(false);
  const [receiveModalOpened, setReceiveModalOpened] = useState(false);
  const [deliverModalOpened, setDeliverModalOpened] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [grnCode, setGrnCode] = useState('');
  const [receivingCode, setReceivingCode] = useState('');
  const statusOptions = STATUS_VALUES.map((value) => ({
    value,
    label: t(`status.${value.toLowerCase()}`),
  }));
  const statusLabels: Record<string, string> = {
    PENDING: t('status.pending'),
    APPROVED: t('status.approved'),
    REJECTED: t('status.rejected'),
    WAITING_FOR_PURCHASE: t('status.waitingForPurchase'),
    IN_STOCK: t('status.inStock'),
    DELIVERED: t('status.delivered'),
    ORDERED: t('status.ordered'),
    ARRIVED_IN_STOCK: t('status.arrivedInStock'),
  };
  const formatStatus = (status: string) => statusLabels[status] || status;

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filtering state
  const [materialRequestFilter, setMaterialRequestFilter] = useState('');
  const [requestedByFilter, setRequestedByFilter] = useState('');
  const [itemsCountFilter, setItemsCountFilter] = useState('');
  const [totalCostFilter, setTotalCostFilter] = useState('');

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // New field, default to DESC
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  // Get sort icon for a column
  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <IconArrowsUpDown size={16} />;
    }
    return sortOrder === 'ASC' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />;
  };

  const { data: allRequests, isLoading } = useQuery({
    queryKey: ['purchase-requests', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await axios.get(`http://localhost:3011/api/v1/purchase-requests${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Apply client-side sorting and filtering
  const requests = useMemo(() => {
    if (!allRequests) return [];

    let filtered = allRequests.filter((request: any) => {
      // Status filter
      if (statusFilter && request.status !== statusFilter) return false;

      // Material Request filter
      if (materialRequestFilter && !request.materialRequest?.id.toLowerCase().includes(materialRequestFilter.toLowerCase())) return false;

      // Requested By filter
      if (requestedByFilter && !request.requestedBy?.fullName.toLowerCase().includes(requestedByFilter.toLowerCase())) return false;

      // Items Count filter
      if (itemsCountFilter && !request.items?.length.toString().includes(itemsCountFilter)) return false;

      // Total Cost filter
      if (totalCostFilter) {
        const cost = Number(request.totalCost || 0);
        const filterCost = Number(totalCostFilter);
        if (!isNaN(filterCost) && cost !== filterCost) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'materialRequest':
          aValue = a.materialRequest?.id || '';
          bValue = b.materialRequest?.id || '';
          break;
        case 'requestedBy':
          aValue = a.requestedBy?.fullName || '';
          bValue = b.requestedBy?.fullName || '';
          break;
        case 'itemsCount':
          aValue = a.items?.length || 0;
          bValue = b.items?.length || 0;
          break;
        case 'totalCost':
          aValue = Number(a.totalCost || 0);
          bValue = Number(b.totalCost || 0);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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
  }, [allRequests, statusFilter, materialRequestFilter, requestedByFilter, itemsCountFilter, totalCostFilter, sortBy, sortOrder]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/approve`,
        {
          approve,
          rejectionReason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: variables.approve
          ? t('notifications.approveSuccess')
          : t('notifications.rejectSuccess'),
        color: variables.approve ? 'green' : 'orange',
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setApproveModalOpened(false);
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.processError'),
        color: 'red',
      });
    },
  });

  const waitingForPurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/order`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.markedOrdered'),
        color: 'cyan',
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.markOrderedError'),
        color: 'red',
      });
    },
  });

  const inStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/receive`,
        {
          notes: 'Received in stock'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.markedArrived'),
        color: 'orange',
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.markArrivedError'),
        color: 'red',
      });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async ({ id, notes, grnCode }: { id: string; notes?: string; grnCode?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/receive`,
        {
          notes: notes || undefined,
          grnCode: grnCode || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: async () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.delivered'),
        color: 'green',
      });

      // If this purchase request is related to a maintenance schedule,
      // update the maintenance status when materials are delivered
      if (selectedRequest?.maintenanceScheduleId) {
        try {
          const token = localStorage.getItem('access_token');
          await axios.patch(
            `http://localhost:3011/api/v1/maintenance/schedules/${selectedRequest.maintenanceScheduleId}`,
            {
              status: 'STARTED', // Change status to STARTED when materials are delivered
              remark: 'Materials delivered - ready to start maintenance work'
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('Updated maintenance status to STARTED for schedule:', selectedRequest.maintenanceScheduleId);
        } catch (error) {
          console.error('Failed to update maintenance status:', error);
          // Don't show error notification for maintenance update failure
          // since the purchase delivery was successful
        }
      }

      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
      setReceiveModalOpened(false);
      setSelectedRequest(null);
      setReceiveNotes('');
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.deliverError'),
        color: 'red',
      });
    },
  });

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailModalOpened(true);
  };

  const handleApproveClick = (request: any) => {
    setSelectedRequest(request);
    setApproveModalOpened(true);
    setRejectionReason('');
  };

  const handleReceiveClick = (request: any) => {
    setSelectedRequest(request);
    setReceiveModalOpened(true);
    setReceiveNotes('');
    setGrnCode('');
  };

  const handleDeliverClick = (request: any) => {
    setSelectedRequest(request);
    setDeliverModalOpened(true);
    setReceivingCode('');
  };

  const handleApprove = (approve: boolean) => {
    if (!selectedRequest) return;
    if (!approve && !rejectionReason.trim()) {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.requireRejectionReason'),
        color: 'red',
      });
      return;
    }
    approveMutation.mutate({
      id: selectedRequest.id,
      approve,
      reason: approve ? undefined : rejectionReason,
    });
  };

  const handleDeliver = () => {
    if (!selectedRequest) return;
    deliverMutation.mutate({
      id: selectedRequest.id,
      notes: receiveNotes || undefined,
      grnCode: grnCode || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'APPROVED':
        return 'blue';
      case 'REJECTED':
        return 'red';
      case 'WAITING_FOR_PURCHASE':
        return 'cyan';
      case 'IN_STOCK':
        return 'orange';
      case 'DELIVERED':
        return 'green';
      default:
        return 'gray';
    }
  };

  const canApprove = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'PENDING';
  };

  const canWaitingForPurchase = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'APPROVED';
  };

  const canInStock = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'ORDERED';
  };

  const canDeliver = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'ARRIVED_IN_STOCK';
  };

  const finalDeliverMutation = useMutation({
    mutationFn: async ({ id, receivingCode }: { id: string; receivingCode?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/deliver`,
        {
          receivingCode: receivingCode || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: async () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.deliveredToTeam'),
        color: 'green',
      });

      // If this purchase request is related to a maintenance schedule,
      // update the maintenance status when materials are delivered
      if (selectedRequest?.maintenanceScheduleId) {
        try {
          const token = localStorage.getItem('access_token');
          await axios.patch(
            `http://localhost:3011/api/v1/maintenance/schedules/${selectedRequest.maintenanceScheduleId}`,
            {
              status: 'STARTED', // Change status to STARTED when materials are delivered
              remark: 'Materials delivered to maintenance team - ready to start work'
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('Updated maintenance status to STARTED for schedule:', selectedRequest.maintenanceScheduleId);
        } catch (error) {
          console.error('Failed to update maintenance status:', error);
          // Don't show error notification for maintenance update failure
          // since the purchase delivery was successful
        }
      }

      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
      setDeliverModalOpened(false);
      setSelectedRequest(null);
      setReceivingCode('');
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.deliverToTeamError'),
        color: 'red',
      });
    },
  });

  const handleFinalDeliver = () => {
    if (!selectedRequest) return;
    finalDeliverMutation.mutate({
      id: selectedRequest.id,
      receivingCode: receivingCode || undefined,
    });
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>{t('title')}</Title>
        <Select
          placeholder={t('filters.statusPlaceholder')}
          data={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          style={{ width: 200 }}
        />
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('table.requestId')}</Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('materialRequest')}>
                        {t('table.materialRequest')}
                      </Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder={t('filters.materialRequestPlaceholder')}
                          value={materialRequestFilter}
                          onChange={(event) => setMaterialRequestFilter(event.currentTarget.value)}
                          size="sm"
                        />
                      </Popover.Dropdown>
                    </Popover>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('materialRequest')}
                    >
                      {getSortIcon('materialRequest')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>{t('table.maintenanceCode')}</Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('requestedBy')}>
                        {t('table.requestedBy')}
                      </Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder={t('filters.requestedByPlaceholder')}
                          value={requestedByFilter}
                          onChange={(event) => setRequestedByFilter(event.currentTarget.value)}
                          size="sm"
                        />
                      </Popover.Dropdown>
                    </Popover>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('requestedBy')}
                    >
                      {getSortIcon('requestedBy')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('itemsCount')}>
                        {t('table.itemsCount')}
                      </Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder="Filter by Items Count..."
                          value={itemsCountFilter}
                          onChange={(event) => setItemsCountFilter(event.currentTarget.value)}
                          size="sm"
                        />
                      </Popover.Dropdown>
                    </Popover>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('itemsCount')}
                    >
                      {getSortIcon('itemsCount')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('totalCost')}>
                        {t('table.totalCost')}
                      </Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder="Filter by Total Cost..."
                          value={totalCostFilter}
                          onChange={(event) => setTotalCostFilter(event.currentTarget.value)}
                          size="sm"
                        />
                      </Popover.Dropdown>
                    </Popover>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('totalCost')}
                    >
                      {getSortIcon('totalCost')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                        {t('table.status')}
                      </Text>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('status')}
                    >
                      {getSortIcon('status')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                        {t('table.requestDate')}
                      </Text>
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
                <Table.Th>{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Center>
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : !requests || requests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text c="dimmed" ta="center">{t('emptyState')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                requests.map((request: any) => (
                  <Table.Tr key={request.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {request.id.substring(0, 8)}...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {request.materialRequestId
                          ? (request.materialRequest?.code ?? t('labels.notAvailable'))
                          : t('labels.directPurchase')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                          {request.maintenanceSchedule?.maintenanceCode || t('labels.notAvailable')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                          {request.requestedBy?.fullName || t('labels.unknown')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {t('labels.itemsCount', { count: request.items?.length || 0 })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {Number(request.totalCost || 0).toFixed(2)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                        <Badge color={getStatusColor(request.status)}>
                          {formatStatus(request.status)}
                        </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconEye size={14} />}
                          onClick={() => handleViewDetails(request)}
                        >
                          {t('actions.view')}
                        </Button>
                        {canApprove(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => handleApproveClick(request)}
                          >
                            {t('actions.review')}
                          </Button>
                        )}
                        {canWaitingForPurchase(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="cyan"
                            leftSection={<IconPackage size={14} />}
                            onClick={() => waitingForPurchaseMutation.mutate(request.id)}
                            loading={waitingForPurchaseMutation.isPending}
                          >
                            {t('actions.markOrdered')}
                          </Button>
                        )}
                        {canInStock(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            leftSection={<IconBox size={14} />}
                            onClick={() => handleReceiveClick(request)}
                          >
                            {t('actions.markArrived')}
                          </Button>
                        )}
                        {canDeliver(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => handleDeliverClick(request)}
                          >
                            {t('actions.deliver')}
                          </Button>
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

      {/* Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={() => {
          setDetailModalOpened(false);
          setSelectedRequest(null);
        }}
        title={t('detailModal.title')}
        size="lg"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.requestId')}:</Text>
              <Text size="sm">{selectedRequest.id}</Text>
            </Group>
            {selectedRequest.materialRequestId && (
              <Group justify="space-between">
                <Text fw={600}>{t('detailModal.materialRequest')}:</Text>
                <Text size="sm">
                  {selectedRequest.materialRequest?.code ?? t('labels.notAvailable')}
                </Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.requestedBy')}:</Text>
              <Text size="sm">
                {selectedRequest.requestedBy?.fullName || t('labels.unknown')}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.totalCost')}:</Text>
              <Text fw={700} size="lg">
                {Number(selectedRequest.totalCost || 0).toFixed(2)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.status')}:</Text>
              <Badge color={getStatusColor(selectedRequest.status)}>
                {formatStatus(selectedRequest.status)}
              </Badge>
            </Group>
            {selectedRequest.supplierName && (
              <Group justify="space-between">
                  <Text fw={600}>{t('detailModal.supplier')}:</Text>
                <Text size="sm">{selectedRequest.supplierName}</Text>
              </Group>
            )}
            {selectedRequest.supplierContact && (
              <Group justify="space-between">
                  <Text fw={600}>{t('detailModal.supplierContact')}:</Text>
                <Text size="sm">{selectedRequest.supplierContact}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.requestDate')}:</Text>
              <Text size="sm">
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </Text>
            </Group>
            {selectedRequest.approvedBy && (
              <Group justify="space-between">
                  <Text fw={600}>{t('detailModal.approvedBy')}:</Text>
                  <Text size="sm">
                    {selectedRequest.approvedBy?.fullName || t('labels.unknown')}
                  </Text>
              </Group>
            )}
            {selectedRequest.approvedAt && (
              <Group justify="space-between">
                  <Text fw={600}>{t('detailModal.approvedAt')}:</Text>
                <Text size="sm">
                  {new Date(selectedRequest.approvedAt).toLocaleString()}
                </Text>
              </Group>
            )}
            {selectedRequest.orderedAt && (
              <Group justify="space-between">
                  <Text fw={600}>{t('detailModal.orderedAt')}:</Text>
                <Text size="sm">
                  {new Date(selectedRequest.orderedAt).toLocaleString()}
                </Text>
              </Group>
            )}
            {selectedRequest.receivedAt && (
              <Group justify="space-between">
                  <Text fw={600}>{t('detailModal.receivedAt')}:</Text>
                <Text size="sm">
                  {new Date(selectedRequest.receivedAt).toLocaleString()}
                </Text>
              </Group>
            )}
            {selectedRequest.grnCode && (
              <Group justify="space-between">
                <Text fw={600}>{t('detailModal.grnCode')}:</Text>
                <Text size="sm">{selectedRequest.grnCode}</Text>
              </Group>
            )}
              {selectedRequest.rejectionReason && (
                <Alert color="red" title={t('detailModal.rejectionReasonTitle')}>
                  {selectedRequest.rejectionReason}
                </Alert>
              )}
              {selectedRequest.notes && (
                <div>
                  <Text fw={600} mb="xs">{t('detailModal.notes')}:</Text>
                  <Text size="sm">{selectedRequest.notes}</Text>
                </div>
              )}

              <div>
                <Text fw={600} mb="xs">{t('detailModal.itemsTitle')}:</Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('detailModal.table.item')}</Table.Th>
                      <Table.Th>{t('detailModal.table.quantity')}</Table.Th>
                      <Table.Th>{t('detailModal.table.unitCost')}</Table.Th>
                      <Table.Th>{t('detailModal.table.totalCost')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                      <Table.Td>{Number(item.unitCost || 0).toFixed(2)}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>
                          {Number(item.totalCost || 0).toFixed(2)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </Stack>
        )}
      </Modal>

      {/* Approve/Reject Modal */}
      <Modal
        opened={approveModalOpened}
        onClose={() => {
          setApproveModalOpened(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title={t('reviewModal.title')}
        size="md"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="blue">{t('reviewModal.info')}</Alert>

            <div>
              <Text fw={600} mb="xs">{t('reviewModal.itemsTitle')}:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('reviewModal.table.item')}</Table.Th>
                    <Table.Th>{t('reviewModal.table.quantity')}</Table.Th>
                    <Table.Th>{t('reviewModal.table.unitCost')}</Table.Th>
                    <Table.Th>{t('reviewModal.table.total')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                      <Table.Td>{Number(item.unitCost || 0).toFixed(2)}</Table.Td>
                      <Table.Td>{Number(item.totalCost || 0).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <Text fw={700} size="lg" ta="right">
              {t('reviewModal.totalLabel')}: {Number(selectedRequest.totalCost || 0).toFixed(2)}
            </Text>

            <Textarea
              label={t('reviewModal.rejectionReasonLabel')}
              placeholder={t('reviewModal.rejectionReasonPlaceholder')}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              minRows={3}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  setApproveModalOpened(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                color="red"
                variant="light"
                leftSection={<IconX size={16} />}
                onClick={() => handleApprove(false)}
                loading={approveMutation.isPending}
              >
                {t('actions.reject')}
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={() => handleApprove(true)}
                loading={approveMutation.isPending}
              >
                {t('actions.approve')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Receive Modal */}
      <Modal
        opened={receiveModalOpened}
        onClose={() => {
          setReceiveModalOpened(false);
          setSelectedRequest(null);
          setReceiveNotes('');
          setGrnCode('');
        }}
        title={t('receiveModal.title')}
        size="md"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="green">{t('receiveModal.info')}</Alert>

            <div>
              <Text fw={600} mb="xs">{t('receiveModal.itemsTitle')}:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('receiveModal.table.item')}</Table.Th>
                    <Table.Th>{t('receiveModal.table.quantity')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <Textarea
              label={t('receiveModal.notesLabel')}
              placeholder={t('receiveModal.notesPlaceholder')}
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
              minRows={3}
            />

            <TextInput
              label={t('receiveModal.grnLabel')}
              placeholder={t('receiveModal.grnPlaceholder')}
              value={grnCode}
              onChange={(e) => setGrnCode(e.target.value)}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  setReceiveModalOpened(false);
                  setSelectedRequest(null);
                  setReceiveNotes('');
                  setGrnCode('');
                }}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={handleDeliver}
                loading={deliverMutation.isPending}
              >
                {t('actions.receive')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Deliver Modal */}
      <Modal
        opened={deliverModalOpened}
        onClose={() => {
          setDeliverModalOpened(false);
          setSelectedRequest(null);
          setReceivingCode('');
        }}
        title={t('deliverModal.title')}
        size="md"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="blue">{t('deliverModal.info')}</Alert>

            <div>
              <Text fw={600} mb="xs">{t('deliverModal.itemsTitle')}:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('deliverModal.table.item')}</Table.Th>
                    <Table.Th>{t('deliverModal.table.quantity')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <TextInput
              label={t('deliverModal.receivingCodeLabel')}
              placeholder={t('deliverModal.receivingCodePlaceholder')}
              value={receivingCode}
              onChange={(e) => setReceivingCode(e.target.value)}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  setDeliverModalOpened(false);
                  setSelectedRequest(null);
                  setReceivingCode('');
                }}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={() => handleFinalDeliver()}
                loading={finalDeliverMutation.isPending}
              >
                {t('actions.deliverToMaintenance')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}



