import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Loader,
  Center,
  Badge,
  Stack,
  Card,
} from '@mantine/core';
import { IconEdit, IconArrowLeft } from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!id,
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

  if (!category) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Text c="dimmed">Category not found</Text>
        </Center>
      </Container>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Group gap="md">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/categories')}
          >
            Back to Categories
          </Button>
          <Title order={1}>{category.name}</Title>
        </Group>
        {isAdmin && (
          <Button
            leftSection={<IconEdit size={16} />}
            onClick={() => navigate(`/categories/${id}/edit`)}
          >
            Edit Category
          </Button>
        )}
      </Group>

      <Stack>
        <Card withBorder p="lg">
          <Title order={3} mb="md">Category Information</Title>
          <Group mb="sm">
            <Text fw={600} w={120}>Name:</Text>
            <Text>{category.name}</Text>
          </Group>
          <Group mb="sm">
            <Text fw={600} w={120}>Description:</Text>
            <Text>{category.description || 'No description provided'}</Text>
          </Group>
          <Group mb="sm">
            <Text fw={600} w={120}>Status:</Text>
            <Badge color={category.isActive ? 'green' : 'red'}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Group>
          <Group mb="sm">
            <Text fw={600} w={120}>Created:</Text>
            <Text>{new Date(category.createdAt).toLocaleString()}</Text>
          </Group>
          <Group>
            <Text fw={600} w={120}>Updated:</Text>
            <Text>{new Date(category.updatedAt).toLocaleString()}</Text>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}

