import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppShell, Group, Text, Button, NavLink, Image, Stack } from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
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
} from '@tabler/icons-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [lightPoleMenuOpened, setLightPoleMenuOpened] = useState(true);
  const [publicParksMenuOpened, setPublicParksMenuOpened] = useState(true);
  const [parkingLotsMenuOpened, setParkingLotsMenuOpened] = useState(false);
  const [museumsMenuOpened, setMuseumsMenuOpened] = useState(false);
  const [publicToiletsMenuOpened, setPublicToiletsMenuOpened] = useState(false);
  const [sportStadiumsMenuOpened, setSportStadiumsMenuOpened] = useState(false);
  const [riverSideProjectsMenuOpened, setRiverSideProjectsMenuOpened] = useState(false);

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

  // Check if sport stadiums routes are active
  const isSportStadiumsRouteActive = 
    location.pathname.startsWith('/sport-stadiums') ||
    (location.pathname === '/maintenance' && location.search.includes('type=stadium'));

  // Check if river side projects routes are active
  const isRiverSideProjectsRouteActive = 
    location.pathname.startsWith('/river-side-projects') ||
    (location.pathname === '/maintenance' && location.search.includes('type=river'));

  return (
    <AppShell
      navbar={{
        width: 250,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <Stack gap="xs" mb="lg" align="center">
          <Image
            src="/esaa-logo.jpeg"
            alt="ESAA Logo"
            w={120}
            h={120}
            fit="contain"
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%23999'%3ELogo%3C/text%3E%3C/svg%3E"
          />
          <Text size="sm" fw={600} ta="center" c="dimmed">
            Coredor Assets Management
          </Text>
        </Stack>
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
        </NavLink>
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
          />
          <NavLink
            component={Link}
            to="/park-issues"
            label="Park Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/park-issues'}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=park"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance'}
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
          />
          <NavLink
            component={Link}
            to="/parking-lot-issues"
            label="Parking Lot Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/parking-lot-issues'}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=parking"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=parking')}
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
          />
          <NavLink
            component={Link}
            to="/museum-issues"
            label="Museum Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/museum-issues'}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=museum"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=museum')}
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
          />
          <NavLink
            component={Link}
            to="/toilet-issues"
            label="Toilet Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/toilet-issues'}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=toilet"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=toilet')}
          />
        </NavLink>
        <NavLink
          label="Sport Stadiums"
          leftSection={<IconTrophy size={16} />}
          rightSection={
            sportStadiumsMenuOpened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )
          }
          active={isSportStadiumsRouteActive}
          opened={sportStadiumsMenuOpened}
          onChange={() => setSportStadiumsMenuOpened(!sportStadiumsMenuOpened)}
        >
          <NavLink
            component={Link}
            to="/sport-stadiums"
            label="Sport Stadiums"
            leftSection={<IconTrophy size={16} />}
            active={location.pathname.startsWith('/sport-stadiums') && !location.pathname.startsWith('/stadium-issues')}
          />
          <NavLink
            component={Link}
            to="/stadium-issues"
            label="Stadium Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/stadium-issues'}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=stadium"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=stadium')}
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
          />
          <NavLink
            component={Link}
            to="/river-issues"
            label="River Project Issues"
            leftSection={<IconAlertTriangle size={16} />}
            active={location.pathname === '/river-issues'}
          />
          <NavLink
            component={Link}
            to="/maintenance?type=river"
            label="Maintenance"
            leftSection={<IconTools size={16} />}
            active={location.pathname === '/maintenance' && location.search.includes('type=river')}
          />
        </NavLink>
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

