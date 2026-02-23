import { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TextInput, Button, Stack, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import axios from 'axios';

type MapPickerProps = {
  value: { lat?: number | null; lng?: number | null };
  onChange: (lat: number, lng: number) => void;
  currentPoleCode?: string | null;
  showAllPoles?: boolean;
};

const DEFAULT_CENTER: [number, number] = [9.0108, 38.7613]; // Addis Ababa

const POLE_ICON_WIDTH = 56;
const POLE_ICON_HEIGHT = 70;

const getIconUrlByStatus = (status?: string) => {
  if (status === 'OPERATIONAL') return '/Green.svg';
  if (status === 'FAULT_DAMAGED') return '/Red.svg';
  if (status === 'UNDER_MAINTENANCE') return '/Orange.svg';
  return '/Grey.svg';
};

const createPoleIcon = (status?: string) =>
  L.icon({
    iconUrl: getIconUrlByStatus(status),
    iconSize: [POLE_ICON_WIDTH, POLE_ICON_HEIGHT],
    iconAnchor: [POLE_ICON_WIDTH / 2, POLE_ICON_HEIGHT],
    popupAnchor: [0, -POLE_ICON_HEIGHT],
  });

const selectedLocationIcon = createPoleIcon('OPERATIONAL');

export function MapPicker({ value, onChange, currentPoleCode, showAllPoles = false }: MapPickerProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const allPolesMarkersRef = useRef<Marker[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allPoles, setAllPoles] = useState<any[]>([]);

  // Fetch all poles if showAllPoles is true
  useEffect(() => {
    if (showAllPoles) {
      const fetchAllPoles = async () => {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            console.warn('No access token found');
            return;
          }
          const res = await axios.get('http://localhost:3011/api/v1/poles?page=1&limit=1000', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAllPoles(res.data?.items || []);
        } catch (error) {
          console.error('Failed to fetch poles:', error);
          // Don't crash the component if fetch fails
          setAllPoles([]);
        }
      };
      fetchAllPoles();
    } else {
      // Reset poles when showAllPoles is false
      setAllPoles([]);
    }
  }, [showAllPoles]);

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Check if Leaflet is available
    if (typeof window === 'undefined' || !L || !L.map) {
      console.error('Leaflet is not available');
      return;
    }

    try {
      mapRef.current = L.map(containerRef.current).setView(
        value.lat && value.lng ? [value.lat, value.lng] : DEFAULT_CENTER,
        13,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e: any) => {
        // Check if click was on a marker (prevent default behavior)
        const target = e.originalEvent?.target;
        if (target && (target.closest('.leaflet-marker-icon') || target.closest('.leaflet-popup'))) {
          return; // Don't handle clicks on markers
        }
        
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: selectedLocationIcon }).addTo(mapRef.current as LeafletMap);
        }
        onChange(lat, lng);
      });

      // Set initial marker if value exists
      if (value.lat && value.lng) {
        markerRef.current = L.marker([value.lat, value.lng], { icon: selectedLocationIcon }).addTo(mapRef.current);
        // Prevent marker clicks from triggering map clicks
        markerRef.current.on('click', (e: any) => {
          e.originalEvent?.stopPropagation();
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapRef.current = null;
        markerRef.current = null;
        allPolesMarkersRef.current = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when value changes (without re-mounting map)
  useEffect(() => {
    if (mapRef.current && value.lat && value.lng) {
      const pos: [number, number] = [value.lat, value.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else if (mapRef.current) {
        markerRef.current = L.marker(pos, { icon: selectedLocationIcon }).addTo(mapRef.current);
      }
    }
  }, [value.lat, value.lng]);

  // Add markers for all poles
  useEffect(() => {
    if (!mapRef.current || !showAllPoles || allPoles.length === 0) return;

    // Remove existing pole markers
    allPolesMarkersRef.current.forEach(marker => {
      marker.remove();
    });
    allPolesMarkersRef.current = [];

    // Add markers for all poles
    allPoles.forEach((pole: any) => {
      if (pole.gpsLat && pole.gpsLng && pole.code !== currentPoleCode) {
        const marker = L.marker([Number(pole.gpsLat), Number(pole.gpsLng)], {
          icon: createPoleIcon(pole.status),
        }).addTo(mapRef.current!);
        
        // Add popup with pole code
        marker.bindPopup(`<strong>${pole.code}</strong><br/>${pole.subcity || pole.district}, ${pole.street}`);
        
        // Prevent marker clicks from triggering map clicks
        marker.on('click', (e: any) => {
          e.originalEvent?.stopPropagation();
        });
        
        allPolesMarkersRef.current.push(marker);
      }
    });
  }, [allPoles, showAllPoles, currentPoleCode]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap) geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'City Light Pole Management System',
          },
        }
      );

      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Center map on search result
        mapRef.current.setView([lat, lng], 15);

        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: selectedLocationIcon }).addTo(mapRef.current);
        }

        // Update parent component
        onChange(lat, lng);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Stack gap="xs">
      <Group>
        <TextInput
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ flex: 1 }}
        />
        <Button
          onClick={handleSearch}
          loading={isSearching}
          leftSection={<IconSearch size={16} />}
        >
          Search
        </Button>
      </Group>
      <div
        ref={containerRef}
        style={{ height: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid #e9ecef' }}
      />
    </Stack>
  );
}

