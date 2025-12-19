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
  FileInput,
  SimpleGrid,
  CloseButton,
  Image,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconUpload, IconPhoto } from '@tabler/icons-react';
import axios from 'axios';

const ISSUE_STATUSES = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function IssuesListPage() {
  const { user } = useAuth();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  const [attachmentsModalOpened, setAttachmentsModalOpened] = useState(false);
  const [selectedIssueForAttachments, setSelectedIssueForAttachments] = useState<any>(null);
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [updateFiles, setUpdateFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'MAINTENANCE_ENGINEER';

  const uploadFiles = async (files: File[], folder: string = 'issues'): Promise<string[]> => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder', folder);

    const token = localStorage.getItem('access_token');
    const response = await axios.post('http://localhost:3011/api/v1/files/upload/multiple', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.map((fileData: any) => fileData.url);
  };

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/issues', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles', 'dropdown'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/poles?page=1&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  // Get poles that have unclosed issues
  const polesWithUnclosedIssues = new Set(
    issues
      ?.filter((issue: any) => issue.status === 'REPORTED' || issue.status === 'IN_PROGRESS')
      .map((issue: any) => issue.pole?.code || issue.poleCode)
      .filter(Boolean) || []
  );

  // Filter out poles that have unclosed issues
  const poleOptions = polesData?.items
    ?.filter((pole: any) => !polesWithUnclosedIssues.has(pole.code))
    .map((pole: any) => ({
      value: pole.code,
      label: `${pole.code} - ${pole.street}, ${pole.subcity}`,
    })) || [];

  const createForm = useForm({
    initialValues: {
      poleCode: '',
      description: '',
      severity: 'MEDIUM',
    },
  });

  const updateForm = useForm({
    initialValues: {
      poleCode: '',
      description: '',
      severity: 'MEDIUM',
      status: '',
      resolutionNotes: '',
    },
  });

  const handleCreateSubmit = async (values: any) => {
    try {
      setUploadingFiles(true);

      // Upload files first if any
      let uploadedFileUrls: string[] = [];
      if (createFiles.length > 0) {
        uploadedFileUrls = await uploadFiles(createFiles, 'issues');
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/issues', {
        ...values,
        attachments: uploadedFileUrls, // Include uploaded file URLs
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Issue created successfully:', response.data);
      notifications.show({
        title: 'Success',
        message: `Issue created successfully${uploadedFileUrls.length > 0 ? ` with ${uploadedFileUrls.length} attachment(s)` : ''}`,
        color: 'green',
      });

      setCreateModalOpened(false);
      createForm.reset();
      setCreateFiles([]);
      refetch();
    } catch (error: any) {
      console.error('Error creating issue:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create issue',
        color: 'red',
      });
      // Clear files on error too, so user can try again
      setCreateFiles([]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUpdateClick = (issue: any) => {
    setSelectedIssue(issue);
    updateForm.setValues({
      poleCode: issue.pole?.code || issue.poleCode || '',
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
      setUploadingFiles(true);

      // Upload additional files as attachments if any
      if (updateFiles.length > 0) {
        try {
          const formData = new FormData();
          updateFiles.forEach(file => {
            formData.append('files', file);
          });
          formData.append('type', 'AFTER'); // Mark as AFTER attachments for updates

          const token = localStorage.getItem('access_token');
          await axios.post(`http://localhost:3011/api/v1/issues/${selectedIssue.id}/attachments`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (attachError) {
          console.error('Error attaching files to issue:', attachError);
          // Continue with issue update even if file upload fails
        }
      }

      const token = localStorage.getItem('access_token');
      // Backend currently only accepts status, severity, and resolutionNotes
      await axios.patch(
        `http://localhost:3011/api/v1/issues/${selectedIssue.id}/status`,
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

      const message = updateFiles.length > 0
        ? `Issue updated successfully with ${updateFiles.length} additional attachment(s) added`
        : 'Issue updated successfully';

      notifications.show({
        title: 'Success',
        message,
        color: 'green',
      });

      // Clear the file input after successful upload
      setUpdateFiles([]);

      setUpdateModalOpened(false);
      setSelectedIssue(null);
      updateForm.reset();
      refetch();
    } catch (error: any) {
      console.error('Error updating issue:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update issue',
        color: 'red',
      });
      // Clear files on error too, so user can try again
      setUpdateFiles([]);
    } finally {
      setUploadingFiles(false);
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

  const openAttachmentsModal = (issue: any) => {
    setSelectedIssueForAttachments(issue);
    setAttachmentsModalOpened(true);
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

      console.log('Deleting issue:', issueToDelete.id);
      const response = await axios.delete(`http://localhost:3011/api/v1/issues/${issueToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Delete response:', response);
      notifications.show({
        title: 'Success',
        message: 'Issue deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setIssueToDelete(null);
      refetch();
    } catch (error: any) {
      console.error('Error deleting issue:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to delete issue',
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
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1} size="h1">Issues</Title>
        {canCreate && (
          <Button 
            onClick={() => setCreateModalOpened(true)}
            size="md"
          >
            Create Issue
          </Button>
        )}
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table highlightOnHover>
            <Table.Thead>
            <Table.Tr>
              <Table.Th>Pole Code</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Attachments</Table.Th>
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
                <Table.Td colSpan={10}>Loading...</Table.Td>
              </Table.Tr>
            ) : issues?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={10}>No issues found</Table.Td>
              </Table.Tr>
            ) : (
              issues?.map((issue: any) => (
                <Table.Tr key={issue.id}>
                  <Table.Td>{issue.pole?.code || issue.poleCode || 'N/A'}</Table.Td>
                  <Table.Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {issue.description}
                  </Table.Td>
                  <Table.Td>
                    {issue.attachments && issue.attachments.length > 0 ? (
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => openAttachmentsModal(issue)}
                        style={{ cursor: 'pointer' }}
                      >
                        📎 {issue.attachments.length} file{issue.attachments.length > 1 ? 's' : ''}
                      </Button>
                    ) : (
                      <Text size="sm" c="dimmed">No attachments</Text>
                    )}
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

      {/* Create Issue Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => {
          setCreateModalOpened(false);
          setCreateFiles([]);
        }}
        title="Create Issue"
        size="lg"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateSubmit)}>
          <Stack>
            <Select
              label="Pole Code"
              placeholder="Select a pole"
              data={poleOptions}
              searchable
              required
              {...createForm.getInputProps('poleCode')}
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

            {/* File Upload Section */}
            <div>
              <Text size="sm" fw={500} mb="xs">Attachments (Optional)</Text>
              <FileInput
                placeholder={createFiles.length > 0 ? `Add more files (${createFiles.length} selected)` : "Select files to upload"}
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                leftSection={<IconUpload size={16} />}
                value={undefined} // Keep button text consistent
                onChange={(files) => {
                  // Add new files to existing ones instead of replacing
                  setCreateFiles(prev => [...prev, ...files]);
                }}
                size="md"
                disabled={uploadingFiles}
                clearable={false}
              />

              {createFiles.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Text size="sm" c="dimmed" mb="xs">
                    Selected files ({createFiles.length}):
                  </Text>
                  <SimpleGrid cols={2} spacing="xs">
                    {createFiles.map((file, index) => (
                      <Group key={index} gap="xs" p="xs" bg="gray.0" style={{ borderRadius: '4px' }}>
                        <IconPhoto size={16} />
                        <Text size="xs" style={{ flex: 1, wordBreak: 'break-all' }}>
                          {file.name}
                        </Text>
                        <CloseButton
                          size="xs"
                          onClick={() => {
                            setCreateFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                        />
                      </Group>
                    ))}
                  </SimpleGrid>
                </div>
              )}
            </div>

            <Button type="submit" loading={uploadingFiles}>
              {uploadingFiles ? 'Uploading...' : 'Create Issue'}
            </Button>
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
          setUpdateFiles([]);
        }}
        title="Edit Issue"
        size="lg"
        centered
      >
        <form onSubmit={updateForm.onSubmit(handleUpdateSubmit)}>
          <Stack>
            {selectedIssue && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color="blue">{selectedIssue.pole?.code || selectedIssue.poleCode}</Badge>
                </Group>
                <Textarea
                  label="Description"
                  value={selectedIssue.description}
                  readOnly
                  styles={{ input: { backgroundColor: 'transparent', cursor: 'not-allowed' } }}
                />
              </Paper>
            )}

            {/* Display existing attachments */}
            {selectedIssue?.status === 'CLOSED' && selectedIssue?.attachments && selectedIssue.attachments.length > 0 && (
              <Text size="sm" c="orange" mb="xs">
                ⚠️ This issue is closed. Existing attachments cannot be deleted.
              </Text>
            )}
            {selectedIssue?.attachments && selectedIssue.attachments.length > 0 && (
              <div>
                <Text size="sm" fw={500} mb="xs">Existing Attachments</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm" mb="md">
                  {selectedIssue.attachments.map((attachment: any, index: number) => (
                    <Paper key={index} p={0} withBorder style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
                      {attachment.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <Image
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          height="100%"
                          width="100%"
                          fit="cover"
                          style={{ borderRadius: '4px' }}
                        />
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f0f0f0',
                            fontSize: '2.5rem',
                          }}
                        >
                          📄
                        </div>
                      )}

                      {/* Overlay buttons */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          display: 'flex',
                          gap: '2px',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '4px',
                          padding: '3px',
                        }}
                      >
                        <ActionIcon
                          component="a"
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="filled"
                          color="blue"
                          size="xs"
                          style={{ color: 'white' }}
                        >
                          <IconPhoto size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="filled"
                          color="red"
                          size="xs"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this attachment?')) {
                              // Delete attachment
                              const token = localStorage.getItem('access_token');
                              axios.delete(`http://localhost:3011/api/v1/issues/${selectedIssue.id}/attachments/${attachment.id}`, {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              })
                              .then(() => {
                                notifications.show({
                                  title: 'Success',
                                  message: 'Attachment deleted successfully',
                                  color: 'green',
                                });
                                // Refresh data
                                refetch();
                                // Update local state
                                setSelectedIssue((prev: any) => prev ? {
                                  ...prev,
                                  attachments: prev.attachments.filter((att: any) => att.id !== attachment.id)
                                } : null);
                              })
                              .catch((error) => {
                                notifications.show({
                                  title: 'Error',
                                  message: error.response?.data?.message || 'Failed to delete attachment',
                                  color: 'red',
                                });
                              });
                            }
                          }}
                          disabled={selectedIssue?.status === 'CLOSED'}
                          style={{ color: 'white' }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </div>
                    </Paper>
                  ))}
                </SimpleGrid>
              </div>
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

            {/* File Upload Section for Update */}
            <div>
              <Text size="sm" fw={500} mb="xs">Additional Attachments (Optional)</Text>
              <FileInput
                placeholder={updateFiles.length > 0 ? `Add more files (${updateFiles.length} selected)` : "Select additional files to upload"}
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                leftSection={<IconUpload size={16} />}
                value={undefined} // Keep button text consistent
                onChange={(files) => {
                  // Add new files to existing ones instead of replacing
                  setUpdateFiles(prev => [...prev, ...files]);
                }}
                size="md"
                disabled={uploadingFiles}
                clearable={false}
              />

              {updateFiles.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Text size="sm" c="dimmed" mb="xs">
                    Files to upload ({updateFiles.length}):
                  </Text>
                  <SimpleGrid cols={2} spacing="xs">
                    {updateFiles.map((file, index) => (
                      <Group key={index} gap="xs" p="xs" bg="gray.0" style={{ borderRadius: '4px' }}>
                        <IconPhoto size={16} />
                        <Text size="xs" style={{ flex: 1, wordBreak: 'break-all' }}>
                          {file.name}
                        </Text>
                        <CloseButton
                          size="xs"
                          onClick={() => {
                            setUpdateFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                        />
                      </Group>
                    ))}
                  </SimpleGrid>
                </div>
              )}
            </div>

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => {
                setUpdateModalOpened(false);
                setSelectedIssue(null);
                updateForm.reset();
                setUpdateFiles([]);
              }}>
                Cancel
              </Button>
              <Button type="submit" loading={uploadingFiles}>
                {uploadingFiles ? 'Uploading...' : 'Update Issue'}
              </Button>
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
        title="Delete Issue"
        size="md"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this issue?
          </Text>
          {issueToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Pole Code:</Text>
              <Text size="sm">{issueToDelete.pole?.code || issueToDelete.poleCode}</Text>
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

      {/* Attachments Modal */}
      <Modal
        opened={attachmentsModalOpened}
        onClose={() => {
          setAttachmentsModalOpened(false);
          setSelectedIssueForAttachments(null);
        }}
        title={`Attachments for Issue ${selectedIssueForAttachments?.pole?.code || selectedIssueForAttachments?.poleCode}`}
        size="lg"
        centered
      >
        <Stack>
          {selectedIssueForAttachments?.status === 'CLOSED' && (
            <Text size="sm" c="orange" ta="center">
              ⚠️ This issue is closed. Attachments cannot be deleted.
            </Text>
          )}
          {selectedIssueForAttachments?.attachments && selectedIssueForAttachments.attachments.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {selectedIssueForAttachments.attachments.map((attachment: any, index: number) => (
                <Paper key={index} p={0} withBorder style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  {attachment.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image
                      src={attachment.fileUrl}
                      alt={attachment.fileName}
                      height="100%"
                      width="100%"
                      fit="cover"
                      style={{ borderRadius: '4px' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        fontSize: '4rem',
                      }}
                    >
                      📄
                    </div>
                  )}

                  {/* Overlay buttons */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '6px',
                      padding: '4px',
                    }}
                  >
                    <ActionIcon
                      component="a"
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="filled"
                      color="blue"
                      size="sm"
                      style={{ color: 'white' }}
                    >
                      <IconPhoto size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this attachment?')) {
                          const token = localStorage.getItem('access_token');
                          axios.delete(`http://localhost:3011/api/v1/issues/${selectedIssueForAttachments.id}/attachments/${attachment.id}`, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          })
                          .then(() => {
                            notifications.show({
                              title: 'Success',
                              message: 'Attachment deleted successfully',
                              color: 'green',
                            });
                            setAttachmentsModalOpened(false);
                            refetch();
                          })
                          .catch((error) => {
                            notifications.show({
                              title: 'Error',
                              message: error.response?.data?.message || 'Failed to delete attachment',
                              color: 'red',
                            });
                          });
                        }
                      }}
                      disabled={selectedIssueForAttachments?.status === 'CLOSED'}
                      style={{ color: 'white' }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </div>
                </Paper>
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" c="dimmed" py="xl">
              No attachments found for this issue.
            </Text>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
