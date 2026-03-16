'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMosques } from '@/hooks/useMosques';
import { useAuthListener } from '@/hooks/useAuth';
import { MosqueWithTimes } from '@/types';
import TopBar from '@/components/UI/TopBar';
import MapLegend from '@/components/Map/MapLegend';
import BottomSheetMosque from '@/components/Mosque/BottomSheetMosque';
import PhoneLoginModal from '@/components/Auth/PhoneLoginModal';
import SubmitModal from '@/components/Mosque/SubmitModal';

// Dynamic import — Leaflet requires browser APIs
const MapView = dynamic(() => import('@/components/Map/MapView'), {
    ssr: false,
    loading: () => (
        <div
            style={{
                flex: 1,
                background: '#0d1117',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div className="spinner" />
        </div>
    ),
});

export default function HomePage() {
    // Initialize auth listener at root
    useAuthListener();

    const { lat, lng, error: geoError } = useGeolocation();

    // We use a separate state for where to fetch mosques from, so the user can pan the map freely
    const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);

    const [selectedMosque, setSelectedMosque] = useState<MosqueWithTimes | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showSubmit, setShowSubmit] = useState(false);

    // If mapCenter exists, fetch from there. Otherwise, use user's GPS if ready
    const fetchLat = mapCenter ? mapCenter.lat : lat;
    const fetchLng = mapCenter ? mapCenter.lng : lng;

    const { mosques, loading, refetch } = useMosques({ lat: fetchLat, lng: fetchLng });

    // Close popup on map click (handled inside MapView)
    const handleMarkerClick = (mosque: MosqueWithTimes) => {
        setSelectedMosque(mosque);
    };

    const handleSubmitSuccess = () => {
        setShowSubmit(false);
        refetch();
    };

    return (
        <>
            <TopBar
                onLoginClick={() => setShowLogin(true)}
                onAddClick={() => setShowSubmit(true)}
            />

            <div className="map-container">
                <MapView
                    userLat={lat}
                    userLng={lng}
                    mosques={mosques}
                    onMarkerClick={handleMarkerClick}
                    onCenterChange={(cLat, cLng) => setMapCenter({ lat: cLat, lng: cLng })}
                />

                <MapLegend />

                {/* FAB — Add Mosque */}
                <button
                    id="fab-add-mosque"
                    className="fab"
                    onClick={() => setShowSubmit(true)}
                    title="মসজিদ যোগ করুন"
                    aria-label="Add mosque"
                >
                    +
                </button>
            </div>

            {/* Mosque Detail Bottom Sheet */}
            {selectedMosque && (
                <BottomSheetMosque
                    mosque={selectedMosque}
                    onClose={() => setSelectedMosque(null)}
                    onLoginRequired={() => setShowLogin(true)}
                    onVoted={refetch}
                />
            )}

            {/* Phone Login Modal */}
            {showLogin && (
                <PhoneLoginModal onClose={() => setShowLogin(false)} />
            )}

            {/* Submit Mosque Modal */}
            {showSubmit && (
                <SubmitModal
                    userLat={lat}
                    userLng={lng}
                    onClose={() => setShowSubmit(false)}
                    onSuccess={handleSubmitSuccess}
                    onLoginRequired={() => {
                        setShowSubmit(false);
                        setShowLogin(true);
                    }}
                />
            )}
        </>
    );
}
