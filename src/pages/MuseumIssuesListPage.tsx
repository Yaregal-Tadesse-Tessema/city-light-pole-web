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

export default function MuseumIssuesListPage() {
  const { user } = useAuth();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['museum-issues'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/museum-issues', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch museum issues:', error.response?.status || error.message);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: museumsData } = useQuery({
    queryKey: ['museums', 'dropdown'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/museums?page=1&limit=100', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch museums for dropdown:', error.response?.status || error.message);
        return { items: [] };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const museumsWithUnclosedIssues = new Set(
    (issues || [])
      .filter((issue: any) => issue?.status === 'REPORTED' || issue?.status === 'IN_PROGRESS')
      .map((issue: any) => issue?.museum?.code || issue?.museumCode)
      .filter(Boolean)
  );

  const museumOptions = (museumsData?.items || [])
    .filter((museum: any) => !museumsWithUnclosedIssues.has(museum?.code))
    .map((museum: any) => ({
      value: museum.code,
      label: `${museum.code} - ${museum.street}, ${museum.district}`,
    }));

  const createForm = useForm({
    initialValues: {
      museumCode: '',
      description: '',
      severity: 'MEDIUM',
    },
  });

  const updateForm = useForm({
    initialValues: {
      museumCode: '',
      description: '',
      severity: 'MEDIUM',
      status: '',
      resolutionNotes: '',
    },
  });

  const handleCreateSubmit = async (values: any) => {
    try {
      if (!values.museumCode) {
        notifications.show({ title: 'Error', message: 'Please select a museum', color: 'red' });
        return;
      }
      if (!values.description?.trim()) {
        notifications.show({ title: 'Error', message: 'Please enter a description', color: 'red' });
        return;
      }
      const token = localStorage.getItem('access_token');
      const payload = {
        museumCode: values.museumCode,
        description: values.description.trim(),
        severity: values.severity || 'MEDIUM',
      };
      await axios.post('http://localhost:3011/api/v1/museum-issues', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Museum issue created successfully',
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
        message: msg || `Failed to create museum issue${error.response?.status ? ` (HTTP ${error.response.status})` : ''}`,
        color: 'red',
      });
    }
  };

  const handleUpdateClick = (issue: any) => {
    setSelectedIssue(issue);
    updateForm.setValues({
      museumCode: issue.museum?.code || issue.museumCode || '',
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
        `http://localhost:3011/api/v1/museum-issues/${selectedIssue.id}/status`,
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
        message: 'Museum issue updated successfully',
        color: 'green',
      });
      setUpdateModalOpened(false);
      setSelectedIssue(null);
      updateForm.reset();
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update museum issue',
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
      await axios.delete(`http://localhost:3011/api/v1/museum-issues/${issueToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Museum issue deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setIssueToDelete(null);
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete museum issue',
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
        <Title size="h2">Museum Issues</Title>
        {canCreate && (
          <Button 
            onClick={() => setCreateModalOpened(true)}
            size="md"
          >
            Create Museum Issue
          </Button>
        )}
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={1200}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Museum Code</Table.Th>
                <Table.Th>Museum Name</Table.Th>
                <Table.Th>Museum Type</Table.Th>
                <Table.Th>District</Table.Th>
                <Table.Th>Street</Table.Th>
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
                  <Table.Td colSpan={canUpdate ? 13 : 12}>Loading...</Table.Td>
                </Table.Tr>
              ) : !issues || issues.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={canUpdate ? 13 : 12}>No museum issues found</Table.Td>
                </Table.Tr>
              ) : (
                (issues || []).map((issue: any) => (
                  <Table.Tr key={issue.id}>
                    <Table.Td>{issue.museum?.code || issue.museumCode || 'N/A'}</Table.Td>
                    <Table.Td>{issue.museum?.name || '—'}</Table.Td>
                    <Table.Td>{issue.museum?.museumType || '—'}</Table.Td>
                    <Table.Td>{issue.museum?.district || '—'}</Table.Td>
                    <Table.Td>{issue.museum?.street || '—'}</Table.Td>
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
        title="Create Museum Issue"
        size="lg"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Museum Code"
              placeholder="Select a museum"
              data={museumOptions}
              searchable
              required
              value={createForm.values.museumCode}
              onChange={(value) => createForm.setFieldValue('museumCode', value || '')}
              error={createForm.errors.museumCode}
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
        title="Edit Museum Issue"
        size="lg"
        centered
      >
        <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
          <Stack>
            {selectedIssue && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color="blue">{selectedIssue.museum?.code || selectedIssue.museumCode}</Badge>
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
        title="Delete Museum Issue"
        size="md"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this museum issue?
          </Text>
          {issueToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Museum Code:</Text>
              <Text size="sm">{issueToDelete.museum?.code || issueToDelete.museumCode}</Text>
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

