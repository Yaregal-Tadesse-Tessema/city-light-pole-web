import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Stack,
  Title,
  Alert,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/categories', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Success',
        message: 'Category created successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create category';
      setApiError(errorMessage);

      if (errorMessage.includes('already exists')) {
        form.setFieldError('name', 'This category name already exists');
      }

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setApiError(null);
    const apiData: any = {
      name: values.name,
    };

    if (values.description) apiData.description = values.description;

    createMutation.mutate(apiData);
  });

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} order={1}>Create Category</Title>

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
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Describe what this category contains..."
              minRows={3}
              {...form.getInputProps('description')}
            />

            <Button.Group>
              <Button variant="outline" onClick={() => navigate('/categories')}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create Category
              </Button>
            </Button.Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

