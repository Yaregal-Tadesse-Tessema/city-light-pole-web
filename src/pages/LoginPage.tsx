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
  Box,
  Group,
  Divider,
} from '@mantine/core';
import { IconLogin, IconBulb, IconShieldCheck, IconSparkles, IconArrowLeft } from '@tabler/icons-react';
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
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          top: '60%',
          left: '20%',
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 7s ease-in-out infinite',
        }}
      />

      <Container size={480} style={{ position: 'relative', zIndex: 1 }}>
        {/* Back to Home Button */}
        <Box style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
          <Button
            component={Link}
            to="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Header with logo and welcome message */}
        <Box ta="center" mb={40}>
          <Group justify="center" mb="lg">
            <Box
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <IconBulb size={32} color="white" />
            </Box>
          </Group>

          <Title
            c="white"
            size="h1"
            fw={700}
            mb="xs"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              fontSize: '2.5rem',
            }}
          >
            Welcome Back
          </Title>

          <Text
            c="rgba(255, 255, 255, 0.9)"
            size="lg"
            fw={300}
            mb="sm"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            Smart City Asset Management
          </Text>

          <Text
            c="rgba(255, 255, 255, 0.8)"
            size="sm"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            Illuminate your city's infrastructure with intelligent management
          </Text>
        </Box>

        {/* Login Form */}
        <Paper
          withBorder={false}
          shadow="xl"
          p={40}
          radius="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Group justify="center" mb="lg">
            <IconLogin size={24} style={{ color: '#667eea' }} />
            <Title order={3} c="#333" fw={600}>
              Sign In to Your Account
            </Title>
          </Group>

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <TextInput
                label="Email Address"
                placeholder="admin@city.gov"
                required
                size="md"
                leftSection={<IconSparkles size={18} style={{ color: '#667eea' }} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                styles={{
                  input: {
                    borderRadius: '12px',
                    border: '2px solid #e1e5e9',
                    transition: 'all 0.3s ease',
                    '&:focus': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    },
                  },
                  label: {
                    color: '#555',
                    fontWeight: 500,
                    marginBottom: '8px',
                  },
                }}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                required
                size="md"
                leftSection={<IconShieldCheck size={18} style={{ color: '#667eea' }} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                styles={{
                  input: {
                    borderRadius: '12px',
                    border: '2px solid #e1e5e9',
                    transition: 'all 0.3s ease',
                    '&:focus': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    },
                  },
                  label: {
                    color: '#555',
                    fontWeight: 500,
                    marginBottom: '8px',
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                mt="md"
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '16px',
                  padding: '14px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                  },
                }}
              >
                {loading ? 'Signing In...' : 'Sign In Securely'}
              </Button>
            </Stack>
          </form>

          <Divider
            my="xl"
            label="Don't have an account?"
            labelPosition="center"
            styles={{
              label: {
                color: '#666',
                fontWeight: 500,
              },
            }}
          />

          <Text ta="center">
            <Anchor
              component={Link}
              to="/signup"
              size="sm"
              style={{
                color: '#667eea',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#764ba2',
                  textDecoration: 'underline',
                },
              }}
            >
              Create New Account
            </Anchor>
          </Text>
        </Paper>

        {/* Footer */}
        <Text
          ta="center"
          mt="xl"
          c="rgba(255, 255, 255, 0.7)"
          size="xs"
          style={{
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          © 2025 Smart City Infrastructure Management System
        </Text>
      </Container>

      {/* Custom CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </Box>
  );
}


