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
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MapPicker } from '../components/MapPicker';

const PARK_TYPES = [
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'RECREATIONAL', label: 'Recreational' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'URBAN', label: 'Urban' },
];

const PARK_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OPERATIONAL', label: 'Operational' },
];

export default function CreateParkPage() {
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
      parkType: 'COMMUNITY',
      areaHectares: undefined as number | undefined,
      hasPaidEntrance: false,
      entranceFee: undefined as number | undefined,
      description: '',
      status: 'ACTIVE',
    },
    validate: {
      code: (value) => (!value ? 'Code is required' : null),
      name: (value) => (!value ? 'Name is required' : null),
      district: (value) => (!value ? 'Subcity is required' : null),
      street: (value) => (!value ? 'Street is required' : null),
      gpsLat: (value) => {
        if (value !== undefined && value !== null) {
          if (value < -90 || value > 90) return 'Latitude must be between -90 and 90';
        }
        return null;
      },
      gpsLng: (value) => {
        if (value !== undefined && value !== null) {
          if (value < -180 || value > 180) return 'Longitude must be between -180 and 180';
        }
        return null;
      },
      areaHectares: (value) => {
        if (value === undefined || value === null || value === '') {
          return 'Area is required';
        }
        if (value <= 0) return 'Area must be greater than 0';
        return null;
      },
      entranceFee: (value, values) => {
        if (values.hasPaidEntrance && (value === undefined || value === null || value === '')) {
          return 'Entrance fee is required when paid entrance is enabled';
        }
        if (values.hasPaidEntrance && value !== undefined && value !== null && value <= 0) {
          return 'Entrance fee must be greater than 0';
        }
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
        areaHectares: Number(data.areaHectares),
        parkType: data.parkType,
        hasPaidEntrance: data.hasPaidEntrance || false,
        status: data.status,
      };

      // Add entrance fee only if hasPaidEntrance is true
      if (data.hasPaidEntrance && data.entranceFee !== undefined && data.entranceFee !== null) {
        apiData.entranceFee = Number(data.entranceFee);
      }

      if (data.description) {
        apiData.description = data.description;
      }

      if (data.gpsLat !== undefined && data.gpsLat !== null && data.gpsLat !== '' && !isNaN(Number(data.gpsLat))) {
        apiData.gpsLat = Number(data.gpsLat);
      }
      if (data.gpsLng !== undefined && data.gpsLng !== null && data.gpsLng !== '' && !isNaN(Number(data.gpsLng))) {
        apiData.gpsLng = Number(data.gpsLng);
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/parks', apiData, {
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
        message: 'Public park registered successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['parks'] });
      navigate(`/parks/${data.code}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to register park';
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
    createMutation.mutate(values);
  });

  return (
    <ErrorBoundary>
      <Container size="md" py="xl">
        <Title mb="xl">Create New Public Park</Title>

        <Paper withBorder p="xl">
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
                placeholder="PK-001"
                required
                {...form.getInputProps('code')}
              />
              <TextInput
                label="Name"
                placeholder="Central Park"
                required
                {...form.getInputProps('name')}
              />
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
              <TextInput
                label="Street"
                placeholder="Main Street"
                required
                {...form.getInputProps('street')}
              />
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
              <ErrorBoundary>
                <MapPicker
                  value={{ lat: form.values.gpsLat ?? null, lng: form.values.gpsLng ?? null }}
                  onChange={(lat, lng) => {
                    form.setValues({
                      ...form.values,
                      gpsLat: typeof lat === 'number' ? lat : Number(lat),
                      gpsLng: typeof lng === 'number' ? lng : Number(lng),
                    });
                  }}
                />
              </ErrorBoundary>
            </Stack>

            <Group grow>
              <Select
                label="Park Type"
                data={PARK_TYPES}
                {...form.getInputProps('parkType')}
              />
              <NumberInput
                label="Area (Hectares)"
                placeholder="5.5"
                required
                min={0.01}
                precision={2}
                value={form.values.areaHectares ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('areaHectares', numValue);
                }}
                error={form.errors.areaHectares}
              />
            </Group>

            <Switch
              label="Has Paid Entrance"
              {...form.getInputProps('hasPaidEntrance', { type: 'checkbox' })}
            />

            {form.values.hasPaidEntrance && (
              <NumberInput
                label="Entrance Fee (ETB)"
                placeholder="50.00"
                required
                min={0.01}
                precision={2}
                value={form.values.entranceFee ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('entranceFee', numValue);
                }}
                error={form.errors.entranceFee}
              />
            )}

            <Textarea
              label="Description (Optional)"
              placeholder="Beautiful community park with playground and walking trails"
              rows={4}
              {...form.getInputProps('description')}
            />

            <Select
              label="Status"
              data={PARK_STATUSES}
              {...form.getInputProps('status')}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/parks')}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Register Public Park
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
    </ErrorBoundary>
  );
}

