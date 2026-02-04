import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Text,
  TextInput,
  NumberInput,
  Select,
  Button,
  Stack,
  Title,
  Group,
  Alert,
  Textarea,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { componentsApi, COMPONENT_TYPES } from '../api/components';

const TYPE_OPTIONS = COMPONENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }));

export default function UpdateComponentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: component, isLoading } = useQuery({
    queryKey: ['component', id],
    queryFn: () => componentsApi.get(id!),
    enabled: !!id,
  });

  const form = useForm<{
    name: string;
    type: string;
    model: string;
    partNumber: string;
    sku: string;
    description: string;
    manufacturerName: string;
    manufacturerPhone: string;
    manufacturerEmail: string;
    manufacturerCountry: string;
    serialNumber: string;
    powerUsageWatt?: number;
    lifespanMonths?: number;
    isActive: boolean;
    tags: string;
  }>({
    initialValues: {
      name: '',
      type: 'BULB',
      model: '',
      partNumber: '',
      sku: '',
      description: '',
      manufacturerName: '',
      manufacturerPhone: '',
      manufacturerEmail: '',
      manufacturerCountry: '',
      serialNumber: '',
      powerUsageWatt: undefined as number | undefined,
      lifespanMonths: undefined as number | undefined,
      isActive: true,
      tags: '',
    },
  });

  useEffect(() => {
    if (component) {
      form.setValues({
        name: component.name || '',
        type: component.type || 'BULB',
        model: component.model || '',
        partNumber: component.partNumber || '',
        sku: component.sku || '',
        description: component.description || '',
        manufacturerName: component.manufacturerName || '',
        manufacturerPhone: component.manufacturerPhone || '',
        manufacturerEmail: component.manufacturerEmail || '',
        manufacturerCountry: component.manufacturerCountry || '',
        serialNumber: component.serialNumber || '',
        powerUsageWatt: component.powerUsageWatt,
        lifespanMonths: component.lifespanMonths,
        isActive: component.isActive !== false,
        tags: Array.isArray(component.tags) ? component.tags.join(', ') : (component.tags || ''),
      });
    }
  }, [component]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => componentsApi.update(id!, data),
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Component updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['component', id] });
      navigate(`/components/${id}`);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update component';
      setApiError(msg);
      notifications.show({ title: 'Error', message: msg, color: 'red' });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setApiError(null);
    const payload: Record<string, unknown> = {
      name: values.name,
      type: values.type,
      model: values.model || undefined,
      partNumber: values.partNumber || undefined,
      sku: values.sku || undefined,
      description: values.description || undefined,
      manufacturerName: values.manufacturerName || undefined,
      manufacturerPhone: values.manufacturerPhone || undefined,
      manufacturerEmail: values.manufacturerEmail || undefined,
      manufacturerCountry: values.manufacturerCountry || undefined,
      serialNumber: values.serialNumber || undefined,
      powerUsageWatt: values.powerUsageWatt,
      lifespanMonths: values.lifespanMonths,
      isActive: values.isActive,
    };
    if (values.tags) {
      payload.tags = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    updateMutation.mutate(payload);
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

  if (!component) {
    return (
      <Container size="md" py="xl">
        <Alert color="red">Component not found</Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">Edit Component</Title>
      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title="Error" onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}
            <Group grow>
              <TextInput label="Name" required {...form.getInputProps('name')} />
              <Select label="Type" required data={TYPE_OPTIONS} {...form.getInputProps('type')} />
            </Group>
            <Group grow>
              <TextInput label="Model" {...form.getInputProps('model')} />
              <TextInput label="Part Number" {...form.getInputProps('partNumber')} />
              <TextInput label="SKU" {...form.getInputProps('sku')} />
            </Group>
            <Textarea label="Description" minRows={2} {...form.getInputProps('description')} />
            <Stack gap="xs">
              <Text size="sm" fw={600} c="dimmed">Manufacturer Information</Text>
              <Group grow>
                <TextInput label="Name" placeholder="Manufacturer name" {...form.getInputProps('manufacturerName')} />
                <TextInput label="Phone" placeholder="Phone number" {...form.getInputProps('manufacturerPhone')} />
                <TextInput label="Email" type="email" placeholder="Email address" {...form.getInputProps('manufacturerEmail')} />
              </Group>
              <TextInput label="Manufacturer Country" {...form.getInputProps('manufacturerCountry')} />
            </Stack>
            <Group grow>
              <TextInput label="Serial Number" {...form.getInputProps('serialNumber')} />
              <NumberInput label="Power (W)" min={0} {...form.getInputProps('powerUsageWatt')} />
              <NumberInput label="Lifespan (months)" min={0} {...form.getInputProps('lifespanMonths')} />
            </Group>
            <TextInput label="Tags (comma-separated)" {...form.getInputProps('tags')} />
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate(`/components/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
