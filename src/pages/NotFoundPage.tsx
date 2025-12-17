import { Container, Paper, Title, Text, Group, Button } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Container size="md" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Paper withBorder p={{ base: 'md', sm: 'xl' }}>
        <Title order={2}>Page not found</Title>
        <Text c="dimmed" mt="xs">
          No route matches <Text span fw={700}>{location.pathname}</Text>.
        </Text>
        <Group mt="lg">
          <Button variant="light" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}


