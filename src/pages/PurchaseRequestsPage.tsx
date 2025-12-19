import { useState } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck, IconX, IconPackage } from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'RECEIVED', label: 'Received' },
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

  const { data: requests, isLoading } = useQuery({
    queryKey: ['purchase-requests', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await axios.get(
        `http://localhost:3011/api/v1/purchase-requests${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
  });

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

  const markOrderedMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/order`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Purchase request marked as ordered',
        color: 'green',
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

  const receiveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/purchase-requests/${id}/receive`,
        {
          notes,
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
        message: 'Purchase request received and items added to inventory',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setReceiveModalOpened(false);
      setSelectedRequest(null);
      setReceiveNotes('');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to receive purchase',
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

  const handleReceive = () => {
    if (!selectedRequest) return;
    receiveMutation.mutate({
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
      case 'ORDERED':
        return 'cyan';
      case 'RECEIVED':
        return 'green';
      default:
        return 'gray';
    }
  };

  const canApprove = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'PENDING';
  };

  const canOrder = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'APPROVED';
  };

  const canReceive = (request: any) => {
    return (
      user?.role === 'ADMIN' &&
      (request.status === 'APPROVED' || request.status === 'ORDERED')
    );
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
                <Table.Th>Material Request</Table.Th>
                <Table.Th>Requested By</Table.Th>
                <Table.Th>Items Count</Table.Th>
                <Table.Th>Total Cost</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Request Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Center>
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : !requests || requests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
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
                        {request.requestedBy?.fullName || 'Unknown'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{request.items?.length || 0} items</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        ${request.totalCost?.toFixed(2) || '0.00'}
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
                        {canOrder(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="cyan"
                            leftSection={<IconPackage size={14} />}
                            onClick={() => markOrderedMutation.mutate(request.id)}
                            loading={markOrderedMutation.isPending}
                          >
                            Mark Ordered
                          </Button>
                        )}
                        {canReceive(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => handleReceiveClick(request)}
                          >
                            Receive
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
                ${selectedRequest.totalCost?.toFixed(2) || '0.00'}
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
                      <Table.Td>${item.unitCost?.toFixed(2) || '0.00'}</Table.Td>
                      <Table.Td>
                        <Text fw={500}>
                          ${item.totalCost?.toFixed(2) || '0.00'}
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
                      <Table.Td>${item.unitCost?.toFixed(2)}</Table.Td>
                      <Table.Td>${item.totalCost?.toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <Text fw={700} size="lg" ta="right">
              Total: ${selectedRequest.totalCost?.toFixed(2) || '0.00'}
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
        title="Receive Purchase"
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
              label="Notes (optional)"
              placeholder="Enter any notes about the receipt..."
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
                onClick={handleReceive}
                loading={receiveMutation.isPending}
              >
                Mark as Received
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}


