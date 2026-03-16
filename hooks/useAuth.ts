'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';

/**
 * Subscribes to Firebase Auth state changes and syncs with our DB.
 * Call once at the app root level.
 */
export function useAuthListener() {
    const { setUser, setDbUserId, setIdToken, setIsLoading, logout } =
        useAuthStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                setUser(firebaseUser);
                setIdToken(token);

                // Sync user to our database
                try {
                    const res = await fetch('/api/auth/sync', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            displayName:
                                firebaseUser.displayName || firebaseUser.phoneNumber || '',
                        }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setDbUserId(data.user.id);
                    }
                } catch (err) {
                    console.error('Failed to sync user:', err);
                }
            } else {
                logout();
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

/**
 * Returns auth state conveniently for use in components.
 */
export function useAuth() {
    const { user, dbUserId, idToken, isLoading } = useAuthStore();
    return { user, dbUserId, idToken, isLoading, isAuthenticated: !!user };
}
