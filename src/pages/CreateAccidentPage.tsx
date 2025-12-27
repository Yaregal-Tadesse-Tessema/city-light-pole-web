import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Stack,
  NumberInput,
  Alert,
  FileInput,
  Text,
  Divider,
  Grid,
  Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconMapPin, IconCar, IconFileText } from '@tabler/icons-react';
import axios from 'axios';

const ACCIDENT_TYPES = [
  { value: 'VEHICLE_COLLISION', label: 'Vehicle Collision' },
  { value: 'FALLING_POLE', label: 'Falling Pole' },
  { value: 'VANDALISM', label: 'Vandalism' },
  { value: 'NATURAL_DISASTER', label: 'Natural Disaster' },
  { value: 'ELECTRICAL_FAULT', label: 'Electrical Fault' },
  { value: 'OTHER', label: 'Other' },
];

interface AccidentFormData {
  accidentType: string;
  accidentDate: string;
  accidentTime: string;
  poleId: string;
  latitude: number | null;
  longitude: number | null;
  locationDescription: string;
  vehiclePlateNumber: string;
  driverName: string;
  insuranceCompany: string;
  claimReferenceNumber: string;
}

export default function CreateAccidentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<AccidentFormData>({
    initialValues: {
      accidentType: '',
      accidentDate: '',
      accidentTime: '',
      poleId: '',
      latitude: null,
      longitude: null,
      locationDescription: '',
      vehiclePlateNumber: '',
      driverName: '',
      insuranceCompany: '',
      claimReferenceNumber: '',
    },
    validate: {
      accidentType: (value) => !value && 'Accident type is required',
      accidentDate: (value) => !value && 'Accident date is required',
      accidentTime: (value) => !value && 'Accident time is required',
      locationDescription: (value) => !value && 'Location description is required',
    },
  });

  // Fetch poles for the dropdown
  const { data: polesData } = useQuery({
    queryKey: ['poles', 'all'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/poles?limit=10000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Format poles for Select component
  const poleOptions = polesData?.items?.map((pole: any) => ({
    value: pole.code,
    label: `${pole.code} - ${pole.subcity}, ${pole.street}`,
  })) || [];

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValues({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          notifications.show({
            title: 'Location Error',
            message: 'Unable to get current location. Please enter coordinates manually.',
            color: 'orange',
          });
        }
      );
    } else {
      notifications.show({
        title: 'Location Error',
        message: 'Geolocation is not supported by this browser.',
        color: 'red',
      });
    }
  };

  // Create accident mutation
  const createMutation = useMutation({
    mutationFn: async (data: AccidentFormData) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/accidents', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: async (accident) => {
      // Upload photos if any
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo) => {
          formData.append('files', photo);
        });

        try {
          const token = localStorage.getItem('access_token');
          await axios.post(`http://localhost:3011/api/v1/accidents/${accident.id}/photos`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error('Failed to upload photos:', error);
        }
      }

      // Upload attachments if any
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((attachment) => {
          formData.append('files', attachment);
        });
        formData.append('attachmentType', 'POLICE_REPORT');

        try {
          const token = localStorage.getItem('access_token');
          await axios.post(`http://localhost:3011/api/v1/accidents/${accident.id}/attachments`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error('Failed to upload attachments:', error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      notifications.show({
        title: 'Success',
        message: 'Accident report created successfully',
        color: 'green',
      });
      navigate('/accidents');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create accident report',
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: AccidentFormData) => {
    // Validate mandatory photos
    if (photos.length < 3) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please upload at least 3 photos of the incident',
        color: 'red',
      });
      return;
    }

    createMutation.mutate(values);
  };

  return (
    <Container size="xl" py="xl">
      <Paper p="xl" withBorder>
        <Title order={2} mb="lg">
          Report Street Light Pole Accident
        </Title>

        <Alert color="blue" mb="lg">
          <Text fw={500}>Important:</Text>
          <Text>Please provide accurate information and upload at least 3 clear photos of the incident.</Text>
        </Alert>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="xl">
            {/* Incident Details */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>Incident Details</Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <Select
                  label="Accident Type"
                  placeholder="Select accident type"
                  data={ACCIDENT_TYPES}
                  required
                  {...form.getInputProps('accidentType')}
                />

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Accident Date"
                      type="date"
                      required
                      {...form.getInputProps('accidentDate')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Accident Time"
                      type="time"
                      required
                      {...form.getInputProps('accidentTime')}
                    />
                  </Grid.Col>
                </Grid>

                <Select
                  label="Pole ID (if known)"
                  placeholder="Select pole or leave blank"
                  data={poleOptions}
                  searchable
                  clearable
                  {...form.getInputProps('poleId')}
                />

                <Textarea
                  label="Location Description"
                  placeholder="Describe the exact location of the accident"
                  required
                  minRows={3}
                  {...form.getInputProps('locationDescription')}
                />

                {/* GPS Coordinates */}
                <Card withBorder>
                  <Card.Section withBorder inheritPadding py="sm">
                    <Group justify="space-between">
                      <Title order={5}>GPS Coordinates (Optional)</Title>
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconMapPin size={14} />}
                        onClick={getCurrentLocation}
                      >
                        Get Current Location
                      </Button>
                    </Group>
                  </Card.Section>

                  <Stack p="md" gap="md">
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Latitude"
                          placeholder="-9.1450 to 38.8942"
                          precision={8}
                          {...form.getInputProps('latitude')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Longitude"
                          placeholder="-176.6597 to 179.4500"
                          precision={8}
                          {...form.getInputProps('longitude')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Card>
              </Stack>
            </Card>

            {/* Vehicle & Insurance Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconCar size={16} style={{ marginRight: 8 }} />
                  Vehicle & Insurance Information
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Vehicle Plate Number"
                      placeholder="Enter vehicle plate number"
                      {...form.getInputProps('vehiclePlateNumber')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Driver Name"
                      placeholder="Enter driver name"
                      {...form.getInputProps('driverName')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Insurance Company"
                      placeholder="Enter insurance company name"
                      {...form.getInputProps('insuranceCompany')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Claim Reference Number"
                      placeholder="Enter claim reference number"
                      {...form.getInputProps('claimReferenceNumber')}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            {/* Photo Upload */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconUpload size={16} style={{ marginRight: 8 }} />
                  Incident Photos (Mandatory - Minimum 3)
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label="Upload Photos"
                  placeholder="Select photos of the incident"
                  multiple
                  accept="image/*,video/*"
                  leftSection={<IconUpload size={14} />}
                  onChange={(files) => setPhotos(files || [])}
                />

                {photos.length > 0 && (
                  <Text size="sm" c="dimmed">
                    {photos.length} file(s) selected
                  </Text>
                )}

                <Alert color="blue">
                  <Text size="sm">
                    Please upload at least 3 clear photos showing the damage, surrounding area, and any relevant details.
                    Videos are also accepted but not mandatory.
                  </Text>
                </Alert>
              </Stack>
            </Card>

            {/* Attachments */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconFileText size={16} style={{ marginRight: 8 }} />
                  Police Report & Other Documents (Optional)
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label="Upload Documents"
                  placeholder="Select police report or other relevant documents"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  leftSection={<IconUpload size={14} />}
                  onChange={(files) => setAttachments(files || [])}
                />

                {attachments.length > 0 && (
                  <Text size="sm" c="dimmed">
                    {attachments.length} file(s) selected
                  </Text>
                )}
              </Stack>
            </Card>

            {/* Submit */}
            <Group justify="flex-end" mt="xl">
              <Button variant="light" onClick={() => navigate('/accidents')}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                disabled={photos.length < 3}
              >
                Submit Accident Report
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
