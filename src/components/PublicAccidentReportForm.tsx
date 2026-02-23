import { useEffect, useState } from 'react';
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
  Grid,
  Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconMapPin, IconCar, IconFileText } from '@tabler/icons-react';
import axios from 'axios';
import EthiopianPhoneInput from './EthiopianPhoneInput';
import VehiclePlateInput from './VehiclePlateInput';
import {
  isValidEthiopianLocalPhone,
  toEthiopianInternationalPhone,
} from '../utils/ethiopianPhone';
import { ETHIOPIAN_INSURANCE_COMPANY_OPTIONS } from '../utils/ethiopianInsuranceCompanies';

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
  driverPhoneNumber: string;
  driverLicenseNumber: string;
  driverNationalIdNumber: string;
  insuranceCompany: string;
  claimReferenceNumber: string;
}

interface PoleOption {
  value: string;
  label: string;
}

const getNowDateTime = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return { date, time };
};

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3011';
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
const apiBaseUrl = normalizedBaseUrl.endsWith('/api/v1')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`;

export default function PublicAccidentReportForm() {
  const { date: currentDate, time: currentTime } = getNowDateTime();
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poleOptions, setPoleOptions] = useState<PoleOption[]>([]);
  const [isLoadingPoles, setIsLoadingPoles] = useState(false);
  const [poleLookupUnavailable, setPoleLookupUnavailable] = useState(false);

  const form = useForm<AccidentFormData>({
    initialValues: {
      accidentType: '',
      accidentDate: currentDate,
      accidentTime: currentTime,
      poleId: '',
      latitude: null,
      longitude: null,
      locationDescription: '',
      vehiclePlateNumber: '',
      driverName: '',
      driverPhoneNumber: '',
      driverLicenseNumber: '',
      driverNationalIdNumber: '',
      insuranceCompany: '',
      claimReferenceNumber: '',
    },
    validate: {
      accidentType: (value) => (!value ? 'Accident type is required' : null),
      accidentDate: (value) => (!value ? 'Accident date is required' : null),
      accidentTime: (value) => (!value ? 'Accident time is required' : null),
      locationDescription: (value) => (!value ? 'Location description is required' : null),
      driverPhoneNumber: (value) =>
        isValidEthiopianLocalPhone(value)
          ? null
          : 'Phone must be 9 digits and cannot start with 0',
    },
  });

  useEffect(() => {
    let mounted = true;
    const loadPoles = async () => {
      try {
        setIsLoadingPoles(true);
        const candidateUrls = [
          `${apiBaseUrl}/poles?page=1&limit=1000`,
          'http://localhost:3011/api/v1/poles?page=1&limit=1000',
          `${apiBaseUrl}/poles`,
        ];

        let items: any[] = [];
        for (const url of candidateUrls) {
          try {
            const response = await axios.get(url);
            const data = response.data;
            const parsed = Array.isArray(data)
              ? data
              : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data?.data)
              ? data.data
              : [];

            if (parsed.length > 0) {
              items = parsed;
              break;
            }
          } catch {
            // Try next candidate URL/shape.
          }
        }

        if (!mounted) return;

        if (items.length === 0) {
          setPoleOptions([]);
          setPoleLookupUnavailable(true);
          return;
        }

        const options = items.map((pole: any) => ({
          value: pole.code,
          label: `${pole.code} - ${pole.subcity}, ${pole.street}`,
        }));
        setPoleOptions(options);
        setPoleLookupUnavailable(false);
      } catch {
        if (!mounted) return;
        setPoleOptions([]);
        setPoleLookupUnavailable(true);
      } finally {
        if (mounted) {
          setIsLoadingPoles(false);
        }
      }
    };

    loadPoles();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-fill current GPS coordinates when the form opens.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValues((prev) => ({
          ...prev,
          latitude: prev.latitude ?? position.coords.latitude,
          longitude: prev.longitude ?? position.coords.longitude,
        }));
      },
      () => {
        // Ignore permission/availability errors; user can still fill manually.
      },
    );
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      notifications.show({
        title: 'Location Error',
        message: 'Geolocation is not supported by this browser.',
        color: 'red',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValues({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        notifications.show({
          title: 'Location Error',
          message: 'Unable to get current location. Enter coordinates manually.',
          color: 'orange',
        });
      },
    );
  };

  const submitReport = async (values: AccidentFormData) => {
    if (photos.length < 1) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please upload at least 1 incident photo',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Public submission must avoid guarded endpoints.
      const payload = {
        ...values,
        driverPhoneNumber: toEthiopianInternationalPhone(values.driverPhoneNumber),
        reporterType: 'EXTERNAL',
      };
      const publicCreateCandidates = [
        `${apiBaseUrl}/accidents/public`,
        '/api/v1/accidents/public',
        `${apiBaseUrl}/public/accidents`,
      ];

      let accident: any = null;
      let lastCreateError: any = null;
      for (const url of publicCreateCandidates) {
        try {
          const res = await axios.post(url, payload);
          accident = res.data;
          break;
        } catch (error: any) {
          lastCreateError = error;
        }
      }

      if (!accident) {
        throw lastCreateError || new Error('Public accident endpoint not available');
      }

      if (photos.length > 0) {
        const photoData = new FormData();
        photos.forEach((photo) => {
          photoData.append('files', photo);
        });
        const publicPhotoCandidates = [
          `${apiBaseUrl}/accidents/${accident.id}/photos`,
          `/api/v1/accidents/${accident.id}/photos`,
          `${apiBaseUrl}/accidents/public/${accident.id}/photos`,
        ];
        let uploaded = false;
        for (const url of publicPhotoCandidates) {
          try {
            await axios.post(url, photoData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            uploaded = true;
            break;
          } catch {
            // Try next candidate.
          }
        }
        if (!uploaded) {
          notifications.show({
            title: 'Photos Not Uploaded',
            message: 'Accident was created, but photo upload endpoint is currently protected.',
            color: 'orange',
          });
        }
      }

      if (attachments.length > 0) {
        const attachmentData = new FormData();
        attachments.forEach((file) => {
          attachmentData.append('files', file);
        });
        attachmentData.append('attachmentType', 'POLICE_REPORT');
        const publicAttachmentCandidates = [
          `${apiBaseUrl}/accidents/${accident.id}/attachments`,
          `/api/v1/accidents/${accident.id}/attachments`,
          `${apiBaseUrl}/accidents/public/${accident.id}/attachments`,
        ];
        for (const url of publicAttachmentCandidates) {
          try {
            await axios.post(url, attachmentData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            break;
          } catch {
            // Optional attachment upload, ignore failures.
          }
        }
      }

      if (driverLicenseFile) {
        const licenseData = new FormData();
        licenseData.append('file', driverLicenseFile);
        const publicLicenseCandidates = [
          `${apiBaseUrl}/accidents/${accident.id}/driver-license`,
          `/api/v1/accidents/${accident.id}/driver-license`,
          `${apiBaseUrl}/public/accidents/${accident.id}/driver-license`,
        ];

        let uploaded = false;
        for (const url of publicLicenseCandidates) {
          try {
            await axios.post(url, licenseData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            uploaded = true;
            break;
          } catch {
            // Try next candidate.
          }
        }

        if (!uploaded) {
          notifications.show({
            title: 'License File Not Uploaded',
            message: 'Accident was created, but driver license file upload is unavailable right now.',
            color: 'orange',
          });
        }
      }

      notifications.show({
        title: 'Submitted',
        message: 'Your accident report has been submitted successfully.',
        color: 'green',
      });

      form.reset();
      setPhotos([]);
      setAttachments([]);
      setDriverLicenseFile(null);
    } catch (error: any) {
      notifications.show({
        title: 'Submission Failed',
        message: error?.response?.status === 401
          ? 'Public accident endpoint is not open yet. Backend must allow anonymous create.'
          : error?.response?.data?.message || 'Failed to submit accident report',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill all required fields before submitting.',
        color: 'red',
      });
      return;
    }
    await submitReport(form.values);
  };

  return (
    <Container size="xl" py="xl" id="public-accident-report">
      <Paper p="xl" withBorder>
        <Title order={2} mb="lg">
          Public Accident Reporting
        </Title>

        <Alert color="blue" mb="lg">
          <Text fw={500}>No login required.</Text>
          <Text>Report accidents immediately. Upload 1 to 3 clear incident photos.</Text>
        </Alert>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Stack gap="xl">
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
                    <TextInput label="Accident Date" type="date" required {...form.getInputProps('accidentDate')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Accident Time" type="time" required {...form.getInputProps('accidentTime')} />
                  </Grid.Col>
                </Grid>

                {poleLookupUnavailable ? (
                  <TextInput
                    label="Pole ID (if known)"
                    placeholder="Enter pole ID manually"
                    {...form.getInputProps('poleId')}
                  />
                ) : (
                  <Select
                    label="Pole ID (if known)"
                    placeholder={isLoadingPoles ? 'Loading poles...' : 'Select pole or leave blank'}
                    data={poleOptions}
                    searchable
                    clearable
                    disabled={isLoadingPoles}
                    {...form.getInputProps('poleId')}
                  />
                )}
                <Text size="xs" c="dimmed" mt={-8}>
                  You can find the Pole ID written on the pole.
                </Text>
                {poleLookupUnavailable && (
                  <Text size="xs" c="orange">
                    Pole list is unavailable without login, so enter the Pole ID manually if you know it.
                  </Text>
                )}

                <Textarea
                  label="Location Description"
                  placeholder="Describe the exact location of the accident"
                  required
                  minRows={3}
                  {...form.getInputProps('locationDescription')}
                />

                <Card withBorder>
                  <Card.Section withBorder inheritPadding py="sm">
                    <Group justify="space-between">
                      <Title order={5}>GPS Coordinates (Optional)</Title>
                      <Button
                        type="button"
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
                          decimalScale={8}
                          fixedDecimalScale
                          {...form.getInputProps('latitude')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Longitude"
                          placeholder="-176.6597 to 179.4500"
                          decimalScale={8}
                          fixedDecimalScale
                          {...form.getInputProps('longitude')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Card>
              </Stack>
            </Card>

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
                    <VehiclePlateInput
                      label="Vehicle Plate Number"
                      value={form.values.vehiclePlateNumber}
                      onChange={(value) => form.setFieldValue('vehiclePlateNumber', value)}
                      error={form.errors.vehiclePlateNumber}
                      placeholder="Enter vehicle plate number"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Driver Name" {...form.getInputProps('driverName')} />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Insurance Company"
                      placeholder="Select insurance company"
                      data={ETHIOPIAN_INSURANCE_COMPANY_OPTIONS}
                      searchable
                      clearable
                      {...form.getInputProps('insuranceCompany')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label="Claim Reference Number" {...form.getInputProps('claimReferenceNumber')} />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <EthiopianPhoneInput
                      label="Driver Phone Number"
                      value={form.values.driverPhoneNumber}
                      onChange={(value) => form.setFieldValue('driverPhoneNumber', value)}
                      error={form.errors.driverPhoneNumber}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Driver License Number"
                      placeholder="Enter driver license number"
                      {...form.getInputProps('driverLicenseNumber')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid align="end">
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <TextInput
                      label="Driver National ID Number"
                      placeholder="Enter driver national ID number"
                      {...form.getInputProps('driverNationalIdNumber')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Button
                      type="button"
                      variant="light"
                      fullWidth
                      onClick={() =>
                        notifications.show({
                          title: 'Coming Soon',
                          message: 'National ID verification will be added in a future update.',
                          color: 'blue',
                        })
                      }
                    >
                      Verify National ID
                    </Button>
                  </Grid.Col>
                </Grid>

                <FileInput
                  label="Driver License File"
                  placeholder="Upload driver license file (PDF or image)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  leftSection={<IconUpload size={14} />}
                  value={driverLicenseFile}
                  onChange={setDriverLicenseFile}
                />
              </Stack>
            </Card>

            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconUpload size={16} style={{ marginRight: 8 }} />
                  Incident Photos (Mandatory - 1 to 3)
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label="Upload Photos (Required)"
                  required
                  placeholder="Select photos of the incident"
                  multiple
                  accept="image/*"
                  leftSection={<IconUpload size={14} />}
                  onChange={(files) => {
                    const selected = files || [];
                    if (selected.length > 3) {
                      notifications.show({
                        title: 'Photo Limit',
                        message: 'You can upload a maximum of 3 photos',
                        color: 'orange',
                      });
                    }
                    setPhotos(selected.slice(0, 3));
                  }}
                />

                {photos.length > 0 && (
                  <Text size="sm" c="dimmed">
                    {photos.length} file(s) selected
                  </Text>
                )}
              </Stack>
            </Card>

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

            <Group justify="flex-end">
              <Button type="submit" loading={isSubmitting}>
                Submit Accident Report
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
