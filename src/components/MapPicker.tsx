import { useEffect, useRef } from 'react';
import L, { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type MapPickerProps = {
  value: { lat?: number | null; lng?: number | null };
  onChange: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER: [number, number] = [9.0108, 38.7613]; // Addis Ababa

export function MapPicker({ value, onChange }: MapPickerProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapRef.current) {
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
          markerRef.current = L.marker([lat, lng]).addTo(mapRef.current as LeafletMap);
        }
        onChange(lat, lng);
      });
    }

    if (mapRef.current && value.lat && value.lng) {
      const pos: [number, number] = [value.lat, value.lng];
      mapRef.current.setView(pos, 14);
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        markerRef.current = L.marker(pos).addTo(mapRef.current);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e9ecef' }}
    />
  );
}

