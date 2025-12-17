import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Table,
  Title,
  Badge,
  Text,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function UsersPage() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
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

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Users</Title>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>Loading...</Table.Td>
                </Table.Tr>
              ) : users?.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>No users found</Table.Td>
                </Table.Tr>
              ) : (
                users?.map((u: any) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.fullName}</Table.Td>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td>
                      <Badge color={getRoleColor(u.role)}>{u.role}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(u.status)}>{u.status}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Container>
  );
}


