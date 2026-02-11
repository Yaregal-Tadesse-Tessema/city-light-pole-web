import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppShell, Group, Text, Button, NavLink, Image, Stack, Burger, Avatar, ScrollArea, Box, ActionIcon, Indicator } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  IconDashboard,
  IconBulb,
  IconAlertTriangle,
  IconTools,
  IconUsers,
  IconLogout,
  IconChevronDown,
  IconChevronRight,
  IconPackage,
  IconShoppingCart,
  IconTags,
  IconBell,
  IconReport,
  IconReplace,
  IconCarCrash,
  IconBox,
} from '@tabler/icons-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Get unread notifications count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/notifications/user/${user.id}/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    enabled: !!user?.id,
  });
  const [lightPoleMenuOpened, setLightPoleMenuOpened] = useState(false);
  const [inventoryMenuOpened, setInventoryMenuOpened] = useState(false);
  const [accidentMenuOpened, setAccidentMenuOpened] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  
  // Check if any light pole related route is active
  const isLightPoleRouteActive = 
    location.pathname.startsWith('/poles') || 
    location.pathname.startsWith('/issues') || 
    location.pathname.startsWith('/maintenance');

  // Check if inventory routes are active
  const isInventoryRouteActive =
    location.pathname.startsWith('/inventory') ||
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/material-requests') ||
    location.pathname.startsWith('/purchase-requests');

  return (
    <AppShell
      navbar={{
        width: { base: 250, sm: 250 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Image
              src="/esaa-logo.jpeg"
              alt="ESAA Logo"
              w={{ base: 40, sm: 60 }}
              h={{ base: 40, sm: 60 }}
              fit="contain"
              style={{ borderRadius: '50%', flexShrink: 0 }}
              visibleFrom="sm"
            />
          </Group>
          <Group gap="xs" visibleFrom="sm" wrap="nowrap">
            <ActionIcon
              component={Link}
              to="/notifications"
              variant="subtle"
              color="blue"
              size="lg"
            >
              <Indicator
                color="red"
                size={16}
                disabled={unreadCount === 0 || !unreadCount}
                label={unreadCount > 99 ? '99+' : unreadCount}
              >
                <IconBell size={20} />
              </Indicator>
            </ActionIcon>

            <Avatar
              src={user?.profilePicture || undefined}
              alt={user?.fullName || 'User'}
              size="sm"
              radius="xl"
              color="blue"
              style={{ flexShrink: 0 }}
            >
              {user?.fullName
                ? user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'}
            </Avatar>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {user?.fullName}
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              ({user?.role})
            </Text>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar
        p={{ base: 'xs', sm: 'md' }}
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Stack gap="xs" mb="lg" align="center" visibleFrom="sm" style={{ flexShrink: 0 }}>
          <Image
            src="/esaa-logo.jpeg"
            alt="ESAA Logo"
            w={{ base: 80, sm: 120 }}
            h={{ base: 80, sm: 120 }}
            fit="contain"
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%23999'%3ELogo%3C/text%3E%3C/svg%3E"
          />
          <Text size="sm" fw={600} ta="center" c="dimmed">
            Addis Ababa
            Light Poles Management System
          </Text>
        </Stack>
        <Group mb="md" visibleFrom="sm" style={{ flexShrink: 0 }}>
          <Text size="sm" c="dimmed">
            {user?.fullName}
          </Text>
          <Text size="xs" c="dimmed">
            ({user?.role})
          </Text>
        </Group>
        <Stack gap="xs" mb="md" hiddenFrom="sm" style={{ flexShrink: 0 }}>
          <Text size="xs" fw={600} c="dimmed">
            {user?.fullName}
          </Text>
          <Text size="xs" c="dimmed">
            {user?.role}
          </Text>
        </Stack>
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap="xs">
          <NavLink
            component={Link}
            to="/dashboard"
          label="Dashboard"
          leftSection={<IconDashboard size={16} />}
          active={location.pathname === '/dashboard'}
          onClick={() => {
            if (isMobile) {
              close();
            }
          }}
        />
        <NavLink
          label="Light Pole"
          leftSection={<IconBulb size={16} />}
          rightSection={
            lightPoleMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isLightPoleRouteActive}
          opened={lightPoleMenuOpened}
          onChange={() => setLightPoleMenuOpened(!lightPoleMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/poles"
            label="Light Poles"
            leftSection={<IconBulb size={16} />}
            active={location.pathname.startsWith('/poles') && !location.pathname.includes('/replace')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/issues"
            label="Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=pole"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={
              location.pathname === '/maintenance' &&
              (!location.search.includes('type=') || location.search.includes('type=pole'))
            }
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/replacements"
            label="Replace Pole"
            leftSection={<IconReplace size={16} />}
            active={location.pathname.startsWith('/replacements')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/components"
            label="Components"
            leftSection={<IconBox size={16} />}
            active={location.pathname.startsWith('/components')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        </NavLink>
        {isAdmin && (
          <NavLink
            label="Inventory Management"
            leftSection={<IconPackage size={16} />}
            rightSection={
              inventoryMenuOpened ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )
            }
            active={isInventoryRouteActive}
            opened={inventoryMenuOpened}
            onChange={() => setInventoryMenuOpened(!inventoryMenuOpened)}
          >
            <NavLink
              component={Link}
              to="/inventory"
              label="Inventory Items"
              leftSection={<IconPackage size={16} />}
              active={location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/')}
              onClick={() => {
                if (isMobile) {
                  close();
                }
              }}
            />
            <NavLink
              component={Link}
              to="/categories"
              label="Categories"
              leftSection={<IconTags size={16} />}
              active={location.pathname.startsWith('/categories')}
              onClick={() => {
                if (isMobile) {
                  close();
                }
              }}
            />
            <NavLink
              component={Link}
              to="/material-requests"
              label="Material Requests"
              leftSection={<IconPackage size={16} />}
              active={location.pathname === '/material-requests'}
              onClick={() => {
                if (isMobile) {
                  close();
                }
              }}
            />
            <NavLink
              component={Link}
              to="/purchase-requests"
              label="Purchase Requests"
              leftSection={<IconShoppingCart size={16} />}
              active={location.pathname === '/purchase-requests'}
              onClick={() => {
                if (isMobile) {
                  close();
                }
              }}
            />
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            component={Link}
            to="/users"
            label="Users"
            leftSection={<IconUsers size={16} />}
            active={location.pathname === '/users'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        )}
        <NavLink
          component={Link}
          to="/reports"
          label="Reports"
          leftSection={<IconReport size={16} />}
          active={location.pathname === '/reports'}
          onClick={() => {
            if (isMobile) {
              close();
            }
          }}
        />
        <NavLink
          label="Accident Management"
          leftSection={<IconCarCrash size={16} />}
          rightSection={
            accidentMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={location.pathname.startsWith('/accidents') || location.pathname === '/damaged-components' || location.pathname === '/accident-reports'}
          opened={accidentMenuOpened}
          onChange={() => setAccidentMenuOpened(!accidentMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/accidents"
            label="Accidents"
            leftSection={<IconCarCrash size={16} />}
            active={location.pathname.startsWith('/accidents') && !location.pathname.includes('/reports')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/accident-reports"
            label="Reports"
            leftSection={<IconReport size={16} />}
            active={location.pathname === '/accident-reports'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          {isAdmin && (
            <NavLink
              component={Link}
              to="/damaged-components"
              label="Components"
              leftSection={<IconTools size={16} />}
              active={location.pathname === '/damaged-components'}
              onClick={() => {
                if (isMobile) {
                  close();
                }
              }}
            />
          )}
        </NavLink>
          </Stack>
        </ScrollArea>
        <Box mt="md" style={{ marginTop: 'auto' }}>
          <Button
            variant="light"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={logout}
            fullWidth
            style={{ flexShrink: 0 }}
          >
            Logout
          </Button>
        </Box>
      </AppShell.Navbar>
      <AppShell.Main>
        <Box pt={{ base: 'xl', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }} pb={{ base: 'xs', sm: 'md' }}>
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

