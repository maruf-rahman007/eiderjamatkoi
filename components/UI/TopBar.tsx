'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface TopBarProps {
    onLoginClick: () => void;
    onAddClick: () => void;
}

export default function TopBar({ onLoginClick, onAddClick }: TopBarProps) {
    const { isAuthenticated } = useAuth();
    const { logout } = useAuthStore();

    async function handleLogout() {
        await signOut(auth);
        logout();
    }

    return (
        <div className="top-bar">
            <a className="app-logo" href="/" aria-label="ঈদের জামাত কই হোম">
                <div className="app-logo-icon" aria-hidden="true">🕌</div>
                <span className="app-logo-text">ঈদের জামাত কই?</span>
            </a>

            <div className="top-bar-actions">
                {/* Language switcher */}
                <LanguageSwitcher />

                {isAuthenticated ? (
                    <>
                        <button
                            id="btn-add-mosque-top"
                            className="btn btn-primary btn-sm"
                            onClick={onAddClick}
                        >
                            + যোগ করুন
                        </button>
                        <button
                            id="btn-logout"
                            className="btn btn-ghost btn-sm"
                            onClick={handleLogout}
                        >
                            লগআউট
                        </button>
                    </>
                ) : (
                    <button
                        id="btn-login"
                        className="btn btn-primary btn-sm"
                        onClick={onLoginClick}
                    >
                        লগইন
                    </button>
                )}
            </div>
        </div>
    );
}

function LanguageSwitcher() {
    const setLang = (lang: string) => {
        localStorage.setItem('i18nextLng', lang);
        window.location.reload();
    };

    const currentLang =
        typeof window !== 'undefined'
            ? localStorage.getItem('i18nextLng') || 'bn'
            : 'bn';

    return (
        <div className="lang-switcher" role="group" aria-label="Language">
            <button
                className={`lang-btn ${currentLang === 'bn' ? 'active' : ''}`}
                onClick={() => setLang('bn')}
                aria-pressed={currentLang === 'bn'}
            >
                বাং
            </button>
            <button
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={currentLang === 'en'}
            >
                EN
            </button>
        </div>
    );
}
