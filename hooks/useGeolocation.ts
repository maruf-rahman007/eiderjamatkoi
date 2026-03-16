'use client';

import { useState, useEffect } from 'react';
import { GeolocationState } from '@/types';
import toast from 'react-hot-toast';

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
            toast.error('আপনার ব্রাউজারে লোকেশন সার্ভিস সাপোর্ট করে না');
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
                console.warn('Geolocation error:', error.message);

                let errorMsg = 'লোকেশন পাওয়া যাচ্ছে না';
                if (error.code === 1) { // PERMISSION_DENIED
                    errorMsg = 'লোকেশন পারমিশন দেওয়া হয়নি';
                } else if (error.code === 2) { // POSITION_UNAVAILABLE
                    errorMsg = 'লোকেশন সিগন্যাল পাওয়া যাচ্ছে না';
                } else if (error.code === 3) { // TIMEOUT
                    errorMsg = 'লোকেশন পেতে সময় বেশি লাগছে';
                } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    errorMsg = 'সিকিউর কানেকশন (HTTPS) ছাড়া লোকেশন কাজ করবে না';
                }

                toast.error(errorMsg);

                setState((prev) => ({
                    lat: prev.lat || DHAKA_CENTER.lat,
                    lng: prev.lng || DHAKA_CENTER.lng,
                    error: error.message,
                    loading: false,
                }));
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return state;
}
