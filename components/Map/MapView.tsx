'use client';

import { useEffect, useRef } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MosqueWithTimes } from '@/types';
import { isPrayerTimePast } from '@/lib/geo';

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createMosqueIcon(isPast: boolean) {
    const color = isPast ? '#ef4444' : '#10b981';
    const glow = isPast ? 'rgba(239,68,68,0.6)' : 'rgba(16,185,129,0.6)';
    const emoji = '🕌';

    return L.divIcon({
        className: '',
        html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          inset: 0;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 12px ${glow};
          border: 2px solid rgba(255,255,255,0.25);
        "></div>
        <span style="
          position: relative;
          z-index: 1;
          font-size: 18px;
          line-height: 1;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        ">${emoji}</span>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -44],
    });
}

function createUserIcon() {
    return L.divIcon({
        className: '',
        html: `
      <div style="
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 14, { animate: true });
    }, [lat, lng, map]);
    return null;
}

function MapEvents({
    onCenterChange,
}: {
    onCenterChange?: (lat: number, lng: number) => void;
}) {
    const map = useMapEvents({
        moveend: () => {
            if (onCenterChange) {
                const center = map.getCenter();
                onCenterChange(center.lat, center.lng);
            }
        },
    });
    return null;
}

interface MapViewProps {
    userLat: number | null;
    userLng: number | null;
    mosques: MosqueWithTimes[];
    onMarkerClick: (mosque: MosqueWithTimes) => void;
    onCenterChange?: (lat: number, lng: number) => void;
}

// Default center: Dhaka
const DEFAULT_LAT = 23.8103;
const DEFAULT_LNG = 90.4125;

export default function MapView({
    userLat,
    userLng,
    mosques,
    onMarkerClick,
    onCenterChange,
}: MapViewProps) {
    const centerLat = userLat ?? DEFAULT_LAT;
    const centerLng = userLng ?? DEFAULT_LNG;

    // Track if we've already done the initial recenter
    const hasRecentered = useRef(false);

    return (
        <MapContainer
            center={[centerLat, centerLng]}
            attributionControl={false} 
            zoom={14}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
            />

            <MapEvents onCenterChange={onCenterChange} />

            {/* Re-center only once when user location first loads */}
            {userLat && userLng && !hasRecentered.current && (
                <RecenterMap lat={userLat} lng={userLng} />
            )}
            {/* Set the ref so we don't snap back repeatedly on pan */}
            {(() => {
                if (userLat && userLng) hasRecentered.current = true;
                return null;
            })()}

            {/* User location dot */}
            {userLat && userLng && (
                <Marker
                    position={[userLat, userLng]}
                    icon={createUserIcon()}
                    zIndexOffset={1000}
                />
            )}

            {/* Mosque markers */}
            {mosques.map((mosque) => {
                const selectedTime = mosque.selectedTime;
                const isPast = selectedTime
                    ? isPrayerTimePast(selectedTime.jamaatTime)
                    : false;

                return (
                    <Marker
                        key={mosque.id}
                        position={[mosque.lat, mosque.lng]}
                        icon={createMosqueIcon(isPast)}
                        eventHandlers={{
                            click: () => onMarkerClick(mosque),
                        }}
                    />
                );
            })}
        </MapContainer>
    );
}
