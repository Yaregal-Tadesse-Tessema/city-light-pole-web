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
  IconTrees,
  IconParking,
  IconBuildingStore,
  IconBath,
  IconTrophy,
  IconDroplet,
  IconPackage,
  IconShoppingCart,
  IconTags,
  IconBell,
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
  const [publicParksMenuOpened, setPublicParksMenuOpened] = useState(false);
  const [parkingLotsMenuOpened, setParkingLotsMenuOpened] = useState(false);
  const [museumsMenuOpened, setMuseumsMenuOpened] = useState(false);
  const [publicToiletsMenuOpened, setPublicToiletsMenuOpened] = useState(false);
  const [footballFieldsMenuOpened, setFootballFieldsMenuOpened] = useState(false);
  const [riverSideProjectsMenuOpened, setRiverSideProjectsMenuOpened] = useState(false);
  const [inventoryMenuOpened, setInventoryMenuOpened] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  
  // Check if any light pole related route is active
  const isLightPoleRouteActive = 
    location.pathname.startsWith('/poles') || 
    location.pathname.startsWith('/issues') || 
    location.pathname.startsWith('/maintenance');

  // Check if any public parks related route is active
  const isPublicParksRouteActive = 
    location.pathname.startsWith('/parks') || 
    location.pathname.startsWith('/park-issues') ||
    (location.pathname === '/maintenance' && location.search.includes('type=park'));

  // Check if parking lots routes are active
  const isParkingLotsRouteActive = 
    location.pathname.startsWith('/parking-lots') ||
    (location.pathname === '/maintenance' && location.search.includes('type=parking'));

  // Check if museums routes are active
  const isMuseumsRouteActive = 
    location.pathname.startsWith('/museums') ||
    (location.pathname === '/maintenance' && location.search.includes('type=museum'));

  // Check if public toilets routes are active
  const isPublicToiletsRouteActive = 
    location.pathname.startsWith('/public-toilets') ||
    (location.pathname === '/maintenance' && location.search.includes('type=toilet'));

  // Check if football fields routes are active
  const isFootballFieldsRouteActive = 
    location.pathname.startsWith('/football-fields') ||
    (location.pathname === '/maintenance' && location.search.includes('type=football'));

  // Check if river side projects routes are active
  const isRiverSideProjectsRouteActive =
    location.pathname.startsWith('/river-side-projects') ||
    (location.pathname === '/maintenance' && location.search.includes('type=river'));

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
            Coredor Assets Management System
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
            active={location.pathname.startsWith('/poles')}
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
          label="Public Parks"
          leftSection={<IconTrees size={16} />}
          rightSection={
            publicParksMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isPublicParksRouteActive}
          opened={publicParksMenuOpened}
          onChange={() => setPublicParksMenuOpened(!publicParksMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/parks"
            label="Public Parks"
            leftSection={<IconTrees size={16} />}
            active={location.pathname.startsWith('/parks') && !location.pathname.startsWith('/park-issues')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/park-issues"
            label="Park Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/park-issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=park"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=park')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        </NavLink>
        <NavLink
          label="Car Parking Lots"
          leftSection={<IconParking size={16} />}
          rightSection={
            parkingLotsMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isParkingLotsRouteActive}
          opened={parkingLotsMenuOpened}
          onChange={() => setParkingLotsMenuOpened(!parkingLotsMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/parking-lots"
            label="Parking Lots"
            leftSection={<IconParking size={16} />}
            active={location.pathname.startsWith('/parking-lots') && !location.pathname.startsWith('/parking-lot-issues')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/parking-lot-issues"
            label="Parking Lot Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/parking-lot-issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=parking"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=parking')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        </NavLink>
        <NavLink
          label="Museums"
          leftSection={<IconBuildingStore size={16} />}
          rightSection={
            museumsMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isMuseumsRouteActive}
          opened={museumsMenuOpened}
          onChange={() => setMuseumsMenuOpened(!museumsMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/museums"
            label="Museums"
            leftSection={<IconBuildingStore size={16} />}
            active={location.pathname.startsWith('/museums') && !location.pathname.startsWith('/museum-issues')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/museum-issues"
            label="Museum Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/museum-issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=museum"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=museum')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        </NavLink>
        <NavLink
          label="Public Toilets"
          leftSection={<IconBath size={16} />}
          rightSection={
            publicToiletsMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isPublicToiletsRouteActive}
          opened={publicToiletsMenuOpened}
          onChange={() => setPublicToiletsMenuOpened(!publicToiletsMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/public-toilets"
            label="Public Toilets"
            leftSection={<IconBath size={16} />}
            active={location.pathname.startsWith('/public-toilets') && !location.pathname.startsWith('/toilet-issues')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/toilet-issues"
            label="Toilet Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/toilet-issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=toilet"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=toilet')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        </NavLink>
        <NavLink
          label="Football Fields"
          leftSection={<IconTrophy size={16} />}
          rightSection={
            footballFieldsMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isFootballFieldsRouteActive}
          opened={footballFieldsMenuOpened}
          onChange={() => setFootballFieldsMenuOpened(!footballFieldsMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/football-fields"
            label="Football Fields"
            leftSection={<IconTrophy size={16} />}
            active={location.pathname.startsWith('/football-fields') && !location.pathname.startsWith('/football-field-issues')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/football-field-issues"
            label="Football Field Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/football-field-issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=football"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=football')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
        </NavLink>
        <NavLink
          label="River Side Projects"
          leftSection={<IconDroplet size={16} />}
          rightSection={
            riverSideProjectsMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isRiverSideProjectsRouteActive}
          opened={riverSideProjectsMenuOpened}
          onChange={() => setRiverSideProjectsMenuOpened(!riverSideProjectsMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/river-side-projects"
            label="River Side Projects"
            leftSection={<IconDroplet size={16} />}
            active={location.pathname.startsWith('/river-side-projects') && !location.pathname.startsWith('/river-issues')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/river-issues"
            label="River Project Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/river-issues'}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=river"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=river')}
            onClick={() => {
              if (isMobile) {
                close();
              }
            }}
          />
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

