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
  Group,
  Alert,
  Textarea,
  Text,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { MapPicker } from '../components/MapPicker';
import { useTranslation } from 'react-i18next';

export default function CreateParkingLotPage() {
  const { t } = useTranslation('createParkingLot');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      district: '',
      street: '',
      gpsLat: undefined as number | undefined,
      gpsLng: undefined as number | undefined,
      parkingType: 'SURFACE',
      capacity: undefined as number | undefined,
      hasPaidParking: false,
      hourlyRate: undefined as number | undefined,
      description: '',
      status: 'ACTIVE',
    },
    validate: {
      code: (value) => (!value ? t('validation.codeRequired') : null),
      name: (value) => (!value ? t('validation.nameRequired') : null),
      district: (value) => (!value ? t('validation.subcityRequired') : null),
      street: (value) => (!value ? t('validation.streetRequired') : null),
      capacity: (value) => {
        if (value === undefined || value === null) {
          return t('validation.capacityRequired');
        }
        if (value <= 0) return t('validation.capacityMin');
        return null;
      },
      hourlyRate: (value, values) => {
        if (values.hasPaidParking && (value === undefined || value === null)) {
          return t('validation.hourlyRateRequired');
        }
        if (values.hasPaidParking && value !== undefined && value !== null && value <= 0) {
          return t('validation.hourlyRateMin');
        }
        return null;
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const apiData: any = {
        code: data.code,
        name: data.name,
        district: data.district,
        street: data.street,
        capacity: Number(data.capacity),
        parkingType: data.parkingType,
        hasPaidParking: data.hasPaidParking || false,
        status: data.status,
      };

      if (data.hasPaidParking && data.hourlyRate !== undefined && data.hourlyRate !== null) {
        apiData.hourlyRate = Number(data.hourlyRate);
      }

      if (data.description) {
        apiData.description = data.description;
      }

      if (data.gpsLat !== undefined && data.gpsLat !== null && !Number.isNaN(Number(data.gpsLat))) {
        apiData.gpsLat = Number(data.gpsLat);
      }
      if (data.gpsLng !== undefined && data.gpsLng !== null && !Number.isNaN(Number(data.gpsLng))) {
        apiData.gpsLng = Number(data.gpsLng);
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/parking-lots', apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.createSuccess'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['parking-lots'] });
      navigate(`/parking-lots/${data.code}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || t('notifications.createError');
      setApiError(errorMessage);
      
      if (errorMessage.includes('code') && errorMessage.includes('already exists')) {
        form.setFieldError('code', t('validation.codeExists'));
      }
      
      notifications.show({
        title: t('notifications.errorTitle'),
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
      <Title mb={{ base: 'md', sm: 'xl' }} order={1} size="h2">{t('title')}</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title={t('notifications.errorTitle')} onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}

            <Group grow>
              <TextInput
                label={t('fields.code')}
                placeholder={t('placeholders.code')}
                required
                {...form.getInputProps('code')}
              />
              <TextInput
                label={t('fields.name')}
                placeholder={t('placeholders.name')}
                required
                {...form.getInputProps('name')}
              />
            </Group>

            <Group grow>
              <Select
                label={t('fields.subcity')}
                placeholder={t('placeholders.subcity')}
                required
                data={[
                  t('subcities.addisKetema', { ns: 'dashboard' }),
                  t('subcities.akakyKaliti', { ns: 'dashboard' }),
                  t('subcities.arada', { ns: 'dashboard' }),
                  t('subcities.bole', { ns: 'dashboard' }),
                  t('subcities.gullele', { ns: 'dashboard' }),
                  t('subcities.kirkos', { ns: 'dashboard' }),
                  t('subcities.kolfeKeranio', { ns: 'dashboard' }),
                  t('subcities.lideta', { ns: 'dashboard' }),
                  t('subcities.nifasSilkLafto', { ns: 'dashboard' }),
                  t('subcities.yeka', { ns: 'dashboard' }),
                  t('subcities.lemiKura', { ns: 'dashboard' }),
                ]}
                searchable
                {...form.getInputProps('district')}
              />
              <TextInput
                label={t('fields.street')}
                placeholder={t('placeholders.street')}
                required
                {...form.getInputProps('street')}
              />
            </Group>

            <Stack gap="xs">
              <Group grow>
                <NumberInput
                  label={t('fields.gpsLatOptional')}
                  placeholder={t('placeholders.gpsAuto')}
                  min={-90}
                  max={90}
                  value={form.values.gpsLat ?? undefined}
                  readOnly
                />
                <NumberInput
                  label={t('fields.gpsLngOptional')}
                  placeholder={t('placeholders.gpsAuto')}
                  min={-180}
                  max={180}
                  value={form.values.gpsLng ?? undefined}
                  readOnly
                />
              </Group>
              <Text size="sm" c="dimmed">
                {t('helper.map')}
              </Text>
              <MapPicker
                value={{ lat: form.values.gpsLat, lng: form.values.gpsLng }}
                onChange={(lat, lng) => {
                  form.setValues({
                    ...form.values,
                    gpsLat: typeof lat === 'number' ? lat : Number(lat),
                    gpsLng: typeof lng === 'number' ? lng : Number(lng),
                  });
                }}
              />
            </Stack>

            <Group grow>
              <Select
                label={t('fields.parkingType')}
                data={t('parkingTypes', { returnObjects: true }) as { value: string; label: string }[]}
                {...form.getInputProps('parkingType')}
              />
              <NumberInput
                label={t('fields.capacity')}
                placeholder={t('placeholders.capacity')}
                required
                min={1}
                value={form.values.capacity ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('capacity', numValue);
                }}
                error={form.errors.capacity}
              />
            </Group>

            <Switch
              label={t('fields.hasPaidParking')}
              {...form.getInputProps('hasPaidParking', { type: 'checkbox' })}
            />

            {form.values.hasPaidParking && (
              <NumberInput
                label={t('fields.hourlyRate')}
                placeholder={t('placeholders.hourlyRate')}
                required
                min={0.01}
                decimalScale={2}
                fixedDecimalScale
                value={form.values.hourlyRate ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('hourlyRate', numValue);
                }}
                error={form.errors.hourlyRate}
              />
            )}

            <Textarea
              label={t('fields.descriptionOptional')}
              placeholder={t('placeholders.description')}
              rows={4}
              {...form.getInputProps('description')}
            />

            <Select
              label={t('fields.status')}
              data={t('statuses', { returnObjects: true }) as { value: string; label: string }[]}
              {...form.getInputProps('status')}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/parking-lots')}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t('actions.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

