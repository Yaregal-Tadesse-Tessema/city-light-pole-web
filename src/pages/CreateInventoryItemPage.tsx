import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  TextInput,
  NumberInput,
  Select,
  Button,
  Stack,
  Title,
  Group,
  Alert,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

const UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'meters', label: 'Meters' },
  { value: 'liters', label: 'Liters' },
  { value: 'kilograms', label: 'Kilograms' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'units', label: 'Units' },
];

export default function CreateInventoryItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get('http://localhost:3011/api/v1/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    retry: 1,
  });

  const categoryOptions = categories?.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  })) || [];



  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      description: '',
      categoryId: '',
      unitOfMeasure: 'pieces',
      currentStock: 0,
      minimumThreshold: 0,
      unitCost: undefined as number | undefined,
      supplierName: '',
      supplierContact: '',
      isActive: true,
    },
    validate: {
      code: (value) => (!value ? 'Code is required' : null),
      name: (value) => (!value ? 'Name is required' : null),
      categoryId: (value) => (!value ? 'Category is required' : null),
      currentStock: (value) => (value < 0 ? 'Stock cannot be negative' : null),
      minimumThreshold: (value) => (value < 0 ? 'Threshold cannot be negative' : null),
      unitCost: (value) => (value !== undefined && value < 0 ? 'Cost cannot be negative' : null),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/inventory', data, {
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
        message: 'Inventory item created successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate(`/inventory/${data.code}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create inventory item';
      setApiError(errorMessage);
      
      if (errorMessage.includes('code') && errorMessage.includes('already exists')) {
        form.setFieldError('code', 'This code is already in use');
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
      code: values.code,
      name: values.name,
      categoryId: values.categoryId,
      unitOfMeasure: values.unitOfMeasure,
      currentStock: values.currentStock,
      minimumThreshold: values.minimumThreshold,
      isActive: values.isActive,
    };

    if (values.description) apiData.description = values.description;
    if (values.unitCost !== undefined) apiData.unitCost = values.unitCost;
    if (values.supplierName) apiData.supplierName = values.supplierName;
    if (values.supplierContact) apiData.supplierContact = values.supplierContact;

    createMutation.mutate(apiData);
  });

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Create Inventory Item</Title>
        <Button variant="light" onClick={() => navigate('/categories')}>
          Manage Categories
        </Button>
      </Group>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title="Error" onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}

            <Group grow>
              <TextInput
                label="Code"
                placeholder="INV-001"
                required
                {...form.getInputProps('code')}
              />
              <TextInput
                label="Name"
                placeholder="LED Bulb 50W"
                required
                {...form.getInputProps('name')}
              />
            </Group>

            <TextInput
              label="Description"
              placeholder="Item description"
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                label="Category"
                placeholder={categoriesLoading ? "Loading categories..." : "Select a category"}
                data={categoryOptions}
                required
                searchable
                disabled={categoriesLoading}
                value={form.values.categoryId}
                onChange={(value) => form.setFieldValue('categoryId', value || '')}
                error={form.errors.categoryId || (categoriesError ? 'Failed to load categories' : undefined)}
              />
              <Select
                label="Unit of Measure"
                data={UNITS}
                required
                {...form.getInputProps('unitOfMeasure')}
              />
            </Group>

            <Group grow>
              <NumberInput
                label="Initial Stock"
                placeholder="0"
                min={0}
                {...form.getInputProps('currentStock')}
              />
              <NumberInput
                label="Minimum Threshold"
                placeholder="10"
                min={0}
                {...form.getInputProps('minimumThreshold')}
              />
            </Group>

            <NumberInput
              label="Unit Cost (Optional)"
              placeholder="25.50"
              min={0}
              precision={2}
              {...form.getInputProps('unitCost')}
            />

            <Group grow>
              <TextInput
                label="Supplier Name (Optional)"
                placeholder="Supplier name"
                {...form.getInputProps('supplierName')}
              />
              <TextInput
                label="Supplier Contact (Optional)"
                placeholder="Phone or email"
                {...form.getInputProps('supplierContact')}
              />
            </Group>

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/inventory')}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create Item
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

    </Container>
  );
}


