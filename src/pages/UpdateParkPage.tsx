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
  Switch,
  Text,
} from '@mantine/core';
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

export default function UpdateParkPage() {
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
    parkType: 'COMMUNITY',
    areaHectares: 0,
    hasPaidEntrance: false,
    entranceFee: 0,
    description: '',
    status: 'ACTIVE',
  });

  const { data: park, isLoading } = useQuery({
    queryKey: ['park', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/parks/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (park) {
      setFormData({
        code: park.code || '',
        name: park.name || '',
        district: park.district || '',
        street: park.street || '',
        gpsLat: park.gpsLat !== undefined && park.gpsLat !== null ? Number(park.gpsLat) : 0,
        gpsLng: park.gpsLng !== undefined && park.gpsLng !== null ? Number(park.gpsLng) : 0,
        parkType: park.parkType || 'COMMUNITY',
        areaHectares: park.areaHectares || 0,
        hasPaidEntrance: park.hasPaidEntrance || false,
        entranceFee: park.entranceFee !== undefined && park.entranceFee !== null ? Number(park.entranceFee) : 0,
        description: park.description || '',
        status: park.status || 'ACTIVE',
      });
    }
  }, [park]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/parks/${code}`, data, {
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
        message: 'Public park updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['parks'] });
      queryClient.invalidateQueries({ queryKey: ['park', code] });
      navigate('/parks');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update park',
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
      areaHectares: Number(formData.areaHectares) || 0,
      parkType: formData.parkType,
      hasPaidEntrance: formData.hasPaidEntrance || false,
      status: formData.status,
    };

    // Add entrance fee only if hasPaidEntrance is true
    if (formData.hasPaidEntrance && formData.entranceFee !== undefined && formData.entranceFee !== null && formData.entranceFee > 0) {
      apiData.entranceFee = Number(formData.entranceFee);
    } else {
      apiData.entranceFee = null;
    }

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
    <ErrorBoundary>
      <Container size="md" py="xl">
        <Title mb="xl">Update Public Park</Title>

        <Paper withBorder p="xl">
          <form onSubmit={handleSubmit}>
            <Stack>
            <Group grow>
              <TextInput
                label="Code"
                placeholder="PK-001"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <TextInput
                label="Name"
                placeholder="Central Park"
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
              <ErrorBoundary>
                <MapPicker
                  value={{ lat: formData.gpsLat ?? null, lng: formData.gpsLng ?? null }}
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
              </ErrorBoundary>
            </Stack>

            <Group grow>
              <Select
                label="Park Type"
                data={PARK_TYPES}
                value={formData.parkType}
                onChange={(value) => setFormData({ ...formData, parkType: value || 'COMMUNITY' })}
              />
              <NumberInput
                label="Area (Hectares)"
                placeholder="5.5"
                required
                min={0}
                precision={2}
                value={formData.areaHectares}
                onChange={(value) => setFormData({ ...formData, areaHectares: Number(value) || 0 })}
              />
            </Group>

            <Switch
              label="Has Paid Entrance"
              checked={formData.hasPaidEntrance}
              onChange={(e) => setFormData({ ...formData, hasPaidEntrance: e.currentTarget.checked })}
            />

            {formData.hasPaidEntrance && (
              <NumberInput
                label="Entrance Fee (ETB)"
                placeholder="50.00"
                required
                min={0.01}
                precision={2}
                value={formData.entranceFee}
                onChange={(value) => setFormData({ ...formData, entranceFee: Number(value) || 0 })}
              />
            )}

            <Textarea
              label="Description (Optional)"
              placeholder="Beautiful community park with playground and walking trails"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Select
              label="Status"
              data={PARK_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/parks')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Park
              </Button>
            </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </ErrorBoundary>
  );
}

