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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck, IconX, IconEdit, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FULFILLED', label: 'Fulfilled' },
];

export default function MaterialRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [approveModalOpened, setApproveModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['material-requests', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await axios.get(
        `http://localhost:3011/api/v1/material-requests${params}`,
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
        `http://localhost:3011/api/v1/material-requests/${id}/approve`,
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
          ? 'Material request approved successfully'
          : 'Material request rejected',
        color: variables.approve ? 'green' : 'orange',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `http://localhost:3011/api/v1/material-requests/${id}`,
        data,
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
        message: 'Material request updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setEditModalOpened(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update material request',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:3011/api/v1/material-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Material request deleted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setDeleteModalOpened(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete material request',
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

  const handleEditClick = (request: any) => {
    setSelectedRequest(request);
    setEditModalOpened(true);
  };

  const handleDeleteClick = (request: any) => {
    setSelectedRequest(request);
    setDeleteModalOpened(true);
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

  const handleEdit = (data: any) => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      data,
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedRequest) return;
    deleteMutation.mutate(selectedRequest.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'APPROVED':
        return 'blue';
      case 'REJECTED':
        return 'red';
      case 'FULFILLED':
        return 'green';
      default:
        return 'gray';
    }
  };

  const canApprove = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'PENDING';
  };

  const canEdit = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'PENDING';
  };

  const canDelete = (request: any) => {
    return user?.role === 'ADMIN' && request.status === 'PENDING';
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Material Requests</Title>
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
                <Table.Th>Maintenance Schedule</Table.Th>
                <Table.Th>Requested By</Table.Th>
                <Table.Th>Items Count</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Request Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center>
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : !requests || requests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center">No material requests found</Text>
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
                        Schedule #{request.maintenanceScheduleId}
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
                        {canEdit(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleEditClick(request)}
                          >
                            Edit
                          </Button>
                        )}
                        {canDelete(request) && (
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDeleteClick(request)}
                          >
                            Delete
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
        title="Material Request Details"
        size="lg"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Group justify="space-between">
              <Text fw={600}>Request ID:</Text>
              <Text size="sm">{selectedRequest.id}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Maintenance Schedule:</Text>
              <Text size="sm">#{selectedRequest.maintenanceScheduleId}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Requested By:</Text>
              <Text size="sm">
                {selectedRequest.requestedBy?.fullName || 'Unknown'}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Status:</Text>
              <Badge color={getStatusColor(selectedRequest.status)}>
                {selectedRequest.status}
              </Badge>
            </Group>
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
              <Text fw={600} mb="xs">Requested Items:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Available</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                      <Table.Td>
                        {item.availableQuantity} available
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={item.requestType === 'USAGE' ? 'green' : 'orange'}
                        >
                          {item.requestType}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            item.status === 'FULFILLED'
                              ? 'green'
                              : item.status === 'APPROVED'
                              ? 'blue'
                              : item.status === 'REJECTED'
                              ? 'red'
                              : 'yellow'
                          }
                        >
                          {item.status}
                        </Badge>
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
        title="Review Material Request"
        size="md"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="blue">
              Review the material request and approve or reject it. If approved,
              available items will be deducted from stock and purchase requests
              will be created for unavailable items.
            </Alert>

            <div>
              <Text fw={600} mb="xs">Requested Items:</Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Available</Table.Th>
                    <Table.Th>Type</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedRequest.items?.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item.inventoryItem?.name || item.inventoryItemCode}
                      </Table.Td>
                      <Table.Td>{item.requestedQuantity}</Table.Td>
                      <Table.Td>
                        {item.availableQuantity} available
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={item.requestType === 'USAGE' ? 'green' : 'orange'}
                        >
                          {item.requestType}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

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

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedRequest(null);
        }}
        title="Edit Material Request"
        size="lg"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="orange">
              You can only edit PENDING material requests. Approved requests cannot be modified.
            </Alert>

            <TextInput
              label="Description"
              placeholder="Maintenance description"
              defaultValue={selectedRequest.description || ''}
              // TODO: Implement edit form
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpened(false);
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="green"
                leftSection={<IconEdit size={16} />}
                onClick={() => {
                  // TODO: Implement edit functionality
                  notifications.show({
                    title: 'Info',
                    message: 'Edit functionality will be implemented soon',
                    color: 'blue',
                  });
                }}
              >
                Update
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedRequest(null);
        }}
        title="Delete Material Request"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this material request? This action cannot be undone.
          </Text>
          {selectedRequest && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Request ID:</Text>
              <Text size="sm">{selectedRequest.id.substring(0, 8)}...</Text>
              <Text size="sm" fw={700} mt="xs">Description:</Text>
              <Text size="sm">{selectedRequest.description || 'No description'}</Text>
              <Text size="sm" fw={700} mt="xs">Status:</Text>
              <Badge color={getStatusColor(selectedRequest.status)}>
                {selectedRequest.status}
              </Badge>
            </Paper>
          )}
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
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


