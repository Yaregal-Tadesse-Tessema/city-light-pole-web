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
} from '@mantine/core';
import { IconUserCog, IconPlus, IconX } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [roleModalOpened, setRoleModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Temporarily disabled admin check for testing
  // if (user?.role !== 'ADMIN') {
  //   return <Navigate to="/dashboard" replace />;
  // }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        res.data.map(async (user: any) => {
          try {
            const rolesRes = await axios.get(`http://localhost:3011/api/v1/roles/user/${user.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return { ...user, roles: rolesRes.data };
          } catch (error) {
            return { ...user, roles: [] };
          }
        })
      );
      return usersWithRoles;
    },
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
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

  const assignMultipleRolesMutation = useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:3011/api/v1/roles/assign-multiple', {
        userId,
        roleIds,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: `${selectedRoles.length} role(s) assigned successfully`,
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
        title: 'Error',
        message: error.response?.data?.message || 'Failed to assign roles',
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
        title: 'Success',
        message: 'Role removed successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to remove role',
        color: 'red',
      });
    },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
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

  const openRoleModal = (user: any) => {
    setSelectedUser(user);
    setRoleModalOpened(true);
  };

  const handleAssignRole = () => {
    if (selectedUser && selectedRoles.length > 0) {
      // Assign all selected roles in a single API call
      assignMultipleRolesMutation.mutate({
        userId: selectedUser.id,
        roleIds: selectedRoles,
      });
    }
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Users</Title>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>System Role</Table.Th>
                <Table.Th>Notification Roles</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>Loading...</Table.Td>
                </Table.Tr>
              ) : users?.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>No users found</Table.Td>
                </Table.Tr>
              ) : (
                users?.map((u: any) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.fullName}</Table.Td>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td>
                      <Badge color={getRoleColor(u.role)}>{u.role.replace('_', ' ')}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {u.roles?.map((role: any) => (
                          <Badge key={role.id} color="blue" variant="light">
                            {role.displayName}
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="transparent"
                              ml={4}
                              onClick={() => removeRoleMutation.mutate({
                                userId: u.id,
                                roleId: role.id,
                              })}
                            >
                              <IconX size={12} />
                            </ActionIcon>
                          </Badge>
                        )) || <Text size="sm" c="dimmed">No notification roles</Text>}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(u.status)}>{u.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Manage notification roles">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => openRoleModal(u)}
                        >
                          <IconUserCog size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Role Assignment Modal */}
      <Modal
        opened={roleModalOpened}
        onClose={() => {
          setRoleModalOpened(false);
          setSelectedUser(null);
          setSelectedRoles([]);
        }}
        title={`Manage Roles for ${selectedUser?.fullName}`}
        size="md"
      >
        <LoadingOverlay visible={rolesLoading} />
        <Stack>
          <Text size="sm" c="dimmed">
            Assign notification roles to this user. Select multiple roles to assign them all at once. They will receive notifications based on their assigned roles.
          </Text>

          <MultiSelect
            label="Select Roles to Assign"
            placeholder="Choose roles"
            data={roles?.map((role: any) => ({
              value: role.id,
              label: role.displayName,
              description: role.description,
            })) || []}
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
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              loading={assignMultipleRolesMutation.isPending}
              disabled={selectedRoles.length === 0}
            >
              Assign Roles ({selectedRoles.length})
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}


