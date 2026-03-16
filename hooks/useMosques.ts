'use client';

import { useState, useEffect, useCallback } from 'react';
import { MosqueWithTimes } from '@/types';

interface UseMosquesOptions {
    lat: number | null;
    lng: number | null;
    radius?: number;
}

export function useMosques({ lat, lng, radius = 5000 }: UseMosquesOptions) {
    const [mosques, setMosques] = useState<MosqueWithTimes[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMosques = useCallback(async () => {
        if (!lat || !lng) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                lat: String(lat),
                lng: String(lng),
                radius: String(radius),
            });

            const res = await fetch(`/api/mosques?${params}`);
            if (!res.ok) throw new Error('Failed to fetch mosques');

            const data: MosqueWithTimes[] = await res.json();
            setMosques(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [lat, lng, radius]);

    useEffect(() => {
        fetchMosques();
    }, [fetchMosques]);

    return { mosques, loading, error, refetch: fetchMosques };
}
