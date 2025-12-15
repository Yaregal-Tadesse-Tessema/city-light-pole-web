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
  Switch,
  Group,
  Alert,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { MapPicker } from '../components/MapPicker';

const POLE_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DECORATIVE', label: 'Decorative' },
  { value: 'HIGH_MAST', label: 'High Mast' },
];

const LAMP_TYPES = [
  { value: 'LED', label: 'LED' },
  { value: 'FLUORESCENT', label: 'Fluorescent' },
  { value: 'SODIUM', label: 'Sodium' },
  { value: 'HALOGEN', label: 'Halogen' },
];

const POLE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OPERATIONAL', label: 'Operational' },
];

export default function CreatePolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      code: '',
      district: '',
      street: '',
      gpsLat: undefined as number | undefined,
      gpsLng: undefined as number | undefined,
      poleType: 'STANDARD',
      heightMeters: 0,
      lampType: 'LED',
      powerRatingWatt: 0,
      hasLedDisplay: false,
      ledModel: '',
      status: 'ACTIVE',
    },
    validate: {
      code: (value) => (!value ? 'Code is required' : null),
      district: (value) => (!value ? 'District is required' : null),
      street: (value) => (!value ? 'Street is required' : null),
      gpsLat: (value) => {
        if (value !== undefined) {
          if (value < -90 || value > 90) return 'Latitude must be between -90 and 90';
        }
        return null;
      },
      gpsLng: (value) => {
        if (value !== undefined) {
          if (value < -180 || value > 180) return 'Longitude must be between -180 and 180';
        }
        return null;
      },
      heightMeters: (value) => (value <= 0 ? 'Height must be greater than 0' : null),
      powerRatingWatt: (value) => (value <= 0 ? 'Power rating must be greater than 0' : null),
      ledModel: (value, values) => {
        if (values.hasLedDisplay && !value) {
          return 'LED Model is required when LED Display is enabled';
        }
        return null;
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Prepare data for API
      const apiData: any = {
        code: data.code,
        district: data.district,
        street: data.street,
        heightMeters: data.heightMeters,
        powerRatingWatt: data.powerRatingWatt,
        poleType: data.poleType,
        lampType: data.lampType,
        hasLedDisplay: data.hasLedDisplay,
        status: data.status,
      };

      // Add GPS coordinates only if provided (completely optional)
      if (data.gpsLat !== undefined && data.gpsLat !== null && data.gpsLat !== '' && !isNaN(Number(data.gpsLat))) {
        apiData.gpsLat = Number(data.gpsLat);
      }
      if (data.gpsLng !== undefined && data.gpsLng !== null && data.gpsLng !== '' && !isNaN(Number(data.gpsLng))) {
        apiData.gpsLng = Number(data.gpsLng);
      }

      // Add LED model only if hasLedDisplay is true
      if (data.hasLedDisplay && data.ledModel) {
        apiData.ledModel = data.ledModel;
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/poles', apiData, {
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
        message: 'Light pole registered successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['poles'] });
      navigate(`/poles/${data.code}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to register pole';
      setApiError(errorMessage);
      
      // Handle unique constraint error for code
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
    <Container size="md" py="xl">
      <Title mb="xl">Create New Light Pole</Title>

      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title="Error" onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}

            <TextInput
              label="Code"
              placeholder="LP-001"
              required
              {...form.getInputProps('code')}
            />

            <Group grow>
              <TextInput
                label="District"
                placeholder="Downtown"
                required
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
              <MapPicker
                value={{ lat: form.values.gpsLat, lng: form.values.gpsLng }}
                onChange={(lat, lng) => {
                  form.setFieldValue('gpsLat', lat);
                  form.setFieldValue('gpsLng', lng);
                }}
              />
            </Stack>

            <Group grow>
              <Select
                label="Pole Type"
                data={POLE_TYPES}
                {...form.getInputProps('poleType')}
              />
              <NumberInput
                label="Height (meters)"
                placeholder="8.5"
                required
                min={0}
                precision={2}
                {...form.getInputProps('heightMeters')}
              />
            </Group>

            <Group grow>
              <Select
                label="Lamp Type"
                data={LAMP_TYPES}
                {...form.getInputProps('lampType')}
              />
              <NumberInput
                label="Power Rating (Watt)"
                placeholder="150"
                required
                min={0}
                {...form.getInputProps('powerRatingWatt')}
              />
            </Group>

            <Switch
              label="Has LED Display"
              {...form.getInputProps('hasLedDisplay', { type: 'checkbox' })}
            />

            {form.values.hasLedDisplay && (
              <TextInput
                label="LED Model"
                placeholder="LED-3000"
                required
                {...form.getInputProps('ledModel')}
              />
            )}

            <Select
              label="Status"
              data={POLE_STATUSES}
              {...form.getInputProps('status')}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/poles')}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Register Light Pole
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

