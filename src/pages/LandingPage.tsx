import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Grid,
  Image,
  Box,
  ThemeIcon,
  Loader,
  Center,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import {
  IconBulb,
  IconAlertTriangle,
  IconTools,
  IconMapPin,
  IconChartBar,
  IconShield,
  IconTrees,
  IconParking,
  IconBuildingStore,
  IconBath,
  IconTrophy,
  IconDroplet,
} from '@tabler/icons-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  const assetTypes = [
    {
      icon: IconBulb,
      title: 'Light Poles',
      description: 'Comprehensive tracking and management of all city light poles with real-time status updates.',
      image: '/light.jpg',
    },
    {
      icon: IconTrees,
      title: 'Public Parks',
      description: 'Manage and monitor public parks, green spaces, and recreational areas across the city.',
      image: '/parks.jpg',
    },
    {
      icon: IconParking,
      title: 'Car Parking Lots',
      description: 'Track parking facilities, capacity, and availability for better urban planning.',
      image: '/parking.jpg',
    },
    {
      icon: IconBuildingStore,
      title: 'Museums',
      description: 'Manage museum facilities, exhibitions, and cultural heritage sites.',
      image: '/adwa.webp',
    },
    {
      icon: IconBath,
      title: 'Public Toilets',
      description: 'Monitor and maintain public restroom facilities throughout the city.',
      image: '/toilates.jpg',
    },
    {
      icon: IconTrophy,
      title: 'Sport Stadiums',
      description: 'Manage sports facilities, stadiums, and athletic venues for events and maintenance.',
      image: '/stadium.jpg',
    },
    {
      icon: IconDroplet,
      title: 'River Side Projects',
      description: 'Track and manage riverfront development projects and waterfront infrastructure.',
      image: '/river side.jpg',
    },
  ];

  const features = [
    {
      icon: IconAlertTriangle,
      title: 'Issue Reporting',
      description: 'Quick and efficient reporting system for identifying and tracking issues across all asset types.',
    },
    {
      icon: IconTools,
      title: 'Maintenance Scheduling',
      description: 'Streamlined maintenance workflows with scheduling and tracking capabilities.',
    },
    {
      icon: IconMapPin,
      title: 'GPS Tracking',
      description: 'Precise location tracking for all assets using GPS coordinates.',
    },
    {
      icon: IconChartBar,
      title: 'Analytics & Reports',
      description: 'Comprehensive dashboards and reports for data-driven decision making.',
    },
    {
      icon: IconShield,
      title: 'Secure Access',
      description: 'Role-based access control ensuring secure and authorized system access.',
    },
  ];

  return (
    <Box>
      {/* Header with Sign In */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 0',
        }}
      >
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group gap={{ base: 'xs', sm: 'md' }}>
              <Image
                src="/esaa-logo.jpeg"
                alt="ESAA Logo"
                w={{ base: 40, sm: 60 }}
                h={{ base: 40, sm: 60 }}
                fit="contain"
                style={{ borderRadius: '50%' }}
              />
              <Title 
                order={3} 
                size={{ base: 'h5', sm: 'h4' }} 
                c="white"
                visibleFrom="xs"
              >
                Coredor Assets Management System
              </Title>
              <Text 
                size="xs" 
                c="white"
                hiddenFrom="xs"
                fw={600}
              >
                Coredor Assets
              </Text>
            </Group>
            <Button
              size="md"
              variant="white"
              color="blue"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Group>
        </Container>
      </Box>

      {/* Compact Hero Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
        p={{ base: 24, sm: 40 }}
      >
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Stack align="center" gap={{ base: 'sm', sm: 'md' }}>
            <Text 
              size={{ base: 'sm', sm: 'lg' }} 
              ta="center" 
              c="white" 
              maw={800}
            >
              Comprehensive management platform for city assets including light poles, public parks, parking lots, museums, public toilets, sport stadiums, and river side projects
            </Text>
            <Button
              size="md"
              variant="outline"
              color="white"
              onClick={() => navigate('/signup')}
              style={{ borderColor: 'white', color: 'white' }}
            >
              Get Started
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Asset Types Section */}
      <Container size="xl" py={{ base: 24, sm: 40 }} px={{ base: 'xs', sm: 'md' }}>
        <Stack align="center" gap="md" mb={{ base: 20, sm: 30 }}>
          <Title order={2} size={{ base: 20, sm: 28 }} ta="center">
            Managed Asset Types
          </Title>
        </Stack>

        <Grid gutter={{ base: 'xs', sm: 'md' }}>
          {assetTypes.map((asset, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Paper p={0} withBorder h="100%" style={{ height: '100%', overflow: 'hidden', cursor: 'pointer' }}>
                <Stack gap={0}>
                  <Image
                    src={asset.image}
                    alt={asset.title}
                    height={{ base: 120, sm: 150 }}
                    fit="cover"
                    style={{ width: '100%' }}
                  />
                  <Stack p={{ base: 'xs', sm: 'md' }} gap="xs">
                    <Group gap="xs">
                      <ThemeIcon size={{ base: 32, sm: 40 }} radius="md" variant="light" color="blue">
                        <asset.icon size={{ base: 16, sm: 20 }} />
                      </ThemeIcon>
                      <Title order={5} size={{ base: 'xs', sm: 'sm' }} style={{ flex: 1 }}>
                        {asset.title}
                      </Title>
                    </Group>
                    <Text c="dimmed" size={{ base: '10px', sm: 'xs' }} lineClamp={2}>
                      {asset.description}
                    </Text>
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      {/* Features Section - Compact */}
      <Container size="lg" py={{ base: 24, sm: 40 }} px={{ base: 'xs', sm: 'md' }}>
        <Stack align="center" gap="md" mb={{ base: 20, sm: 30 }}>
          <Title order={2} size={{ base: 20, sm: 28 }} ta="center">
            Key Features
          </Title>
        </Stack>

        <Grid gutter={{ base: 'xs', sm: 'md' }}>
          {features.map((feature, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p={{ base: 'xs', sm: 'md' }} withBorder h="100%" style={{ height: '100%' }}>
                <Stack gap="sm">
                  <ThemeIcon size={{ base: 40, sm: 50 }} radius="md" variant="light" color="blue">
                    <feature.icon size={{ base: 20, sm: 24 }} />
                  </ThemeIcon>
                  <Title order={5} size="h6">
                    {feature.title}
                  </Title>
                  <Text c="dimmed" size={{ base: '10px', sm: 'xs' }}>
                    {feature.description}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      {/* Compact CTA Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
        }}
        p={{ base: 24, sm: 40 }}
      >
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Stack align="center" gap={{ base: 'sm', sm: 'md' }}>
            <Title order={3} size={{ base: 18, sm: 24 }} ta="center" c="white">
              Ready to Get Started?
            </Title>
            <Button
              size="md"
              variant="white"
              color="pink"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.1" py={{ base: 'md', sm: 'xl' }}>
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Stack gap="md">
            <Group justify="space-between" wrap="wrap">
              <Stack gap="xs">
                <Text fw={600} size={{ base: 'sm', sm: 'md' }}>ESAA</Text>
                <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed">
                  Addis Ababa City Administration Electric Service Administration Authority
                </Text>
              </Stack>
              <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed">
                © {new Date().getFullYear()} All rights reserved
              </Text>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

