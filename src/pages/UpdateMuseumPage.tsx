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

const MUSEUM_TYPES = [
  { value: 'HISTORICAL', label: 'Historical' },
  { value: 'ART', label: 'Art' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'CULTURAL', label: 'Cultural' },
];

const MUSEUM_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OPERATIONAL', label: 'Operational' },
];

export default function UpdateMuseumPage() {
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
    museumType: 'HISTORICAL',
    description: '',
    status: 'ACTIVE',
  });

  const { data: museum, isLoading } = useQuery({
    queryKey: ['museum', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/museums/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (museum) {
      setFormData({
        code: museum.code || '',
        name: museum.name || '',
        district: museum.district || '',
        street: museum.street || '',
        gpsLat: museum.gpsLat !== undefined && museum.gpsLat !== null ? Number(museum.gpsLat) : 0,
        gpsLng: museum.gpsLng !== undefined && museum.gpsLng !== null ? Number(museum.gpsLng) : 0,
        museumType: museum.museumType || 'HISTORICAL',
        description: museum.description || '',
        status: museum.status || 'ACTIVE',
      });
    }
  }, [museum]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/museums/${code}`, data, {
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
        message: 'Museum updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['museums'] });
      queryClient.invalidateQueries({ queryKey: ['museum', code] });
      navigate('/museums');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update museum',
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
      museumType: formData.museumType,
      status: formData.status,
    };

    if (formData.description) {
      apiData.description = formData.description;
    }

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
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Update Museum</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Group grow>
              <TextInput
                label="Code"
                placeholder="MU-001"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <TextInput
                label="Name"
                placeholder="National Museum"
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
                <NumberInput
                  label="GPS Latitude"
                  placeholder="Auto-filled from map"
                  value={formData.gpsLat ?? undefined}
                  readOnly
                />
                <NumberInput
                  label="GPS Longitude"
                  placeholder="Auto-filled from map"
                  value={formData.gpsLng ?? undefined}
                  readOnly
                />
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

            <Select
              label="Museum Type"
              data={MUSEUM_TYPES}
              value={formData.museumType}
              onChange={(value) => setFormData({ ...formData, museumType: value || 'HISTORICAL' })}
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Historical museum showcasing Ethiopian heritage"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Select
              label="Status"
              data={MUSEUM_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/museums')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Museum
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

