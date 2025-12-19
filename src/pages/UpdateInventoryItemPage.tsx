import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Loader,
  Center,
} from '@mantine/core';
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

export default function UpdateInventoryItemPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    unitOfMeasure: 'pieces',
    minimumThreshold: 0,
    unitCost: undefined as number | undefined,
    supplierName: '',
    supplierContact: '',
    isActive: true,
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
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

  const categoryOptions = categories?.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  })) || [];


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

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        categoryId: item.category?.id || '',
        unitOfMeasure: item.unitOfMeasure || 'pieces',
        minimumThreshold: item.minimumThreshold || 0,
        unitCost: item.unitCost || undefined,
        supplierName: item.supplierName || '',
        supplierContact: item.supplierContact || '',
        isActive: item.isActive !== undefined ? item.isActive : true,
      });
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/inventory/${code}`, data, {
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
        message: 'Inventory item updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', code] });
      navigate(`/inventory/${code}`);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update inventory item',
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const apiData: any = {
      name: formData.name,
      categoryId: formData.categoryId,
      unitOfMeasure: formData.unitOfMeasure,
      minimumThreshold: formData.minimumThreshold,
      isActive: formData.isActive,
    };

    if (formData.description) apiData.description = formData.description;
    if (formData.unitCost !== undefined) apiData.unitCost = formData.unitCost;
    if (formData.supplierName) apiData.supplierName = formData.supplierName;
    if (formData.supplierContact) apiData.supplierContact = formData.supplierContact;

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
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Update Inventory Item</Title>
        <Button variant="light" onClick={() => navigate('/categories')}>
          Manage Categories
        </Button>
      </Group>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Code"
              value={code}
              readOnly
              disabled
            />

            <TextInput
              label="Name"
              placeholder="LED Bulb 50W"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <TextInput
              label="Description"
              placeholder="Item description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Group grow>
              <Select
                label="Category"
                placeholder={categoriesLoading ? "Loading categories..." : "Select a category"}
                data={categoryOptions}
                required
                searchable
                disabled={categoriesLoading}
                value={formData.categoryId}
                onChange={(value) => setFormData({ ...formData, categoryId: value || '' })}
              />
              <Select
                label="Unit of Measure"
                data={UNITS}
                required
                value={formData.unitOfMeasure}
                onChange={(value) => setFormData({ ...formData, unitOfMeasure: value || 'pieces' })}
              />
            </Group>

            <NumberInput
              label="Minimum Threshold"
              placeholder="10"
              min={0}
              value={formData.minimumThreshold}
              onChange={(value) => setFormData({ ...formData, minimumThreshold: Number(value) || 0 })}
            />

            <NumberInput
              label="Unit Cost (Optional)"
              placeholder="25.50"
              min={0}
              precision={2}
              value={formData.unitCost}
              onChange={(value) => setFormData({ ...formData, unitCost: value ? Number(value) : undefined })}
            />

            <Group grow>
              <TextInput
                label="Supplier Name (Optional)"
                placeholder="Supplier name"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
              <TextInput
                label="Supplier Contact (Optional)"
                placeholder="Phone or email"
                value={formData.supplierContact}
                onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
              />
            </Group>

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate(`/inventory/${code}`)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Item
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

    </Container>
  );
}


