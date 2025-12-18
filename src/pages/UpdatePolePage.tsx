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

export default function UpdatePolePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    subcity: '',
    street: '',
    gpsLat: 0,
    gpsLng: 0,
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
        subcity: pole.subcity || '',
        street: pole.street || '',
        gpsLat: pole.gpsLat !== undefined && pole.gpsLat !== null ? Number(pole.gpsLat) : 0,
        gpsLng: pole.gpsLng !== undefined && pole.gpsLng !== null ? Number(pole.gpsLng) : 0,
        poleType: pole.poleType || 'STANDARD',
        heightMeters: pole.heightMeters || 0,
        lampType: pole.lampType || 'LED',
        powerRatingWatt: pole.powerRatingWatt || 0,
        hasLedDisplay: pole.hasLedDisplay || false,
        ledModel: pole.ledModel || '',
        ledInstallationDate: pole.ledInstallationDate ? new Date(pole.ledInstallationDate).toISOString().split('T')[0] : '',
        ledStatus: pole.ledStatus || '',
        numberOfPoles: pole.numberOfPoles !== undefined && pole.numberOfPoles !== null ? Number(pole.numberOfPoles) : undefined,
        hasCamera: pole.hasCamera || false,
        cameraInstallationDate: pole.cameraInstallationDate ? new Date(pole.cameraInstallationDate).toISOString().split('T')[0] : '',
        hasPhoneCharger: pole.hasPhoneCharger || false,
        phoneChargerInstallationDate: pole.phoneChargerInstallationDate ? new Date(pole.phoneChargerInstallationDate).toISOString().split('T')[0] : '',
        poleInstallationDate: pole.poleInstallationDate ? new Date(pole.poleInstallationDate).toISOString().split('T')[0] : '',
        status: pole.status || 'OPERATIONAL',
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
      subcity: formData.subcity,
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

    // Add LED fields only if hasLedDisplay is true
    if (formData.hasLedDisplay) {
      if (formData.ledModel) {
        apiData.ledModel = formData.ledModel;
      }
      if (formData.ledInstallationDate) {
        apiData.ledInstallationDate = formData.ledInstallationDate;
      }
      if (formData.ledStatus) {
        apiData.ledStatus = formData.ledStatus;
      }
    }

    // Add new fields
    if (formData.numberOfPoles !== undefined && formData.numberOfPoles !== null) {
      apiData.numberOfPoles = formData.numberOfPoles;
    }
    apiData.hasCamera = formData.hasCamera || false;
    if (formData.hasCamera && formData.cameraInstallationDate) {
      apiData.cameraInstallationDate = formData.cameraInstallationDate;
    }
    apiData.hasPhoneCharger = formData.hasPhoneCharger || false;
    if (formData.hasPhoneCharger && formData.phoneChargerInstallationDate) {
      apiData.phoneChargerInstallationDate = formData.phoneChargerInstallationDate;
    }
    if (formData.poleInstallationDate) {
      apiData.poleInstallationDate = formData.poleInstallationDate;
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
      <Title mb={{ base: 'md', sm: 'xl' }} size={{ base: 'h2', sm: 'h1' }}>Update Light Pole</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
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
                value={formData.subcity}
                onChange={(value) => setFormData({ ...formData, subcity: value || '' })}
              />
              <Select
                label="Street"
                placeholder="Select street"
                required
                data={STREETS}
                searchable
                value={formData.street}
                onChange={(value) => setFormData({ ...formData, street: value || '' })}
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
              <>
                <TextInput
                  label="LED Model"
                  placeholder="LED-3000"
                  value={formData.ledModel}
                  onChange={(e) => setFormData({ ...formData, ledModel: e.target.value })}
                />
                <TextInput
                  type="date"
                  label="LED Installation Date"
                  required
                  value={formData.ledInstallationDate}
                  onChange={(e) => setFormData({ ...formData, ledInstallationDate: e.target.value })}
                />
                <Select
                  label="LED Status"
                  data={LED_STATUSES}
                  required
                  value={formData.ledStatus}
                  onChange={(value) => setFormData({ ...formData, ledStatus: value || '' })}
                />
              </>
            )}

            <NumberInput
              label="Number of Bulbs"
              placeholder="1"
              min={1}
              value={formData.numberOfPoles}
              onChange={(value) => setFormData({ ...formData, numberOfPoles: value ? Number(value) : undefined })}
            />

            <TextInput
              type="date"
              label="Pole Installation Date"
              value={formData.poleInstallationDate}
              onChange={(e) => setFormData({ ...formData, poleInstallationDate: e.target.value })}
            />

            <Switch
              label="Has Camera"
              checked={formData.hasCamera}
              onChange={(e) => setFormData({ ...formData, hasCamera: e.currentTarget.checked })}
            />

            {formData.hasCamera && (
              <TextInput
                type="date"
                label="Camera Installation Date"
                required
                value={formData.cameraInstallationDate}
                onChange={(e) => setFormData({ ...formData, cameraInstallationDate: e.target.value })}
              />
            )}

            <Switch
              label="Has Phone Charger"
              checked={formData.hasPhoneCharger}
              onChange={(e) => setFormData({ ...formData, hasPhoneCharger: e.currentTarget.checked })}
            />

            {formData.hasPhoneCharger && (
              <TextInput
                type="date"
                label="Phone Charger Installation Date"
                required
                value={formData.phoneChargerInstallationDate}
                onChange={(e) => setFormData({ ...formData, phoneChargerInstallationDate: e.target.value })}
              />
            )}

            <Select
              label="Status"
              data={POLE_STATUSES}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'OPERATIONAL' })}
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

