import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Table,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import { IconEdit, IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

export default function InventoryDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/inventory/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  const { data: transactions } = useQuery({
    queryKey: ['inventory-transactions', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/inventory/${code}/transactions?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container size="md" py="xl">
        <Text>Inventory item not found</Text>
      </Container>
    );
  }

  const getStockStatus = () => {
    if (item.currentStock <= item.minimumThreshold) {
      return { color: 'red', label: 'Low Stock' };
    }
    if (item.currentStock <= item.minimumThreshold * 1.5) {
      return { color: 'yellow', label: 'Warning' };
    }
    return { color: 'green', label: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/inventory')}
        >
          Back to Inventory
        </Button>
        {user?.role === 'ADMIN' && (
          <Button
            leftSection={<IconEdit size={16} />}
            onClick={() => navigate(`/inventory/${code}/edit`)}
          >
            Edit
          </Button>
        )}
      </Group>

      <Title mb="md" order={1}>{item.name}</Title>

      <Paper withBorder p="md" mb="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>Code:</Text>
            <Text>{item.code}</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Category:</Text>
            <Text>{item.category?.name || 'No category'}</Text>
          </Group>
          <Divider />
          {item.description && (
            <>
              <Group justify="space-between" align="flex-start">
                <Text fw={600}>Description:</Text>
                <Text style={{ maxWidth: '70%', textAlign: 'right' }}>{item.description}</Text>
              </Group>
              <Divider />
            </>
          )}
          <Group justify="space-between">
            <Text fw={600}>Unit of Measure:</Text>
            <Text>{item.unitOfMeasure}</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Current Stock:</Text>
            <Text fw={700} size="lg">{item.currentStock} {item.unitOfMeasure}</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Minimum Threshold:</Text>
            <Text>{item.minimumThreshold} {item.unitOfMeasure}</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Stock Status:</Text>
            <Badge color={stockStatus.color} size="lg">{stockStatus.label}</Badge>
          </Group>
          <Divider />
          {item.unitCost && (
            <>
              <Group justify="space-between">
                <Text fw={600}>Unit Cost:</Text>
                <Text>{Number(item.unitCost).toFixed(2)}</Text>
              </Group>
              <Divider />
            </>
          )}
          {item.supplierName && (
            <>
              <Group justify="space-between">
                <Text fw={600}>Supplier:</Text>
                <Text>{item.supplierName}</Text>
              </Group>
              {item.supplierContact && (
                <>
                  <Group justify="space-between">
                    <Text fw={600}>Supplier Contact:</Text>
                    <Text>{item.supplierContact}</Text>
                  </Group>
                </>
              )}
              <Divider />
            </>
          )}
          <Group justify="space-between">
            <Text fw={600}>Status:</Text>
            <Badge color={item.isActive ? 'green' : 'gray'}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Title order={3} mb="md">Transaction History</Title>
        {transactions && transactions.length > 0 ? (
          <Table.ScrollContainer minWidth={400}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Quantity</Table.Th>
                  <Table.Th>Stock Before</Table.Th>
                  <Table.Th>Stock After</Table.Th>
                  <Table.Th>User</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {transactions.map((transaction: any) => (
                  <Table.Tr key={transaction.id}>
                    <Table.Td>{new Date(transaction.createdAt).toLocaleDateString()}</Table.Td>
                    <Table.Td>
                      <Badge size="sm">{transaction.type}</Badge>
                    </Table.Td>
                    <Table.Td>{transaction.quantity}</Table.Td>
                    <Table.Td>{transaction.stockBefore}</Table.Td>
                    <Table.Td>{transaction.stockAfter}</Table.Td>
                    <Table.Td>{transaction.user?.fullName || 'System'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Text c="dimmed">No transactions found</Text>
        )}
      </Paper>
    </Container>
  );
}


