import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  Title,
  Button,
  Group,
  Badge,
  ActionIcon,
  Text,
  Stack,
  Pagination,
  Alert,
} from '@mantine/core';
import { IconPlus, IconEye } from '@tabler/icons-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function PoleReplacementsListPage() {
  const { t } = useTranslation('replacementsList');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['replaced-poles', page],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Fetching replaced poles:', { page, pageSize, token: token ? 'present' : 'missing' });

      try {
        const res = await axios.get(
          `http://localhost:3011/api/v1/poles?page=${page}&limit=${pageSize}&status=REPLACED`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('✅ Replaced poles API response:', res.data);
        return res.data;
      } catch (error: any) {
        console.error('❌ Replaced poles API error:', error.response?.data || error.message);
        throw error;
      }
    },
  });

  const replacements = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  console.log('📊 Replacements data:', { data, replacements, totalPages, error });

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'DAMAGE': return 'red';
      case 'UPGRADE': return 'blue';
      case 'MAINTENANCE': return 'orange';
      case 'OBSOLETE': return 'gray';
      case 'OTHER': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl" pt="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>{t('title')}</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/replacements/new')}
        >
          {t('actions.create')}
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="md">
          <Text fw={600}>{t('errors.loadTitle')}</Text>
          <Text>{error.message || t('errors.unknown')}</Text>
          <Text size="sm" c="dimmed" mt="xs">
            {t('errors.checkConsole')}
          </Text>
        </Alert>
      )}

      <Paper p="md" withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('table.poleCode')}</Table.Th>
                <Table.Th>{t('table.subcity')}</Table.Th>
                <Table.Th>{t('table.street')}</Table.Th>
                <Table.Th>{t('table.poleType')}</Table.Th>
                <Table.Th>{t('table.lampType')}</Table.Th>
                <Table.Th>{t('table.powerRating')}</Table.Th>
                <Table.Th>{t('table.ledDisplay')}</Table.Th>
                <Table.Th>{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>{tCommon('loading')}</Table.Td>
                </Table.Tr>
              ) : replacements.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Stack align="center" py="xl">
                      <Text c="dimmed">{t('emptyState.title')}</Text>
                      <Text size="sm" c="dimmed" mb="md">
                        {t('emptyState.subtitle')}
                      </Text>
                      <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => navigate('/replacements/new')}
                      >
                        {t('emptyState.cta')}
                      </Button>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                replacements.map((pole: any) => (
                  <Table.Tr key={pole.code}>
                    <Table.Td>
                      <Text fw={600}>{pole.code}</Text>
                    </Table.Td>
                    <Table.Td>{pole.subcity}</Table.Td>
                    <Table.Td>{pole.street}</Table.Td>
                    <Table.Td>
                      <Badge variant="light">{pole.poleType}</Badge>
                    </Table.Td>
                    <Table.Td>{pole.lampType}</Table.Td>
                    <Table.Td>
                      {pole.powerRatingWatt ? `${pole.powerRatingWatt}W` : t('labels.notAvailable')}
                    </Table.Td>
                    <Table.Td>
                      {pole.hasLedDisplay ? (
                        <Badge color="blue" variant="light">{t('labels.yes')}</Badge>
                      ) : (
                        <Badge color="gray" variant="light">{t('labels.no')}</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => navigate(`/poles/${pole.code}`)}
                        title={t('actions.viewDetails')}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
            />
          </Group>
        )}
      </Paper>
    </Container>
  );
}
