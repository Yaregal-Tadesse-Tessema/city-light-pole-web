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

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WAITING_FOR_PURCHASE', label: 'Waiting for Purchase' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function PurchaseRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [approveModalOpened, setApproveModalOpened] = useState(false);
  const [receiveModalOpened, setReceiveModalOpened] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

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
        title: 'Success',
        message: variables.approve
          ? 'Purchase request approved successfully'
          : 'Purchase request rejected',
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
        title: 'Error',
        message: error.response?.data?.message || 'Failed to process request',
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
        title: 'Success',
        message: 'Purchase request marked as ordered',
        color: 'cyan',
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to mark as ordered',
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
        title: 'Success',
        message: 'Purchase request marked as arrived in stock',
        color: 'orange',
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to mark as arrived in stock',
        color: 'red',
      });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/deliver`,
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
    onSuccess: async () => {
      notifications.show({
        title: 'Success',
        message: 'Purchase request delivered',
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
        title: 'Error',
        message: error.response?.data?.message || 'Failed to deliver purchase',
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
  };

  const handleApprove = (approve: boolean) => {
    if (!selectedRequest) return;
    if (!approve && !rejectionReason.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a rejection reason',
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

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Purchase Requests</Title>
        <Select
          placeholder="Filter by status"
          data={STATUSES}
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
                <Table.Th>Request ID</Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('materialRequest')}>Material Request</Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder="Filter by Material Request..."
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
                <Table.Th>Maintenance Code</Table.Th>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('requestedBy')}>Requested By</Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder="Filter by Requested By..."
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('itemsCount')}>Items Count</Text>
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('totalCost')}>Total Cost</Text>
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status</Text>
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
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Request Date</Text>
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
                  <Table.Td colSpan={9}>
                    <Center>
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : !requests || requests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text c="dimmed" ta="center">No purchase requests found</Text>
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
                          ? `MR-${request.materialRequestId.substring(0, 8)}...`
                          : 'Direct Purchase'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {request.maintenanceSchedule?.maintenanceCode || 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {request.requestedBy?.fullName || 'Unknown'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{request.items?.length || 0} items</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        ${Number(request.totalCost || 0).toFixed(2)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(request.status)}>
                        {request.status}
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
                          View
                        </Button>
                        {canApprove(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => handleApproveClick(request)}
                          >
                            Review
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
                            Mark as Ordered
                          </Button>
                        )}
                        {canInStock(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            leftSection={<IconBox size={14} />}
                            onClick={() => inStockMutation.mutate(request.id)}
                            loading={inStockMutation.isPending}
                          >
                            Mark as Arrived
                          </Button>
                        )}
                        {canDeliver(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => handleReceiveClick(request)}
                          >
                            Deliver
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
        title="Purchase Request Details"
        size="lg"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Group justify="space-between">
              <Text fw={600}>Request ID:</Text>
              <Text size="sm">{selectedRequest.id}</Text>
            </Group>
            {selectedRequest.materialRequestId && (
              <Group justify="space-between">
                <Text fw={600}>Material Request:</Text>
                <Text size="sm">
                  {selectedRequest.materialRequestId.substring(0, 8)}...
                </Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text fw={600}>Requested By:</Text>
              <Text size="sm">
                {selectedRequest.requestedBy?.fullName || 'Unknown'}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Total Cost:</Text>
              <Text fw={700} size="lg">
                ${Number(selectedRequest.totalCost || 0).toFixed(2)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Status:</Text>
              <Badge color={getStatusColor(selectedRequest.status)}>
                {selectedRequest.status}
              </Badge>
            </Group>
            {selectedRequest.supplierName && (
              <Group justify="space-between">
                <Text fw={600}>Supplier:</Text>
                <Text size="sm">{selectedRequest.supplierName}</Text>
              </Group>
            )}
            {selectedRequest.supplierContact && (
              <Group justify="space-between">
                <Text fw={600}>Supplier Contact:</Text>
                <Text size="sm">{selectedRequest.supplierContact}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text fw={600}>Request Date:</Text>
              <Text size="sm">
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </Text>
            </Group>
            {selectedRequest.approvedBy && (
              <Group justify="space-between">
                <Text fw={600}>Approved By:</Text>
                <Text size="sm">
                  {selectedRequest.approvedBy?.fullName || 'Unknown'}
                </Text>
              </Group>
            )}
            {selectedRequest.approvedAt && (
              <Group justify="space-between">
                <Text fw={600}>Approved At:</Text>
                <Text size="sm">
                  {new Date(selectedRequest.approvedAt).toLocaleString()}
                </Text>
              </Group>
            )}
            {selectedRequest.orderedAt && (
              <Group justify="space-between">
                <Text fw={600}>Ordered At:</Text>
                <Text size="sm">
                  {new Date(selectedRequest.orderedAt).toLocaleString()}
                </Text>
              </Group>
            )}
            {selectedRequest.receivedAt && (
              <Group justify="space-between">
                <Text fw={600}>Received At:</Text>
                <Text size="sm">
                  {new Date(selectedRequest.receivedAt).toLocaleString()}
                </Text>
              </Group>
            )}
            {selectedRequest.rejectionReason && (
              <Alert color="red" title="Rejection Reason">
                {selectedRequest.rejectionReason}
              </Alert>
            )}
            {selectedRequest.notes && (
              <div>
                <Text fw={600} mb="xs">Notes:</Text>
                <Text size="sm">{selectedRequest.notes}</Text>
              </div>
            )}

            <div>
              <Text fw={600} mb="xs">Items to Purchase:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Unit Cost</Table.Th>
                    <Table.Th>Total Cost</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                      <Table.Td>${Number(item.unitCost || 0).toFixed(2)}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>
                          ${Number(item.totalCost || 0).toFixed(2)}
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
        title="Review Purchase Request"
        size="md"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="blue">
              Review the purchase request and approve or reject it. If approved,
              you can mark it as ordered when the order is placed with the supplier.
            </Alert>

            <div>
              <Text fw={600} mb="xs">Items to Purchase:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Unit Cost</Table.Th>
                    <Table.Th>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                      <Table.Td>${Number(item.unitCost || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${Number(item.totalCost || 0).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <Text fw={700} size="lg" ta="right">
              Total: ${Number(selectedRequest.totalCost || 0).toFixed(2)}
            </Text>

            <Textarea
              label="Rejection Reason (if rejecting)"
              placeholder="Enter reason for rejection..."
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
                Cancel
              </Button>
              <Button
                color="red"
                variant="light"
                leftSection={<IconX size={16} />}
                onClick={() => handleApprove(false)}
                loading={approveMutation.isPending}
              >
                Reject
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={() => handleApprove(true)}
                loading={approveMutation.isPending}
              >
                Approve
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
        }}
        title="Deliver Purchase"
        size="md"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="green">
              Mark this purchase as received. Items will be added to inventory
              automatically.
            </Alert>

            <div>
              <Text fw={600} mb="xs">Items to be added to inventory:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
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
              label="Delivery Notes (optional)"
              placeholder="Enter any notes about the delivery..."
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
              minRows={3}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  setReceiveModalOpened(false);
                  setSelectedRequest(null);
                  setReceiveNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={handleDeliver}
                loading={deliverMutation.isPending}
              >
                Mark as Delivered
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}


