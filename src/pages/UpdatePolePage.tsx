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
  Switch,
  Group,
  Loader,
  Center,
  Text,
} from '@mantine/core';
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

export default function UpdatePolePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    district: '',
    street: '',
    gpsLat: 0,
    gpsLng: 0,
    poleType: 'STANDARD',
    heightMeters: 0,
    lampType: 'LED',
    powerRatingWatt: 0,
    hasLedDisplay: false,
    ledModel: '',
    status: 'ACTIVE',
  });

  const { data: pole, isLoading } = useQuery({
    queryKey: ['pole', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/poles/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (pole) {
      setFormData({
        code: pole.code || '',
        district: pole.district || '',
        street: pole.street || '',
        gpsLat: pole.gpsLat !== undefined && pole.gpsLat !== null ? Number(pole.gpsLat) : 0,
        gpsLng: pole.gpsLng !== undefined && pole.gpsLng !== null ? Number(pole.gpsLng) : 0,
        poleType: pole.poleType || 'STANDARD',
        heightMeters: pole.heightMeters || 0,
        lampType: pole.lampType || 'LED',
        powerRatingWatt: pole.powerRatingWatt || 0,
        hasLedDisplay: pole.hasLedDisplay || false,
        ledModel: pole.ledModel || '',
        status: pole.status || 'ACTIVE',
      });
    }
  }, [pole]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/poles/${code}`, data, {
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
        message: 'Light pole updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['poles'] });
      queryClient.invalidateQueries({ queryKey: ['pole', code] });
      navigate('/poles');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update pole',
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare data for API, ensuring GPS coordinates are numbers
    const apiData: any = {
      code: formData.code,
      district: formData.district,
      street: formData.street,
      heightMeters: formData.heightMeters,
      powerRatingWatt: formData.powerRatingWatt,
      poleType: formData.poleType,
      lampType: formData.lampType,
      hasLedDisplay: formData.hasLedDisplay,
      status: formData.status,
    };

    // Convert GPS coordinates to numbers if they exist
    if (formData.gpsLat !== undefined && formData.gpsLat !== null && formData.gpsLat !== '' && !isNaN(Number(formData.gpsLat))) {
      apiData.gpsLat = Number(formData.gpsLat);
    }
    if (formData.gpsLng !== undefined && formData.gpsLng !== null && formData.gpsLng !== '' && !isNaN(Number(formData.gpsLng))) {
      apiData.gpsLng = Number(formData.gpsLng);
    }

    // Add LED model only if hasLedDisplay is true
    if (formData.hasLedDisplay && formData.ledModel) {
      apiData.ledModel = formData.ledModel;
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
    <Container size="md" py="xl">
      <Title mb="xl">Update Light Pole</Title>

      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Code"
              placeholder="LP-001"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />

            <Group grow>
              <TextInput
                label="District"
                placeholder="Downtown"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
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
                  // Ensure GPS coordinates are always stored as numbers
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
                label="Pole Type"
                data={POLE_TYPES}
                value={formData.poleType}
                onChange={(value) => setFormData({ ...formData, poleType: value || 'STANDARD' })}
              />
              <NumberInput
                label="Height (meters)"
                placeholder="8.5"
                required
                min={0}
                precision={2}
                value={formData.heightMeters}
                onChange={(value) => setFormData({ ...formData, heightMeters: Number(value) || 0 })}
              />
            </Group>

            <Group grow>
              <Select
                label="Lamp Type"
                data={LAMP_TYPES}
                value={formData.lampType}
                onChange={(value) => setFormData({ ...formData, lampType: value || 'LED' })}
              />
              <NumberInput
                label="Power Rating (Watt)"
                placeholder="150"
                required
                min={0}
                value={formData.powerRatingWatt}
                onChange={(value) => setFormData({ ...formData, powerRatingWatt: Number(value) || 0 })}
              />
            </Group>

            <Switch
              label="Has LED Display"
              checked={formData.hasLedDisplay}
              onChange={(e) => setFormData({ ...formData, hasLedDisplay: e.currentTarget.checked })}
            />

            {formData.hasLedDisplay && (
              <TextInput
                label="LED Model"
                placeholder="LED-3000"
                value={formData.ledModel}
                onChange={(e) => setFormData({ ...formData, ledModel: e.target.value })}
              />
            )}

            <Select
              label="Status"
              data={POLE_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/poles')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Pole
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

