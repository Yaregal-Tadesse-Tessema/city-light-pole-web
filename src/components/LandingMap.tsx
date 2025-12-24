import { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Paper, Loader, Center, Stack, Text, Group, Select, Button } from '@mantine/core';
import { IconFilter, IconX } from '@tabler/icons-react';
import axios from 'axios';

// Pole status types
type PoleStatus = 'OPERATIONAL' | 'FAULT_DAMAGED' | 'UNDER_MAINTENANCE' | 'REPLACED';

// Pole interface
interface Pole {
  id: string;
  code: string;
  gpsLat: number;
  gpsLng: number;
  status: PoleStatus;
  subcity: string;
  street: string;
}

const DEFAULT_CENTER: [number, number] = [9.0108, 38.7613]; // Addis Ababa
const DEFAULT_ZOOM = 12;

// Create custom colored icons for different pole statuses
const createStatusIcon = (status: PoleStatus) => {
  let color: string;
  let statusLabel: string;

  switch (status) {
    case 'OPERATIONAL':
      color = '#4CAF50'; // Green
      statusLabel = 'Operational';
      break;
    case 'FAULT_DAMAGED':
      color = '#F44336'; // Red
      statusLabel = 'Fault/Damaged';
      break;
    case 'UNDER_MAINTENANCE':
      color = '#FF9800'; // Orange
      statusLabel = 'Under Maintenance';
      break;
    default:
      color = '#9E9E9E'; // Gray
      statusLabel = 'Unknown';
  }

  return L.divIcon({
    className: 'status-pin-icon',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
      cursor: pointer;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
    <div style="
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0,0,0,0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      margin-bottom: 8px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    " class="status-tooltip">
      ${statusLabel}
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const LandingMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const [poles, setPoles] = useState<Pole[]>([]);
  const [filteredPoles, setFilteredPoles] = useState<Pole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcities, setSubcities] = useState<string[]>([]);
  const [streets, setStreets] = useState<string[]>([]);
  const [selectedSubcity, setSelectedSubcity] = useState<string | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null);

  // Fetch poles data
  useEffect(() => {
    const fetchPoles = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3011/api/v1/poles', {
          params: {
            page: 1,
            limit: 1000, // Get all poles for the map
          },
        });

        if (response.data && response.data.items) {
          const allPoles = response.data.items;

          const polesWithCoords = allPoles.filter((pole: any) => {
            // Convert string coordinates to numbers if needed
            const lat = typeof pole.gpsLat === 'string' ? parseFloat(pole.gpsLat) : pole.gpsLat;
            const lng = typeof pole.gpsLng === 'string' ? parseFloat(pole.gpsLng) : pole.gpsLng;
            const hasLat = lat !== null && lat !== undefined && !isNaN(lat);
            const hasLng = lng !== null && lng !== undefined && !isNaN(lng);

            return hasLat && hasLng;
          });

          // Convert coordinates to numbers for poles with valid coords
          const processedPoles = polesWithCoords.map((pole: any) => ({
            ...pole,
            gpsLat: typeof pole.gpsLat === 'string' ? parseFloat(pole.gpsLat) : pole.gpsLat,
            gpsLng: typeof pole.gpsLng === 'string' ? parseFloat(pole.gpsLng) : pole.gpsLng,
          }));

          setPoles(processedPoles);
          setFilteredPoles(processedPoles);

          // Extract unique subcities and streets for filter dropdowns
          const uniqueSubcities = [...new Set(processedPoles.map(pole => pole.subcity))].sort() as string[];
          const uniqueStreets = [...new Set(processedPoles.map(pole => pole.street))].sort() as string[];

          setSubcities(uniqueSubcities);
          setStreets(uniqueStreets);

          // Set default subcity filter to "Bole" (most common/populated)
          if (uniqueSubcities.includes('Bole') && !selectedSubcity) {
            setSelectedSubcity('Bole');
          }
        }
      } catch (err) {
        console.error('Error fetching poles:', err);
        setError('Failed to load pole data');
      } finally {
        setLoading(false);
      }
    };

    fetchPoles();
  }, []);

  // Filter poles based on selected filters
  useEffect(() => {
    let filtered = poles;

    if (selectedSubcity) {
      filtered = filtered.filter(pole => pole.subcity === selectedSubcity);
    }

    if (selectedStreet) {
      filtered = filtered.filter(pole => pole.street === selectedStreet);
    }

    setFilteredPoles(filtered);
  }, [poles, selectedSubcity, selectedStreet]);

  // Handle filter changes
  const handleSubcityChange = (value: string | null) => {
    setSelectedSubcity(value);
  };

  const handleStreetChange = (value: string | null) => {
    setSelectedStreet(value);
  };

  const clearFilters = () => {
    // Reset to default subcity (Bole) or null if no default available
    const defaultSubcity = subcities.includes('Bole') ? 'Bole' : null;
    setSelectedSubcity(defaultSubcity);
    setSelectedStreet(null);
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || loading) return;

    // Initialize map only once
    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(leafletMapRef.current);
    }

    const map = leafletMapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each filtered pole
    console.log('Adding markers for', filteredPoles.length, 'filtered poles');
    filteredPoles.forEach((pole, index) => {
      console.log(`Adding marker ${index + 1}:`, pole.code, [pole.gpsLat, pole.gpsLng]);
      const icon = createStatusIcon(pole.status);

      const marker = L.marker([pole.gpsLat, pole.gpsLng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Arial, sans-serif; max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Pole ${pole.code}</h4>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Status:</strong>
              <span style="color: ${
                pole.status === 'OPERATIONAL' ? '#4CAF50' :
                pole.status === 'FAULT_DAMAGED' ? '#F44336' :
                pole.status === 'UNDER_MAINTENANCE' ? '#FF9800' : '#9E9E9E'
              };">
                ${pole.status === 'OPERATIONAL' ? 'Operational' :
                  pole.status === 'FAULT_DAMAGED' ? 'Fault/Damaged' :
                  pole.status === 'UNDER_MAINTENANCE' ? 'Under Maintenance' : 'Unknown'}
              </span>
            </p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Subcity:</strong> ${pole.subcity}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Street:</strong> ${pole.street}</p>
          </div>
        `);

      console.log('Marker added for pole:', pole.code);

      // Add hover effects
      marker.on('mouseover', function() {
        const tooltip = this.getElement()?.querySelector('.status-tooltip') as HTMLElement;
        if (tooltip) {
          tooltip.style.opacity = '1';
        }
      });

      marker.on('mouseout', function() {
        const tooltip = this.getElement()?.querySelector('.status-tooltip') as HTMLElement;
        if (tooltip) {
          tooltip.style.opacity = '0';
        }
      });
    });

    console.log('Finished adding markers');

    // Fit map to show all markers if there are any
    if (filteredPoles.length > 0) {
      const group = new L.featureGroup(filteredPoles.map(pole => L.marker([pole.gpsLat, pole.gpsLng])));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup on unmount
      if (map) {
        map.remove();
        leafletMapRef.current = null;
      }
    };
  }, [filteredPoles, loading]);

  if (loading) {
    return (
      <Paper withBorder style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Center>
          <Stack align="center" gap="sm">
            <Loader size="lg" />
            <Text c="dimmed">Loading pole locations...</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper withBorder style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Center>
          <Stack align="center" gap="sm">
            <Text c="red" fw={500}>Error loading map</Text>
            <Text c="dimmed" size="sm">{error}</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Status Legend */}
      <Group justify="center" gap="lg">
        <Group gap="xs">
          <div style={{
            width: 12,
            height: 12,
            backgroundColor: '#4CAF50',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            border: '1px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
          <Text size="sm">Operational ({filteredPoles.filter(p => p.status === 'OPERATIONAL').length})</Text>
        </Group>

        <Group gap="xs">
          <div style={{
            width: 12,
            height: 12,
            backgroundColor: '#F44336',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            border: '1px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
          <Text size="sm">Fault/Damaged ({filteredPoles.filter(p => p.status === 'FAULT_DAMAGED').length})</Text>
        </Group>

        <Group gap="xs">
          <div style={{
            width: 12,
            height: 12,
            backgroundColor: '#FF9800',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            border: '1px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
          <Text size="sm">Under Maintenance ({filteredPoles.filter(p => p.status === 'UNDER_MAINTENANCE').length})</Text>
        </Group>
      </Group>

      {/* Filters */}
      <Paper withBorder p="md" bg="gray.0" style={{ position: 'relative', zIndex: 1000 }}>
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">
              <IconFilter size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Filter Poles
            </Text>
            {(selectedSubcity || selectedStreet) && (
              <Button
                size="xs"
                variant="light"
                color="gray"
                leftSection={<IconX size={14} />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Group>

          <Group grow>
            <Select
              placeholder="Filter by Subcity"
              data={[
                { value: '', label: 'All Subcities' },
                ...subcities.map(subcity => ({ value: subcity, label: subcity }))
              ]}
              value={selectedSubcity || ''}
              onChange={(value) => handleSubcityChange(value || null)}
              clearable
              searchable
              size="sm"
              styles={{
                dropdown: {
                  zIndex: 1001,
                }
              }}
            />

            <Select
              placeholder="Filter by Street"
              data={[
                { value: '', label: 'All Streets' },
                ...streets.map(street => ({ value: street, label: street }))
              ]}
              value={selectedStreet || ''}
              onChange={(value) => handleStreetChange(value || null)}
              clearable
              searchable
              size="sm"
              styles={{
                dropdown: {
                  zIndex: 1001,
                }
              }}
            />
          </Group>

          {(selectedSubcity || selectedStreet) && (
            <Text size="xs" c="dimmed">
              Active filters: {selectedSubcity && `Subcity: ${selectedSubcity}`}
              {selectedSubcity && selectedStreet && ' | '}
              {selectedStreet && `Street: ${selectedStreet}`}
            </Text>
          )}
        </Stack>
      </Paper>

      {/* Map Container */}
      <Paper withBorder style={{ height: '400px', overflow: 'hidden' }}>
        <div
          ref={mapRef}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        />
      </Paper>



      {/* Summary */}
      <Group justify="center">
        <Text size="sm" c="dimmed">
          Total poles displayed: {filteredPoles.length}{poles.length !== filteredPoles.length ? ` (filtered from ${poles.length})` : ''}
        </Text>
      </Group>
    </Stack>
  );
};

export default LandingMap;
