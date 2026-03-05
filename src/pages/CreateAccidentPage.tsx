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
import EthiopianPhoneInput from '../components/EthiopianPhoneInput';
import VehiclePlateInput from '../components/VehiclePlateInput';
import {
  isValidEthiopianLocalPhone,
  toEthiopianInternationalPhone,
} from '../utils/ethiopianPhone';
import { ETHIOPIAN_INSURANCE_COMPANY_OPTIONS } from '../utils/ethiopianInsuranceCompanies';
import { useTranslation } from 'react-i18next';

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

export default function CreateAccidentPage() {
  const { t } = useTranslation('createAccident');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);

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
      driverPhoneNumber: '',
      driverLicenseNumber: '',
      driverNationalIdNumber: '',
      insuranceCompany: '',
      claimReferenceNumber: '',
    },
    validate: {
      accidentType: (value) => !value && t('validation.accidentTypeRequired'),
      accidentDate: (value) => !value && t('validation.accidentDateRequired'),
      accidentTime: (value) => !value && t('validation.accidentTimeRequired'),
      locationDescription: (value) => !value && t('validation.locationDescriptionRequired'),
      driverPhoneNumber: (value) =>
        isValidEthiopianLocalPhone(value)
          ? null
          : t('validation.phoneInvalid'),
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
    label: t('labels.poleOption', {
      code: pole.code,
      subcity: pole.subcity,
      street: pole.street,
    }),
  })) || [];

  const accidentTypeOptions = [
    { value: 'VEHICLE_COLLISION', label: t('accidentTypes.VEHICLE_COLLISION') },
    { value: 'FALLING_POLE', label: t('accidentTypes.FALLING_POLE') },
    { value: 'VANDALISM', label: t('accidentTypes.VANDALISM') },
    { value: 'NATURAL_DISASTER', label: t('accidentTypes.NATURAL_DISASTER') },
    { value: 'ELECTRICAL_FAULT', label: t('accidentTypes.ELECTRICAL_FAULT') },
    { value: 'OTHER', label: t('accidentTypes.OTHER') },
  ];

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
            title: t('notifications.locationErrorTitle'),
            message: t('notifications.locationErrorMessage'),
            color: 'orange',
          });
        }
      );
    } else {
      notifications.show({
        title: t('notifications.locationErrorTitle'),
        message: t('notifications.geolocationUnsupported'),
        color: 'red',
      });
    }
  };

  // Create accident mutation
  const createMutation = useMutation({
    mutationFn: async (data: AccidentFormData) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/accidents', {
        ...data,
        reporterType: 'INTERNAL',
      }, {
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

      // Upload driver license file if provided
      if (driverLicenseFile) {
        const formData = new FormData();
        formData.append('file', driverLicenseFile);

        try {
          const token = localStorage.getItem('access_token');
          await axios.post(`http://localhost:3011/api/v1/accidents/${accident.id}/driver-license`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error('Failed to upload driver license file:', error);
          notifications.show({
            title: t('notifications.driverLicenseUploadFailedTitle'),
            message: t('notifications.driverLicenseUploadFailedMessage'),
            color: 'orange',
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.createSuccess'),
        color: 'green',
      });
      navigate('/accidents');
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.createError'),
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: AccidentFormData) => {
    // Validate mandatory photos
    if (photos.length < 1) {
      notifications.show({
        title: t('notifications.validationErrorTitle'),
        message: t('notifications.photosRequired'),
        color: 'red',
      });
      return;
    }

    createMutation.mutate({
      ...values,
      driverPhoneNumber: toEthiopianInternationalPhone(values.driverPhoneNumber),
    });
  };

  return (
    <Container size="xl" py="xl">
      <Paper p="xl" withBorder>
        <Title order={2} mb="lg">
          {t('title')}
        </Title>

        <Alert color="blue" mb="lg">
          <Text fw={500}>{t('alerts.importantTitle')}:</Text>
          <Text>{t('alerts.importantBody')}</Text>
        </Alert>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="xl">
            {/* Incident Details */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>{t('sections.incidentDetails')}</Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <Select
                  label={t('fields.accidentType')}
                  placeholder={t('placeholders.selectAccidentType')}
                  data={accidentTypeOptions}
                  required
                  {...form.getInputProps('accidentType')}
                />

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.accidentDate')}
                      type="date"
                      required
                      {...form.getInputProps('accidentDate')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.accidentTime')}
                      type="time"
                      required
                      {...form.getInputProps('accidentTime')}
                    />
                  </Grid.Col>
                </Grid>

                <Select
                  label={t('fields.poleIdOptional')}
                  placeholder={t('placeholders.selectPoleOptional')}
                  data={poleOptions}
                  searchable
                  clearable
                  {...form.getInputProps('poleId')}
                />

                <Textarea
                  label={t('fields.locationDescription')}
                  placeholder={t('placeholders.locationDescription')}
                  required
                  minRows={3}
                  {...form.getInputProps('locationDescription')}
                />

                {/* GPS Coordinates */}
                <Card withBorder>
                  <Card.Section withBorder inheritPadding py="sm">
                    <Group justify="space-between">
                      <Title order={5}>{t('sections.gpsOptional')}</Title>
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconMapPin size={14} />}
                        onClick={getCurrentLocation}
                      >
                        {t('actions.getCurrentLocation')}
                      </Button>
                    </Group>
                  </Card.Section>

                  <Stack p="md" gap="md">
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label={t('fields.latitude')}
                          placeholder={t('placeholders.latitude')}
                          decimalScale={8}
                          fixedDecimalScale
                          {...form.getInputProps('latitude')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label={t('fields.longitude')}
                          placeholder={t('placeholders.longitude')}
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

            {/* Vehicle & Insurance Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconCar size={16} style={{ marginRight: 8 }} />
                  {t('sections.vehicleInsurance')}
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <VehiclePlateInput
                      label={t('fields.vehiclePlateNumber')}
                      value={form.values.vehiclePlateNumber}
                      onChange={(value) => form.setFieldValue('vehiclePlateNumber', value)}
                      error={form.errors.vehiclePlateNumber}
                      placeholder={t('placeholders.vehiclePlateNumber')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.driverName')}
                      placeholder={t('placeholders.driverName')}
                      {...form.getInputProps('driverName')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label={t('fields.insuranceCompany')}
                      placeholder={t('placeholders.insuranceCompany')}
                      data={ETHIOPIAN_INSURANCE_COMPANY_OPTIONS}
                      searchable
                      clearable
                      {...form.getInputProps('insuranceCompany')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.claimReferenceNumber')}
                      placeholder={t('placeholders.claimReferenceNumber')}
                      {...form.getInputProps('claimReferenceNumber')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <EthiopianPhoneInput
                      label={t('fields.driverPhoneNumber')}
                      value={form.values.driverPhoneNumber}
                      onChange={(value) => form.setFieldValue('driverPhoneNumber', value)}
                      error={form.errors.driverPhoneNumber}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.driverLicenseNumber')}
                      placeholder={t('placeholders.driverLicenseNumber')}
                      {...form.getInputProps('driverLicenseNumber')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid align="end">
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <TextInput
                      label={t('fields.driverNationalIdNumber')}
                      placeholder={t('placeholders.driverNationalIdNumber')}
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
                          title: t('notifications.comingSoonTitle'),
                          message: t('notifications.nationalIdComingSoon'),
                          color: 'blue',
                        })
                      }
                    >
                      {t('actions.verifyNationalId')}
                    </Button>
                  </Grid.Col>
                </Grid>

                <FileInput
                  label={t('fields.driverLicenseFile')}
                  placeholder={t('placeholders.driverLicenseFile')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  leftSection={<IconUpload size={14} />}
                  value={driverLicenseFile}
                  onChange={setDriverLicenseFile}
                />
              </Stack>
            </Card>

            {/* Photo Upload */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconUpload size={16} style={{ marginRight: 8 }} />
                  {t('sections.photos')}
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label={t('fields.uploadPhotosRequired')}
                  required
                  placeholder={t('placeholders.uploadPhotos')}
                  multiple
                  accept="image/*"
                  leftSection={<IconUpload size={14} />}
                  onChange={(files) => {
                    const selected = files || [];
                    if (selected.length > 3) {
                      notifications.show({
                        title: t('notifications.photoLimitTitle'),
                        message: t('notifications.photoLimitMessage'),
                        color: 'orange',
                      });
                    }
                    setPhotos(selected.slice(0, 3));
                  }}
                />

                {photos.length > 0 && (
                  <Text size="sm" c="dimmed">
                    {t('labels.filesSelected', { count: photos.length })}
                  </Text>
                )}

                <Alert color="blue">
                  <Text size="sm">
                    {t('alerts.photosHelp')}
                  </Text>
                </Alert>
              </Stack>
            </Card>

            {/* Attachments */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconFileText size={16} style={{ marginRight: 8 }} />
                  {t('sections.attachments')}
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label={t('fields.uploadDocuments')}
                  placeholder={t('placeholders.uploadDocuments')}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  leftSection={<IconUpload size={14} />}
                  onChange={(files) => setAttachments(files || [])}
                />

                {attachments.length > 0 && (
                  <Text size="sm" c="dimmed">
                    {t('labels.filesSelected', { count: attachments.length })}
                  </Text>
                )}
              </Stack>
            </Card>

            {/* Submit */}
            <Group justify="flex-end" mt="xl">
              <Button variant="light" onClick={() => navigate('/accidents')}>
                {t('actions.cancel')}
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                disabled={photos.length < 1}
              >
                {t('actions.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
