import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Title,
  Card,
  Table,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Group,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconEye } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';

interface DamagedComponent {
  id: string;
  name: string;
  description?: string;
  componentType: string;
  minorCost: number;
  moderateCost: number;
  severeCost: number;
  totalLossCost: number;
  isActive: boolean;
  sortOrder: number;
}

export default function DamagedComponentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [editingComponent, setEditingComponent] = useState<DamagedComponent | null>(null);

  const { data: components, isLoading } = useQuery({
    queryKey: ['damaged-components'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/damaged-components', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.post('http://localhost:3011/api/v1/damaged-components', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-components'] });
      notifications.show({ title: 'Success', message: 'Component created', color: 'green' });
      close();
      setEditingComponent(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create component',
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(`http://localhost:3011/api/v1/damaged-components/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-components'] });
      notifications.show({ title: 'Success', message: 'Component updated', color: 'green' });
      close();
      setEditingComponent(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update component',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem('access_token');
      return axios.delete(`http://localhost:3011/api/v1/damaged-components/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-components'] });
      notifications.show({ title: 'Success', message: 'Component deleted', color: 'green' });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete component',
        color: 'red',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(`http://localhost:3011/api/v1/damaged-components/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-components'] });
    },
  });

  const handleSubmit = (values: any) => {
    if (editingComponent) {
      updateMutation.mutate({ id: editingComponent.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (component: DamagedComponent) => {
    setEditingComponent(component);
    open();
  };

  const handleCreate = () => {
    setEditingComponent(null);
    open();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate(id);
  };

  if (!user?.role?.includes('ADMIN')) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Access Denied">
          Only administrators can manage damaged components.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title>Damaged Components Management</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          Add Component
        </Button>
      </Group>

      <Card withBorder>
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Cost</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {components?.map((component: DamagedComponent) => (
                <Table.Tr key={component.id}>
                  <Table.Td>
                    <div>
                      <div style={{ fontWeight: 500 }}>{component.name}</div>
                      {component.description && (
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {component.description}
                        </div>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>${component.minorCost}</Table.Td>
                  <Table.Td>
                    <Badge color={component.isActive ? 'green' : 'red'}>
                      {component.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleEdit(component)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color={component.isActive ? 'orange' : 'green'}
                        onClick={() => handleToggleActive(component.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(component.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Card>

      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingComponent(null);
        }}
        title={editingComponent ? 'Edit Component' : 'Add Component'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const cost = parseFloat(formData.get('cost') as string);
            const values = {
              name: formData.get('name'),
              description: formData.get('description'),
              componentType: 'OTHER', // Default to OTHER since we're not using component types
              minorCost: cost,
              moderateCost: cost,
              severeCost: cost,
              totalLossCost: cost,
              sortOrder: 0, // Default sort order
              isActive: true,
            };
            handleSubmit(values);
          }}
        >
          <TextInput
            label="Name"
            name="name"
            required
            defaultValue={editingComponent?.name || ''}
          />

          <Textarea
            label="Description"
            name="description"
            defaultValue={editingComponent?.description || ''}
            mt="md"
          />

          <NumberInput
            label="Cost"
            name="cost"
            required
            min={0}
            defaultValue={editingComponent?.minorCost || 0}
            mt="md"
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingComponent ? 'Update' : 'Create'}
            </Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
}
