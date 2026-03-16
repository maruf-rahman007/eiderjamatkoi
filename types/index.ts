// Shared TypeScript types across the app

export interface UserProfile {
    id: string;
    firebaseUid: string;
    displayName: string | null;
    createdAt: string;
}

export interface EidPrayerTime {
    id: string;
    jamaatTime: string; // "HH:MM"
    year: number;
    voteCount: number;
    isSelected: boolean;
    submittedBy: string | null;
    userVoted?: boolean;
}

export interface MosqueWithTimes {
    id: string;
    name: string;
    nameBn: string | null;
    lat: number;
    lng: number;
    photoUrl: string | null;
    submittedBy: string | null;
    submitterName: string | null;
    distance?: number; // in metres
    prayerTimes: EidPrayerTime[];
    selectedTime: EidPrayerTime | null;
    totalVotes: number;
}

export interface SubmitMosquePayload {
    name: string;
    nameBn?: string;
    lat: number;
    lng: number;
    photoUrl?: string;
    jamaatTimes: string[]; // ["07:00", "08:00"]
    userLat: number;
    userLng: number;
}

export interface VotePayload {
    prayerTimeId: string;
}

export interface ReportPayload {
    mosqueId?: string;
    prayerTimeId?: string;
    reason: string;
    suggestedTime?: string;
}

export type MarkerColor = 'green' | 'red' | 'yellow';

export interface GeolocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    loading: boolean;
}
