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

const TOILET_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'ACCESSIBLE', label: 'Accessible' },
  { value: 'PORTABLE', label: 'Portable' },
];

const TOILET_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OPERATIONAL', label: 'Operational' },
];

export default function UpdatePublicToiletPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    district: '',
    street: '',
    gpsLat: 0,
    gpsLng: 0,
    toiletType: 'STANDARD',
    hasPaidAccess: false,
    accessFee: 0,
    description: '',
    status: 'ACTIVE',
  });

  const { data: toilet, isLoading } = useQuery({
    queryKey: ['public-toilet', code],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/public-toilets/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (toilet) {
      setFormData({
        code: toilet.code || '',
        district: toilet.district || '',
        street: toilet.street || '',
        gpsLat: toilet.gpsLat !== undefined && toilet.gpsLat !== null ? Number(toilet.gpsLat) : 0,
        gpsLng: toilet.gpsLng !== undefined && toilet.gpsLng !== null ? Number(toilet.gpsLng) : 0,
        toiletType: toilet.toiletType || 'STANDARD',
        hasPaidAccess: toilet.hasPaidAccess || false,
        accessFee: toilet.accessFee !== undefined && toilet.accessFee !== null ? Number(toilet.accessFee) : 0,
        description: toilet.description || '',
        status: toilet.status || 'ACTIVE',
      });
    }
  }, [toilet]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(`http://localhost:3011/api/v1/public-toilets/${code}`, data, {
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
        message: 'Public toilet updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['public-toilets'] });
      queryClient.invalidateQueries({ queryKey: ['public-toilet', code] });
      navigate('/public-toilets');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update public toilet',
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const apiData: any = {
      code: formData.code,
      district: formData.district,
      street: formData.street,
      toiletType: formData.toiletType,
      hasPaidAccess: formData.hasPaidAccess || false,
      status: formData.status,
    };

    if (formData.hasPaidAccess && formData.accessFee !== undefined && formData.accessFee !== null && formData.accessFee > 0) {
      apiData.accessFee = Number(formData.accessFee);
    } else {
      apiData.accessFee = null;
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
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Update Public Toilet</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Code"
              placeholder="PT-001"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />

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
              label="Toilet Type"
              data={TOILET_TYPES}
              value={formData.toiletType}
              onChange={(value) => setFormData({ ...formData, toiletType: value || 'STANDARD' })}
            />

            <Switch
              label="Has Paid Access"
              checked={formData.hasPaidAccess}
              onChange={(e) => setFormData({ ...formData, hasPaidAccess: e.currentTarget.checked })}
            />

            {formData.hasPaidAccess && (
              <NumberInput
                label="Access Fee (ETB)"
                placeholder="5.00"
                required
                min={0.01}
                precision={2}
                value={formData.accessFee}
                onChange={(value) => setFormData({ ...formData, accessFee: Number(value) || 0 })}
              />
            )}

            <Textarea
              label="Description (Optional)"
              placeholder="Public toilet facility"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Select
              label="Status"
              data={TOILET_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'ACTIVE' })}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/public-toilets')}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Public Toilet
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

