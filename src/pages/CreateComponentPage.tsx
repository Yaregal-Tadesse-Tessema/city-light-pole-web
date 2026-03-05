import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Text,
  TextInput,
  NumberInput,
  Select,
  Button,
  Stack,
  Title,
  Group,
  Alert,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { componentsApi, COMPONENT_TYPES } from '../api/components';
import { useTranslation } from 'react-i18next';

export default function CreateComponentPage() {
  const { t } = useTranslation('createComponent');
  const typeOptions = COMPONENT_TYPES.map((type) => ({
    value: type,
    label: t(`typeLabels.${type}`, { defaultValue: type.replace(/_/g, ' ') }),
  }));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      type: 'BULB',
      model: '',
      partNumber: '',
      sku: '',
      description: '',
      manufacturerName: '',
      manufacturerPhone: '',
      manufacturerEmail: '',
      manufacturerCountry: '',
      serialNumber: '',
      powerUsageWatt: undefined as number | undefined,
      lifespanMonths: undefined as number | undefined,
      isActive: true,
      tags: '',
    },
    validate: {
      name: (v) => (!v ? t('validation.nameRequired') : null),
      type: (v) => (!v ? t('validation.typeRequired') : null),
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => componentsApi.create(data),
    onSuccess: (data) => {
      notifications.show({ title: t('notifications.successTitle'), message: t('notifications.createSuccess'), color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['components'] });
      navigate(`/components/${data.id}`);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || t('notifications.createError');
      setApiError(msg);
      notifications.show({ title: t('notifications.errorTitle'), message: msg, color: 'red' });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setApiError(null);
    const payload: Record<string, unknown> = {
      name: values.name,
      type: values.type,
      model: values.model || undefined,
      partNumber: values.partNumber || undefined,
      sku: values.sku || undefined,
      description: values.description || undefined,
      manufacturerName: values.manufacturerName || undefined,
      manufacturerPhone: values.manufacturerPhone || undefined,
      manufacturerEmail: values.manufacturerEmail || undefined,
      manufacturerCountry: values.manufacturerCountry || undefined,
      serialNumber: values.serialNumber || undefined,
      powerUsageWatt: values.powerUsageWatt,
      lifespanMonths: values.lifespanMonths,
      isActive: values.isActive,
    };
    if (values.tags) {
      payload.tags = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    createMutation.mutate(payload);
  });

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">{t('title')}</Title>
      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title={t('notifications.errorTitle')} onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}
            <Group grow>
              <TextInput label={t('fields.name')} required {...form.getInputProps('name')} />
              <Select label={t('fields.type')} required data={typeOptions} {...form.getInputProps('type')} />
            </Group>
            <Group grow>
              <TextInput label={t('fields.model')} {...form.getInputProps('model')} />
              <TextInput label={t('fields.partNumber')} {...form.getInputProps('partNumber')} />
              <TextInput label={t('fields.sku')} {...form.getInputProps('sku')} />
            </Group>
            <Textarea label={t('fields.description')} minRows={2} {...form.getInputProps('description')} />
            <Stack gap="xs">
              <Text size="sm" fw={600} c="dimmed">{t('sections.manufacturerInfo')}</Text>
              <Group grow>
                <TextInput label={t('fields.manufacturerName')} placeholder={t('placeholders.manufacturerName')} {...form.getInputProps('manufacturerName')} />
                <TextInput label={t('fields.manufacturerPhone')} placeholder={t('placeholders.manufacturerPhone')} {...form.getInputProps('manufacturerPhone')} />
                <TextInput label={t('fields.manufacturerEmail')} type="email" placeholder={t('placeholders.manufacturerEmail')} {...form.getInputProps('manufacturerEmail')} />
              </Group>
              <TextInput label={t('fields.manufacturerCountry')} {...form.getInputProps('manufacturerCountry')} />
            </Stack>
            <Group grow>
              <TextInput label={t('fields.serialNumber')} {...form.getInputProps('serialNumber')} />
              <NumberInput label={t('fields.power')} min={0} {...form.getInputProps('powerUsageWatt')} />
              <NumberInput label={t('fields.lifespanMonths')} min={0} {...form.getInputProps('lifespanMonths')} />
            </Group>
            <TextInput label={t('fields.tags')} {...form.getInputProps('tags')} />
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/components')}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t('actions.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}





