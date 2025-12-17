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
import { MapPicker } from '../components/MapPicker';

const PARKING_TYPES = [
  { value: 'SURFACE', label: 'Surface' },
  { value: 'MULTI_LEVEL', label: 'Multi-Level' },
  { value: 'UNDERGROUND', label: 'Underground' },
  { value: 'STREET', label: 'Street' },
];

const PARKING_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OPERATIONAL', label: 'Operational' },
];

export default function UpdateParkingLotPage() {
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
    parkingType: 'SURFACE',
    capacity: 0,
    hasPaidParking: false,
    hourlyRate: 0,
    description: '',
    status: 'ACTIVE',
  });

  const { data: parkingLot, isLoading } = useQuery({
    queryKey: ['parking-lot', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/parking-lots/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (parkingLot) {
      setFormData({
        code: parkingLot.code || '',
        name: parkingLot.name || '',
        district: parkingLot.district || '',
        street: parkingLot.street || '',
        gpsLat: parkingLot.gpsLat !== undefined && parkingLot.gpsLat !== null ? Number(parkingLot.gpsLat) : 0,
        gpsLng: parkingLot.gpsLng !== undefined && parkingLot.gpsLng !== null ? Number(parkingLot.gpsLng) : 0,
        parkingType: parkingLot.parkingType || 'SURFACE',
        capacity: parkingLot.capacity || 0,
        hasPaidParking: parkingLot.hasPaidParking || false,
        hourlyRate: parkingLot.hourlyRate !== undefined && parkingLot.hourlyRate !== null ? Number(parkingLot.hourlyRate) : 0,
        description: parkingLot.description || '',
        status: parkingLot.status || 'ACTIVE',
      });
    }
  }, [parkingLot]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/parking-lots/${code}`, data, {
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
        message: 'Parking lot updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['parking-lots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-lot', code] });
      navigate('/parking-lots');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update parking lot',
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
      capacity: Number(formData.capacity) || 0,
      parkingType: formData.parkingType,
      hasPaidParking: formData.hasPaidParking || false,
      status: formData.status,
    };

    if (formData.hasPaidParking && formData.hourlyRate !== undefined && formData.hourlyRate !== null && formData.hourlyRate > 0) {
      apiData.hourlyRate = Number(formData.hourlyRate);
    } else {
      apiData.hourlyRate = null;
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
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Update Parking Lot</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Group grow>
              <TextInput
                label="Code"
                placeholder="PL-001"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <TextInput
                label="Name"
                placeholder="Central Parking"
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

            <Group grow>
              <Select
                label="Parking Type"
                data={PARKING_TYPES}
                value={formData.parkingType}
                onChange={(value) => setFormData({ ...formData, parkingType: value || 'SURFACE' })}
              />
              <NumberInput
                label="Capacity (vehicles)"
                placeholder="50"
                required
                min={1}
                value={formData.capacity}
                onChange={(value) => setFormData({ ...formData, capacity: Number(value) || 0 })}
              />
            </Group>

            <Switch
              label="Has Paid Parking"
              checked={formData.hasPaidParking}
              onChange={(e) => setFormData({ ...formData, hasPaidParking: e.currentTarget.checked })}
            />

            {formData.hasPaidParking && (
              <NumberInput
                label="Hourly Rate (ETB)"
                placeholder="20.00"
                required
                min={0.01}
                precision={2}
                value={formData.hourlyRate}
                onChange={(value) => setFormData({ ...formData, hourlyRate: Number(value) || 0 })}
              />
            )}

            <Textarea
              label="Description (Optional)"
              placeholder="Public parking facility with security"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Select
              label="Status"
              data={PARKING_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/parking-lots')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Parking Lot
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

