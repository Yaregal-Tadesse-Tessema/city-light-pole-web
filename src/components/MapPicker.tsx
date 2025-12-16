import { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap, Marker, Icon } from 'leaflet';
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

// Create custom colored icons
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        width: 12px;
        height: 12px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const blueIcon = createColoredIcon('#3388ff');
const redIcon = createColoredIcon('#ff0000');

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
          const res = await axios.get('http://localhost:3011/api/v1/poles?page=1&limit=1000', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAllPoles(res.data?.items || []);
        } catch (error) {
          console.error('Failed to fetch poles:', error);
        }
      };
      fetchAllPoles();
    }
  }, [showAllPoles]);

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(
      value.lat && value.lng ? [value.lat, value.lng] : DEFAULT_CENTER,
      13,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: blueIcon }).addTo(mapRef.current as LeafletMap);
      }
      onChange(lat, lng);
    });

    // Set initial marker if value exists
    if (value.lat && value.lng) {
      markerRef.current = L.marker([value.lat, value.lng], { icon: blueIcon }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
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
        markerRef.current = L.marker(pos, { icon: blueIcon }).addTo(mapRef.current);
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
          icon: redIcon
        }).addTo(mapRef.current!);
        
        // Add popup with pole code
        marker.bindPopup(`<strong>${pole.code}</strong><br/>${pole.district}, ${pole.street}`);
        
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
          markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
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

