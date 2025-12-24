import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  Divider,
  Card,
  Badge,
  LoadingOverlay,
  Checkbox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconReplace } from '@tabler/icons-react';
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

const COMPONENT_TYPES = [
  { value: 'led_display', label: 'LED Display' },
  { value: 'camera', label: 'Camera' },
  { value: 'phone_charger', label: 'Phone Charger' },
  { value: 'lamp', label: 'Lamp/Bulb' },
  { value: 'wiring', label: 'Wiring' },
  { value: 'mounting_hardware', label: 'Mounting Hardware' },
];

const REPLACEMENT_REASONS = [
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'UPGRADE', label: 'Upgrade' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OBSOLETE', label: 'Obsolete' },
  { value: 'OTHER', label: 'Other' },
];

interface Pole {
  id: string;
  code: string;
  subcity: string;
  street: string;
  poleType: string;
  heightMeters: number;
  lampType: string;
  powerRatingWatt: number;
  hasLedDisplay: boolean;
  ledModel?: string;
  ledInstallationDate?: string;
  ledStatus?: string;
  hasCamera: boolean;
  cameraInstallationDate?: string;
  hasPhoneCharger: boolean;
  phoneChargerInstallationDate?: string;
  poleInstallationDate: string;
  status: string;
  gpsLat: number;
  gpsLng: number;
}

export default function CreatePoleReplacementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedOldPole, setSelectedOldPole] = useState<Pole | null>(null);

  // Fetch all poles for selection (no pagination)
  const { data: poles, isLoading: polesLoading, error: polesError } = useQuery({
    queryKey: ['poles', 'all'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/poles?limit=10000&page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.items || res.data;
    },
  });

  // If no poles exist, show a helpful message
  const hasPoles = poles && poles.length > 0;
  const poleCount = poles?.length || 0;

  // Debug logging
  console.log('🔍 Poles loaded:', poleCount, poles);

  const form = useForm({
    initialValues: {
      oldPoleCode: '',
      // New pole details
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
      ledInstallationDate: '',
      ledStatus: '',
      hasCamera: false,
      cameraInstallationDate: '',
      hasPhoneCharger: false,
      phoneChargerInstallationDate: '',
      poleInstallationDate: '',
      status: 'OPERATIONAL',
      // Replacement details
      replacementDate: new Date().toISOString().split('T')[0],
      replacementReason: '',
      replacedBy: '',
      // Component reuse
      reuseComponents: [] as string[],
      notes: '',
    },
    validate: {
      oldPoleCode: (value) => (!value ? 'Old pole selection is required' : null),
      code: (value) => (!value ? 'New pole code is required' : null),
      subcity: (value) => (!value ? 'Subcity is required' : null),
      street: (value) => (!value ? 'Street is required' : null),
      heightMeters: (value) => (value <= 0 ? 'Height must be greater than 0' : null),
      powerRatingWatt: (value) => (value <= 0 ? 'Power rating must be greater than 0' : null),
      replacementDate: (value) => (!value ? 'Replacement date is required' : null),
      replacementReason: (value) => (!value ? 'Replacement reason is required' : null),
      replacedBy: (value) => (!value ? 'Replaced by (personnel) is required' : null),
    },
  });

  // When old pole is selected, populate new pole form with similar details (except code)
  useEffect(() => {
    if (selectedOldPole) {
      form.setValues({
        // Don't auto-fill code - let user enter manually (placeholder shows suggestion)
        subcity: selectedOldPole.subcity,
        street: selectedOldPole.street,
        gpsLat: selectedOldPole.gpsLat,
        gpsLng: selectedOldPole.gpsLng,
        poleType: selectedOldPole.poleType,
        heightMeters: selectedOldPole.heightMeters,
        lampType: selectedOldPole.lampType,
        powerRatingWatt: selectedOldPole.powerRatingWatt,
        hasLedDisplay: selectedOldPole.hasLedDisplay,
        ledModel: selectedOldPole.ledModel || '',
        ledStatus: selectedOldPole.ledStatus || '',
        hasCamera: selectedOldPole.hasCamera,
        hasPhoneCharger: selectedOldPole.hasPhoneCharger,
        poleInstallationDate: new Date().toISOString().split('T')[0],
        status: 'OPERATIONAL',
      });
    }
  }, [selectedOldPole, form]);

  const createReplacementMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('http://localhost:3011/api/v1/pole-replacements', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Pole replacement created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      queryClient.invalidateQueries({ queryKey: ['poles'] });
      queryClient.invalidateQueries({ queryKey: ['pole-replacements'] });
      navigate('/poles');
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.message || 'Failed to create pole replacement');
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create pole replacement',
        color: 'red',
        icon: <IconX size={16} />,
      });
    },
  });

  const handleSubmit = (values: any) => {
    setApiError(null);

    const replacementData = {
      oldPoleCode: values.oldPoleCode,
      newPoleData: {
        code: values.code,
        subcity: values.subcity,
        street: values.street,
        gpsLat: values.gpsLat,
        gpsLng: values.gpsLng,
        poleType: values.poleType,
        heightMeters: values.heightMeters,
        lampType: values.lampType,
        powerRatingWatt: values.powerRatingWatt,
        hasLedDisplay: values.hasLedDisplay,
        ledModel: values.ledModel,
        ledInstallationDate: values.ledInstallationDate,
        ledStatus: values.ledStatus,
        hasCamera: values.hasCamera,
        cameraInstallationDate: values.cameraInstallationDate,
        hasPhoneCharger: values.hasPhoneCharger,
        phoneChargerInstallationDate: values.phoneChargerInstallationDate,
        poleInstallationDate: values.poleInstallationDate,
        status: values.status,
      },
      replacementDetails: {
        replacementDate: values.replacementDate,
        replacementReason: values.replacementReason,
        replacedBy: values.replacedBy,
        reuseComponents: values.reuseComponents,
        notes: values.notes,
      },
    };

    createReplacementMutation.mutate(replacementData);
  };

  const handleOldPoleChange = (poleId: string) => {
    form.setFieldValue('oldPoleId', poleId);
    const pole = poles?.find((p: Pole) => p.id === poleId);
    setSelectedOldPole(pole || null);
  };

  if (polesLoading) {
    return (
      <Container size="lg" pt="xl">
        <LoadingOverlay visible />
      </Container>
    );
  }

  return (
    <Container size="lg" pt="xl">
      <Title mb="xl" order={1}>
        Create Pole Replacement
      </Title>

      {apiError && (
        <Alert color="red" mb="md" icon={<IconX size={16} />}>
          {apiError}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xl">
          {/* Old Pole Selection */}
          <Card withBorder>
            <Title order={3} mb="md">
              Select Pole to Replace
            </Title>
            {(() => {
              const selectData = poles?.filter((pole: Pole) => pole.code).map((pole: Pole) => ({
                value: pole.code,
                label: `${pole.code} - ${pole.street || 'Unknown'}, ${pole.subcity || 'Unknown'}`,
              })) || [];
              console.log('📋 Select data for poles:', selectData.length, 'items');
              return (
                <Select
                  label="Old Pole"
                  placeholder="Select a pole to replace"
                  data={selectData}
              value={form.values.oldPoleCode}
              onChange={(value) => {
                form.setFieldValue('oldPoleCode', value);
                const pole = poles?.find((p: Pole) => p.code === value);
                setSelectedOldPole(pole || null);
              }}
              searchable
              clearable
              required
              mb="md"
              maxDropdownHeight={300}
              limit={false}
              nothingFoundMessage="No poles found matching your search"
            />
              );
            })()}

            {!hasPoles && !polesLoading && (
              <Alert color="blue" icon={<IconCheck size={16} />}>
                <Text size="sm" mb="xs">
                  No poles found in the system. You need to create some poles first before you can create replacements.
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => navigate('/poles/new')}
                  >
                    Create Pole Manually
                  </Button>
                  <Button
                    size="xs"
                    color="green"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('access_token');
                        const samplePoles = [
                          {
                            code: 'LP-TEST-001',
                            subcity: 'Arada',
                            street: 'Africa Avenue',
                            gpsLat: 9.0108,
                            gpsLng: 38.7613,
                            poleType: 'STANDARD',
                            heightMeters: 8,
                            lampType: 'LED',
                            powerRatingWatt: 100,
                            hasLedDisplay: false,
                            hasCamera: false,
                            hasPhoneCharger: false,
                            poleInstallationDate: new Date().toISOString().split('T')[0],
                            status: 'OPERATIONAL'
                          },
                          {
                            code: 'LP-TEST-002',
                            subcity: 'Bole',
                            street: 'Bole Road',
                            gpsLat: 9.0208,
                            gpsLng: 38.7713,
                            poleType: 'DECORATIVE',
                            heightMeters: 10,
                            lampType: 'LED',
                            powerRatingWatt: 150,
                            hasLedDisplay: true,
                            ledModel: 'LED-2000',
                            hasCamera: false,
                            hasPhoneCharger: true,
                            poleInstallationDate: new Date().toISOString().split('T')[0],
                            status: 'OPERATIONAL'
                          }
                        ];

                        for (const pole of samplePoles) {
                          await axios.post('http://localhost:3011/api/v1/poles', pole, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                        }

                        notifications.show({
                          title: 'Success',
                          message: 'Sample poles created successfully!',
                          color: 'green',
                          icon: <IconCheck size={16} />
                        });

                        // Refresh the poles data
                        queryClient.invalidateQueries({ queryKey: ['poles'] });

                      } catch (error: any) {
                        notifications.show({
                          title: 'Error',
                          message: error.response?.data?.message || 'Failed to create sample poles',
                          color: 'red',
                          icon: <IconX size={16} />
                        });
                      }
                    }}
                  >
                    Create Sample Poles
                  </Button>
                </Group>
              </Alert>
            )}

            {hasPoles && (
              <Text size="sm" c="dimmed">
                Found {poleCount} pole{poleCount !== 1 ? 's' : ''} in the system.
              </Text>
            )}

            {selectedOldPole && (
              <Paper p="md" withBorder bg="gray.0">
                <Title order={4} mb="sm">
                  Old Pole Details
                </Title>
                <Group gap="md">
                  <Text size="sm">
                    <strong>Code:</strong> {selectedOldPole.code}
                  </Text>
                  <Text size="sm">
                    <strong>Type:</strong> {selectedOldPole.poleType}
                  </Text>
                  <Text size="sm">
                    <strong>Height:</strong> {selectedOldPole.heightMeters}m
                  </Text>
                  <Text size="sm">
                    <strong>Lamp:</strong> {selectedOldPole.lampType}
                  </Text>
                  <Badge color={selectedOldPole.status === 'OPERATIONAL' ? 'green' : 'red'}>
                    {selectedOldPole.status}
                  </Badge>
                </Group>
                <Group gap="md" mt="sm">
                  <Text size="sm">
                    <strong>LED Display:</strong> {selectedOldPole.hasLedDisplay ? 'Yes' : 'No'}
                  </Text>
                  <Text size="sm">
                    <strong>Camera:</strong> {selectedOldPole.hasCamera ? 'Yes' : 'No'}
                  </Text>
                  <Text size="sm">
                    <strong>Phone Charger:</strong> {selectedOldPole.hasPhoneCharger ? 'Yes' : 'No'}
                  </Text>
                </Group>
              </Paper>
            )}
          </Card>

          {/* New Pole Details */}
          <Card withBorder>
            <Title order={3} mb="md">
              New Pole Specifications
            </Title>
            <Stack gap="md">
              <Group grow>
                <TextInput
                  label="Pole Code"
                  placeholder={selectedOldPole ? `Suggested: NEW-${selectedOldPole.code}` : "Enter new pole code"}
                  {...form.getInputProps('code')}
                  required
                />
                <Select
                  label="Pole Type"
                  data={POLE_TYPES}
                  {...form.getInputProps('poleType')}
                />
              </Group>

              <Group grow>
                <NumberInput
                  label="Height (meters)"
                  placeholder="Enter height"
                  min={1}
                  {...form.getInputProps('heightMeters')}
                  required
                />
                <Select
                  label="Lamp Type"
                  data={LAMP_TYPES}
                  {...form.getInputProps('lampType')}
                />
              </Group>

              <Group grow>
                <NumberInput
                  label="Power Rating (Watt)"
                  placeholder="Enter power rating"
                  min={1}
                  {...form.getInputProps('powerRatingWatt')}
                  required
                />
                <TextInput
                  label="Installation Date"
                  type="date"
                  {...form.getInputProps('poleInstallationDate')}
                  required
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Subcity"
                  placeholder="Enter subcity"
                  {...form.getInputProps('subcity')}
                  required
                />
                <TextInput
                  label="Street"
                  placeholder="Enter street"
                  {...form.getInputProps('street')}
                  required
                />
              </Group>

              <MapPicker
                value={{
                  lat: form.values.gpsLat || 9.0108,
                  lng: form.values.gpsLng || 38.7613
                }}
                onChange={(lat, lng) => {
                  form.setFieldValue('gpsLat', typeof lat === 'number' ? lat : Number(lat));
                  form.setFieldValue('gpsLng', typeof lng === 'number' ? lng : Number(lng));
                }}
              />

              <Divider />

              <Title order={4} mb="sm">
                Additional Components
              </Title>

              <Group grow>
                <Switch
                  label="LED Display"
                  {...form.getInputProps('hasLedDisplay', { type: 'checkbox' })}
                />
                <Switch
                  label="Camera"
                  {...form.getInputProps('hasCamera', { type: 'checkbox' })}
                />
                <Switch
                  label="Phone Charger"
                  {...form.getInputProps('hasPhoneCharger', { type: 'checkbox' })}
                />
              </Group>

              {form.values.hasLedDisplay && (
                <Group grow>
                  <TextInput
                    label="LED Model"
                    placeholder="Enter LED model"
                    {...form.getInputProps('ledModel')}
                  />
                  <TextInput
                    label="LED Installation Date"
                    type="date"
                    {...form.getInputProps('ledInstallationDate')}
                  />
                </Group>
              )}

              {form.values.hasCamera && (
                <TextInput
                  label="Camera Installation Date"
                  type="date"
                  {...form.getInputProps('cameraInstallationDate')}
                />
              )}

              {form.values.hasPhoneCharger && (
                <TextInput
                  label="Phone Charger Installation Date"
                  type="date"
                  {...form.getInputProps('phoneChargerInstallationDate')}
                />
              )}
            </Stack>
          </Card>

          {/* Component Reuse */}
          <Card withBorder>
            <Title order={3} mb="md">
              Component Reuse from Old Pole
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Select which components from the old pole will be reused in the new installation:
            </Text>
            <Checkbox.Group
              value={form.values.reuseComponents}
              onChange={(value) => form.setFieldValue('reuseComponents', value)}
            >
              <Group mt="xs">
                {COMPONENT_TYPES.map((component) => (
                  <Checkbox
                    key={component.value}
                    value={component.value}
                    label={component.label}
                  />
                ))}
              </Group>
            </Checkbox.Group>
          </Card>

          {/* Replacement Details */}
          <Card withBorder>
            <Title order={3} mb="md">
              Replacement Details
            </Title>
            <Stack gap="md">
              <Group grow>
                <TextInput
                  label="Replacement Date"
                  type="date"
                  {...form.getInputProps('replacementDate')}
                  required
                />
                <TextInput
                  label="Replaced By (Personnel)"
                  placeholder="Enter personnel name"
                  {...form.getInputProps('replacedBy')}
                  required
                />
              </Group>

              <Select
                label="Replacement Reason"
                placeholder="Select reason for replacement"
                data={REPLACEMENT_REASONS}
                {...form.getInputProps('replacementReason')}
                required
              />

              <TextInput
                label="Additional Notes"
                placeholder="Enter any additional notes"
                {...form.getInputProps('notes')}
              />
            </Stack>
          </Card>

          {/* Submit */}
          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={() => navigate('/poles')}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createReplacementMutation.isPending}
              leftSection={<IconReplace size={16} />}
            >
              Create Pole Replacement
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}
