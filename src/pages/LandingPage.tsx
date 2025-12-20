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
import LandingMap from '../components/LandingMap';
import {
  IconAlertTriangle,
  IconTools,
  IconMapPin,
  IconChartBar,
  IconShield,
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


  const features = [
    {
      icon: IconAlertTriangle,
      title: 'Issue Reporting',
      description: 'Quick and efficient reporting system for identifying and tracking light pole issues and maintenance needs.',
    },
    {
      icon: IconTools,
      title: 'Maintenance Scheduling',
      description: 'Streamlined maintenance workflows with scheduling and tracking capabilities.',
    },
    {
      icon: IconMapPin,
      title: 'GPS Tracking',
      description: 'Precise GPS location tracking for all light poles with interactive mapping and real-time status updates.',
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
      {/* Enhanced Header */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
          padding: '20px 0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap={{ base: 'sm', sm: 'lg' }} align="center">
              <Paper
                radius="xl"
                style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Image
                  src="/esaa-logo.jpeg"
                  alt="ESAA Logo"
                  w={{ base: 40, sm: 50 }}
                  h={{ base: 40, sm: 50 }}
                  fit="contain"
                  style={{ borderRadius: '50%' }}
                />
              </Paper>

              <Stack gap={0}>
                <Title
                  order={3}
                  size={{ base: 'lg', sm: 'xl' }}
                  c="white"
                  style={{
                    fontWeight: 700,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  Addis Ababa
                </Title>
                <Text
                  size={{ base: 'xs', sm: 'sm' }}
                  c="white"
                  opacity={0.9}
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  Light Poles Management System
                </Text>
              </Stack>
            </Group>

            <Group gap="sm">
              <Button
                size="md"
                variant="subtle"
                color="white"
                onClick={() => navigate('/login')}
                style={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                size="md"
                variant="filled"
                color="white"
                c="blue.9"
                onClick={() => navigate('/signup')}
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  fontWeight: 600,
                }}
              >
                Get Started
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section with Background Image */}
      <Box
        style={{
          background: `linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url('/1754208313136.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: 'white',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
        }}
        p={{ base: 40, sm: 60 }}
      >
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Stack align="center" gap={{ base: 'lg', sm: 'xl' }}>
            <Stack align="center" gap="md">
              <Title
                order={1}
                size={{ base: 32, sm: 48, lg: 56 }}
                ta="center"
                c="white"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  fontWeight: 700,
                }}
              >
                Addis Ababa
                <br />
                <Text span c="#FFD700" inherit>Light Poles</Text>
                <br />
                Management System
              </Title>

              <Text
                size={{ base: 'md', sm: 'lg', lg: 'xl' }}
                ta="center"
                c="white"
                maw={900}
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  lineHeight: 1.6,
                }}
              >
                Advanced smart city infrastructure management with real-time monitoring,
                GPS tracking, and comprehensive maintenance scheduling for Addis Ababa's
                lighting network.
              </Text>
            </Stack>

            <Group gap="md" wrap="wrap" justify="center">
              <Button
                size="lg"
                variant="filled"
                color="white"
                c="blue.9"
                onClick={() => navigate('/signup')}
                style={{
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  fontWeight: 600,
                }}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                color="white"
                onClick={() => navigate('/login')}
                style={{
                  borderColor: 'white',
                  color: 'white',
                  borderWidth: 2,
                }}
              >
                Sign In
              </Button>
            </Group>

            {/* Stats Section */}
            <Group gap={{ base: 'xl', sm: '3xl' }} mt="xl" wrap="wrap" justify="center">
              <Stack align="center" gap={4}>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  5,000+
                </Text>
                <Text size="sm" c="white" opacity={0.9}>
                  Light Poles
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  11
                </Text>
                <Text size="sm" c="white" opacity={0.9}>
                  Subcities
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  24/7
                </Text>
                <Text size="sm" c="white" opacity={0.9}>
                  Monitoring
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Container>
      </Box>


      {/* Features Section with Visual Enhancement */}
      <Box
        style={{
          background: `linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%), url('/streets.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
        py={{ base: 40, sm: 60 }}
      >
        <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
          <Stack align="center" gap="xl" mb={{ base: 30, sm: 40 }}>
            <Stack align="center" gap="md">
              <Title
                order={2}
                size={{ base: 28, sm: 36, lg: 42 }}
                ta="center"
                c="dark.8"
                style={{ fontWeight: 700 }}
              >
                Powerful Features for
                <Text span c="blue.6" inherit> Smart City Management</Text>
              </Title>
              <Text
                size={{ base: 'md', sm: 'lg' }}
                ta="center"
                c="dimmed"
                maw={700}
              >
                Comprehensive tools designed specifically for efficient light pole infrastructure management
              </Text>
            </Stack>
          </Stack>

          <Grid gutter={{ base: 'md', sm: 'lg' }}>
            {features.map((feature, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                <Paper
                  p={{ base: 'lg', sm: 'xl' }}
                  withBorder
                  h="100%"
                  style={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <Stack gap="md" align="center">
                    <ThemeIcon
                      size={{ base: 60, sm: 70 }}
                      radius="xl"
                      variant="gradient"
                      gradient={{ from: 'blue.5', to: 'cyan.5' }}
                      style={{
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      <feature.icon size={{ base: 24, sm: 28 }} />
                    </ThemeIcon>
                    <Stack gap="xs" align="center">
                      <Title order={4} size="h5" ta="center" c="dark.8">
                        {feature.title}
                      </Title>
                      <Text c="dimmed" size="sm" ta="center" lh={1.6}>
                        {feature.description}
                      </Text>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Visual Showcase Section */}
      <Container size="lg" py={{ base: 40, sm: 60 }} px={{ base: 'xs', sm: 'md' }}>
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <Title
              order={2}
              size={{ base: 28, sm: 36 }}
              ta="center"
              c="dark.8"
              style={{ fontWeight: 700 }}
            >
              See Addis Ababa's
              <Text span c="blue.6" inherit> Lighting Infrastructure</Text>
            </Title>
            <Text
              size={{ base: 'md', sm: 'lg' }}
              ta="center"
              c="dimmed"
              maw={700}
            >
              Interactive map showcasing real-time status of 5,000+ light poles across all subcities
            </Text>
          </Stack>

          {/* Image Gallery */}
          <Group gap="md" wrap="wrap" justify="center">
            <Paper
              radius="lg"
              style={{
                width: { base: '100%', sm: 200 },
                height: 150,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Image
                src="/images.jpg"
                alt="Addis Ababa streets"
                fit="cover"
                style={{ width: '100%', height: '100%' }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '16px',
                }}
              >
                <Text size="sm" c="white" fw={500}>
                  Addis Ababa Streets
                </Text>
              </Box>
            </Paper>

            <Paper
              radius="lg"
              style={{
                width: { base: '100%', sm: 200 },
                height: 150,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Image
                src="/IM3.jpg"
                alt="City infrastructure"
                fit="cover"
                style={{ width: '100%', height: '100%' }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '16px',
                }}
              >
                <Text size="sm" c="white" fw={500}>
                  Smart City Infrastructure
                </Text>
              </Box>
            </Paper>

            <Paper
              radius="lg"
              style={{
                width: { base: '100%', sm: 200 },
                height: 150,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Image
                src="/sddefault.jpg"
                alt="Modern lighting"
                fit="cover"
                style={{ width: '100%', height: '100%' }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '16px',
                }}
              >
                <Text size="sm" c="white" fw={500}>
                  Modern LED Lighting
                </Text>
              </Box>
            </Paper>
          </Group>
        </Stack>
      </Container>

      {/* Interactive Map Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%), url('/ee68270c-9bdb-4c06-acd0-a08203081eff_1984x1323.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
        py={{ base: 40, sm: 60 }}
      >
        <Container size="xl" px={{ base: 'xs', sm: 'md' }}>
          <Stack align="center" gap="md" mb={{ base: 30, sm: 40 }}>
            <Title
              order={2}
              size={{ base: 28, sm: 36, lg: 42 }}
              ta="center"
              c="white"
              style={{
                fontWeight: 700,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Interactive City Assets Map
            </Title>
            <Text
              c="white"
              ta="center"
              size={{ base: 'md', sm: 'lg' }}
              maw={700}
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              Explore 5,000+ light poles across Addis Ababa with advanced filtering and real-time status monitoring
            </Text>
          </Stack>

          <Paper
            radius="lg"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
            p="md"
          >
            <LandingMap />
          </Paper>
        </Container>
      </Box>

      {/* Enhanced CTA Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%), url('/Img2.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          color: 'white',
          position: 'relative',
        }}
        p={{ base: 40, sm: 60 }}
      >
        {/* Overlay for better text readability */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        />

        <Container size="lg" px={{ base: 'xs', sm: 'md' }} style={{ position: 'relative', zIndex: 1 }}>
          <Stack align="center" gap={{ base: 'lg', sm: 'xl' }}>
            <Stack align="center" gap="md">
              <Title
                order={2}
                size={{ base: 28, sm: 36, lg: 42 }}
                ta="center"
                c="white"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  fontWeight: 700,
                }}
              >
                Transform Addis Ababa's
                <br />
                <Text span c="#FFD700" inherit>Lighting Infrastructure</Text>
              </Title>
              <Text
                size={{ base: 'md', sm: 'lg' }}
                ta="center"
                c="white"
                maw={700}
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  lineHeight: 1.6,
                }}
              >
                Join thousands of city workers in revolutionizing how Addis Ababa manages its lighting network.
                Start your journey towards smarter, more efficient city infrastructure management.
              </Text>
            </Stack>

            <Group gap="md" wrap="wrap" justify="center">
              <Button
                size="lg"
                variant="filled"
                color="white"
                c="blue.9"
                onClick={() => navigate('/signup')}
                style={{
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  fontWeight: 600,
                  padding: '12px 24px',
                }}
              >
                🚀 Start Managing Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                color="white"
                onClick={() => navigate('/login')}
                style={{
                  borderColor: 'white',
                  color: 'white',
                  borderWidth: 2,
                  padding: '12px 24px',
                }}
              >
                Sign In to Dashboard
              </Button>
            </Group>

            {/* Trust indicators */}
            <Group gap="xl" mt="xl" wrap="wrap" justify="center">
              <Stack align="center" gap={4}>
                <Text size="lg" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  ⚡ Real-time
                </Text>
                <Text size="xs" c="white" opacity={0.9}>
                  Live monitoring
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="lg" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  🗺️ GPS-Tracked
                </Text>
                <Text size="xs" c="white" opacity={0.9}>
                  Precise locations
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="lg" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  📊 Analytics
                </Text>
                <Text size="xs" c="white" opacity={0.9}>
                  Data-driven insights
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="lg" fw={700} c="white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  🔒 Secure
                </Text>
                <Text size="xs" c="white" opacity={0.9}>
                  Role-based access
                </Text>
              </Stack>
            </Group>
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

