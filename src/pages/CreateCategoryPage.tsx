import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Stack,
  Title,
  Alert,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function CreateCategoryPage() {
  const { t } = useTranslation('createCategory');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (!value ? t('validation.nameRequired') : null),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/categories', data, {
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || t('notifications.createError');
      setApiError(errorMessage);

      if (errorMessage.includes('already exists')) {
        form.setFieldError('name', t('validation.nameExists'));
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
    const apiData: any = {
      name: values.name,
    };

    if (values.description) apiData.description = values.description;

    createMutation.mutate(apiData);
  });

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} order={1}>{t('title')}</Title>

      <Paper withBorder p={{ base: 'xs', sm: 'xl' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            {apiError && (
              <Alert color="red" title={t('notifications.errorTitle')} onClose={() => setApiError(null)} withCloseButton>
                {apiError}
              </Alert>
            )}

            <TextInput
              label={t('fields.name')}
              placeholder={t('placeholders.name')}
              required
              {...form.getInputProps('name')}
            />

            <Textarea
              label={t('fields.descriptionOptional')}
              placeholder={t('placeholders.description')}
              minRows={3}
              {...form.getInputProps('description')}
            />

            <Button.Group>
              <Button variant="outline" onClick={() => navigate('/categories')}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t('actions.create')}
              </Button>
            </Button.Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

