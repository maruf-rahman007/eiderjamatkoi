'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import BottomSheet from '@/components/UI/BottomSheet';
import { MosqueWithTimes, EidPrayerTime } from '@/types';
import { formatDistance, formatPrayerTime, isPrayerTimePast } from '@/lib/geo';
import { useAuth } from '@/hooks/useAuth';

interface Props {
    mosque: MosqueWithTimes;
    onClose: () => void;
    onLoginRequired: () => void;
    onVoted: () => void;
}

export default function BottomSheetMosque({
    mosque,
    onClose,
    onLoginRequired,
    onVoted,
}: Props) {
    const { isAuthenticated, idToken } = useAuth();
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
    const [votingId, setVotingId] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}`;

    async function handleVote(prayerTimeId: string) {
        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        setVotingId(prayerTimeId);
        try {
            const res = await fetch(`/api/mosques/${mosque.id}/vote`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prayerTimeId }),
            });

            if (res.ok) {
                setVotedIds((prev) => new Set([...prev, prayerTimeId]));
                toast.success('যাচাই করা হয়েছে! ✓');
                onVoted();
            } else {
                const data = await res.json();
                if (res.status === 409) {
                    toast.error('আপনি ইতিমধ্যে ভোট দিয়েছেন');
                    setVotedIds((prev) => new Set([...prev, prayerTimeId]));
                } else {
                    toast.error(data.error || 'ভোট দিতে সমস্যা হয়েছে');
                }
            }
        } catch {
            toast.error('নেটওয়ার্ক সমস্যা');
        } finally {
            setVotingId(null);
        }
    }

    return (
        <BottomSheet onClose={onClose}>
            <div className="bottom-sheet-body">
                {/* Photo */}
                {mosque.photoUrl ? (
                    <Image
                        src={mosque.photoUrl}
                        alt={mosque.name}
                        width={600}
                        height={180}
                        className="mosque-photo"
                        style={{ objectFit: 'cover' }}
                    />
                ) : (
                    <div className="mosque-photo-placeholder" aria-hidden="true">🕌</div>
                )}

                {/* Name */}
                <h2 className="mosque-name">
                    {mosque.nameBn || mosque.name}
                </h2>
                {mosque.nameBn && mosque.name !== mosque.nameBn && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 8 }}>
                        {mosque.name}
                    </p>
                )}

                {/* Meta chips */}
                <div className="mosque-meta">
                    {mosque.distance !== undefined && (
                        <span className="meta-chip chip-distance">
                            📍 {formatDistance(mosque.distance)}
                        </span>
                    )}
                    {mosque.totalVotes > 0 && (
                        <span className="meta-chip chip-verified">
                            ✓ {mosque.totalVotes} জন যাচাই করেছেন
                        </span>
                    )}
                    {mosque.submitterName && (
                        <span className="meta-chip chip-creator">
                            👤 {mosque.submitterName}
                        </span>
                    )}
                </div>

                {/* Prayer Times */}
                <div className="prayer-times-section">
                    <p className="section-label">জামাতের সময়</p>
                    <div className="prayer-time-list">
                        {mosque.prayerTimes.length === 0 && (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                                এখনো কোনো জামাতের সময় যোগ করা হয়নি
                            </p>
                        )}
                        {mosque.prayerTimes.map((pt) => {
                            const isMissed = isPrayerTimePast(pt.jamaatTime);
                            const hasVoted = votedIds.has(pt.id);
                            const isVoting = votingId === pt.id;

                            return (
                                <div
                                    key={pt.id}
                                    className={`prayer-time-card ${pt.isSelected ? 'is-selected' : ''} ${isMissed ? 'is-missed' : ''}`}
                                >
                                    <div className="time-display">
                                        {formatPrayerTime(pt.jamaatTime, 'bn')}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {pt.isSelected && !isMissed && (
                                            <span className="time-selected-badge">সর্বোচ্চ ভোট</span>
                                        )}
                                        {isMissed && (
                                            <span className="time-missed-badge">শেষ</span>
                                        )}
                                        <button
                                            className={`vote-btn ${hasVoted ? 'voted' : ''}`}
                                            onClick={() => !hasVoted && handleVote(pt.id)}
                                            disabled={isVoting}
                                            aria-label={hasVoted ? 'Voted' : 'Vote to verify'}
                                        >
                                            {isVoting ? (
                                                <div
                                                    className="spinner"
                                                    style={{ width: 12, height: 12, borderWidth: 1.5 }}
                                                />
                                            ) : hasVoted ? (
                                                '✓'
                                            ) : (
                                                '👍'
                                            )}
                                            <span className="vote-count">{pt.voteCount}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="action-row">
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        id={`navigate-${mosque.id}`}
                    >
                        🗺️ নেভিগেট করুন
                    </a>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowReport(true)}
                        id={`report-${mosque.id}`}
                    >
                        ⚠️ ভুল রিপোর্ট করুন
                    </button>
                </div>

                {/* Report Form */}
                {showReport && (
                    <ReportForm
                        mosqueId={mosque.id}
                        prayerTimes={mosque.prayerTimes}
                        idToken={idToken}
                        isAuthenticated={isAuthenticated}
                        onLoginRequired={onLoginRequired}
                        onClose={() => setShowReport(false)}
                    />
                )}
            </div>
        </BottomSheet>
    );
}

/* ── Inline Report Form ───────────────────────────────────────────── */
function ReportForm({
    mosqueId,
    prayerTimes,
    idToken,
    isAuthenticated,
    onLoginRequired,
    onClose,
}: {
    mosqueId: string;
    prayerTimes: EidPrayerTime[];
    idToken: string | null;
    isAuthenticated: boolean;
    onLoginRequired: () => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState('');
    const [selectedTimeId, setSelectedTimeId] = useState('');
    const [suggestedTime, setSuggestedTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isAuthenticated) { onLoginRequired(); return; }
        if (!reason.trim()) { toast.error('কারণ লিখুন'); return; }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/mosques/${mosqueId}/report`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prayerTimeId: selectedTimeId || undefined,
                    reason,
                    suggestedTime: suggestedTime || undefined,
                }),
            });

            if (res.ok) {
                toast.success('রিপোর্ট জমা দেওয়া হয়েছে। ধন্যবাদ!');
                onClose();
            } else {
                toast.error('রিপোর্ট জমা দিতে সমস্যা হয়েছে');
            }
        } catch {
            toast.error('নেটওয়ার্ক সমস্যা');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            style={{
                marginTop: 16,
                padding: 16,
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
            }}
        >
            <p
                style={{
                    fontWeight: 600,
                    marginBottom: 12,
                    color: 'var(--color-warning)',
                }}
            >
                ⚠️ ভুল তথ্য রিপোর্ট করুন
            </p>
            <form onSubmit={handleSubmit}>
                {prayerTimes.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">কোন সময়টি ভুল?</label>
                        <select
                            className="form-input"
                            value={selectedTimeId}
                            onChange={(e) => setSelectedTimeId(e.target.value)}
                        >
                            <option value="">সব সময়</option>
                            {prayerTimes.map((pt) => (
                                <option key={pt.id} value={pt.id}>
                                    {formatPrayerTime(pt.jamaatTime, 'bn')}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">কারণ লিখুন *</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        placeholder="সমস্যাটি বিস্তারিত লিখুন..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        style={{ resize: 'none' }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">সঠিক সময় (যদি জানেন)</label>
                    <input
                        type="time"
                        className="form-input"
                        value={suggestedTime}
                        onChange={(e) => setSuggestedTime(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="submit"
                        className="btn btn-danger btn-sm"
                        disabled={submitting}
                    >
                        {submitting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'জমা দিন'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={onClose}
                    >
                        বাতিল
                    </button>
                </div>
            </form>
        </div>
    );
}
