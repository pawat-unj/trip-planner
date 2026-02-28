import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { MapData, MapMarker } from '../../types';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';

// Fix Leaflet default marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom marker icons by type
const markerColors: Record<MapMarker['type'], string> = {
  camp: '#7eb8a8',      // sage
  trailhead: '#d4a574', // terracotta
  viewpoint: '#9eb3c2', // blue
  water: '#7ec8e3',     // light blue
  food: '#daa06d',      // desert
  accommodation: '#c17f59', // rust
  activity: '#5a8a7a',  // forest
  poi: '#636e72',       // gray
  divider: '#1f2937',   // dark divider
};

const markerIcons: Record<MapMarker['type'], string> = {
  camp: '⛺',
  trailhead: '🚶',
  viewpoint: '👁️',
  water: '💧',
  food: '🍽️',
  accommodation: '🏨',
  activity: '🎯',
  poi: '📍',
  divider: '🗓️',
};

function createCustomIcon(type: MapMarker['type']): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${markerColors[type]};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">${markerIcons[type]}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Day colors for routes
const dayColors = [
  '#7eb8a8', // sage
  '#d4a574', // terracotta
  '#9eb3c2', // blue
  '#c17f59', // rust
  '#5a8a7a', // forest
  '#daa06d', // desert
  '#8b9dc3', // mountain
];

interface TripMapProps {
  mapData: MapData;
  height?: string;
  showDayTabs?: boolean;
  onDayChange?: (day: number | 'all') => void;
  onMapClick?: (lat: number, lon: number) => void;
  mapClickEnabled?: boolean;
  className?: string;
}

export function TripMap({
  mapData,
  height = '400px',
  showDayTabs = true,
  onDayChange,
  onMapClick,
  mapClickEnabled = false,
  className = '',
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const markerLayersRef = useRef<L.Marker[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  // Get unique days from routes and markers
  const days = Array.from(
    new Set([
      ...mapData.routes.filter((r) => r.day !== undefined).map((r) => r.day!),
      ...mapData.markers.filter((m) => m.day !== undefined).map((m) => m.day!),
    ])
  ).sort((a, b) => a - b);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: mapData.center,
      zoom: mapData.zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Optional map click handler for editor drawing mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    };

    if (mapClickEnabled && onMapClick) {
      map.on('click', handleClick);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [onMapClick, mapClickEnabled]);

  // Update routes and markers when data or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
    markerLayersRef.current.forEach((layer) => map.removeLayer(layer));
    routeLayersRef.current = [];
    markerLayersRef.current = [];

    // Filter routes based on selected day
    const filteredRoutes =
      selectedDay === 'all'
        ? mapData.routes
        : mapData.routes.filter((r) => r.day === undefined || r.day === selectedDay);

    // Add routes
    filteredRoutes.forEach((route) => {
      const latLngs = route.points.map((p) => [p.lat, p.lon] as L.LatLngTuple);
      const color = route.color || (route.day !== undefined ? dayColors[route.day % dayColors.length] : dayColors[0]);

      const polyline = L.polyline(latLngs, {
        color,
        weight: selectedDay === 'all' && route.day !== undefined ? 3 : 4,
        opacity: selectedDay !== 'all' || route.day === undefined ? 1 : 0.6,
      }).addTo(map);

      if (route.name) {
        polyline.bindPopup(`<strong>${route.name}</strong>`);
      }

      routeLayersRef.current.push(polyline);
    });

    // Filter markers based on selected day
    const filteredMarkers =
      selectedDay === 'all'
        ? mapData.markers
        : mapData.markers.filter((m) => m.day === undefined || m.day === selectedDay);

    // Add markers
    filteredMarkers.forEach((marker) => {
      const icon = createCustomIcon(marker.type);
      const leafletMarker = L.marker([marker.lat, marker.lon], { icon }).addTo(map);

      const popupContent = `
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${marker.name}</strong>
          ${marker.description ? `<p style="margin: 4px 0 0; font-size: 12px; color: #636e72;">${marker.description}</p>` : ''}
        </div>
      `;
      leafletMarker.bindPopup(popupContent);

      markerLayersRef.current.push(leafletMarker);
    });

    // Fit bounds if we have routes
    if (filteredRoutes.length > 0) {
      const allPoints = filteredRoutes.flatMap((r) => r.points);
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lon]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [mapData, selectedDay]);

  const handleDayChange = (day: string) => {
    const newDay = day === 'all' ? 'all' : parseInt(day, 10);
    setSelectedDay(newDay);
    onDayChange?.(newDay);
  };

  return (
    <div className={className}>
      {showDayTabs && days.length > 0 && (
        <Tabs defaultValue="all" onChange={handleDayChange}>
          <TabsList className="mb-3">
            <TabsTrigger value="all">All Days</TabsTrigger>
            {days.map((day) => (
              <TabsTrigger key={day} value={day.toString()}>
                Day {day}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <div
        ref={mapRef}
        style={{ height }}
        className="rounded-xl overflow-hidden border border-border"
      />
    </div>
  );
}
