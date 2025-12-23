import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Grid,
  Alert,
  Modal,
  Textarea,
  Table,
  ThemeIcon,
  Loader,
  Center,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconPackage,
  IconCalendar,
  IconUser,
  IconMapPin,
  IconTools,
} from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';


function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'yellow';
    case 'AWAITING_DELIVERY':
      return 'blue';
    case 'DELIVERED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'FULFILLED':
      return 'teal';
    default:
      return 'gray';
  }
}

export default function MaterialRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [approveModalOpened, setApproveModalOpened] = useState(false);
  const [rejectModalOpened, setRejectModalOpened] = useState(false);
  const [receiveModalOpened, setReceiveModalOpened] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  const { data: materialRequest, isLoading } = useQuery({
    queryKey: ['material-request', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/material-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { approve: boolean; notes?: string }) => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:3011/api/v1/material-requests/${id}/approve`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-request', id] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      notifications.show({
        title: 'Success',
        message: 'Material request approved successfully',
        color: 'green',
      });
      setApproveModalOpened(false);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to approve material request',
        color: 'red',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { approve: boolean; rejectionReason: string }) => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:3011/api/v1/material-requests/${id}/approve`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-request', id] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      notifications.show({
        title: 'Success',
        message: 'Material request rejected',
        color: 'red',
      });
      setRejectModalOpened(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to reject material request',
        color: 'red',
      });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (data: { receiveNotes?: string }) => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:3011/api/v1/material-requests/${id}/receive`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-request', id] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
      notifications.show({
        title: 'Success',
        message: 'Material received successfully',
        color: 'green',
      });
      setReceiveModalOpened(false);
      setReceiveNotes('');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to receive material',
        color: 'red',
      });
    },
  });

  if (isLoading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Loader size="xl" />
        </Center>
      </Container>
    );
  }

  if (!materialRequest) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Alert color="red" title="Not Found">
            Material request not found
          </Alert>
        </Center>
      </Container>
    );
  }

  const canApprove = user?.role === 'ADMIN' && materialRequest.status === 'PENDING';
  const canReject = user?.role === 'ADMIN' && materialRequest.status === 'PENDING';
  const canReceive = materialRequest.status === 'AWAITING_DELIVERY';

  return (
    <Container size="xl" pt={{ base: 'xl', sm: 'xl' }} pb={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group mb="md">
        <ActionIcon variant="light" onClick={() => navigate('/material-requests')}>
          <IconArrowLeft size={16} />
        </ActionIcon>
        <Title order={1}>Material Request Details</Title>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Basic Information */}
            <Paper p="md" withBorder>
              <Title order={3} mb="md">Request Information</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="blue">
                      <IconTools size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Request ID</Text>
                      <Text size="sm" fw={500}>{materialRequest.id}</Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="green">
                      <IconMapPin size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Pole Code</Text>
                      <Text size="sm" fw={500}>
                        {materialRequest.maintenanceSchedule?.poleCode || 'N/A'}
                      </Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="orange">
                      <IconUser size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Requested By</Text>
                      <Text size="sm" fw={500}>
                        {materialRequest.requestedBy?.fullName || 'Unknown'}
                      </Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="purple">
                      <IconPackage size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Items Count</Text>
                      <Text size="sm" fw={500}>{materialRequest.items?.length || 0} items</Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="cyan">
                      <IconCalendar size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Request Date</Text>
                      <Text size="sm" fw={500}>
                        {new Date(materialRequest.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <div>
                    <Text size="sm" c="dimmed">Status</Text>
                    <Badge color={getStatusColor(materialRequest.status)} mt={4}>
                      {materialRequest.status}
                    </Badge>
                  </div>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Requested Items */}
            <Paper p="md" withBorder>
              <Title order={3} mb="md">Requested Items</Title>
              {materialRequest.items && materialRequest.items.length > 0 ? (
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Unit</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {materialRequest.items.map((item: any, index: number) => (
                      <Table.Tr key={index}>
                        <Table.Td>{item.inventoryItem?.name || item.inventoryItemCode || 'Unknown Item'}</Table.Td>
                        <Table.Td>{item.requestedQuantity}</Table.Td>
                        <Table.Td>{item.inventoryItem?.unit || 'N/A'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text c="dimmed" ta="center">No items requested</Text>
              )}
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Actions */}
            <Paper p="md" withBorder>
              <Title order={3} mb="md">Actions</Title>
              <Stack gap="sm">
                {canApprove && (
                  <Button
                    fullWidth
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => setApproveModalOpened(true)}
                  >
                    Approve Request
                  </Button>
                )}
                {canReject && (
                  <Button
                    fullWidth
                    color="red"
                    variant="outline"
                    leftSection={<IconX size={16} />}
                    onClick={() => setRejectModalOpened(true)}
                  >
                    Reject Request
                  </Button>
                )}
                {canReceive && (
                  <Button
                    fullWidth
                    color="blue"
                    leftSection={<IconPackage size={16} />}
                    onClick={() => setReceiveModalOpened(true)}
                  >
                    Receive Material
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Status History */}
            <Paper p="md" withBorder>
              <Title order={3} mb="md">Status History</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Created</Text>
                  <Text size="sm" c="dimmed">
                    {new Date(materialRequest.createdAt).toLocaleString()}
                  </Text>
                </Group>
                {materialRequest.approvedAt && (
                  <Group justify="space-between">
                    <Text size="sm">
                      {materialRequest.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {new Date(materialRequest.approvedAt).toLocaleString()}
                    </Text>
                  </Group>
                )}
                {materialRequest.deliveredAt && (
                  <Group justify="space-between">
                    <Text size="sm">Delivered</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(materialRequest.deliveredAt).toLocaleString()}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>

            {/* Approval/Rejection Info */}
            {(materialRequest.approvedBy || materialRequest.rejectionReason) && (
              <Paper p="md" withBorder>
                <Title order={3} mb="md">
                  {materialRequest.status === 'REJECTED' ? 'Rejection Details' : 'Approval Details'}
                </Title>
                <Stack gap="xs">
                  {materialRequest.approvedBy && (
                    <Group justify="space-between">
                      <Text size="sm">
                        {materialRequest.status === 'REJECTED' ? 'Rejected by' : 'Approved by'}
                      </Text>
                      <Text size="sm" fw={500}>
                        {materialRequest.approvedBy?.fullName || 'Unknown'}
                      </Text>
                    </Group>
                  )}
                  {materialRequest.rejectionReason && (
                    <div>
                      <Text size="sm" mb="xs">Rejection Reason:</Text>
                      <Text size="sm" c="dimmed">{materialRequest.rejectionReason}</Text>
                    </div>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Approve Modal */}
      <Modal
        opened={approveModalOpened}
        onClose={() => setApproveModalOpened(false)}
        title="Approve Material Request"
        centered
      >
        <Stack>
          <Text>Are you sure you want to approve this material request?</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setApproveModalOpened(false)}>
              Cancel
            </Button>
            <Button
              color="green"
              onClick={() => approveMutation.mutate({ approve: true })}
              loading={approveMutation.isPending}
            >
              Approve
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reject Modal */}
      <Modal
        opened={rejectModalOpened}
        onClose={() => setRejectModalOpened(false)}
        title="Reject Material Request"
        centered
      >
        <Stack>
          <Textarea
            label="Rejection Reason"
            placeholder="Please provide a reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.currentTarget.value)}
            required
            minRows={3}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setRejectModalOpened(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => rejectMutation.mutate({ approve: false, rejectionReason })}
              loading={rejectMutation.isPending}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Receive Modal */}
      <Modal
        opened={receiveModalOpened}
        onClose={() => setReceiveModalOpened(false)}
        title="Receive Material"
        centered
      >
        <Stack>
          <Text>Confirm that you have received the requested materials.</Text>
          <Textarea
            label="Receive Notes (Optional)"
            placeholder="Add any notes about the received materials..."
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.currentTarget.value)}
            minRows={2}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setReceiveModalOpened(false)}>
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={() => receiveMutation.mutate({ receiveNotes })}
              loading={receiveMutation.isPending}
            >
              Confirm Receipt
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
