// @ts-nocheck
import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [9.0108, 38.7613];
const DEFAULT_ZOOM = 12;
const POLE_ICON_WIDTH = 56;
const POLE_ICON_HEIGHT = 70;

const getIconUrlByStatus = (status: string) => {
  if (status === 'OPERATIONAL') return '/Green.svg';
  if (status === 'FAULT_DAMAGED') return '/Red.svg';
  if (status === 'UNDER_MAINTENANCE') return '/Orange.svg';
  return '/Grey.svg';
};

const createPoleIcon = (status: string) =>
  L.icon({
    iconUrl: getIconUrlByStatus(status),
    iconSize: [POLE_ICON_WIDTH, POLE_ICON_HEIGHT],
    iconAnchor: [POLE_ICON_WIDTH / 2, POLE_ICON_HEIGHT],
    popupAnchor: [0, -POLE_ICON_HEIGHT],
  });

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value);
  return Number.NaN;
};

export default function SubcityPolesMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subcity = (searchParams.get('subcity') || '').trim();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseLayerControlRef = useRef<L.Control.Layers | null>(null);

  const {
    data: polesInSubcity,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['poles', 'subcity-map', subcity],
    enabled: !!subcity,
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/poles', {
        params: {
          subcity,
          limit: 10000,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items || [];
    },
  });

  const geolocatedPoles = useMemo(() => {
    if (!Array.isArray(polesInSubcity)) return [];
    return polesInSubcity.filter((pole: any) => {
      const lat = toNumber(pole.gpsLat);
      const lng = toNumber(pole.gpsLng);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [polesInSubcity]);

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    const satelliteImageryLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      },
    );

    const satelliteLabelsLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Labels &copy; Esri',
        maxZoom: 19,
      },
    );

    const satelliteHybridLayer = L.layerGroup([satelliteImageryLayer, satelliteLabelsLayer]);

    streetLayer.addTo(map);
    baseLayerControlRef.current = L.control
      .layers(
        {
          'Street Map': streetLayer,
          'Satellite (Hybrid)': satelliteHybridLayer,
        },
        {},
        { position: 'topright' },
      )
      .addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (baseLayerControlRef.current) {
        baseLayerControlRef.current.remove();
        baseLayerControlRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const markerBounds: L.LatLngExpression[] = [];

    geolocatedPoles.forEach((pole: any) => {
      const lat = toNumber(pole.gpsLat);
      const lng = toNumber(pole.gpsLng);
      const marker = L.marker([lat, lng], { icon: createPoleIcon(pole.status) });
      marker.bindTooltip(`${pole.code || 'N/A'}`, {
        direction: 'top',
        offset: [0, -34],
        opacity: 0.95,
      });
      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif; min-width: 180px;">
          <div><strong>Pole Code:</strong> ${pole.code || 'N/A'}</div>
          <div><strong>Subcity:</strong> ${pole.subcity || 'N/A'}</div>
          <div><strong>Street:</strong> ${pole.street || 'N/A'}</div>
          <div><strong>Status:</strong> ${pole.status || 'UNKNOWN'}</div>
        </div>
      `);
      markersLayerRef.current?.addLayer(marker);
      markerBounds.push([lat, lng]);
    });

    if (markerBounds.length > 0) {
      const bounds = L.latLngBounds(markerBounds);
      mapRef.current.fitBounds(bounds.pad(0.1));
    } else {
      mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [geolocatedPoles]);

  if (!subcity) {
    return (
      <Container size="xl" py="xl">
        <Stack gap="md">
          <Group>
            <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Group>
          <Alert color="yellow" icon={<IconAlertTriangle size={16} />} title="Missing subcity">
            Please provide a subcity query parameter to view poles on the map.
          </Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group>
            <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={handleBack}>
              Back
            </Button>
            <Title order={2}>Light Poles Map - {subcity}</Title>
          </Group>
        </Group>

        <Paper withBorder p="sm">
          <Group gap="lg" wrap="wrap">
            <Group gap="xs">
              <img src="/Green.svg" alt="Operational" width={16} height={16} />
              <Text size="sm">Operational</Text>
            </Group>
            <Group gap="xs">
              <img src="/Red.svg" alt="Fault damaged" width={16} height={16} />
              <Text size="sm">Fault/Damaged</Text>
            </Group>
            <Group gap="xs">
              <img src="/Orange.svg" alt="Under maintenance" width={16} height={16} />
              <Text size="sm">Under Maintenance</Text>
            </Group>
            <Group gap="xs">
              <img src="/Grey.svg" alt="Unknown" width={16} height={16} />
              <Text size="sm">Unknown</Text>
            </Group>
          </Group>
        </Paper>

        {isLoading && (
          <Paper withBorder p="xl">
            <Center>
              <Stack align="center" gap="sm">
                <Loader />
                <Text c="dimmed">Loading poles for {subcity}...</Text>
              </Stack>
            </Center>
          </Paper>
        )}

        {isError && (
          <Alert color="red" title="Failed to load poles" icon={<IconAlertTriangle size={16} />}>
            <Group justify="space-between" align="center">
              <Text size="sm">Unable to fetch poles data. Please try again.</Text>
              <Button size="xs" variant="white" color="red" onClick={() => refetch()}>
                Retry
              </Button>
            </Group>
          </Alert>
        )}

        {!isLoading && !isError && polesInSubcity.length === 0 && (
          <Alert color="blue" title="No poles found">
            No poles found for this subcity.
          </Alert>
        )}

        {!isLoading && !isError && polesInSubcity.length > 0 && geolocatedPoles.length === 0 && (
          <Alert color="blue" title="No geolocated poles">
            This subcity has poles, but none with valid GPS coordinates.
          </Alert>
        )}

        <Paper withBorder style={{ height: 620, overflow: 'hidden' }}>
          <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        </Paper>

        {!isLoading && !isError && (
          <Text size="sm" c="dimmed">
            Showing {geolocatedPoles.length} geolocated poles out of {polesInSubcity.length} poles in {subcity}.
          </Text>
        )}
      </Stack>
    </Container>
  );
}
