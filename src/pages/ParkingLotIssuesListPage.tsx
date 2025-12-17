import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Table,
  Button,
  Group,
  Badge,
  Title,
  Modal,
  Textarea,
  Select,
  Stack,
  ActionIcon,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import axios from 'axios';

const ISSUE_STATUSES = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function ParkingLotIssuesListPage() {
  const { user } = useAuth();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['parking-lot-issues'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/parking-lot-issues', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch parking lot issues:', error.response?.status || error.message);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: parkingLotsData } = useQuery({
    queryKey: ['parking-lots', 'dropdown'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/parking-lots?page=1&limit=100', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch parking lots for dropdown:', error.response?.status || error.message);
        return { items: [] };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const parkingLotsWithUnclosedIssues = new Set(
    (issues || [])
      .filter((issue: any) => issue?.status === 'REPORTED' || issue?.status === 'IN_PROGRESS')
      .map((issue: any) => issue?.parkingLot?.code || issue?.parkingLotCode)
      .filter(Boolean)
  );

  const parkingLotOptions = (parkingLotsData?.items || [])
    .filter((lot: any) => !parkingLotsWithUnclosedIssues.has(lot?.code))
    .map((lot: any) => ({
      value: lot.code,
      label: `${lot.code} - ${lot.street}, ${lot.district}`,
    }));

  const createForm = useForm({
    initialValues: {
      parkingLotCode: '',
      description: '',
      severity: 'MEDIUM',
    },
  });

  const updateForm = useForm({
    initialValues: {
      parkingLotCode: '',
      description: '',
      severity: 'MEDIUM',
      status: '',
      resolutionNotes: '',
    },
  });

  const handleCreateSubmit = async (values: any) => {
    try {
      if (!values.parkingLotCode) {
        notifications.show({ title: 'Error', message: 'Please select a parking lot', color: 'red' });
        return;
      }
      if (!values.description?.trim()) {
        notifications.show({ title: 'Error', message: 'Please enter a description', color: 'red' });
        return;
      }
      const token = localStorage.getItem('access_token');
      const payload = {
        parkingLotCode: values.parkingLotCode,
        description: values.description.trim(),
        severity: values.severity || 'MEDIUM',
      };
      await axios.post('http://localhost:3011/api/v1/parking-lot-issues', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Parking lot issue created successfully',
        color: 'green',
      });
      setCreateModalOpened(false);
      createForm.reset();
      refetch();
    } catch (error: any) {
      const msg =
        typeof error.response?.data?.message === 'string'
          ? error.response?.data?.message
          : Array.isArray(error.response?.data?.message)
            ? error.response?.data?.message.join(', ')
            : undefined;
      notifications.show({
        title: 'Error',
        message: msg || `Failed to create parking lot issue${error.response?.status ? ` (HTTP ${error.response.status})` : ''}`,
        color: 'red',
      });
    }
  };

  const handleUpdateClick = (issue: any) => {
    setSelectedIssue(issue);
    updateForm.setValues({
      parkingLotCode: issue.parkingLot?.code || issue.parkingLotCode || '',
      description: issue.description || '',
      severity: issue.severity || 'MEDIUM',
      status: issue.status,
      resolutionNotes: issue.resolutionNotes || '',
    });
    setUpdateModalOpened(true);
  };

  const handleUpdateSubmit = async (values: any) => {
    if (!selectedIssue) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(
        `http://localhost:3011/api/v1/parking-lot-issues/${selectedIssue.id}/status`,
        {
          severity: values.severity,
          status: values.status,
          resolutionNotes: values.resolutionNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      notifications.show({
        title: 'Success',
        message: 'Parking lot issue updated successfully',
        color: 'green',
      });
      setUpdateModalOpened(false);
      setSelectedIssue(null);
      updateForm.reset();
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update parking lot issue',
        color: 'red',
      });
    }
  };

  const handleDeleteClick = (issue: any) => {
    setIssueToDelete(issue);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:3011/api/v1/parking-lot-issues/${issueToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Parking lot issue deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setIssueToDelete(null);
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete parking lot issue',
        color: 'red',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'yellow';
      case 'RESOLVED':
        return 'green';
      case 'CLOSED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'green';
      case 'MEDIUM':
        return 'yellow';
      case 'HIGH':
        return 'orange';
      case 'CRITICAL':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title size="h2">Parking Lot Issues</Title>
        {canCreate && (
          <Button 
            onClick={() => setCreateModalOpened(true)}
            size="md"
          >
            Create Parking Lot Issue
          </Button>
        )}
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={1200}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Parking Lot Code</Table.Th>
                <Table.Th>Lot Name</Table.Th>
                <Table.Th>District</Table.Th>
                <Table.Th>Street</Table.Th>
                <Table.Th>Capacity</Table.Th>
                <Table.Th>Paid Parking</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Severity</Table.Th>
                <Table.Th>Reported By</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Resolution Notes</Table.Th>
                <Table.Th>Updated</Table.Th>
                {canUpdate && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={canUpdate ? 14 : 13}>Loading...</Table.Td>
                </Table.Tr>
              ) : !issues || issues.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={canUpdate ? 14 : 13}>No parking lot issues found</Table.Td>
                </Table.Tr>
              ) : (
                (issues || []).map((issue: any) => (
                  <Table.Tr key={issue.id}>
                    <Table.Td>{issue.parkingLot?.code || issue.parkingLotCode || 'N/A'}</Table.Td>
                    <Table.Td>{issue.parkingLot?.name || '—'}</Table.Td>
                    <Table.Td>{issue.parkingLot?.district || '—'}</Table.Td>
                    <Table.Td>{issue.parkingLot?.street || '—'}</Table.Td>
                    <Table.Td>{issue.parkingLot?.capacity ?? '—'}</Table.Td>
                    <Table.Td>{issue.parkingLot?.hasPaidParking ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {issue.description}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(issue.status)}>{issue.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                    </Table.Td>
                    <Table.Td>{issue.reportedBy?.fullName || 'N/A'}</Table.Td>
                    <Table.Td>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td style={{ maxWidth: 240, whiteSpace: 'pre-wrap' }}>
                      {issue.resolutionNotes || '—'}
                    </Table.Td>
                    <Table.Td>
                      {issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : '—'}
                    </Table.Td>
                    {canUpdate && (
                      <Table.Td onClick={(e) => e.stopPropagation()}>
                        {issue.status === 'REPORTED' && (
                          <Group gap="xs">
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateClick(issue);
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(issue);
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        )}
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Create Parking Lot Issue"
        size="lg"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Parking Lot Code"
              placeholder="Select a parking lot"
              data={parkingLotOptions}
              searchable
              required
              value={createForm.values.parkingLotCode}
              onChange={(value) => createForm.setFieldValue('parkingLotCode', value || '')}
              error={createForm.errors.parkingLotCode}
            />
            <Textarea
              label="Description"
              placeholder="Describe the issue..."
              required
              {...createForm.getInputProps('description')}
            />
            <Select
              label="Severity"
              data={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']}
              value={createForm.values.severity}
              onChange={(value) => createForm.setFieldValue('severity', value || 'MEDIUM')}
              error={createForm.errors.severity}
            />
            <Button type="submit">Create</Button>
          </Stack>
        </form>
      </Modal>

      <Modal 
        opened={updateModalOpened} 
        onClose={() => {
          setUpdateModalOpened(false);
          setSelectedIssue(null);
          updateForm.reset();
        }} 
        title="Edit Parking Lot Issue"
        size="lg"
        centered
      >
        <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
          <Stack>
            {selectedIssue && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color="blue">{selectedIssue.parkingLot?.code || selectedIssue.parkingLotCode}</Badge>
                </Group>
                <Textarea
                  label="Description"
                  value={selectedIssue.description}
                  readOnly
                  styles={{ input: { backgroundColor: 'transparent', cursor: 'not-allowed' } }}
                />
              </Paper>
            )}
            <Select
              label="Severity"
              data={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']}
              required
              {...updateForm.getInputProps('severity')}
            />
            <Select
              label="Status"
              data={ISSUE_STATUSES}
              required
              {...updateForm.getInputProps('status')}
            />
            <Textarea
              label="Resolution Notes"
              placeholder="Add notes about the resolution..."
              {...updateForm.getInputProps('resolutionNotes')}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => {
                setUpdateModalOpened(false);
                setSelectedIssue(null);
                updateForm.reset();
              }}>
                Cancel
              </Button>
              <Button type="submit">Update Issue</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setIssueToDelete(null);
        }}
        title="Delete Parking Lot Issue"
        size="md"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this parking lot issue?
          </Text>
          {issueToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Parking Lot Code:</Text>
              <Text size="sm">{issueToDelete.parkingLot?.code || issueToDelete.parkingLotCode}</Text>
              <Text size="sm" fw={700} mt="xs">Description:</Text>
              <Text size="sm">{issueToDelete.description}</Text>
            </Paper>
          )}
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setIssueToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

