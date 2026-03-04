import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Box,
  Stack,
  Card,
  ThemeIcon,
  SimpleGrid,
} from '@mantine/core';
import {
  IconBolt,
  IconChartBar,
  IconShieldCheck,
  IconCamera,
  IconBulb,
  IconGauge,
  IconArrowRight,
  IconAlertTriangle,
  IconMapPin,
  IconClockHour4,
  IconListDetails,
  IconTool,
  IconCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const baseFeatureIcons = [
    IconBulb,
    IconGauge,
    IconChartBar,
    IconShieldCheck,
    IconCamera,
    IconBolt,
  ];
  const translatedFeatures = (t('features', { returnObjects: true }) as { title: string; description: string }[]) || [];
  const features = baseFeatureIcons.map((IconComponent, index) => ({
    icon: IconComponent,
    title: translatedFeatures[index]?.title || '',
    description: translatedFeatures[index]?.description || '',
  }));

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3011').replace(/\/$/, '');
  const apiV1BaseUrl = apiBaseUrl.endsWith('/api/v1') ? apiBaseUrl : `${apiBaseUrl}/api/v1`;

  const { data: incidentsTotal = 0 } = useQuery({
    queryKey: ['landing', 'public-accidents-total'],
    queryFn: async () => {
      const res = await axios.get(`${apiV1BaseUrl}/public/accidents?page=1&limit=1`);
      return Number(res.data?.total || 0);
    },
  });

  const { data: issuesTotal = 0 } = useQuery({
    queryKey: ['landing', 'public-issues-total'],
    queryFn: async () => {
      const res = await axios.get(`${apiV1BaseUrl}/public/issues?page=1&limit=1`);
      return Number(res.data?.total || 0);
    },
  });

  const { data: inProgressMaintenance = 0 } = useQuery({
    queryKey: ['landing', 'in-progress-maintenance'],
    queryFn: async () => {
      const res = await axios.get(`${apiV1BaseUrl}/poles?status=UNDER_MAINTENANCE&page=1&limit=1`);
      return Number(res.data?.total || 0);
    },
  });

  const { data: completedMaintenance = 0 } = useQuery({
    queryKey: ['landing', 'completed-maintenance'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return 0;

      const res = await axios.get(`${apiV1BaseUrl}/reports/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return Number(res.data?.maintenance?.completed || 0);
    },
  });

  const formatCount = (value: number) => value.toLocaleString();

  const statEntries = (t('stats', { returnObjects: true }) as { label: string; valueLabel: string }[]) || [];
  const statValues = (t('statsValues', { returnObjects: true }) as Record<string, string>) || {};
  const statDecorators: Record<string, { icon: ComponentType<any>; color: string }> = {
    lightPolesManaged: { icon: IconBulb, color: 'yellow' },
    subcitiesCovered: { icon: IconMapPin, color: 'grape' },
    monitoring: { icon: IconClockHour4, color: 'blue' },
    uptime: { icon: IconShieldCheck, color: 'teal' },
    incidentsReported: { icon: IconAlertTriangle, color: 'red' },
    issuesReported: { icon: IconListDetails, color: 'orange' },
    inProgressMaintenances: { icon: IconTool, color: 'indigo' },
    completedMaintenances: { icon: IconCheck, color: 'green' },
  };
  const stats = statEntries.map((stat) => {
    let value = statValues[stat.valueLabel] ?? '';
    switch (stat.valueLabel) {
      case 'incidentsReported':
        value = formatCount(incidentsTotal);
        break;
      case 'issuesReported':
        value = formatCount(issuesTotal);
        break;
      case 'inProgressMaintenances':
        value = formatCount(inProgressMaintenance);
        break;
      case 'completedMaintenances':
        value = formatCount(completedMaintenance);
        break;
    }
    const decorator = statDecorators[stat.valueLabel] || { icon: IconBulb, color: 'gray' };
    return {
      ...stat,
      value,
      icon: decorator.icon,
      color: decorator.color,
    };
  });

  return (
    <Box style={{ minHeight: '100vh' }}>
      {/* Hero Section with Background Image */}
      <Box
        style={{
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 100%), url('/addis.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: 'white',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
        }}
        p={60}
      >
        <Container size="lg" px="md">
          <Group mb="md" style={{ justifyContent: 'flex-end' }}>
            <LanguageSelector size="sm" />
          </Group>
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title
                order={1}
                size={48}
                ta="center"
                c="white"
                style={{
                  textShadow: '3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                }}
              >
                {t('hero.preTitle')}
                <br />
                <Text
                  span
                  c="#FFD700"
                  inherit
                  style={{
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontWeight: 900,
                  }}
                >
                  {t('hero.titleHighlight')}
                </Text>
                <br />
                {t('hero.titleSuffix')}
              </Title>

              <Text
                size="lg"
                ta="center"
                c="white"
                maw={900}
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.7), 0 0 15px rgba(0,0,0,0.3)',
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                {t('hero.subtitle')}
              </Text>
              <Text
                size="sm"
                ta="center"
                c="white"
                maw={900}
                style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
                  lineHeight: 1.5,
                }}
              >
                {t('hero.description')}
              </Text>
            </Stack>

            <Group gap="md" wrap="wrap" justify="center">
              <Button
                size="lg"
                variant="filled"
                color="white"
                c="blue.9"
                onClick={() => navigate('/login')}
                style={{
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  fontWeight: 600,
                }}
              >
                {t('cta.login')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                color="red"
                leftSection={<IconAlertTriangle size={18} />}
                onClick={() => navigate('/report-accident')}
                style={{
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                {t('cta.report')}
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 60, sm: 80 }} style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Container size="lg">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title order={2} ta="center" size="h2">
                {t('sections.powerfulFeaturesTitle')}
              </Title>
              <Text c="dimmed" ta="center" maw={600} size="lg">
                {t('sections.powerfulFeaturesSubtitle')}
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {features.map((feature, index) => (
                <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group mb="md">
                    <ThemeIcon size="lg" variant="light" color="blue">
                      <feature.icon size={24} />
                    </ThemeIcon>
                    <Title order={4}>{feature.title}</Title>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {feature.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box py={{ base: 40, sm: 60 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
            {stats.map((stat, index) => (
              <Card
                key={index}
                withBorder
                radius="md"
                p="md"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  borderColor: 'var(--mantine-color-gray-3)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Stack align="center" gap="xs">
                  <ThemeIcon size={38} radius="xl" color={stat.color} variant="light">
                    <stat.icon size={20} />
                  </ThemeIcon>
                  <Text size="1.8rem" fw={900} c={`${stat.color}.7`} lh={1.1}>
                    {stat.value}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" fw={600}>
                    {stat.label}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 60, sm: 80 }} style={{ backgroundColor: 'var(--mantine-color-blue-6)' }}>
        <Container size="lg">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title order={2} ta="center" c="white" size="h2">
                {t('cta.readyTitle')}
              </Title>
              <Text c="white" ta="center" maw={600} size="lg" opacity={0.9}>
                {t('cta.readyBody')}
              </Text>
            </Stack>

            <Group gap="md">
              <Button
                size="lg"
                variant="white"
                color="blue"
                rightSection={<IconArrowRight size={20} />}
                onClick={() => navigate('/login')}
                style={{ fontWeight: 600 }}
              >
                {t('cta.goToLogin')}
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
