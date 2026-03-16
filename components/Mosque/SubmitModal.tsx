'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import BottomSheet from '@/components/UI/BottomSheet';
import { useAuth } from '@/hooks/useAuth';
import { haversineDistance } from '@/lib/geo';
import { uploadMosquePhoto } from '@/lib/supabase';

interface Props {
    userLat: number | null;
    userLng: number | null;
    onClose: () => void;
    onSuccess: () => void;
    onLoginRequired: () => void;
}

export default function SubmitModal({
    userLat,
    userLng,
    onClose,
    onSuccess,
    onLoginRequired,
}: Props) {
    const { isAuthenticated, idToken } = useAuth();

    const [name, setName] = useState('');
    const [nameBn, setNameBn] = useState('');
    const [lat, setLat] = useState(userLat ? String(userLat) : '');
    const [lng, setLng] = useState(userLng ? String(userLng) : '');
    const [times, setTimes] = useState<string[]>(['']);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    if (!isAuthenticated) {
        return (
            <BottomSheet title="মসজিদ যোগ করুন" onClose={onClose}>
                <div className="bottom-sheet-body" style={{ textAlign: 'center', paddingTop: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
                        মসজিদ যোগ করতে লগইন করতে হবে
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => { onClose(); onLoginRequired(); }}
                    >
                        লগইন করুন
                    </button>
                </div>
            </BottomSheet>
        );
    }

    function addTime() {
        if (times.length >= 4) { toast.error('সর্বোচ্চ ৪টি সময় যোগ করা যাবে'); return; }
        setTimes([...times, '']);
    }

    function removeTime(idx: number) {
        setTimes(times.filter((_, i) => i !== idx));
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('ছবির সাইজ সর্বোচ্চ ৫MB'); return; }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) { toast.error('মসজিদের নাম দিন'); return; }
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        if (isNaN(parsedLat) || isNaN(parsedLng)) { toast.error('অবস্থান দিন'); return; }

        const validTimes = times.filter((t) => t.trim());
        if (validTimes.length === 0) { toast.error('অন্তত একটি জামাতের সময় দিন'); return; }

        // Client-side proximity check (server also validates)
        if (userLat && userLng) {
            const dist = haversineDistance(userLat, userLng, parsedLat, parsedLng);
            if (dist > 1000) {
                toast.error(`আপনি মসজিদ থেকে ${Math.round(dist)}m দূরে। ১ কিমির মধ্যে থাকুন।`);
                return;
            }
        }

        setSubmitting(true);
        try {
            let photoUrl: string | undefined;

            // Upload photo if selected
            if (photoFile) {
                if (!idToken) {
                    throw new Error('Authentication token missing. Please log in again.');
                }
                const tempId = `temp-${Date.now()}`;
                // Pass the idToken from useAuth hook
                photoUrl = await uploadMosquePhoto(photoFile, tempId, idToken);
            }

            const res = await fetch('/api/mosques', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    nameBn: nameBn.trim() || undefined,
                    lat: parsedLat,
                    lng: parsedLng,
                    photoUrl, // <-- now always valid if uploaded
                    jamaatTimes: validTimes,
                    userLat,
                    userLng,
                }),
            });

            if (res.ok) {
                toast.success('মসজিদ সফলভাবে যোগ করা হয়েছে! 🕌');
                onSuccess();
            } else {
                const data = await res.json();
                toast.error(data.error || 'সমস্যা হয়েছে');
            }
        } catch (err: any) {
            toast.error(err.message || 'নেটওয়ার্ক সমস্যা');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <BottomSheet title="মসজিদ যোগ করুন" onClose={onClose}>
            <form className="bottom-sheet-body" onSubmit={handleSubmit}>
                {/* Photo */}
                <div className="form-group">
                    <label className="form-label">মসজিদের ছবি</label>
                    <div
                        className={`photo-upload-area ${photoPreview ? 'has-photo' : ''}`}
                        onClick={() => fileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload mosque photo"
                    >
                        {photoPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photoPreview} alt="Mosque preview" />
                        ) : (
                            <>
                                <span className="photo-upload-icon">📷</span>
                                <span className="photo-upload-text">ছবি আপলোড করুন (সর্বোচ্চ ৫MB)</span>
                            </>
                        )}
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />
                </div>

                {/* Mosque Name */}
                <div className="form-group">
                    <label className="form-label" htmlFor="mosque-name-en">
                        মসজিদের নাম (ইংরেজি) *
                    </label>
                    <input
                        id="mosque-name-en"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Baitul Mukarram Mosque"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="mosque-name-bn">
                        মসজিদের নাম (বাংলা)
                    </label>
                    <input
                        id="mosque-name-bn"
                        type="text"
                        className="form-input"
                        placeholder="যেমন: বায়তুল মোকাররম মসজিদ"
                        value={nameBn}
                        onChange={(e) => setNameBn(e.target.value)}
                    />
                </div>

                {/* Location */}
                <div className="form-group">
                    <label className="form-label">মসজিদের অবস্থান</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                            type="number"
                            step="any"
                            className="form-input"
                            placeholder="Latitude"
                            value={lat}
                            onChange={(e) => setLat(e.target.value)}
                            aria-label="Latitude"
                        />
                        <input
                            type="number"
                            step="any"
                            className="form-input"
                            placeholder="Longitude"
                            value={lng}
                            onChange={(e) => setLng(e.target.value)}
                            aria-label="Longitude"
                        />
                    </div>
                    {userLat && userLng && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 8 }}
                            onClick={() => { setLat(String(userLat)); setLng(String(userLng)); }}
                        >
                            📍 আমার বর্তমান অবস্থান ব্যবহার করুন
                        </button>
                    )}
                </div>

                {/* Jamaat Times */}
                <div className="form-group">
                    <label className="form-label">জামাতের সময় (সর্বোচ্চ ৪টি) *</label>
                    {times.map((t, idx) => (
                        <div key={idx} className="time-input-row">
                            <input
                                type="time"
                                className="form-input"
                                value={t}
                                onChange={(e) => {
                                    const newTimes = [...times];
                                    newTimes[idx] = e.target.value;
                                    setTimes(newTimes);
                                }}
                                aria-label={`Prayer time ${idx + 1}`}
                                id={`time-input-${idx}`}
                            />
                            {times.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-icon btn-sm"
                                    onClick={() => removeTime(idx)}
                                    aria-label="Remove time"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {times.length < 4 && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 4 }}
                            onClick={addTime}
                        >
                            + আরেকটি সময় যোগ করুন
                        </button>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 8 }}
                    disabled={submitting}
                    id="btn-submit-mosque"
                >
                    {submitting ? (
                        <><div className="spinner" /> জমা হচ্ছে...</>
                    ) : (
                        '🕌 মসজিদ যোগ করুন'
                    )}
                </button>
            </form>
        </BottomSheet>
    );
}
