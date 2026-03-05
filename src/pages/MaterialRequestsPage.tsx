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
  Popover,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck, IconX, IconTrash, IconPackage, IconEdit, IconFilter, IconArrowsUpDown, IconSortAscending, IconSortDescending, IconPlus } from '@tabler/icons-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const STATUS_VALUES = ['PENDING', 'AWAITING_DELIVERY', 'DELIVERED', 'REJECTED', 'FULFILLED'] as const;

export default function MaterialRequestsPage() {
  const { t } = useTranslation('materialRequests');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [approveModalOpened, setApproveModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveModalOpened, setReceiveModalOpened] = useState(false);
  const getRequestCode = (request: any) => request.code ?? t('labels.notAvailable');
  const statusOptions = STATUS_VALUES.map((value) => ({
    value,
    label: t(`status.${value.toLowerCase()}`),
  }));
  const statusLabels: Record<string, string> = {
    PENDING: t('status.pending'),
    AWAITING_DELIVERY: t('status.awaitingDelivery'),
    DELIVERED: t('status.delivered'),
    REJECTED: t('status.rejected'),
    FULFILLED: t('status.fulfilled'),
    APPROVED: t('status.approved'),
  };
  const formatStatus = (status: string) => statusLabels[status] || status;

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filtering state
  const [codeFilter, setCodeFilter] = useState('');
  const [requestedByFilter, setRequestedByFilter] = useState('');
  const [itemsCountFilter, setItemsCountFilter] = useState('');

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
    queryKey: ['material-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/material-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Apply client-side sorting and filtering
  const filteredAndSortedRequests = useMemo(() => {
    if (!allRequests) return [];

    let filtered = allRequests.filter((request: any) => {
      // Status filter
      if (statusFilter && request.status !== statusFilter) return false;

      // Code filter (search by code)
      if (codeFilter && request.code) {
        const searchLower = codeFilter.toLowerCase();
        if (!request.code.toLowerCase().includes(searchLower)) return false;
      }

      // Requested By filter
      if (requestedByFilter && !request.requestedBy?.fullName.toLowerCase().includes(requestedByFilter.toLowerCase())) return false;

      // Items Count filter
      if (itemsCountFilter && !request.items?.length.toString().includes(itemsCountFilter)) return false;

      return true;
    });

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'code':
          aValue = getRequestCode(a);
          bValue = getRequestCode(b);
          break;
        case 'id':
          aValue = a.id || '';
          bValue = b.id || '';
          break;
        case 'requestedBy':
          aValue = a.requestedBy?.fullName || '';
          bValue = b.requestedBy?.fullName || '';
          break;
        case 'itemsCount':
          aValue = a.items?.length || 0;
          bValue = b.items?.length || 0;
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
  }, [allRequests, statusFilter, codeFilter, requestedByFilter, itemsCountFilter, sortBy, sortOrder]);

  // For backward compatibility, keep requests as filteredAndSortedRequests
  const requests = filteredAndSortedRequests;

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
        title: t('notifications.successTitle'),
        message: variables.approve
          ? t('notifications.approveSuccess')
          : t('notifications.rejectSuccess'),
        color: variables.approve ? 'green' : 'orange',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
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
        title: t('notifications.successTitle'),
        message: t('notifications.updateSuccess'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setEditModalOpened(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.updateError'),
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
        title: t('notifications.successTitle'),
        message: t('notifications.deleteSuccess'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setDeleteModalOpened(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.deleteError'),
        color: 'red',
      });
    },
  });

  // Receive material request mutation
  const receiveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `http://localhost:3011/api/v1/material-requests/${id}/receive`,
        { notes },
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
        message: t('notifications.receivedSuccess'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'schedules'] });
      setReceiveModalOpened(false);
      setSelectedRequest(null);
      setReceiveNotes('');
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.receivedError'),
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

  const handleReceiveClick = (request: any) => {
    setSelectedRequest(request);
    setReceiveModalOpened(true);
    setReceiveNotes('');
  };

  const handleReceive = () => {
    if (!selectedRequest) return;
    receiveMutation.mutate({
      id: selectedRequest.id,
      notes: receiveNotes.trim() || undefined,
    });
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
        <Title order={1}>{t('title')}</Title>
        <Group gap="md">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/maintenance')}
          >
            {t('actions.addRequest')}
          </Button>
          <Select
            placeholder={t('filters.statusPlaceholder')}
            data={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 200 }}
          />
          {(codeFilter || requestedByFilter || itemsCountFilter) && (
            <Button
              variant="light"
              color="red"
              size="sm"
              onClick={() => {
                setCodeFilter('');
                setRequestedByFilter('');
                setItemsCountFilter('');
              }}
            >
              {t('actions.clearFilters')}
            </Button>
          )}
        </Group>
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} style={{ cursor: 'pointer' }} onClick={() => handleSort('code')}>
                      {t('table.code')}
                    </Text>
                    <Popover position="bottom" withArrow shadow="md">
                      <Popover.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconFilter size={14} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <TextInput
                          placeholder={t('filters.codePlaceholder')}
                          value={codeFilter}
                          onChange={(event) => setCodeFilter(event.currentTarget.value)}
                          size="sm"
                        />
                      </Popover.Dropdown>
                    </Popover>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleSort('code')}
                    >
                      {getSortIcon('code')}
                    </ActionIcon>
                  </Group>
                </Table.Th>
                <Table.Th>{t('table.poleCode')}</Table.Th>
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
                          placeholder={t('filters.itemsCountPlaceholder')}
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
                <Table.Th>{t('table.status')}</Table.Th>
                <Table.Th>{t('table.requestDate')}</Table.Th>
                <Table.Th>{t('table.actions')}</Table.Th>
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
                    <Text c="dimmed" ta="center">{t('emptyState')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                requests.map((request: any) => (
                  <Table.Tr key={request.id}>
                    <Table.Td>
                      <Text
                        fw={500}
                        size="sm"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        c="blue"
                        onClick={() => navigate(`/material-requests/${request.id}`)}
                      >
                        {getRequestCode(request)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {request.maintenanceSchedule?.poleCode || t('labels.notAvailable')}
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
                      <Text size="sm">{t('labels.itemsCount', { count: request.items?.length || 0 })}</Text>
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
                        {request.status === 'AWAITING_DELIVERY' && (
                          <Button
                            size="xs"
                            variant="light"
                            color="purple"
                            leftSection={<IconPackage size={14} />}
                            onClick={() => handleReceiveClick(request)}
                          >
                            {t('actions.receive')}
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
                            {t('actions.edit')}
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
                            {t('actions.delete')}
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
              <Text fw={600}>{t('detailModal.code')}:</Text>
              <Text size="sm">{getRequestCode(selectedRequest)}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.maintenanceSchedule')}:</Text>
              <Text size="sm">#{selectedRequest.maintenanceScheduleId}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.requestedBy')}:</Text>
              <Text size="sm">
                {selectedRequest.requestedBy?.fullName || t('labels.unknown')}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>{t('detailModal.status')}:</Text>
              <Badge color={getStatusColor(selectedRequest.status)}>
                {formatStatus(selectedRequest.status)}
              </Badge>
            </Group>
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
                    <Table.Th>{t('detailModal.table.available')}</Table.Th>
                    <Table.Th>{t('detailModal.table.type')}</Table.Th>
                    <Table.Th>{t('detailModal.table.status')}</Table.Th>
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
                        {t('detailModal.availableCount', { count: item.availableQuantity })}
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
                          {formatStatus(item.status)}
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
                    <Table.Th>{t('reviewModal.table.available')}</Table.Th>
                    <Table.Th>{t('reviewModal.table.type')}</Table.Th>
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
                        {t('reviewModal.availableCount', { count: item.availableQuantity })}
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

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedRequest(null);
        }}
        title={t('editModal.title')}
        size="lg"
        centered
      >
        {selectedRequest && (
          <Stack>
            <Alert color="orange">{t('editModal.info')}</Alert>

            <TextInput
              label={t('editModal.descriptionLabel')}
              placeholder={t('editModal.descriptionPlaceholder')}
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
                {tCommon('actions.cancel')}
              </Button>
              <Button
                color="green"
                leftSection={<IconEdit size={16} />}
                onClick={() => {
                  // TODO: Implement edit functionality
                  notifications.show({
                    title: t('notifications.infoTitle'),
                    message: t('notifications.editNotImplemented'),
                    color: 'blue',
                  });
                }}
              >
                {t('actions.update')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Receive Material Modal */}
      <Modal
        opened={receiveModalOpened}
        onClose={() => {
          setReceiveModalOpened(false);
          setSelectedRequest(null);
          setReceiveNotes('');
        }}
        title={t('receiveModal.title')}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t('receiveModal.info')}
          </Text>
          {selectedRequest && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={600}>{t('receiveModal.code')}:</Text>
              <Text size="sm">{getRequestCode(selectedRequest)}</Text>
              <Text size="sm" fw={600} mt="xs">{t('receiveModal.poleCode')}:</Text>
              <Text size="sm">{selectedRequest.maintenanceSchedule?.poleCode || t('labels.notAvailable')}</Text>
              <Text size="sm" fw={600} mt="xs">{t('receiveModal.items')}:</Text>
              <Text size="sm">{t('labels.itemsCount', { count: selectedRequest.items?.length || 0 })}</Text>
            </Paper>
          )}
          <Textarea
            label={t('receiveModal.notesLabel')}
            placeholder={t('receiveModal.notesPlaceholder')}
            value={receiveNotes}
            onChange={(event) => setReceiveNotes(event.currentTarget.value)}
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
              {tCommon('actions.cancel')}
            </Button>
            <Button
              color="purple"
              onClick={handleReceive}
              loading={receiveMutation.isPending}
            >
              {t('actions.markReceived')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedRequest(null);
        }}
        title={t('deleteModal.title')}
        centered
      >
        <Stack>
          <Text>
            {t('deleteModal.confirmation')}
          </Text>
          {selectedRequest && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>{t('deleteModal.code')}:</Text>
              <Text size="sm">{getRequestCode(selectedRequest)}</Text>
              <Text size="sm" fw={700} mt="xs">{t('deleteModal.description')}:</Text>
              <Text size="sm">{selectedRequest.description || t('labels.noDescription')}</Text>
              <Text size="sm" fw={700} mt="xs">{t('deleteModal.status')}:</Text>
              <Badge color={getStatusColor(selectedRequest.status)}>
                {formatStatus(selectedRequest.status)}
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
              {tCommon('actions.cancel')}
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              {t('actions.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

