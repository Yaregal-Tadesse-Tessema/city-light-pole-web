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
  Textarea,
  Text,
} from '@mantine/core';
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

export default function UpdateFootballFieldPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    district: '',
    street: '',
    gpsLat: 0,
    gpsLng: 0,
    fieldType: 'COMMUNITY',
    capacity: 0,
    description: '',
    status: 'ACTIVE',
  });

  const { data: field, isLoading } = useQuery({
    queryKey: ['football-field', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/football-fields/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!code,
    retry: false,
  });

  useEffect(() => {
    if (field) {
      setFormData({
        code: field.code || '',
        name: field.name || '',
        district: field.district || '',
        street: field.street || '',
        gpsLat: field.gpsLat !== undefined && field.gpsLat !== null ? Number(field.gpsLat) : 0,
        gpsLng: field.gpsLng !== undefined && field.gpsLng !== null ? Number(field.gpsLng) : 0,
        fieldType: field.fieldType || 'COMMUNITY',
        capacity: field.capacity !== undefined && field.capacity !== null ? Number(field.capacity) : 0,
        description: field.description || '',
        status: field.status || 'ACTIVE',
      });
    }
  }, [field]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/football-fields/${code}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Football field updated successfully', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['football-fields'] });
      queryClient.invalidateQueries({ queryKey: ['football-field', code] });
      navigate('/football-fields');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update football field',
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const apiData: any = {
      code: formData.code,
      name: formData.name,
      district: formData.district,
      street: formData.street,
      fieldType: formData.fieldType,
      status: formData.status,
    };

    if (formData.capacity !== undefined && formData.capacity !== null && formData.capacity >= 0) {
      apiData.capacity = Number(formData.capacity);
    }
    if (formData.description) apiData.description = formData.description;

    if (formData.gpsLat !== undefined && formData.gpsLat !== null && formData.gpsLat !== '' && !isNaN(Number(formData.gpsLat))) {
      apiData.gpsLat = Number(formData.gpsLat);
    }
    if (formData.gpsLng !== undefined && formData.gpsLng !== null && formData.gpsLng !== '' && !isNaN(Number(formData.gpsLng))) {
      apiData.gpsLng = Number(formData.gpsLng);
    }

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
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>
        Update Football Field
      </Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Group grow>
              <TextInput
                label="Code"
                placeholder="FF-001"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <TextInput
                label="Name"
                placeholder="City Football Field"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.district}
                onChange={(value) => setFormData({ ...formData, district: value || '' })}
              />
              <TextInput
                label="Street"
                placeholder="Main Street"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </Group>

            <Stack gap="xs">
              <Group grow>
                <NumberInput label="GPS Latitude" placeholder="Auto-filled from map" value={formData.gpsLat ?? undefined} readOnly />
                <NumberInput label="GPS Longitude" placeholder="Auto-filled from map" value={formData.gpsLng ?? undefined} readOnly />
              </Group>
              <Text size="sm" c="dimmed">
                Click on the map to set coordinates (centered on Addis Ababa).
              </Text>
              <MapPicker
                value={{ lat: formData.gpsLat, lng: formData.gpsLng }}
                onChange={(lat, lng) => {
                  setFormData((prev) => ({
                    ...prev,
                    gpsLat: typeof lat === 'number' ? lat : Number(lat),
                    gpsLng: typeof lng === 'number' ? lng : Number(lng),
                  }));
                }}
                currentPoleCode={formData.code}
                showAllPoles={true}
              />
            </Stack>

            <Group grow>
              <Select
                label="Field Type"
                data={FIELD_TYPES}
                value={formData.fieldType}
                onChange={(value) => setFormData({ ...formData, fieldType: value || 'COMMUNITY' })}
              />
              <NumberInput
                label="Capacity (Optional)"
                placeholder="2000"
                min={0}
                value={formData.capacity}
                onChange={(value) => setFormData({ ...formData, capacity: Number(value) || 0 })}
              />
            </Group>

            <Textarea
              label="Description (Optional)"
              placeholder="Football field description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Select
              label="Status"
              data={FIELD_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/football-fields')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Football Field
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}


