import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

const SCHEDULE_STATUSES = ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'];
const LOG_STATUSES = ['REQUESTED', 'STARTED', 'PAUSED', 'COMPLETED'];

export default function MaintenancePage() {
  const [createScheduleOpened, setCreateScheduleOpened] = useState(false);
  const [createLogOpened, setCreateLogOpened] = useState(false);
  const [editScheduleOpened, setEditScheduleOpened] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['maintenance', 'schedules'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/maintenance/schedules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['maintenance', 'logs'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/maintenance/logs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: issues } = useQuery({
    queryKey: ['issues', 'for-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/issues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const issueOptions =
    issues?.map((issue: any) => ({
      value: issue.id,
      label: `${issue.pole?.code || issue.poleCode || 'N/A'} – ${issue.description}`,
      poleCode: issue.pole?.code || issue.poleCode,
    })) || [];

  const scheduleForm = useForm({
    initialValues: {
      poleCode: '',
      issueId: '',
      frequency: 'MONTHLY', // kept as default and hidden from UI
      description: '',
      startDate: '',
      endDate: '',
      status: 'REQUESTED',
      estimatedCost: undefined as number | undefined,
      remark: '',
    },
  });

  const logForm = useForm({
    initialValues: {
      poleCode: '',
      scheduleId: '',
      description: '',
      status: 'REQUESTED',
      scheduledDate: '',
      completedDate: '',
      cost: undefined as number | undefined,
      notes: '',
    },
    validate: {
      notes: (value, values) =>
        values.status === 'PAUSED' && !value?.trim()
          ? 'Notes are required when status is PAUSED'
          : null,
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
      const payload = {
        ...values,
        estimatedCost:
          values.estimatedCost === undefined || values.estimatedCost === null || values.estimatedCost === ''
            ? undefined
            : Number(values.estimatedCost),
        remark: values.remark?.trim() || undefined,
      };
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

  const handleCreateLog = async (values: any) => {
    if (values.status === 'PAUSED' && !values.notes?.trim()) {
      logForm.setFieldError('notes', 'Notes are required when status is PAUSED');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:3011/api/v1/maintenance/logs', values, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      notifications.show({
        title: 'Success',
        message: 'Maintenance log created',
        color: 'green',
      });
      setCreateLogOpened(false);
      logForm.reset();
      refetchLogs();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create log',
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
      const payload = {
        ...values,
        estimatedCost:
          values.estimatedCost === undefined || values.estimatedCost === null || values.estimatedCost === ''
            ? undefined
            : Number(values.estimatedCost),
        remark: values.remark?.trim() || undefined,
      };
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

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Maintenance</Title>
        <Group>
          <Button variant="light" onClick={() => setCreateScheduleOpened(true)}>
            Create Schedule
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="schedules">
        <Tabs.List>
          <Tabs.Tab value="schedules">Schedules</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="schedules" pt="xl">
          <Paper withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Pole Code</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Frequency</Table.Th>
                  <Table.Th>Start Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Est. Cost</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedulesLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>Loading...</Table.Td>
                  </Table.Tr>
                ) : schedules?.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>No schedules found</Table.Td>
                  </Table.Tr>
                ) : (
                  schedules?.map((schedule: any) => (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>{schedule.poleCode || '—'}</Table.Td>
                      <Table.Td>{schedule.description}</Table.Td>
                      <Table.Td>{schedule.frequency}</Table.Td>
                      <Table.Td>
                        {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        <Badge>{schedule.status}</Badge>
                      </Table.Td>
                      <Table.Td>{schedule.estimatedCost ? `$${schedule.estimatedCost}` : '—'}</Table.Td>
                      <Table.Td>
                        {['REQUESTED', 'STARTED', 'PAUSED'].includes(schedule.status) && (
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => handleEditScheduleClick(schedule)}
                          >
                            {schedule.status === 'STARTED' || schedule.status === 'PAUSED' ? 'Update Status' : 'Edit'}
                          </Button>
                        )}
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
      <Modal opened={createScheduleOpened} onClose={() => setCreateScheduleOpened(false)} title="Create Maintenance Schedule">
        <form onSubmit={scheduleForm.onSubmit(handleCreateSchedule)}>
          <Stack>
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
                scheduleForm.setFieldValue('poleCode', selected?.poleCode || '');
              }}
            />
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
      <Modal opened={editScheduleOpened} onClose={() => { setEditScheduleOpened(false); setSelectedSchedule(null); }} title="Edit Maintenance Schedule">
        <form onSubmit={editScheduleForm.onSubmit(handleEditScheduleSubmit)}>
          <Stack>
            {selectedSchedule && (
              <Group gap="xs">
                <Badge color="blue">{selectedSchedule.poleCode || '—'}</Badge>
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

      {/* Create Log Modal */}
      <Modal opened={createLogOpened} onClose={() => setCreateLogOpened(false)} title="Create Maintenance Log">
        <form onSubmit={logForm.onSubmit(handleCreateLog)}>
          <Stack>
            <TextInput
              label="Pole Code"
              placeholder="LP-001"
              required
              {...logForm.getInputProps('poleCode')}
            />
            <TextInput
              label="Schedule ID (optional)"
              placeholder="Related schedule id"
              {...logForm.getInputProps('scheduleId')}
            />
            <TextInput
              label="Description"
              placeholder="Replace lamp"
              required
              {...logForm.getInputProps('description')}
            />
            <Select
              label="Status"
              data={LOG_STATUSES}
              required
              {...logForm.getInputProps('status')}
            />
            <TextInput
              label="Scheduled Date"
              type="date"
              required
              {...logForm.getInputProps('scheduledDate')}
            />
            <TextInput
              label="Completed Date (optional)"
              type="date"
              {...logForm.getInputProps('completedDate')}
            />
            <NumberInput
              label="Cost (optional)"
              min={0}
              step={10}
              precision={2}
              {...logForm.getInputProps('cost')}
            />
            <TextInput
              label="Notes (optional)"
              placeholder="Extra details"
              {...logForm.getInputProps('notes')}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setCreateLogOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

