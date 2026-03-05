import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Loader,
  Center,
  Badge,
  Stack,
  Card,
} from '@mantine/core';
import { IconEdit, IconArrowLeft } from '@tabler/icons-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function CategoryDetailPage() {
  const { t } = useTranslation('categoryDetail');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:3011/api/v1/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!category) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Text c="dimmed">{t('state.notFound')}</Text>
        </Center>
      </Container>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Group gap="md">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/categories')}
          >
            {t('actions.backToCategories')}
          </Button>
          <Title order={1}>{category.name}</Title>
        </Group>
        {isAdmin && (
          <Button
            leftSection={<IconEdit size={16} />}
            onClick={() => navigate(`/categories/${id}/edit`)}
          >
            {t('actions.editCategory')}
          </Button>
        )}
      </Group>

      <Stack>
        <Card withBorder p="lg">
          <Title order={3} mb="md">{t('sections.information')}</Title>
          <Group mb="sm">
            <Text fw={600} w={120}>{t('fields.name')}:</Text>
            <Text>{category.name}</Text>
          </Group>
          <Group mb="sm">
            <Text fw={600} w={120}>{t('fields.description')}:</Text>
            <Text>{category.description || t('labels.noDescription')}</Text>
          </Group>
          <Group mb="sm">
            <Text fw={600} w={120}>{t('fields.status')}:</Text>
            <Badge color={category.isActive ? 'green' : 'red'}>
              {category.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          </Group>
          <Group mb="sm">
            <Text fw={600} w={120}>{t('fields.created')}:</Text>
            <Text>{new Date(category.createdAt).toLocaleString()}</Text>
          </Group>
          <Group>
            <Text fw={600} w={120}>{t('fields.updated')}:</Text>
            <Text>{new Date(category.updatedAt).toLocaleString()}</Text>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}

