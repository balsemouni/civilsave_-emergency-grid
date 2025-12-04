import React, { useEffect, useState } from 'react';
import { MapPin, Droplets, Tent, Cross, AlertTriangle } from 'lucide-react';

// Resource types
export enum ResourceType {
  WATER = 'WATER',
  SHELTER = 'SHELTER',
  MEDICAL = 'MEDICAL',
  DANGER = 'DANGER',
}

// Resource status
export enum ResourceStatus {
  OPERATIONAL = 'OPERATIONAL',
  CROWDED = 'CROWDED',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN',
}

// ResourcePoint type now includes latitude and longitude
export interface ResourcePoint {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  location: { x: number; y: number };
  latitude: number;
  longitude: number;
}

// Define hospital and danger icons
const HOSPITAL_ICON: ResourceType = ResourceType.MEDICAL;
const DANGER_ICON: ResourceType = ResourceType.DANGER;

interface MapViewProps {
  onSelect: (r: ResourcePoint) => void;
  maxDistanceKm?: number; // max distance to show nearby resources
}

// Calculate distance between two lat/lon points
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Simulate fetching hospitals/danger zones near user
const fetchResources = (userLat: number, userLon: number): ResourcePoint[] => {
  return [
    {
      id: 'h1',
      name: 'Hospital A',
      type: HOSPITAL_ICON,
      status: ResourceStatus.OPERATIONAL,
      latitude: userLat + 0.005,
      longitude: userLon + 0.003,
      location: { x: 0, y: 0 },
    },
    {
      id: 'h2',
      name: 'Hospital B',
      type: HOSPITAL_ICON,
      status: ResourceStatus.CROWDED,
      latitude: userLat - 0.004,
      longitude: userLon - 0.002,
      location: { x: 0, y: 0 },
    },
    {
      id: 'd1',
      name: 'Danger Zone',
      type: DANGER_ICON,
      status: ResourceStatus.CRITICAL,
      latitude: userLat + 0.002,
      longitude: userLon - 0.004,
      location: { x: 0, y: 0 },
    },
  ];
};

const MapView: React.FC<MapViewProps> = ({ onSelect, maxDistanceKm = 5 }) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resources, setResources] = useState<ResourcePoint[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setUserLocation(coords);
          setResources(fetchResources(coords.latitude, coords.longitude));
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const nearbyResources = userLocation
    ? resources.filter((res) =>
        getDistanceKm(userLocation.latitude, userLocation.longitude, res.latitude, res.longitude) <= maxDistanceKm
      )
    : [];

  const getIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.WATER:
        return Droplets;
      case ResourceType.SHELTER:
        return Tent;
      case ResourceType.MEDICAL:
        return Cross;
      case ResourceType.DANGER:
        return AlertTriangle;
      default:
        return MapPin;
    }
  };

  const getColor = (status: ResourceStatus) => {
    switch (status) {
      case ResourceStatus.OPERATIONAL:
        return '#10b981';
      case ResourceStatus.CROWDED:
        return '#f59e0b';
      case ResourceStatus.CRITICAL:
        return '#ef4444';
      case ResourceStatus.UNKNOWN:
        return '#94a3b8';
      default:
        return '#fff';
    }
  };

  const latLonToPercent = (lat: number, lon: number) => {
    if (!userLocation) return { x: 50, y: 50 };
    const deltaLat = lat - userLocation.latitude;
    const deltaLon = lon - userLocation.longitude;
    return { x: 50 + deltaLon * 5000, y: 50 - deltaLat * 5000 };
  };

  return (
    <div className="relative w-full aspect-square bg-tactical-900 rounded-xl border border-tactical-800 overflow-hidden shadow-2xl mt-4">
      {/* Grid Lines */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>

      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 rounded-full border border-green-500/10 animate-pulse-slow pointer-events-none"></div>

      {/* Map Points */}
      {nearbyResources.map((res) => {
        const Icon = getIcon(res.type);
        const color = getColor(res.status);
        const { x, y } = latLonToPercent(res.latitude, res.longitude);

        return (
          <button
            key={res.id}
            onClick={() => onSelect(res)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 focus:outline-none group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="relative">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-40 group-hover:opacity-75 animate-ping"
                style={{ backgroundColor: color }}
              ></span>
              <div className="relative p-2 rounded-full bg-tactical-900 border-2 shadow-sm" style={{ borderColor: color }}>
                <Icon size={16} color={color} />
              </div>

              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {res.name}
              </div>
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono">GRID: SEC-04</div>
    </div>
  );
};

export default MapView;
