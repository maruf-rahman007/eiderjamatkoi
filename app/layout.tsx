import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
    title: 'ঈদের জামাত কই? | Eid Jamaat Koi',
    description:
        'কাছের মসজিদে ঈদের জামাতের সময় খুঁজুন। Find Eid prayer (Jamaat) times at nearby mosques in Bangladesh.',
    keywords: 'eid jamaat, eid prayer time, mosque, Bangladesh, ঈদের জামাত',
    authors: [{ name: 'eiderjamatkoi' }],
    openGraph: {
        title: 'ঈদের জামাত কই?',
        description: 'কাছের মসজিদে ঈদের জামাতের সময় খুঁজুন',
        type: 'website',
        locale: 'bn_BD',
    },
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0a0f1e',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="bn">
            <body>
                <div id="app-root">
                    {children}
                </div>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: '#1c2638',
                            color: '#f9fafb',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            fontFamily: "'Hind Siliguri', sans-serif",
                            fontSize: '14px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
