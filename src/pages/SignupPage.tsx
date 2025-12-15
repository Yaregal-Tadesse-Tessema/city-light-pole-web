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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signup({
      email,
      password,
      fullName,
      phone: phone || undefined,
    });
    setLoading(false);

    if (result.success) {
      notifications.show({
        title: 'Success',
        message: 'Account created successfully! Please login.',
        color: 'green',
      });
      navigate('/login');
    } else {
      notifications.show({
        title: 'Error',
        message: result.error || 'Signup failed',
        color: 'red',
      });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        City Light Pole Management
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
        Create a new account
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <TextInput
              label="Email"
              placeholder="engineer@city.gov"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              label="Phone (Optional)"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password (min 6 characters)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
            <Button type="submit" fullWidth mt="xl" loading={loading}>
              Create Account
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md">
          Already have an account?{' '}
          <Anchor component={Link} to="/login" size="sm">
            Sign in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}

