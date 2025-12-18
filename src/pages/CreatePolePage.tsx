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

const LED_STATUSES = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'ON_MAINTENANCE', label: 'On Maintenance' },
  { value: 'FAILED_DAMAGED', label: 'Failed/Damaged' },
];

const POLE_STATUSES = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'FAULT_DAMAGED', label: 'Fault/Damaged' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
];

const STREETS = [
  'Africa Avenue',
  'Bole Road',
  'Airport Road',
  'Churchill Avenue',
  'Menelik II Avenue',
  'Haile Selassie Avenue',
  'Ras Desta Damtew Avenue',
  'Ras Mekonnen Avenue',
  'Ras Abebe Aregay Street',
  'Dejazmach Balcha Abanefso Street',
  'King George VI Street',
  'Queen Elizabeth II Street',
  'Mahatma Gandhi Street',
  'Sylvia Pankhurst Street',
  'Jomo Kenyatta Avenue',
  'Patrice Lumumba Street',
  'Nelson Mandela Avenue',
  'Julius Nyerere Street',
  'Samora Machel Street',
  'Kwame Nkrumah Street',
  'Ahmed Sekou Toure Street',
  'Gamal Abdel Nasser Street',
  'Jawaharlal Nehru Street',
  'Alexander Pushkin Avenue',
  'Cunningham Street',
  'Smuts Avenue',
  'Hachalu Hundessa Road',
  'Haile Gebreselassie Avenue',
  'Sahle Selassie Street',
  'Yohannes IV Street',
  'Tewodros II Street',
  'Menelik I Street',
  'Atse Yohannes Street',
  'Atse Tewodros Street',
  'Atse Menelik Street',
  'Atse Haile Selassie Street',
  'Adwa Street',
  'Alula Aba Nega Street',
  'Aba Kiros Street',
  'Aba Samuel Road',
  'Debre Zeit Road',
  'Jimma Road',
  'Ambo Road',
  'Dessie Road',
  'Gojjam Berenda Road',
  'Sidamo Road',
  'Wolaita Road',
  'Arsi Road',
  'Bale Road',
  'Borena Road',
  'Harar Road',
  'Wollo Sefer Road',
  'Mekelle Road',
  'Gondar Road',
  'Bahir Dar Road',
  'Dire Dawa Road',
  'Assab Road',
  'Djibouti Road',
  'Sudan Street',
  'Egypt Street',
  'Algeria Avenue',
  'Tunisia Street',
  'Morocco Street',
  'Libya Street',
  'Senegal Street',
  'Mali Street',
  'Niger Street',
  'Nigeria Street',
  'Ghana Street',
  'Benin Street',
  'Togo Street',
  'Cameroon Street',
  'Chad Street',
  'Congo Street',
  'Gabon Street',
  'Central African Republic Street',
  'South Africa Street',
  'Sierra Leone Street',
  'Liberia Street',
  'Ivory Coast Street',
  'Guinea Street',
  'Ethiopia Street',
  'Kenya Street',
  'Uganda Street',
  'Tanzania Street',
  'Rwanda Street',
  'Burundi Street',
  'Somalia Street',
  'Eritrea Street',
  'Djibouti Street',
  'Madagascar Avenue',
  'Mauritius Street',
  'Seychelles Street',
  'Comoros Street',
  'Mozambique Street',
  'Angola Street',
  'Namibia Street',
  'Botswana Street',
  'Zimbabwe Street',
  'Zambia Street',
  'Malawi Street',
  'Lesotho Street',
  'Swaziland Avenue',
  'Sao Tome and Principe Street',
  'Cape Verde Street',
  '20 Meter Road',
  '22 Meter Road',
  '30 Meter Road',
  '40 Meter Road',
  'Ring Road',
  'CMC Road',
  'Megenagna Road',
  'Summit Road',
  'Salite Mihret Road',
  'Yeka Road',
  'Kotebe Road',
  'Ayat Road',
  'Gurd Shola Road',
  'Kazanchis Road',
  'Mexico Square Road',
  'Meskel Square Road',
  'Saris Road',
  'Kaliti Road',
  'Akaki Road',
  'Tor Hailoch Road',
  'Asko Road',
  'Shiro Meda Road',
  'Entoto Road',
  'Piassa Road',
  'Arada Road',
  'Merkato Road',
  'Kolfe Road',
  'Jemo Road',
  'Gotera Road',
  'Lancha Road',
  'Kera Road',
  'Ayer Tena Road',
  'Lafto Road',
  'Nifas Silk Road',
  'Gerji Road',
  'Beshale Road',
  'Lebu Road',
  'Figa Road',
  'Chechela Road',
  'Bole Bulbula Road',
  'Addis Ketema Road',
  'Lideta Road',
  'Kirkos Road',
  'Yeka Abado Road',
  'Gulele Road',
  'Arat Kilo Road',
  'Sidist Kilo Road',
  'Sebategna Road',
  'Autobus Tera Road',
  'Shola Market Road',
  'Bole Medhanealem Road',
  'Megenagna Square Road',
  'St. Urael Road',
  'Atlas Road',
  'Edna Mall Road',
  'Friendship Building Road',
  'Ethiopian Airlines Road',
  'Millennium Hall Road',
  'African Union Road',
];

export default function CreatePolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      code: '',
      subcity: '',
      street: '',
      gpsLat: undefined as number | undefined,
      gpsLng: undefined as number | undefined,
      poleType: 'STANDARD',
      heightMeters: 0,
      lampType: 'LED',
      powerRatingWatt: 0,
      hasLedDisplay: false,
      ledModel: '',
      ledInstallationDate: '' as string,
      ledStatus: '' as string,
      numberOfPoles: undefined as number | undefined,
      hasCamera: false,
      cameraInstallationDate: '' as string,
      hasPhoneCharger: false,
      phoneChargerInstallationDate: '' as string,
      poleInstallationDate: '' as string,
      status: 'OPERATIONAL',
    },
    validate: {
      code: (value) => (!value ? 'Code is required' : null),
      subcity: (value) => (!value ? 'Subcity is required' : null),
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
      ledInstallationDate: (value, values) => {
        if (values.hasLedDisplay && !value) {
          return 'LED installation date is required when LED Display is enabled';
        }
        return null;
      },
      ledStatus: (value, values) => {
        if (values.hasLedDisplay && !value) {
          return 'LED status is required when LED Display is enabled';
        }
        return null;
      },
      cameraInstallationDate: (value, values) => {
        if (values.hasCamera && !value) {
          return 'Camera installation date is required when Camera is enabled';
        }
        return null;
      },
      phoneChargerInstallationDate: (value, values) => {
        if (values.hasPhoneCharger && !value) {
          return 'Phone charger installation date is required when Phone Charger is enabled';
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
        subcity: data.subcity,
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

      // Add LED fields only if hasLedDisplay is true
      if (data.hasLedDisplay) {
        if (data.ledModel) {
          apiData.ledModel = data.ledModel;
        }
        if (data.ledInstallationDate) {
          apiData.ledInstallationDate = data.ledInstallationDate;
        }
        if (data.ledStatus) {
          apiData.ledStatus = data.ledStatus;
        }
      }

      // Add new fields
      if (data.numberOfPoles !== undefined && data.numberOfPoles !== null) {
        apiData.numberOfPoles = data.numberOfPoles;
      }
      apiData.hasCamera = data.hasCamera || false;
      if (data.hasCamera && data.cameraInstallationDate) {
        apiData.cameraInstallationDate = data.cameraInstallationDate;
      }
      apiData.hasPhoneCharger = data.hasPhoneCharger || false;
      if (data.hasPhoneCharger && data.phoneChargerInstallationDate) {
        apiData.phoneChargerInstallationDate = data.phoneChargerInstallationDate;
      }
      if (data.poleInstallationDate) {
        apiData.poleInstallationDate = data.poleInstallationDate;
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
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Create New Light Pole</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
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
                {...form.getInputProps('subcity')}
              />
              <Select
                label="Street"
                placeholder="Select street"
                required
                data={STREETS}
                searchable
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
                  // Use setFieldValue to update only GPS fields without affecting other fields
                  // Ensure GPS coordinates are always numbers
                  form.setFieldValue('gpsLat', typeof lat === 'number' ? lat : Number(lat));
                  form.setFieldValue('gpsLng', typeof lng === 'number' ? lng : Number(lng));
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
              <>
                <TextInput
                  label="LED Model"
                  placeholder="LED-3000"
                  required
                  {...form.getInputProps('ledModel')}
                />
                <TextInput
                  type="date"
                  label="LED Installation Date"
                  required
                  {...form.getInputProps('ledInstallationDate')}
                />
                <Select
                  label="LED Status"
                  data={LED_STATUSES}
                  required
                  {...form.getInputProps('ledStatus')}
                />
              </>
            )}

            <NumberInput
              label="Number of Bulbs"
              placeholder="1"
              min={1}
              {...form.getInputProps('numberOfPoles')}
            />

            <TextInput
              type="date"
              label="Pole Installation Date"
              {...form.getInputProps('poleInstallationDate')}
            />

            <Switch
              label="Has Camera"
              {...form.getInputProps('hasCamera', { type: 'checkbox' })}
            />

            {form.values.hasCamera && (
              <TextInput
                type="date"
                label="Camera Installation Date"
                required
                {...form.getInputProps('cameraInstallationDate')}
              />
            )}

            <Switch
              label="Has Phone Charger"
              {...form.getInputProps('hasPhoneCharger', { type: 'checkbox' })}
            />

            {form.values.hasPhoneCharger && (
              <TextInput
                type="date"
                label="Phone Charger Installation Date"
                required
                {...form.getInputProps('phoneChargerInstallationDate')}
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

