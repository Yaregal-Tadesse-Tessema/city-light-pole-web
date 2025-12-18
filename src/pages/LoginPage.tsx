import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Anchor,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green',
      });
      // Check for redirect path saved before login
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    } else {
      notifications.show({
        title: 'Error',
        message: result.error || 'Login failed',
        color: 'red',
      });
    }
  };

  return (
    <Container size={{ base: '100%', xs: 420 }} my={{ base: 20, sm: 40 }} px={{ base: 'xs', sm: 'md' }}>
      <Title ta="center" mb="md" size={{ base: 'h2', sm: 'h1' }}>
        Coredor Assets Management System
      </Title>
      <Text c="dimmed" size={{ base: 'xs', sm: 'sm' }} ta="center" mt={5} mb={{ base: 'md', sm: 'xl' }}>
        Sign in to your account
      </Text>

      <Paper withBorder shadow="md" p={{ base: 20, sm: 30 }} mt={{ base: 20, sm: 30 }} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="admin@city.gov"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth mt="xl" loading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md">
          Don't have an account?{' '}
          <Anchor component={Link} to="/signup" size="sm">
            Sign up
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}


