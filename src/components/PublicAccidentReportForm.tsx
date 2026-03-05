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
import { useTranslation } from 'react-i18next';
import {
  isValidEthiopianLocalPhone,
  toEthiopianInternationalPhone,
} from '../utils/ethiopianPhone';
import { ETHIOPIAN_INSURANCE_COMPANY_OPTIONS } from '../utils/ethiopianInsuranceCompanies';
import { toApiV1Url } from '../config/api';

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

export default function PublicAccidentReportForm() {
  const { t } = useTranslation('publicAccidentReport');
  const { date: currentDate, time: currentTime } = getNowDateTime();
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poleOptions, setPoleOptions] = useState<PoleOption[]>([]);
  const [isLoadingPoles, setIsLoadingPoles] = useState(false);
  const [poleLookupUnavailable, setPoleLookupUnavailable] = useState(false);

  const accidentTypes = [
    { value: 'VEHICLE_COLLISION', label: t('accidentTypes.vehicleCollision') },
    { value: 'FALLING_POLE', label: t('accidentTypes.fallingPole') },
    { value: 'VANDALISM', label: t('accidentTypes.vandalism') },
    { value: 'NATURAL_DISASTER', label: t('accidentTypes.naturalDisaster') },
    { value: 'ELECTRICAL_FAULT', label: t('accidentTypes.electricalFault') },
    { value: 'OTHER', label: t('accidentTypes.other') },
  ];

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
      accidentType: (value) => (!value ? t('validation.accidentTypeRequired') : null),
      accidentDate: (value) => (!value ? t('validation.accidentDateRequired') : null),
      accidentTime: (value) => (!value ? t('validation.accidentTimeRequired') : null),
      locationDescription: (value) => (!value ? t('validation.locationDescriptionRequired') : null),
      driverPhoneNumber: (value) =>
        isValidEthiopianLocalPhone(value)
          ? null
          : t('validation.phoneFormat'),
    },
  });

  useEffect(() => {
    let mounted = true;
    const loadPoles = async () => {
      try {
        setIsLoadingPoles(true);
        const candidateUrls = [
          toApiV1Url('/poles?page=1&limit=1000'),
          toApiV1Url('/poles'),
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
        title: t('notifications.locationError.title'),
        message: t('notifications.locationError.unsupported'),
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
          title: t('notifications.locationError.title'),
          message: t('notifications.locationError.unavailable'),
          color: 'orange',
        });
      },
    );
  };

  const submitReport = async (values: AccidentFormData) => {
    if (photos.length < 1) {
      notifications.show({
        title: t('notifications.validationError.title'),
        message: t('notifications.validationError.photoRequired'),
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
        toApiV1Url('/accidents/public'),
        toApiV1Url('/public/accidents'),
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
          toApiV1Url(`/accidents/${accident.id}/photos`),
          toApiV1Url(`/accidents/public/${accident.id}/photos`),
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
            title: t('notifications.photosNotUploaded.title'),
            message: t('notifications.photosNotUploaded.message'),
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
          toApiV1Url(`/accidents/${accident.id}/attachments`),
          toApiV1Url(`/accidents/public/${accident.id}/attachments`),
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
          toApiV1Url(`/accidents/${accident.id}/driver-license`),
          toApiV1Url(`/public/accidents/${accident.id}/driver-license`),
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
            title: t('notifications.licenseNotUploaded.title'),
            message: t('notifications.licenseNotUploaded.message'),
            color: 'orange',
          });
        }
      }

      notifications.show({
        title: t('notifications.submitted.title'),
        message: t('notifications.submitted.message'),
        color: 'green',
      });

      form.reset();
      setPhotos([]);
      setAttachments([]);
      setDriverLicenseFile(null);
    } catch (error: any) {
      notifications.show({
        title: t('notifications.submissionFailed.title'),
        message: error?.response?.status === 401
          ? t('notifications.submissionFailed.unauthorized')
          : error?.response?.data?.message || t('notifications.submissionFailed.default'),
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
        title: t('notifications.validationError.title'),
        message: t('notifications.validationError.requiredFields'),
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
          {t('title')}
        </Title>

        <Alert color="blue" mb="lg">
          <Text fw={500}>{t('alerts.noLogin.title')}</Text>
          <Text>{t('alerts.noLogin.message')}</Text>
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
                <Title order={4}>{t('sections.incidentDetails')}</Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <Select
                  label={t('fields.accidentType.label')}
                  placeholder={t('fields.accidentType.placeholder')}
                  data={accidentTypes}
                  required
                  {...form.getInputProps('accidentType')}
                />

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.accidentDate.label')}
                      type="date"
                      required
                      {...form.getInputProps('accidentDate')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.accidentTime.label')}
                      type="time"
                      required
                      {...form.getInputProps('accidentTime')}
                    />
                  </Grid.Col>
                </Grid>

                {poleLookupUnavailable ? (
                  <TextInput
                    label={t('fields.poleId.label')}
                    placeholder={t('fields.poleId.manualPlaceholder')}
                    {...form.getInputProps('poleId')}
                  />
                ) : (
                  <Select
                    label={t('fields.poleId.label')}
                    placeholder={
                      isLoadingPoles ? t('fields.poleId.loadingPlaceholder') : t('fields.poleId.selectPlaceholder')
                    }
                    data={poleOptions}
                    searchable
                    clearable
                    disabled={isLoadingPoles}
                    {...form.getInputProps('poleId')}
                  />
                )}
                <Text size="xs" c="dimmed" mt={-8}>
                  {t('fields.poleId.helper')}
                </Text>
                {poleLookupUnavailable && (
                  <Text size="xs" c="orange">
                    {t('fields.poleId.unavailableHelper')}
                  </Text>
                )}

                <Textarea
                  label={t('fields.locationDescription.label')}
                  placeholder={t('fields.locationDescription.placeholder')}
                  required
                  minRows={3}
                  {...form.getInputProps('locationDescription')}
                />

                <Card withBorder>
                  <Card.Section withBorder inheritPadding py="sm">
                    <Group justify="space-between">
                      <Title order={5}>{t('sections.gpsCoordinates')}</Title>
                      <Button
                        type="button"
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
                          label={t('fields.latitude.label')}
                          placeholder={t('fields.latitude.placeholder')}
                          decimalScale={8}
                          fixedDecimalScale
                          {...form.getInputProps('latitude')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label={t('fields.longitude.label')}
                          placeholder={t('fields.longitude.placeholder')}
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
                  {t('sections.vehicleInsurance')}
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <VehiclePlateInput
                      label={t('fields.vehiclePlateNumber.label')}
                      value={form.values.vehiclePlateNumber}
                      onChange={(value) => form.setFieldValue('vehiclePlateNumber', value)}
                      error={form.errors.vehiclePlateNumber}
                      placeholder={t('fields.vehiclePlateNumber.placeholder')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput label={t('fields.driverName.label')} {...form.getInputProps('driverName')} />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label={t('fields.insuranceCompany.label')}
                      placeholder={t('fields.insuranceCompany.placeholder')}
                      data={ETHIOPIAN_INSURANCE_COMPANY_OPTIONS}
                      searchable
                      clearable
                      {...form.getInputProps('insuranceCompany')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.claimReferenceNumber.label')}
                      {...form.getInputProps('claimReferenceNumber')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <EthiopianPhoneInput
                      label={t('fields.driverPhoneNumber.label')}
                      value={form.values.driverPhoneNumber}
                      onChange={(value) => form.setFieldValue('driverPhoneNumber', value)}
                      error={form.errors.driverPhoneNumber}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('fields.driverLicenseNumber.label')}
                      placeholder={t('fields.driverLicenseNumber.placeholder')}
                      {...form.getInputProps('driverLicenseNumber')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid align="end">
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <TextInput
                      label={t('fields.driverNationalIdNumber.label')}
                      placeholder={t('fields.driverNationalIdNumber.placeholder')}
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
                          title: t('notifications.comingSoon.title'),
                          message: t('notifications.comingSoon.message'),
                          color: 'blue',
                        })
                      }
                    >
                      {t('actions.verifyNationalId')}
                    </Button>
                  </Grid.Col>
                </Grid>

                <FileInput
                  label={t('fields.driverLicenseFile.label')}
                  placeholder={t('fields.driverLicenseFile.placeholder')}
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
                  {t('sections.incidentPhotos')}
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label={t('fields.incidentPhotos.label')}
                  required
                  placeholder={t('fields.incidentPhotos.placeholder')}
                  multiple
                  accept="image/*"
                  leftSection={<IconUpload size={14} />}
                  onChange={(files) => {
                    const selected = files || [];
                    if (selected.length > 3) {
                      notifications.show({
                        title: t('notifications.photoLimit.title'),
                        message: t('notifications.photoLimit.message'),
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
              </Stack>
            </Card>

            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconFileText size={16} style={{ marginRight: 8 }} />
                  {t('sections.policeReport')}
                </Title>
              </Card.Section>

              <Stack p="md" gap="md">
                <FileInput
                  label={t('fields.attachments.label')}
                  placeholder={t('fields.attachments.placeholder')}
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

            <Group justify="flex-end">
              <Button type="submit" loading={isSubmitting}>
                {t('actions.submitReport')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
