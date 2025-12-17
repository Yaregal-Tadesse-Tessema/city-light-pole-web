import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { IconEye, IconTrash } from '@tabler/icons-react';
import {
  Container,
  Paper,
  Table,
  Title,
  Tabs,
  Badge,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Stack,
  Select,
  Textarea,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

const SCHEDULE_STATUSES = ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'];

export default function MaintenancePage() {
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('type'); // 'park' or 'pole' or null (all)
  const [createScheduleOpened, setCreateScheduleOpened] = useState(false);
  const [editScheduleOpened, setEditScheduleOpened] = useState(false);
  const [issueModalOpened, setIssueModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);

  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['maintenance', 'schedules', filterType],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/maintenance/schedules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Filter by type if specified
      if (filterType === 'park') {
        return res.data.filter((schedule: any) => schedule.parkCode);
      } else if (filterType === 'pole') {
        return res.data.filter((schedule: any) => schedule.poleCode);
      }
      return res.data;
    },
  });


  const { data: poleIssues } = useQuery({
    queryKey: ['issues', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/issues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: parkIssues } = useQuery({
    queryKey: ['park-issues', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/parks/issues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: selectedIssue, isLoading: issueLoading } = useQuery({
    queryKey: ['issue', selectedIssueId],
    queryFn: async () => {
      if (!selectedIssueId) return null;
      const token = localStorage.getItem('access_token');
      // Try pole issues first, then park issues
      try {
        const res = await axios.get(`http://localhost:3011/api/v1/issues/${selectedIssueId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return { ...res.data, type: 'pole' };
      } catch {
        try {
          const res = await axios.get(`http://localhost:3011/api/v1/parks/issues/${selectedIssueId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return { ...res.data, type: 'park' };
        } catch {
          return null;
        }
      }
    },
    enabled: !!selectedIssueId && issueModalOpened,
  });

  // Combine pole and park issues
  const allIssues = [
    ...(poleIssues || []).map((issue: any) => ({ ...issue, type: 'pole' })),
    ...(parkIssues || []).map((issue: any) => ({ ...issue, type: 'park' })),
  ];

  const issueOptions =
    allIssues
      ?.filter((issue: any) => issue.status !== 'CLOSED' && issue.status !== 'IN_PROGRESS') // Exclude closed and in-progress issues
      .map((issue: any) => ({
        value: issue.id,
        label: `${issue.type === 'park' ? 'Park' : 'Pole'} ${issue.park?.code || issue.pole?.code || issue.parkCode || issue.poleCode || 'N/A'} – ${issue.description}`,
        poleCode: issue.pole?.code || issue.poleCode,
        parkCode: issue.park?.code || issue.parkCode,
        issueType: issue.type,
      })) || [];

  const { data: polesData } = useQuery({
    queryKey: ['poles', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/poles?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: parksData } = useQuery({
    queryKey: ['parks', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/parks?page=1&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const poleOptions = polesData?.items?.map((pole: any) => ({
    value: pole.code,
    label: `${pole.code} - ${pole.street}, ${pole.subcity || pole.district}`,
  })) || [];

  const parkOptions = parksData?.items?.map((park: any) => ({
    value: park.code,
    label: `${park.code} - ${park.street}, ${park.district}`,
  })) || [];

  const scheduleForm = useForm({
    initialValues: {
      poleCode: '',
      parkCode: '',
      issueId: '',
      frequency: 'MONTHLY', // kept as default and hidden from UI
      description: '',
      startDate: '',
      endDate: '',
      status: 'REQUESTED',
      estimatedCost: undefined as number | undefined,
      remark: '',
      maintenanceType: 'issue', // 'issue' or 'direct'
    },
  });


  const editScheduleForm = useForm({
    initialValues: {
      description: '',
      startDate: '',
      endDate: '',
      status: 'REQUESTED',
      estimatedCost: undefined as number | undefined,
      remark: '',
    },
    validate: {
      remark: (value, values) =>
        ['PAUSED', 'COMPLETED'].includes(values.status) && !value?.trim()
          ? 'Remark is required when status is PAUSED or COMPLETED'
          : null,
    },
  });

  const handleCreateSchedule = async (values: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        frequency: values.frequency || 'MONTHLY',
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        status: values.status || 'REQUESTED',
        estimatedCost:
          values.estimatedCost === undefined || values.estimatedCost === null || values.estimatedCost === ''
            ? undefined
            : Number(values.estimatedCost),
        remark: values.remark?.trim() || undefined,
      };

      // Add issueId if maintenance type is 'issue'
      if (values.maintenanceType === 'issue') {
        if (!values.issueId) {
          notifications.show({
            title: 'Error',
            message: 'Please select an issue',
            color: 'red',
          });
          return;
        }
        payload.issueId = values.issueId;
        // Also set poleCode or parkCode based on issue type
        if (values.parkCode) {
          payload.parkCode = values.parkCode;
        }
        if (values.poleCode) {
          payload.poleCode = values.poleCode;
        }
      } else {
        // Direct maintenance - require either poleCode or parkCode
        if (values.poleCode) {
          payload.poleCode = values.poleCode;
        } else if (values.parkCode) {
          payload.parkCode = values.parkCode;
        } else {
          notifications.show({
            title: 'Error',
            message: 'Please select either a pole or park for direct maintenance',
            color: 'red',
          });
          return;
        }
      }

      await axios.post('http://localhost:3011/api/v1/maintenance/schedules', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Maintenance schedule created',
        color: 'green',
      });
      setCreateScheduleOpened(false);
      scheduleForm.reset();
      refetchSchedules();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create schedule',
        color: 'red',
      });
    }
  };


  const handleEditScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    editScheduleForm.setValues({
      description: schedule.description || '',
      startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
      endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
      status: schedule.status || 'REQUESTED',
      estimatedCost: schedule.estimatedCost ?? undefined,
      remark: schedule.remark || '',
    });
    setEditScheduleOpened(true);
  };

  const handleEditScheduleSubmit = async (values: any) => {
    if (!selectedSchedule) return;
    if (['PAUSED', 'COMPLETED'].includes(values.status) && !values.remark?.trim()) {
      editScheduleForm.setFieldError('remark', 'Remark is required when status is PAUSED or COMPLETED');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        ...values,
        estimatedCost:
          values.estimatedCost === undefined || values.estimatedCost === null || values.estimatedCost === ''
            ? undefined
            : Number(values.estimatedCost),
        remark: values.remark?.trim() || undefined,
      };
      
      // Preserve issueId, poleCode, and parkCode from the original schedule if they exist
      if (selectedSchedule.issueId) {
        payload.issueId = selectedSchedule.issueId;
      }
      if (selectedSchedule.poleCode) {
        payload.poleCode = selectedSchedule.poleCode;
      }
      if (selectedSchedule.parkCode) {
        payload.parkCode = selectedSchedule.parkCode;
      }
      await axios.patch(
        `http://localhost:3011/api/v1/maintenance/schedules/${selectedSchedule.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      notifications.show({
        title: 'Success',
        message: 'Schedule updated',
        color: 'green',
      });
      setEditScheduleOpened(false);
      setSelectedSchedule(null);
      editScheduleForm.reset();
      refetchSchedules();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update schedule',
        color: 'red',
      });
    }
  };

  const handleDeleteClick = (schedule: any) => {
    setScheduleToDelete(schedule);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;
    
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

      await axios.delete(`http://localhost:3011/api/v1/maintenance/schedules/${scheduleToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      notifications.show({
        title: 'Success',
        message: 'Maintenance schedule deleted successfully',
        color: 'green',
      });
      setDeleteModalOpened(false);
      setScheduleToDelete(null);
      refetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to delete maintenance schedule',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>
          Maintenance
          {filterType === 'park' && ' - Parks'}
          {filterType === 'pole' && ' - Poles'}
        </Title>
        <Group>
          <Button variant="light" onClick={() => setCreateScheduleOpened(true)}>
            Create Schedule
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="schedules">
        <Tabs.List>
          <Tabs.Tab value="schedules">Maintenance History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="schedules" pt="xl">
          <Paper withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Pole/Park Code</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Frequency</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th>End Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Cost</Table.Th>
                  <Table.Th>Issue Detail</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedulesLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={9}>Loading...</Table.Td>
                  </Table.Tr>
                ) : schedules?.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={9}>No maintenance records found</Table.Td>
                  </Table.Tr>
                ) : (
                  schedules?.map((schedule: any) => (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>{schedule.poleCode || schedule.parkCode || '—'}</Table.Td>
                      <Table.Td>{schedule.description}</Table.Td>
                      <Table.Td>{schedule.frequency}</Table.Td>
                      <Table.Td>
                        {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        <Badge>{schedule.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {schedule.cost && schedule.cost > 0
                          ? `$${parseFloat(schedule.cost).toFixed(2)}`
                          : schedule.estimatedCost && schedule.estimatedCost > 0
                          ? `$${parseFloat(schedule.estimatedCost).toFixed(2)}`
                          : '-'}
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => {
                            if (schedule.issueId) {
                              setSelectedIssueId(schedule.issueId);
                              setIssueModalOpened(true);
                            } else {
                              notifications.show({
                                title: 'No Issue',
                                message: 'This maintenance record has no associated issue',
                                color: 'gray',
                              });
                            }
                          }}
                          title={schedule.issueId ? "View Issue" : "No associated issue"}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {schedule.status === 'REQUESTED' && (
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteClick(schedule)}
                              title="Delete Schedule"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                          {['REQUESTED', 'STARTED', 'PAUSED'].includes(schedule.status) && (
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => handleEditScheduleClick(schedule)}
                            >
                              {schedule.status === 'STARTED' || schedule.status === 'PAUSED' ? 'Update Status' : 'Edit'}
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

      </Tabs>

      {/* Create Schedule Modal */}
      <Modal
        opened={createScheduleOpened}
        onClose={() => {
          setCreateScheduleOpened(false);
          scheduleForm.reset();
        }}
        title="Create Maintenance Schedule"
        size="lg"
        centered
      >
        <form onSubmit={scheduleForm.onSubmit(handleCreateSchedule)}>
          <Stack>
            <Select
              label="Maintenance Type"
              data={[
                { value: 'issue', label: 'Related to Issue' },
                { value: 'direct', label: 'Direct Maintenance (No Issue)' },
              ]}
              value={scheduleForm.values.maintenanceType}
              onChange={(value) => {
                scheduleForm.setFieldValue('maintenanceType', value || 'issue');
                // Clear related fields when switching type
                if (value === 'direct') {
                  scheduleForm.setFieldValue('issueId', '');
                } else {
                  scheduleForm.setFieldValue('poleCode', '');
                  scheduleForm.setFieldValue('parkCode', '');
                }
              }}
            />

            {scheduleForm.values.maintenanceType === 'issue' ? (
              <Select
                label="Issue"
                placeholder="Select related issue"
                data={issueOptions}
                searchable
                required
                value={scheduleForm.values.issueId}
                onChange={(value) => {
                  const selected = issueOptions.find((opt: any) => opt.value === value);
                  scheduleForm.setFieldValue('issueId', value || '');
                  if (selected?.issueType === 'park') {
                    scheduleForm.setFieldValue('parkCode', selected?.parkCode || '');
                    scheduleForm.setFieldValue('poleCode', '');
                  } else {
                    scheduleForm.setFieldValue('poleCode', selected?.poleCode || '');
                    scheduleForm.setFieldValue('parkCode', '');
                  }
                }}
              />
            ) : (
              <>
                <Select
                  label="Select Type"
                  data={[
                    { value: 'pole', label: 'Light Pole' },
                    { value: 'park', label: 'Public Park' },
                  ]}
                  value={scheduleForm.values.poleCode ? 'pole' : scheduleForm.values.parkCode ? 'park' : ''}
                  onChange={(value) => {
                    // Clear both when switching
                    scheduleForm.setFieldValue('poleCode', '');
                    scheduleForm.setFieldValue('parkCode', '');
                  }}
                  required
                />
                {scheduleForm.values.poleCode || scheduleForm.values.parkCode ? (
                  <Select
                    label={scheduleForm.values.poleCode ? 'Pole Code' : 'Park Code'}
                    placeholder={`Select a ${scheduleForm.values.poleCode ? 'pole' : 'park'}`}
                    data={scheduleForm.values.poleCode ? poleOptions : parkOptions}
                    searchable
                    required
                    value={scheduleForm.values.poleCode || scheduleForm.values.parkCode || ''}
                    onChange={(value) => {
                      if (scheduleForm.values.poleCode) {
                        scheduleForm.setFieldValue('poleCode', value || '');
                        scheduleForm.setFieldValue('parkCode', '');
                      } else {
                        scheduleForm.setFieldValue('parkCode', value || '');
                        scheduleForm.setFieldValue('poleCode', '');
                      }
                    }}
                  />
                ) : (
                  <Select
                    label="Asset Type"
                    placeholder="Select Light Pole or Public Park above first"
                    data={[]}
                    disabled
                  />
                )}
              </>
            )}
            <TextInput
              label="Description"
              placeholder="Monthly inspection"
              required
              {...scheduleForm.getInputProps('description')}
            />
            <TextInput
              label="Start Date"
              type="date"
              required
              {...scheduleForm.getInputProps('startDate')}
            />
            <TextInput
              label="End Date (optional)"
              type="date"
              {...scheduleForm.getInputProps('endDate')}
            />
            <Select
              label="Status"
              data={SCHEDULE_STATUSES}
              required
              {...scheduleForm.getInputProps('status')}
            />
            <NumberInput
              label="Estimated Cost (optional)"
              placeholder="100"
              min={0}
              value={
                scheduleForm.values.estimatedCost === undefined || scheduleForm.values.estimatedCost === null
                  ? undefined
                  : Number(scheduleForm.values.estimatedCost)
              }
              onChange={(value) => {
                if (value === '' || value === null) {
                  scheduleForm.setFieldValue('estimatedCost', undefined);
                } else {
                  scheduleForm.setFieldValue('estimatedCost', Number(value));
                }
              }}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setCreateScheduleOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        opened={editScheduleOpened}
        onClose={() => {
          setEditScheduleOpened(false);
          setSelectedSchedule(null);
        }}
        title="Edit Maintenance Schedule"
        size="lg"
        centered
      >
        <form onSubmit={editScheduleForm.onSubmit(handleEditScheduleSubmit)}>
          <Stack>
            {selectedSchedule && (
              <Group gap="xs">
                <Badge color="blue">{selectedSchedule.poleCode || selectedSchedule.parkCode || '—'}</Badge>
                <Badge>{selectedSchedule.frequency}</Badge>
              </Group>
            )}
            <TextInput
              label="Description"
              required
              {...editScheduleForm.getInputProps('description')}
            />
            <TextInput
              label="Start Date"
              type="date"
              required
              {...editScheduleForm.getInputProps('startDate')}
            />
            <TextInput
              label="End Date (optional)"
              type="date"
              {...editScheduleForm.getInputProps('endDate')}
            />
            <Select
              label="Status"
              data={SCHEDULE_STATUSES}
              required
              {...editScheduleForm.getInputProps('status')}
            />
            <NumberInput
              label="Estimated Cost (optional)"
              min={0}
              value={
                editScheduleForm.values.estimatedCost === undefined || editScheduleForm.values.estimatedCost === null
                  ? undefined
                  : Number(editScheduleForm.values.estimatedCost)
              }
              onChange={(value) => {
                if (value === '' || value === null) {
                  editScheduleForm.setFieldValue('estimatedCost', undefined);
                } else {
                  editScheduleForm.setFieldValue('estimatedCost', Number(value));
                }
              }}
            />
            <Textarea
              label="Remark"
              placeholder="Add remark (required for Paused/Completed)"
              {...editScheduleForm.getInputProps('remark')}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => { setEditScheduleOpened(false); setSelectedSchedule(null); }}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View Issue Modal */}
      <Modal
        opened={issueModalOpened}
        onClose={() => {
          setIssueModalOpened(false);
          setSelectedIssueId(null);
        }}
        title="Associated Issue"
        size="lg"
        centered
      >
        {issueLoading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : selectedIssue ? (
          <Stack>
            <Paper p="md" withBorder>
              <Group mb="xs">
                <Text fw={700}>{selectedIssue.type === 'park' ? 'Park' : 'Pole'} Code:</Text>
                <Badge color="blue">{selectedIssue.park?.code || selectedIssue.pole?.code || selectedIssue.parkCode || selectedIssue.poleCode || 'N/A'}</Badge>
              </Group>
              <Group mb="xs">
                <Text fw={700}>Severity:</Text>
                <Badge
                  color={
                    selectedIssue.severity === 'LOW'
                      ? 'green'
                      : selectedIssue.severity === 'MEDIUM'
                      ? 'yellow'
                      : selectedIssue.severity === 'HIGH'
                      ? 'orange'
                      : 'red'
                  }
                >
                  {selectedIssue.severity}
                </Badge>
              </Group>
              <Text fw={700} mb="xs">Description:</Text>
              <Text mb="xs">{selectedIssue.description}</Text>
              {selectedIssue.resolutionNotes && (
                <>
                  <Text fw={700} mb="xs">Resolution Notes:</Text>
                  <Text mb="xs">{selectedIssue.resolutionNotes}</Text>
                </>
              )}
              <Group mt="xs">
                <Text fw={700}>Reported By:</Text>
                <Text>{selectedIssue.reportedBy?.fullName || 'N/A'}</Text>
              </Group>
              <Group mt="xs">
                <Text fw={700}>Created:</Text>
                <Text>{new Date(selectedIssue.createdAt).toLocaleDateString()}</Text>
              </Group>
              {selectedIssue.updatedAt && (
                <Group mt="xs">
                  <Text fw={700}>Updated:</Text>
                  <Text>{new Date(selectedIssue.updatedAt).toLocaleDateString()}</Text>
                </Group>
              )}
            </Paper>
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => {
                setIssueModalOpened(false);
                setSelectedIssueId(null);
              }}>
                Close
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" p="xl">
            Issue not found
          </Text>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setScheduleToDelete(null);
        }}
        title="Delete Maintenance Schedule"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete this maintenance schedule?
          </Text>
          {scheduleToDelete && (
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={700}>Pole/Park Code:</Text>
              <Text size="sm">{scheduleToDelete.poleCode || scheduleToDelete.parkCode || '—'}</Text>
              <Text size="sm" fw={700} mt="xs">Description:</Text>
              <Text size="sm">{scheduleToDelete.description}</Text>
              <Text size="sm" fw={700} mt="xs">Status:</Text>
              <Badge>{scheduleToDelete.status}</Badge>
            </Paper>
          )}
          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setScheduleToDelete(null);
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

