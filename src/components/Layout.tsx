import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppShell, Group, Text, Button, NavLink } from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import {
  IconDashboard,
  IconBulb,
  IconAlertTriangle,
  IconTools,
  IconUsers,
  IconLogout,
} from '@tabler/icons-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AppShell
      navbar={{
        width: 250,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <Text size="xl" fw={700} mb="lg">
          Light Pole Management
        </Text>
        <Group mb="md">
          <Text size="sm" c="dimmed">
            {user?.fullName}
          </Text>
          <Text size="xs" c="dimmed">
            ({user?.role})
          </Text>
        </Group>
        <NavLink
          component={Link}
          to="/dashboard"
          label="Dashboard"
          leftSection={<IconDashboard size={16} />}
          active={location.pathname === '/dashboard'}
        />
        <NavLink
          component={Link}
          to="/poles"
          label="Light Poles"
          leftSection={<IconBulb size={16} />}
          active={location.pathname.startsWith('/poles')}
        />
        <NavLink
          component={Link}
          to="/issues"
          label="Issues"
          leftSection={<IconAlertTriangle size={16} />}
          active={location.pathname === '/issues'}
        />
        <NavLink
          component={Link}
          to="/maintenance"
          label="Maintenance"
          leftSection={<IconTools size={16} />}
          active={location.pathname === '/maintenance'}
        />
        {isAdmin && (
          <NavLink
            component={Link}
            to="/users"
            label="Users"
            leftSection={<IconUsers size={16} />}
            active={location.pathname === '/users'}
          />
        )}
        <Button
          mt="md"
          variant="light"
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={logout}
          fullWidth
        >
          Logout
        </Button>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

