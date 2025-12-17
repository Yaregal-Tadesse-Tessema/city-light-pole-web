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
  Alert,
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

export default function PublicToiletIssuesListPage() {
  const { user } = useAuth();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  const [existingIssueId, setExistingIssueId] = useState<string | null>(null);
  const [existingIssueModalOpened, setExistingIssueModalOpened] = useState(false);
  
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';

  const { data: issues, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['toilet-issues'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/toilet-issues', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: existingIssue, isLoading: existingIssueLoading } = useQuery({
    queryKey: ['public-toilet-issue', existingIssueId],
    queryFn: async () => {
      if (!existingIssueId) return null;
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/toilet-issues/${existingIssueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!existingIssueId && existingIssueModalOpened,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: toiletsData } = useQuery({
    queryKey: ['public-toilets', 'dropdown'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:3011/api/v1/public-toilets?page=1&limit=100', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (error: any) {
        console.warn('Failed to fetch toilets for dropdown:', error.response?.status || error.message);
        return { items: [] };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const toiletsWithUnclosedIssues = new Set(
    (issues || [])
      .filter((issue: any) => issue?.status === 'REPORTED' || issue?.status === 'IN_PROGRESS')
      .map((issue: any) => issue?.publicToilet?.code || issue?.publicToiletCode)
      .filter(Boolean)
  );

  const toiletOptions = (toiletsData?.items || [])
    .filter((toilet: any) => !toiletsWithUnclosedIssues.has(toilet?.code))
    .map((toilet: any) => ({
      value: toilet.code,
      label: `${toilet.code} - ${toilet.street}, ${toilet.district}`,
    }));

  const createForm = useForm({
    initialValues: {
      publicToiletCode: '',
      description: '',
      severity: 'MEDIUM',
    },
  });

  const updateForm = useForm({
    initialValues: {
      publicToiletCode: '',
      description: '',
      severity: 'MEDIUM',
      status: '',
      resolutionNotes: '',
    },
  });

  const handleCreateSubmit = async (values: any) => {
    try {
      if (!values.publicToiletCode) {
        notifications.show({ title: 'Error', message: 'Please select a public toilet', color: 'red' });
        return;
      }
      if (!values.description?.trim()) {
        notifications.show({ title: 'Error', message: 'Please enter a description', color: 'red' });
        return;
      }
      const token = localStorage.getItem('access_token');
      const payload = {
        publicToiletCode: values.publicToiletCode,
        description: values.description.trim(),
        severity: values.severity || 'MEDIUM',
      };
      await axios.post('http://localhost:3011/api/v1/toilet-issues', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Public toilet issue created successfully',
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

      // If backend says "Existing issue id: <uuid>", show a modal to view/delete it
      const match = (msg || '').match(
        /Existing issue id:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
      );
      if (match?.[1]) {
        setExistingIssueId(match[1]);
        setExistingIssueModalOpened(true);
      }
      notifications.show({
        title: 'Error',
        message: msg || `Failed to create public toilet issue${error.response?.status ? ` (HTTP ${error.response.status})` : ''}`,
        color: 'red',
      });
    }
  };

  const handleDeleteExistingIssue = async () => {
    if (!existingIssueId) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:3011/api/v1/toilet-issues/${existingIssueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notifications.show({ title: 'Success', message: 'Existing issue deleted', color: 'green' });
      setExistingIssueModalOpened(false);
      setExistingIssueId(null);
      refetch();
    } catch (e: any) {
      const msg =
        typeof e.response?.data?.message === 'string'
          ? e.response?.data?.message
          : Array.isArray(e.response?.data?.message)
            ? e.response?.data?.message.join(', ')
            : e.message;
      notifications.show({ title: 'Error', message: msg || 'Failed to delete existing issue', color: 'red' });
    }
  };

  const handleUpdateClick = (issue: any) => {
    setSelectedIssue(issue);
    updateForm.setValues({
      publicToiletCode: issue.publicToilet?.code || issue.publicToiletCode || '',
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
        `http://localhost:3011/api/v1/toilet-issues/${selectedIssue.id}/status`,
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
        message: 'Public toilet issue updated successfully',
        color: 'green',
      });
      setUpdateModalOpened(false);
      setSelectedIssue(null);
      updateForm.reset();
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update public toilet issue',
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
      await axios.delete(`http://localhost:3011/api/v1/toilet-issues/${issueToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Public toilet issue deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setIssueToDelete(null);
      refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete public toilet issue',
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
        <Title size="h2">Public Toilet Issues</Title>
        {canCreate && (
          <Button 
            onClick={() => setCreateModalOpened(true)}
            size="md"
          >
            Create Toilet Issue
          </Button>
        )}
      </Group>

      {isError && (
        <Alert color="red" mb="md" title="Failed to load public toilet issues">
          {(() => {
            const anyErr: any = error;
            const msg =
              typeof anyErr?.response?.data?.message === 'string'
                ? anyErr.response.data.message
                : Array.isArray(anyErr?.response?.data?.message)
                  ? anyErr.response.data.message.join(', ')
                  : anyErr?.message;
            return `${msg || 'Unknown error'}${anyErr?.response?.status ? ` (HTTP ${anyErr.response.status})` : ''}`;
          })()}
        </Alert>
      )}

      <Paper withBorder>
        <Table.ScrollContainer minWidth={1200}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Toilet Code</Table.Th>
                <Table.Th>Toilet Type</Table.Th>
                <Table.Th>District</Table.Th>
                <Table.Th>Street</Table.Th>
                <Table.Th>Paid Access</Table.Th>
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
                  <Table.Td colSpan={canUpdate ? 13 : 12}>No public toilet issues found</Table.Td>
                </Table.Tr>
              ) : (
                (issues || []).map((issue: any) => (
                  <Table.Tr key={issue.id}>
                    <Table.Td>{issue.publicToilet?.code || issue.publicToiletCode || 'N/A'}</Table.Td>
                    <Table.Td>{issue.publicToilet?.toiletType || '—'}</Table.Td>
                    <Table.Td>{issue.publicToilet?.district || '—'}</Table.Td>
                    <Table.Td>{issue.publicToilet?.street || '—'}</Table.Td>
                    <Table.Td>{issue.publicToilet?.hasPaidAccess ? 'Yes' : 'No'}</Table.Td>
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
        opened={existingIssueModalOpened}
        onClose={() => {
          setExistingIssueModalOpened(false);
          setExistingIssueId(null);
        }}
        title="Existing Unclosed Issue Found"
        size="lg"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            The backend reports an existing unclosed issue blocking creation.
          </Text>
          <Paper withBorder p="sm">
            <Text size="sm"><b>Issue ID:</b> {existingIssueId || '—'}</Text>
            {existingIssueLoading ? (
              <Text size="sm" c="dimmed" mt="xs">Loading issue details...</Text>
            ) : existingIssue ? (
              <>
                <Text size="sm" mt="xs"><b>Toilet Code:</b> {existingIssue.publicToilet?.code || existingIssue.publicToiletCode || '—'}</Text>
                <Text size="sm" mt="xs"><b>Status:</b> {existingIssue.status || '—'}</Text>
                <Text size="sm" mt="xs"><b>Severity:</b> {existingIssue.severity || '—'}</Text>
                <Text size="sm" mt="xs"><b>Description:</b> {existingIssue.description || '—'}</Text>
              </>
            ) : (
              <Text size="sm" c="dimmed" mt="xs">
                Could not load issue details. You can still try to delete it if it is in REPORTED status.
              </Text>
            )}
          </Paper>
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setExistingIssueModalOpened(false);
                setExistingIssueId(null);
              }}
            >
              Close
            </Button>
            <Button color="red" onClick={handleDeleteExistingIssue}>
              Delete Existing Issue
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Create Public Toilet Issue"
        size="lg"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Public Toilet Code"
              placeholder="Select a public toilet"
              data={toiletOptions}
              searchable
              required
              value={createForm.values.publicToiletCode}
              onChange={(value) => createForm.setFieldValue('publicToiletCode', value || '')}
              error={createForm.errors.publicToiletCode}
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
        title="Edit Public Toilet Issue"
        size="lg"
        centered
      >
        <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
          <Stack>
            {selectedIssue && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color="blue">{selectedIssue.publicToilet?.code || selectedIssue.publicToiletCode}</Badge>
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
        title="Delete Public Toilet Issue"
        size="md"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this public toilet issue?
          </Text>
          {issueToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Toilet Code:</Text>
              <Text size="sm">{issueToDelete.publicToilet?.code || issueToDelete.publicToiletCode}</Text>
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

