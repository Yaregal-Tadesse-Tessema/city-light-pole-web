import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Table,
  Title,
  Badge,
  Text,
  Button,
  Group,
  Select,
  MultiSelect,
  Modal,
  Stack,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  TextInput,
  PasswordInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUserCog, IconPlus, IconX, IconEdit } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const SYSTEM_ROLES = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN' },
  { value: 'MAINTENANCE_ENGINEER', label: 'MAINTENANCE_ENGINEER' },
  { value: 'SUPERVISOR_VIEWER', label: 'SUPERVISOR_VIEWER' },
  { value: 'INSPECTOR', label: 'INSPECTOR' },
  { value: 'SUPERVISOR', label: 'SUPERVISOR' },
  { value: 'FINANCE', label: 'FINANCE' },
];

const USER_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' },
];

export default function UsersPage() {
  const { t } = useTranslation('users');
  const { t: tCommon } = useTranslation('common');
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'SYSTEM_ADMINISTRATOR';

  const createForm = useForm({
    initialValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'SUPERVISOR_VIEWER',
    },
    validate: {
      fullName: (value) => (!value ? t('validation.fullNameRequired') : null),
      email: (value) => (!value ? t('validation.emailRequired') : null),
      password: (value) =>
        value.length < 6 ? t('validation.passwordLength') : null,
      role: (value) => (!value ? t('validation.roleRequired') : null),
    },
  });

  const updateForm = useForm({
    initialValues: {
      fullName: '',
      email: '',
      phone: '',
      role: 'SUPERVISOR_VIEWER',
      status: 'ACTIVE',
    },
    validate: {
      fullName: (value) => (!value ? t('validation.fullNameRequired') : null),
      email: (value) => (!value ? t('validation.emailRequired') : null),
      role: (value) => (!value ? t('validation.roleRequired') : null),
      status: (value) => (!value ? t('validation.statusRequired') : null),
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    enabled: !loading && isAdmin,
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const usersWithRoles = await Promise.all(
        res.data.map(async (u: any) => {
          try {
            const rolesRes = await axios.get(
              `http://localhost:3011/api/v1/roles/user/${u.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            return { ...u, roles: rolesRes.data };
          } catch {
            return { ...u, roles: [] };
          }
        }),
      );

      return usersWithRoles;
    },
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    enabled: !loading && isAdmin,
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: any) => {
      const token = localStorage.getItem('access_token');
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role: values.role,
      };
      const res = await axios.post('http://localhost:3011/api/v1/users', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.createSuccess'),
        color: 'green',
      });
      setCreateModalOpened(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.createError'),
        color: 'red',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const token = localStorage.getItem('access_token');
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        role: values.role,
        status: values.status,
      };
      const res = await axios.patch(
        `http://localhost:3011/api/v1/users/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data;
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.updateSuccess'),
        color: 'green',
      });
      setUpdateModalOpened(false);
      setSelectedUser(null);
      updateForm.reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.updateError'),
        color: 'red',
      });
    },
  });

  const assignMultipleRolesMutation = useMutation({
    mutationFn: async ({
      userId,
      roleIds,
    }: {
      userId: string;
      roleIds: string[];
    }) => {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:3011/api/v1/roles/assign-multiple',
        {
          userId,
          roleIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.rolesAssigned', { count: selectedRoles.length }),
        color: 'green',
      });
      setRoleModalOpened(false);
      setSelectedUser(null);
      setSelectedRoles([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.assignRolesError'),
        color: 'red',
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:3011/api/v1/roles/${userId}/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.removeRoleSuccess'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.removeRoleError'),
        color: 'red',
      });
    },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'SYSTEM_ADMIN':
        return 'grape';
      case 'MAINTENANCE_ENGINEER':
        return 'blue';
      case 'SUPERVISOR_VIEWER':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'green' : 'red';
  };

  const openRoleModal = (u: any) => {
    setSelectedUser(u);
    setRoleModalOpened(true);
  };

  const openUpdateModal = (u: any) => {
    setSelectedUser(u);
    updateForm.setValues({
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'SUPERVISOR_VIEWER',
      status: u.status || 'ACTIVE',
    });
    setUpdateModalOpened(true);
  };

  const handleAssignRole = () => {
    if (selectedUser && selectedRoles.length > 0) {
      assignMultipleRolesMutation.mutate({
        userId: selectedUser.id,
        roleIds: selectedRoles,
      });
    }
  };

  if (loading) {
    return (
      <Container size="xl" py={{ base: 'md', sm: 'xl' }}>
        <Text c="dimmed">{tCommon('loading')}</Text>
      </Container>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }}>
        <Title size="h2">{t('title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpened(true)}>
          {t('actions.createUser')}
        </Button>
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={900}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('table.name')}</Table.Th>
                <Table.Th>{t('table.email')}</Table.Th>
                <Table.Th>{t('table.phone')}</Table.Th>
                <Table.Th>{t('table.systemRole')}</Table.Th>
                <Table.Th>{t('table.notificationRoles')}</Table.Th>
                <Table.Th>{t('table.status')}</Table.Th>
                <Table.Th>{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>{tCommon('loading')}</Table.Td>
                </Table.Tr>
              ) : users?.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>{t('emptyState')}</Table.Td>
                </Table.Tr>
              ) : (
                users?.map((u: any) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.fullName}</Table.Td>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td>{u.phone || t('labels.notAvailable')}</Table.Td>
                    <Table.Td>
                      <Badge color={getRoleColor(u.role)}>{u.role.replace('_', ' ')}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {u.roles?.length ? (
                          u.roles.map((role: any) => (
                            <Badge key={role.id} color="blue" variant="light">
                              {role.displayName}
                              <ActionIcon
                                size="xs"
                                color="red"
                                variant="transparent"
                                ml={4}
                                onClick={() =>
                                  removeRoleMutation.mutate({
                                    userId: u.id,
                                    roleId: role.id,
                                  })
                                }
                              >
                                <IconX size={12} />
                              </ActionIcon>
                            </Badge>
                          ))
                        ) : (
                          <Text size="sm" c="dimmed">
                            {t('labels.noNotificationRoles')}
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(u.status)}>{u.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label={t('actions.editUser')}>
                          <ActionIcon color="grape" variant="light" onClick={() => openUpdateModal(u)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('actions.manageNotificationRoles')}>
                          <ActionIcon color="blue" variant="light" onClick={() => openRoleModal(u)}>
                            <IconUserCog size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal
        opened={createModalOpened}
        onClose={() => {
          setCreateModalOpened(false);
          createForm.reset();
        }}
        title={t('createModal.title')}
        size="md"
      >
        <form onSubmit={createForm.onSubmit((values) => createUserMutation.mutate(values))}>
          <Stack>
            <TextInput label={t('form.fullName')} required {...createForm.getInputProps('fullName')} />
            <TextInput label={t('form.email')} required type="email" {...createForm.getInputProps('email')} />
            <TextInput label={t('form.phoneOptional')} {...createForm.getInputProps('phone')} />
            <PasswordInput label={t('form.password')} required {...createForm.getInputProps('password')} />
            <Select label={t('form.systemRole')} data={SYSTEM_ROLES} required {...createForm.getInputProps('role')} />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setCreateModalOpened(false)}>
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" loading={createUserMutation.isPending}>
                {t('actions.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={updateModalOpened}
        onClose={() => {
          setUpdateModalOpened(false);
          setSelectedUser(null);
          updateForm.reset();
        }}
        title={t('updateModal.title', {
          name: selectedUser?.fullName ? `: ${selectedUser.fullName}` : '',
        })}
        size="md"
      >
        <form
          onSubmit={updateForm.onSubmit((values) => {
            if (!selectedUser) return;
            updateUserMutation.mutate({ id: selectedUser.id, values });
          })}
        >
          <Stack>
            <TextInput label={t('form.fullName')} required {...updateForm.getInputProps('fullName')} />
            <TextInput label={t('form.email')} required type="email" {...updateForm.getInputProps('email')} />
            <TextInput label={t('form.phoneOptional')} {...updateForm.getInputProps('phone')} />
            <Select label={t('form.systemRole')} data={SYSTEM_ROLES} required {...updateForm.getInputProps('role')} />
            <Select label={t('form.status')} data={USER_STATUSES} required {...updateForm.getInputProps('status')} />
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setUpdateModalOpened(false);
                  setSelectedUser(null);
                  updateForm.reset();
                }}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" loading={updateUserMutation.isPending}>
                {t('actions.update')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={roleModalOpened}
        onClose={() => {
          setRoleModalOpened(false);
          setSelectedUser(null);
          setSelectedRoles([]);
        }}
        title={t('rolesModal.title', { name: selectedUser?.fullName })}
        size="md"
      >
        <LoadingOverlay visible={rolesLoading} />
        <Stack>
          <Text size="sm" c="dimmed">
            {t('rolesModal.helpText')}
          </Text>

          <MultiSelect
            label={t('rolesModal.selectLabel')}
            placeholder={t('rolesModal.selectPlaceholder')}
            data={
              roles?.map((role: any) => ({
                value: role.id,
                label: role.displayName,
                description: role.description,
              })) || []
            }
            value={selectedRoles}
            onChange={setSelectedRoles}
            clearable
            maxDropdownHeight={200}
            searchable
          />

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => {
                setRoleModalOpened(false);
                setSelectedUser(null);
                setSelectedRoles([]);
              }}
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              onClick={handleAssignRole}
              loading={assignMultipleRolesMutation.isPending}
              disabled={selectedRoles.length === 0}
            >
              {t('actions.assignRoles', { count: selectedRoles.length })}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
