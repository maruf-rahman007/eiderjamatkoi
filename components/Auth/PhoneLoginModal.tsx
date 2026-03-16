'use client';

import { useState, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
} from 'firebase/auth';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
}

type Step = 'phone' | 'otp';

export default function PhoneLoginModal({ onClose }: Props) {
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const setupRecaptcha = useCallback(() => {
        if (!(window as unknown as Record<string, unknown>).recaptchaVerifier) {
            (window as unknown as Record<string, unknown>).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { },
            });
        }
        return (window as unknown as Record<string, unknown>).recaptchaVerifier as RecaptchaVerifier;
    }, []);

    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault();
        if (!phone.trim()) { toast.error('ফোন নম্বর দিন'); return; }

        setLoading(true);
        try {
            const verifier = setupRecaptcha();
            const fullPhone = phone.startsWith('+') ? phone : `+88${phone}`;
            const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
            setConfirmation(result);
            setStep('otp');
            toast.success('OTP পাঠানো হয়েছে');
        } catch (error) {
            console.error(error);
            toast.error('OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            // Reset recaptcha
            delete (window as unknown as Record<string, unknown>).recaptchaVerifier;
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { toast.error('৬ সংখ্যার OTP দিন'); return; }
        if (!confirmation) return;

        setLoading(true);
        try {
            await confirmation.confirm(code);
            toast.success('লগইন সফল! 🎉');
            onClose();
        } catch {
            toast.error('OTP ভুল হয়েছে। আবার চেষ্টা করুন।');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    }

    function handleOtpChange(idx: number, value: string) {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[idx] = value.slice(-1);
        setOtp(newOtp);
        // Auto-advance
        if (value && idx < 5) {
            otpRefs.current[idx + 1]?.focus();
        }
    }

    function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-label="Login">
                <h1 className="modal-title">🕌 লগইন করুন</h1>
                <p className="modal-subtitle">
                    {step === 'phone'
                        ? 'মসজিদ যোগ ও যাচাই করতে ফোন নম্বর দিয়ে লগইন করুন'
                        : `+88${phone} নম্বরে আসা ৬ সংখ্যার OTP দিন`}
                </p>

                {step === 'phone' ? (
                    <form onSubmit={handleSendOtp}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone-input">ফোন নম্বর</label>
                            <div className="phone-row">
                                <div className="phone-prefix">🇧🇩 +88</div>
                                <input
                                    id="phone-input"
                                    type="tel"
                                    className="form-input"
                                    placeholder="01XXXXXXXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    maxLength={11}
                                    autoComplete="tel"
                                    autoFocus
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                            id="btn-send-otp"
                        >
                            {loading ? <div className="spinner" /> : 'OTP পাঠান'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="otp-container" role="group" aria-label="OTP input">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { otpRefs.current[idx] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className="otp-input"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                    autoFocus={idx === 0}
                                    aria-label={`OTP digit ${idx + 1}`}
                                    id={`otp-${idx}`}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginBottom: 12 }}
                            disabled={loading}
                            id="btn-verify-otp"
                        >
                            {loading ? <div className="spinner" /> : 'যাচাই করুন'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: '100%' }}
                            onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                        >
                            ← ফোন নম্বর পরিবর্তন করুন
                        </button>
                    </form>
                )}

                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" ref={recaptchaRef} />
            </div>
        </div>
    );
}
