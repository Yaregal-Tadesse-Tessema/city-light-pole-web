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

export default function FootballFieldIssuesListPage() {
  const { user } = useAuth();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['football-field-issues'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/football-field-issues', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch football field issues:', error.response?.status || error.message);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: fieldsData } = useQuery({
    queryKey: ['football-fields', 'dropdown'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/football-fields?page=1&limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch football fields for dropdown:', error.response?.status || error.message);
        return { items: [] };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const fieldsWithUnclosedIssues = new Set(
    (issues || [])
      .filter((issue: any) => issue?.status === 'REPORTED' || issue?.status === 'IN_PROGRESS')
      .map((issue: any) => issue?.footballField?.code || issue?.footballFieldCode)
      .filter(Boolean)
  );

  const fieldOptions = (fieldsData?.items || [])
    .filter((f: any) => !fieldsWithUnclosedIssues.has(f?.code))
    .map((f: any) => ({
      value: f.code,
      label: `${f.code} - ${f.street}, ${f.district}`,
    }));

  const createForm = useForm({
    initialValues: {
      footballFieldCode: '',
      description: '',
      severity: 'MEDIUM',
    },
  });

  const updateForm = useForm({
    initialValues: {
      footballFieldCode: '',
      description: '',
      severity: 'MEDIUM',
      status: '',
      resolutionNotes: '',
    },
  });

  const handleCreateSubmit = async (values: any) => {
    try {
      if (!values.footballFieldCode) {
        notifications.show({ title: 'Error', message: 'Please select a football field', color: 'red' });
        return;
      }
      if (!values.description?.trim()) {
        notifications.show({ title: 'Error', message: 'Please enter a description', color: 'red' });
        return;
      }
      const token = localStorage.getItem('access_token');
      const payload = {
        footballFieldCode: values.footballFieldCode,
        description: values.description.trim(),
        severity: values.severity || 'MEDIUM',
      };
      await axios.post('http://localhost:3011/api/v1/football-field-issues', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({ title: 'Success', message: 'Football field issue created successfully', color: 'green' });
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
        message: msg || `Failed to create football field issue${error.response?.status ? ` (HTTP ${error.response.status})` : ''}`,
        color: 'red',
      });
    }
  };

  const handleUpdateClick = (issue: any) => {
    setSelectedIssue(issue);
    updateForm.setValues({
      footballFieldCode: issue.footballField?.code || issue.footballFieldCode || '',
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
        `http://localhost:3011/api/v1/football-field-issues/${selectedIssue.id}/status`,
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
      notifications.show({ title: 'Success', message: 'Football field issue updated successfully', color: 'green' });
      setUpdateModalOpened(false);
      setSelectedIssue(null);
      updateForm.reset();
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update football field issue',
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
      await axios.delete(`http://localhost:3011/api/v1/football-field-issues/${issueToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifications.show({ title: 'Success', message: 'Football field issue deleted successfully', color: 'green' });
      setDeleteModalOpened(false);
      setIssueToDelete(null);
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete football field issue',
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
        <Title size="h2">Football Field Issues</Title>
        {canCreate && (
          <Button onClick={() => setCreateModalOpened(true)} size="md">
            Create Football Field Issue
          </Button>
        )}
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={1300}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Field Code</Table.Th>
                <Table.Th>Field Name</Table.Th>
                <Table.Th>Field Type</Table.Th>
                <Table.Th>Capacity</Table.Th>
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
                  <Table.Td colSpan={canUpdate ? 14 : 13}>Loading...</Table.Td>
                </Table.Tr>
              ) : !issues || issues.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={canUpdate ? 14 : 13}>No football field issues found</Table.Td>
                </Table.Tr>
              ) : (
                (issues || []).map((issue: any) => (
                  <Table.Tr key={issue.id}>
                    <Table.Td>{issue.footballField?.code || issue.footballFieldCode || 'N/A'}</Table.Td>
                    <Table.Td>{issue.footballField?.name || '—'}</Table.Td>
                    <Table.Td>{issue.footballField?.fieldType || '—'}</Table.Td>
                    <Table.Td>{issue.footballField?.capacity ?? '—'}</Table.Td>
                    <Table.Td>{issue.footballField?.district || '—'}</Table.Td>
                    <Table.Td>{issue.footballField?.street || '—'}</Table.Td>
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
                    <Table.Td>{new Date(issue.createdAt).toLocaleDateString()}</Table.Td>
                    <Table.Td style={{ maxWidth: 240, whiteSpace: 'pre-wrap' }}>{issue.resolutionNotes || '—'}</Table.Td>
                    <Table.Td>{issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : '—'}</Table.Td>
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

      <Modal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} title="Create Football Field Issue" size="lg" centered>
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Football Field Code"
              placeholder="Select a football field"
              data={fieldOptions}
              searchable
              required
              value={createForm.values.footballFieldCode}
              onChange={(value) => createForm.setFieldValue('footballFieldCode', value || '')}
              error={createForm.errors.footballFieldCode}
            />
            <Textarea label="Description" placeholder="Describe the issue..." required {...createForm.getInputProps('description')} />
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
        title="Edit Football Field Issue"
        size="lg"
        centered
      >
        <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
          <Stack>
            {selectedIssue && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color="blue">{selectedIssue.footballField?.code || selectedIssue.footballFieldCode}</Badge>
                </Group>
                <Textarea
                  label="Description"
                  value={selectedIssue.description}
                  readOnly
                  styles={{ input: { backgroundColor: 'transparent', cursor: 'not-allowed' } }}
                />
              </Paper>
            )}
            <Select label="Severity" data={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} required {...updateForm.getInputProps('severity')} />
            <Select label="Status" data={ISSUE_STATUSES} required {...updateForm.getInputProps('status')} />
            <Textarea label="Resolution Notes" placeholder="Add notes about the resolution..." {...updateForm.getInputProps('resolutionNotes')} />
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateModalOpened(false);
                  setSelectedIssue(null);
                  updateForm.reset();
                }}
              >
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
        title="Delete Football Field Issue"
        size="md"
        centered
      >
        <Stack>
          <Text>Are you sure you want to delete this football field issue?</Text>
          {issueToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>
                Field Code:
              </Text>
              <Text size="sm">{issueToDelete.footballField?.code || issueToDelete.footballFieldCode}</Text>
              <Text size="sm" fw={700} mt="xs">
                Description:
              </Text>
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


