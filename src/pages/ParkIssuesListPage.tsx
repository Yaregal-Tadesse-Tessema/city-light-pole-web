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
  TextInput,
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

export default function ParkIssuesListPage() {
  const { user } = useAuth();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['park-issues'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/parks/issues', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: parksData } = useQuery({
    queryKey: ['parks', 'dropdown'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/parks?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  // Get parks that have unclosed issues
  const parksWithUnclosedIssues = new Set(
    issues
      ?.filter((issue: any) => issue.status === 'REPORTED' || issue.status === 'IN_PROGRESS')
      .map((issue: any) => issue.park?.code || issue.parkCode)
      .filter(Boolean) || []
  );

  // Filter out parks that have unclosed issues
  const parkOptions = parksData?.items
    ?.filter((park: any) => !parksWithUnclosedIssues.has(park.code))
    .map((park: any) => ({
      value: park.code,
      label: `${park.code} - ${park.street}, ${park.district}`,
    })) || [];

  const createForm = useForm({
    initialValues: {
      parkCode: '',
      description: '',
      severity: 'MEDIUM',
    },
  });

  const updateForm = useForm({
    initialValues: {
      parkCode: '',
      description: '',
      severity: 'MEDIUM',
      status: '',
      resolutionNotes: '',
    },
  });

  const handleCreateSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/parks/issues', values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Park issue created successfully:', response.data);
      notifications.show({
        title: 'Success',
        message: 'Park issue created successfully',
        color: 'green',
      });
      setCreateModalOpened(false);
      createForm.reset();
      refetch();
    } catch (error: any) {
      console.error('Error creating park issue:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create park issue',
        color: 'red',
      });
    }
  };

  const handleUpdateClick = (issue: any) => {
    setSelectedIssue(issue);
    updateForm.setValues({
      parkCode: issue.park?.code || issue.parkCode || '',
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
      // Backend currently only accepts status, severity, and resolutionNotes
      await axios.patch(
        `http://localhost:3011/api/v1/parks/issues/${selectedIssue.id}/status`,
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
        message: 'Park issue updated successfully',
        color: 'green',
      });
      setUpdateModalOpened(false);
      setSelectedIssue(null);
      updateForm.reset();
      refetch();
    } catch (error: any) {
      console.error('Error updating park issue:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update park issue',
        color: 'red',
      });
    }
  };

  const handleDeleteClick = (issue: any) => {
    try {
      setIssueToDelete(issue);
      setDeleteModalOpened(true);
    } catch (error) {
      console.error('Error opening delete modal:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) {
      console.error('No issue selected for deletion');
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        notifications.show({
          title: 'Error',
          message: 'Authentication token not found',
          color: 'red',
        });
        return;
      }

      console.log('Deleting park issue:', issueToDelete.id);
      const response = await axios.delete(`http://localhost:3011/api/v1/parks/issues/${issueToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Delete response:', response);
      notifications.show({
        title: 'Success',
        message: 'Park issue deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setIssueToDelete(null);
      refetch();
    } catch (error: any) {
      console.error('Error deleting park issue:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to delete park issue',
        color: 'red',
      });
      // Don't close modal on error so user can try again
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
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Park Issues</Title>
        {canCreate && (
          <Button onClick={() => setCreateModalOpened(true)}>Create Park Issue</Button>
        )}
      </Group>

      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Park Code</Table.Th>
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
                <Table.Td colSpan={9}>Loading...</Table.Td>
              </Table.Tr>
            ) : issues?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9}>No park issues found</Table.Td>
              </Table.Tr>
            ) : (
              issues?.map((issue: any) => (
                <Table.Tr key={issue.id}>
                  <Table.Td>{issue.park?.code || issue.parkCode || 'N/A'}</Table.Td>
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
      </Paper>

      {/* Create Issue Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Create Park Issue"
        size="lg"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Park Code"
              placeholder="Select a park"
              data={parkOptions}
              searchable
              required
              {...createForm.getInputProps('parkCode')}
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
              {...createForm.getInputProps('severity')}
            />
            <Button type="submit">Create</Button>
          </Stack>
        </form>
      </Modal>

      {/* Update Issue Modal */}
      <Modal 
        opened={updateModalOpened} 
        onClose={() => {
          setUpdateModalOpened(false);
          setSelectedIssue(null);
          updateForm.reset();
        }} 
        title="Edit Park Issue"
      >
        <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
          <Stack>
            {selectedIssue && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color="blue">{selectedIssue.park?.code || selectedIssue.parkCode}</Badge>
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

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setIssueToDelete(null);
        }}
        title="Delete Park Issue"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this park issue?
          </Text>
          {issueToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Park Code:</Text>
              <Text size="sm">{issueToDelete.park?.code || issueToDelete.parkCode}</Text>
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


