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
import { IconLogin, IconBulb, IconShieldCheck, IconSparkles, IconArrowLeft, IconStar, IconSparkles2, IconHexagon } from '@tabler/icons-react';
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
        background: `
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'backgroundShift 20s ease-in-out infinite',
      }}
    >
      {/* Enhanced Background decorative elements */}
      <Box
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '90px',
          height: '90px',
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          top: '60%',
          left: '20%',
          width: '70px',
          height: '70px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 7s ease-in-out infinite',
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      />

      {/* Additional decorative elements */}
      <Box
        style={{
          position: 'absolute',
          top: '25%',
          right: '25%',
          width: '50px',
          height: '50px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '25% 75% 75% 25% / 25% 25% 75% 75%',
          animation: 'morph 10s ease-in-out infinite',
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '35%',
          left: '30%',
          width: '40px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '75% 25% 75% 25% / 75% 25% 75% 25%',
          animation: 'morph 12s ease-in-out infinite reverse',
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      />

      {/* Floating particles */}
      <Box
        style={{
          position: 'absolute',
          top: '15%',
          left: '70%',
          width: '4px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '50%',
          animation: 'particleFloat 4s ease-in-out infinite',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          top: '75%',
          left: '8%',
          width: '6px',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '50%',
          animation: 'particleFloat 5s ease-in-out infinite reverse',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          top: '45%',
          right: '8%',
          width: '3px',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%',
          animation: 'particleFloat 6s ease-in-out infinite',
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

        {/* Enhanced Header with logo and welcome message */}
        <Box ta="center" mb={40}>
          <Group justify="center" mb="lg" gap="md">
            <Box
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '50%',
                padding: '20px',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)',
                animation: 'logoGlow 3s ease-in-out infinite alternate',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <IconBulb size={36} color="white" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' }} />

              {/* Sparkle effects around logo */}
              <Box
                style={{
                  position: 'absolute',
                  top: '10%',
                  right: '15%',
                  animation: 'sparkle 2s ease-in-out infinite',
                }}
              >
                <IconSparkles2 size={8} color="white" />
              </Box>
              <Box
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '10%',
                  animation: 'sparkle 2.5s ease-in-out infinite',
                }}
              >
                <IconStar size={6} color="white" />
              </Box>
            </Box>

            {/* Decorative hexagons */}
            <Box
              style={{
                position: 'absolute',
                top: '15%',
                left: '15%',
                transform: 'rotate(45deg)',
                opacity: 0.3,
                animation: 'hexagonRotate 8s linear infinite',
              }}
            >
              <IconHexagon size={24} color="white" />
            </Box>
            <Box
              style={{
                position: 'absolute',
                top: '20%',
                right: '20%',
                transform: 'rotate(-30deg)',
                opacity: 0.2,
                animation: 'hexagonRotate 10s linear infinite reverse',
              }}
            >
              <IconHexagon size={18} color="white" />
            </Box>
          </Group>

          <Title
            c="white"
            size="h1"
            fw={700}
            mb="xs"
            style={{
              textShadow: '0 3px 6px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.1)',
              fontSize: '2.8rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 50%, #e6f3ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'titleGlow 4s ease-in-out infinite alternate',
            }}
          >
            Welcome Back
          </Title>

          <Text
            c="rgba(255, 255, 255, 0.95)"
            size="lg"
            fw={400}
            mb="sm"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              letterSpacing: '0.5px',
            }}
          >
            Smart City Asset Management
          </Text>

          <Text
            c="rgba(255, 255, 255, 0.85)"
            size="sm"
            style={{
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              maxWidth: '400px',
              margin: '0 auto',
              lineHeight: '1.5',
            }}
          >
            Illuminate your city's infrastructure with intelligent management and cutting-edge technology
          </Text>
        </Box>

        {/* Enhanced Login Form */}
        <Paper
          withBorder={false}
          shadow="xl"
          p={40}
          radius="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Inner glow effect */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(102, 126, 234, 0.02) 100%)',
              pointerEvents: 'none',
              borderRadius: '12px',
            }}
          />
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
                leftSection={<IconSparkles size={18} style={{ color: '#667eea', filter: 'drop-shadow(0 0 4px rgba(102, 126, 234, 0.3))' }} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                styles={{
                  input: {
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(5px)',
                    color: '#333',
                    fontWeight: 500,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:focus': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.15), 0 4px 12px rgba(102, 126, 234, 0.1)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      transform: 'translateY(-1px)',
                    },
                    '&:hover': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                      background: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                  label: {
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    marginBottom: '8px',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  },
                }}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                required
                size="md"
                leftSection={<IconShieldCheck size={18} style={{ color: '#667eea', filter: 'drop-shadow(0 0 4px rgba(102, 126, 234, 0.3))' }} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                styles={{
                  input: {
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(5px)',
                    color: '#333',
                    fontWeight: 500,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:focus': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.15), 0 4px 12px rgba(102, 126, 234, 0.1)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      transform: 'translateY(-1px)',
                    },
                    '&:hover': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                      background: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                  label: {
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    marginBottom: '8px',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                mt="lg"
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '16px',
                  padding: '16px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4), 0 0 20px rgba(102, 126, 234, 0.2)',
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 50%, #e07ce7 100%)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                    transition: 'left 0.5s',
                  },
                  '&:hover::before': {
                    left: '100%',
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

      {/* Enhanced Custom CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(90deg);
          }
          50% {
            transform: translateY(-25px) rotate(180deg);
          }
          75% {
            transform: translateY(-15px) rotate(270deg);
          }
        }

        @keyframes morph {
          0%, 100% {
            border-radius: 25% 75% 75% 25% / 25% 25% 75% 75%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 75% 25% 75% 25% / 75% 25% 75% 25%;
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            border-radius: 100%;
            transform: rotate(180deg) scale(0.9);
          }
          75% {
            border-radius: 25% 75% 25% 75% / 75% 75% 25% 25%;
            transform: rotate(270deg) scale(1.05);
          }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translateY(-10px) translateX(5px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) translateX(-5px) scale(0.8);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-10px) translateX(3px) scale(1.1);
            opacity: 0.9;
          }
        }

        @keyframes backgroundShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes logoGlow {
          0% {
            box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
            transform: scale(1);
          }
          100% {
            box-shadow: 0 8px 32px rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
          }
        }

        @keyframes titleGlow {
          0% {
            filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
          }
          100% {
            filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 10px rgba(102, 126, 234, 0.3));
          }
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(0.8) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
        }

        @keyframes hexagonRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
}


