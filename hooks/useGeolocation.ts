'use client';

import { useState, useEffect } from 'react';
import { GeolocationState } from '@/types';

// Dhaka city center as default fallback
const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lng: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState({
                lat: DHAKA_CENTER.lat,
                lng: DHAKA_CENTER.lng,
                error: 'Geolocation not supported',
                loading: false,
            });
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setState({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                setState({
                    lat: DHAKA_CENTER.lat,
                    lng: DHAKA_CENTER.lng,
                    error: error.message,
                    loading: false,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return state;
}
