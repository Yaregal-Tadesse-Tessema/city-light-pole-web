import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Box,
  Stack,
  Card,
  Grid,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Center,
} from '@mantine/core';
import {
  IconBolt,
  IconMapPin,
  IconChartBar,
  IconShieldCheck,
  IconUsers,
  IconBuilding,
  IconRoad,
  IconCar,
  IconHome,
  IconTree,
  IconToiletPaper,
  IconBallBasketball,
  IconRiver,
  IconCamera,
  IconBulb,
  IconGauge,
  IconCheck,
  IconArrowRight,
} from '@tabler/icons-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: IconBulb,
      title: 'Smart Lighting',
      description: 'Automated street light management with real-time monitoring and energy optimization.',
    },
    {
      icon: IconGauge,
      title: 'GPS Tracking',
      description: 'Precise location tracking for all light poles with interactive mapping capabilities.',
    },
    {
      icon: IconChartBar,
      title: 'Analytics Dashboard',
      description: 'Comprehensive reporting and analytics for maintenance scheduling and performance monitoring.',
    },
    {
      icon: IconShieldCheck,
      title: 'Incident Management',
      description: 'Streamlined accident reporting and damage assessment workflow for quick response.',
    },
    {
      icon: IconCamera,
      title: 'Surveillance Integration',
      description: 'Integrated camera systems for enhanced security and incident documentation.',
    },
    {
      icon: IconBolt,
      title: 'Energy Management',
      description: 'Intelligent power management to reduce energy consumption and operational costs.',
    },
  ];

  const stats = [
    { value: '5,000+', label: 'Light Poles Managed' },
    { value: '50+', label: 'Subcities Covered' },
    { value: '24/7', label: 'Monitoring' },
    { value: '99.9%', label: 'Uptime' },
  ];

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
                  textShadow: '3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                }}
              >
                Addis Ababa
                <br />
                <Text span c="#FFD700" inherit style={{
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                  fontWeight: 900,
                }}>
                  Light Poles
                </Text>
                <br />
                Management System
              </Title>

              <Text
                size={{ base: 'md', sm: 'lg', lg: 'xl' }}
                ta="center"
                c="white"
                maw={900}
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.7), 0 0 15px rgba(0,0,0,0.3)',
                  lineHeight: 1.6,
                  fontWeight: 600,
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
                variant="filled"
                color="blue"
                onClick={() => navigate('/login')}
                style={{
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                Sign In
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
              <Title order={2} ta="center" size={{ base: 'h2', sm: 'h1' }}>
                Powerful Features
              </Title>
              <Text c="dimmed" ta="center" maw={600} size="lg">
                Comprehensive infrastructure management tools designed specifically for Addis Ababa's smart city initiatives.
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
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl">
            {stats.map((stat, index) => (
              <Stack key={index} align="center" gap="xs">
                <Text size="3xl" fw={900} c="blue">
                  {stat.value}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {stat.label}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 60, sm: 80 }} style={{ backgroundColor: 'var(--mantine-color-blue-6)' }}>
        <Container size="lg">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title order={2} ta="center" c="white" size={{ base: 'h2', sm: 'h1' }}>
                Ready to Get Started?
              </Title>
              <Text c="white" ta="center" maw={600} size="lg" opacity={0.9}>
                Join thousands of users already managing Addis Ababa's infrastructure with our advanced platform.
              </Text>
            </Stack>

            <Group gap="md">
              <Button
                size="lg"
                variant="white"
                color="blue"
                rightSection={<IconArrowRight size={20} />}
                onClick={() => navigate('/signup')}
                style={{ fontWeight: 600 }}
              >
                Start Managing Today
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}