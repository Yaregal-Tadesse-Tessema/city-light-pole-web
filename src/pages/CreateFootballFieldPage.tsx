import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Textarea,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { MapPicker } from '../components/MapPicker';

const FIELD_TYPES = [
  { value: 'NATURAL_GRASS', label: 'Natural Grass' },
  { value: 'ARTIFICIAL_TURF', label: 'Artificial Turf' },
  { value: 'COMMUNITY', label: 'Community' },
];

const FIELD_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OPERATIONAL', label: 'Operational' },
];

export default function CreateFootballFieldPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      district: '',
      street: '',
      gpsLat: undefined as number | undefined,
      gpsLng: undefined as number | undefined,
      fieldType: 'COMMUNITY',
      capacity: undefined as number | undefined,
      description: '',
      status: 'ACTIVE',
    },
    validate: {
      code: (value) => (!value ? 'Code is required' : null),
      name: (value) => (!value ? 'Name is required' : null),
      district: (value) => (!value ? 'Subcity is required' : null),
      street: (value) => (!value ? 'Street is required' : null),
      capacity: (value) => {
        if (value === undefined || value === null || value === '') return null;
        if (value < 0) return 'Capacity cannot be negative';
        return null;
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const apiData: any = {
        code: data.code,
        name: data.name,
        district: data.district,
        street: data.street,
        fieldType: data.fieldType,
        status: data.status,
      };

      if (data.capacity !== undefined && data.capacity !== null && data.capacity !== '') {
        apiData.capacity = Number(data.capacity);
      }
      if (data.description) apiData.description = data.description;

      if (data.gpsLat !== undefined && data.gpsLat !== null && data.gpsLat !== '' && !isNaN(Number(data.gpsLat))) {
        apiData.gpsLat = Number(data.gpsLat);
      }
      if (data.gpsLng !== undefined && data.gpsLng !== null && data.gpsLng !== '' && !isNaN(Number(data.gpsLng))) {
        apiData.gpsLng = Number(data.gpsLng);
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/football-fields', apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      notifications.show({ title: 'Success', message: 'Football field registered successfully', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['football-fields'] });
      navigate(`/football-fields/${data.code}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to register football field';
      setApiError(errorMessage);
      if (errorMessage.includes('code') && errorMessage.includes('already exists')) {
        form.setFieldError('code', 'This code is already in use');
      }
      notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setApiError(null);
    createMutation.mutate(values);
  });

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>
        Create New Football Field
      </Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title="Error" onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}

            <Group grow>
              <TextInput label="Code" placeholder="FF-001" required {...form.getInputProps('code')} />
              <TextInput label="Name" placeholder="City Football Field" required {...form.getInputProps('name')} />
            </Group>

            <Group grow>
              <Select
                label="Subcity"
                placeholder="Select subcity"
                required
                data={[
                  'Addis Ketema',
                  'Akaky Kaliti',
                  'Arada',
                  'Bole',
                  'Gullele',
                  'Kirkos',
                  'Kolfe Keranio',
                  'Lideta',
                  'Nifas Silk-Lafto',
                  'Yeka',
                  'Lemi Kura',
                ]}
                searchable
                {...form.getInputProps('district')}
              />
              <TextInput label="Street" placeholder="Main Street" required {...form.getInputProps('street')} />
            </Group>

            <Stack gap="xs">
              <Group grow>
                <NumberInput
                  label="GPS Latitude (Optional)"
                  placeholder="Auto-filled from map"
                  min={-90}
                  max={90}
                  value={form.values.gpsLat ?? undefined}
                  readOnly
                />
                <NumberInput
                  label="GPS Longitude (Optional)"
                  placeholder="Auto-filled from map"
                  min={-180}
                  max={180}
                  value={form.values.gpsLng ?? undefined}
                  readOnly
                />
              </Group>
              <Text size="sm" c="dimmed">
                Click on the map to set coordinates (centered on Addis Ababa).
              </Text>
              <MapPicker
                value={{ lat: form.values.gpsLat, lng: form.values.gpsLng }}
                onChange={(lat, lng) => {
                  form.setValues({
                    ...form.values,
                    gpsLat: typeof lat === 'number' ? lat : Number(lat),
                    gpsLng: typeof lng === 'number' ? lng : Number(lng),
                  });
                }}
              />
            </Stack>

            <Group grow>
              <Select label="Field Type" data={FIELD_TYPES} {...form.getInputProps('fieldType')} />
              <NumberInput
                label="Capacity (Optional)"
                placeholder="2000"
                min={0}
                value={form.values.capacity ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('capacity', numValue);
                }}
              />
            </Group>

            <Textarea
              label="Description (Optional)"
              placeholder="Football field description"
              rows={4}
              {...form.getInputProps('description')}
            />

            <Select label="Status" data={FIELD_STATUSES} {...form.getInputProps('status')} />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/football-fields')}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Register Football Field
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}


