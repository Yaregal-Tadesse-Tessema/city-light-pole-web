import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  Title,
  Button,
  Group,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Text,
  Modal,
  TextInput,
  Stack,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function CategoryListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:3011/api/v1/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Category deleted successfully',
        color: 'green',
      });
      refetch();
      setDeleteModalOpened(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete category',
        color: 'red',
      });
    },
  });

  const handleDeleteClick = (category: any) => {
    setSelectedCategory(category);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Categories</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/categories/new')}
          >
            Add Category
          </Button>
        )}
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Center>
                      <Loader size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : !categories || categories.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center">No categories found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                categories.map((category: any) => (
                  <Table.Tr key={category.id}>
                    <Table.Td>
                      <Text fw={600}>{category.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
                        {category.description || 'No description'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={category.isActive ? 'green' : 'red'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => navigate(`/categories/${category.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        {isAdmin && (
                          <>
                            <ActionIcon
                              variant="light"
                              color="orange"
                              onClick={() => navigate(`/categories/${category.id}/edit`)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteClick(category)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedCategory(null);
        }}
        title="Delete Category"
        size="sm"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete the category "{selectedCategory?.name}"?
            This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpened(false);
                setSelectedCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

