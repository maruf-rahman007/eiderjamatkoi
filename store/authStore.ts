'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';

interface AuthState {
    user: User | null;
    dbUserId: string | null;
    idToken: string | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setDbUserId: (id: string | null) => void;
    setIdToken: (token: string | null) => void;
    setIsLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            dbUserId: null,
            idToken: null,
            isLoading: true,
            setUser: (user) => set({ user }),
            setDbUserId: (dbUserId) => set({ dbUserId }),
            setIdToken: (idToken) => set({ idToken }),
            setIsLoading: (isLoading) => set({ isLoading }),
            logout: () => set({ user: null, dbUserId: null, idToken: null }),
        }),
        {
            name: 'eid-auth',
            partialize: (state) => ({ dbUserId: state.dbUserId }),
        }
    )
);
