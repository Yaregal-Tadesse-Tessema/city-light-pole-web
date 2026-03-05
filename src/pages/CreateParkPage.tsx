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
import ErrorBoundary from '../components/ErrorBoundary';
import { MapPicker } from '../components/MapPicker';
import { useTranslation } from 'react-i18next';

export default function CreateParkPage() {
  const { t } = useTranslation('createPark');
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
      parkType: 'COMMUNITY',
      areaHectares: undefined as number | undefined,
      hasPaidEntrance: false,
      entranceFee: undefined as number | undefined,
      description: '',
      status: 'ACTIVE',
    },
    validate: {
      code: (value) => (!value ? t('validation.codeRequired') : null),
      name: (value) => (!value ? t('validation.nameRequired') : null),
      district: (value) => (!value ? t('validation.subcityRequired') : null),
      street: (value) => (!value ? t('validation.streetRequired') : null),
      gpsLat: (value) => {
        if (value !== undefined && value !== null) {
          if (value < -90 || value > 90) return t('validation.latitudeRange');
        }
        return null;
      },
      gpsLng: (value) => {
        if (value !== undefined && value !== null) {
          if (value < -180 || value > 180) return t('validation.longitudeRange');
        }
        return null;
      },
      areaHectares: (value) => {
        if (value === undefined || value === null) {
          return t('validation.areaRequired');
        }
        if (value <= 0) return t('validation.areaMin');
        return null;
      },
      entranceFee: (value, values) => {
        if (values.hasPaidEntrance && (value === undefined || value === null)) {
          return t('validation.entranceFeeRequired');
        }
        if (values.hasPaidEntrance && value !== undefined && value !== null && value <= 0) {
          return t('validation.entranceFeeMin');
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
        areaHectares: Number(data.areaHectares),
        parkType: data.parkType,
        hasPaidEntrance: data.hasPaidEntrance || false,
        status: data.status,
      };

      // Add entrance fee only if hasPaidEntrance is true
      if (data.hasPaidEntrance && data.entranceFee !== undefined && data.entranceFee !== null) {
        apiData.entranceFee = Number(data.entranceFee);
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
      const response = await axios.post('http://localhost:3011/api/v1/parks', apiData, {
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
      queryClient.invalidateQueries({ queryKey: ['parks'] });
      navigate(`/parks/${data.code}`);
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
    <ErrorBoundary>
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
              <ErrorBoundary>
                <MapPicker
                  value={{ lat: form.values.gpsLat ?? null, lng: form.values.gpsLng ?? null }}
                  onChange={(lat, lng) => {
                    form.setValues({
                      ...form.values,
                      gpsLat: typeof lat === 'number' ? lat : Number(lat),
                      gpsLng: typeof lng === 'number' ? lng : Number(lng),
                    });
                  }}
                />
              </ErrorBoundary>
            </Stack>

            <Group grow>
              <Select
                label={t('fields.parkType')}
                data={t('parkTypes', { returnObjects: true }) as { value: string; label: string }[]}
                {...form.getInputProps('parkType')}
              />
              <NumberInput
                label={t('fields.areaHectares')}
                placeholder={t('placeholders.areaHectares')}
                required
                min={0.01}
                decimalScale={2}
                fixedDecimalScale
                value={form.values.areaHectares ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('areaHectares', numValue);
                }}
                error={form.errors.areaHectares}
              />
            </Group>

            <Switch
              label={t('fields.hasPaidEntrance')}
              {...form.getInputProps('hasPaidEntrance', { type: 'checkbox' })}
            />

            {form.values.hasPaidEntrance && (
              <NumberInput
                label={t('fields.entranceFee')}
                placeholder={t('placeholders.entranceFee')}
                required
                min={0.01}
                decimalScale={2}
                fixedDecimalScale
                value={form.values.entranceFee ?? undefined}
                onChange={(value) => {
                  const numValue = value === '' || value === null || value === undefined ? undefined : Number(value);
                  form.setFieldValue('entranceFee', numValue);
                }}
                error={form.errors.entranceFee}
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
              <Button variant="outline" onClick={() => navigate('/parks')}>
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
    </ErrorBoundary>
  );
}
