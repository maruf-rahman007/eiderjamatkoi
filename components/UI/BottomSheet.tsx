'use client';

import { useEffect, useRef } from 'react';

interface BottomSheetProps {
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
}

export default function BottomSheet({ title, onClose, children }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Close on overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="bottom-sheet-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="bottom-sheet" ref={sheetRef}>
                <div className="bottom-sheet-handle" />
                {title && (
                    <div className="bottom-sheet-header">
                        <h2 className="bottom-sheet-title">{title}</h2>
                        <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
