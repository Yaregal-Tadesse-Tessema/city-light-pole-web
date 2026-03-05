import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Group,
  Alert,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function CreateInventoryItemPage() {
  const { t } = useTranslation('createInventoryItem');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error(t('errors.authTokenMissing'));
      }
      const response = await axios.get('http://localhost:3011/api/v1/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    retry: 1,
  });

  const categoryOptions = categories?.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  })) || [];



  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      description: '',
      categoryId: '',
      unitOfMeasure: 'pieces',
      currentStock: 0,
      minimumThreshold: 0,
      unitCost: undefined as number | undefined,
      supplierName: '',
      supplierContact: '',
      isActive: true,
    },
    validate: {
      code: (value) => (!value ? t('validation.codeRequired') : null),
      name: (value) => (!value ? t('validation.nameRequired') : null),
      categoryId: (value) => (!value ? t('validation.categoryRequired') : null),
      currentStock: (value) => (value < 0 ? t('validation.stockNegative') : null),
      minimumThreshold: (value) => (value < 0 ? t('validation.thresholdNegative') : null),
      unitCost: (value) => (value !== undefined && value < 0 ? t('validation.costNegative') : null),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://localhost:3011/api/v1/inventory', data, {
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
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate(`/inventory/${data.code}`);
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
    const apiData: any = {
      code: values.code,
      name: values.name,
      categoryId: values.categoryId,
      unitOfMeasure: values.unitOfMeasure,
      currentStock: values.currentStock,
      minimumThreshold: values.minimumThreshold,
      isActive: values.isActive,
    };

    if (values.description) apiData.description = values.description;
    if (values.unitCost !== undefined) apiData.unitCost = values.unitCost;
    if (values.supplierName) apiData.supplierName = values.supplierName;
    if (values.supplierContact) apiData.supplierContact = values.supplierContact;

    createMutation.mutate(apiData);
  });

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>{t('title')}</Title>
        <Button variant="light" onClick={() => navigate('/categories')}>
          {t('actions.manageCategories')}
        </Button>
      </Group>

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

            <TextInput
              label={t('fields.description')}
              placeholder={t('placeholders.description')}
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                label={t('fields.category')}
                placeholder={categoriesLoading ? t('placeholders.loadingCategories') : t('placeholders.selectCategory')}
                data={categoryOptions}
                required
                searchable
                disabled={categoriesLoading}
                value={form.values.categoryId}
                onChange={(value) => form.setFieldValue('categoryId', value || '')}
                error={form.errors.categoryId || (categoriesError ? t('errors.loadCategories') : undefined)}
              />
              <Select
                label={t('fields.unitOfMeasure')}
                data={t('units', { returnObjects: true }) as { value: string; label: string }[]}
                required
                {...form.getInputProps('unitOfMeasure')}
              />
            </Group>

            <Group grow>
              <NumberInput
                label={t('fields.initialStock')}
                placeholder={t('placeholders.initialStock')}
                min={0}
                {...form.getInputProps('currentStock')}
              />
              <NumberInput
                label={t('fields.minimumThreshold')}
                placeholder={t('placeholders.minimumThreshold')}
                min={0}
                {...form.getInputProps('minimumThreshold')}
              />
            </Group>

            <NumberInput
              label={t('fields.unitCostOptional')}
              placeholder={t('placeholders.unitCost')}
              min={0}
              decimalScale={2}
              fixedDecimalScale
              {...form.getInputProps('unitCost')}
            />

            <Group grow>
              <TextInput
                label={t('fields.supplierNameOptional')}
                placeholder={t('placeholders.supplierName')}
                {...form.getInputProps('supplierName')}
              />
              <TextInput
                label={t('fields.supplierContactOptional')}
                placeholder={t('placeholders.supplierContact')}
                {...form.getInputProps('supplierContact')}
              />
            </Group>

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => navigate('/inventory')}>
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
