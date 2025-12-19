import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Stack,
  Title,
  Loader,
  Center,
  Alert,
  Textarea,
  Switch,
  Group,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

export default function UpdateCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

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

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
      });
    }
  }, [category]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/categories/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Category updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      navigate('/categories');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update category';
      setApiError(errorMessage);

      if (errorMessage.includes('already exists')) {
        setApiError('A category with this name already exists');
      }

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const apiData: any = {
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
    };

    updateMutation.mutate(apiData);
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} order={1}>Update Category</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title="Error" onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}

            <TextInput
              label="Category Name"
              placeholder="e.g., Light Bulbs"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Describe what this category contains..."
              minRows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Group justify="space-between">
              <div>
                <Title order={6}>Active Status</Title>
                <div style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                  Inactive categories won't appear in dropdowns
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onChange={(event) => setFormData({ ...formData, isActive: event.currentTarget.checked })}
              />
            </Group>

            <Button.Group>
              <Button variant="outline" onClick={() => navigate('/categories')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Category
              </Button>
            </Button.Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

