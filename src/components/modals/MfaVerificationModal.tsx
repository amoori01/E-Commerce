'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, X, KeyRound, CheckCircle2 } from 'lucide-react';

interface MfaVerificationModalProps {
  isOpen: boolean;
  userEmail?: string;
  userPhone?: string;
  actionTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MfaVerificationModal({
  isOpen,
  userEmail,
  userPhone,
  actionTitle,
  onSuccess,
  onCancel,
}: MfaVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    setIsRequesting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_otp',
          email: userEmail,
          phone: userPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch OTP');
      setStatusMessage(data.message);
      if (data.simulatedCodeForTesting) {
        setSimulatedCode(data.simulatedCodeForTesting);
        setOtp(data.simulatedCodeForTesting); // prefill for streamlined testing
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error requesting code');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          email: userEmail,
          phone: userPhone,
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Verification failed');
      }
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-300 shadow-modal rounded-sm overflow-hidden text-slate-800 text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 bg-amg-navy text-white flex items-center justify-between border-b border-amg-navy-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold tracking-tight text-xs uppercase">
              MFA Security Challenge (OWASP ASVS v4.0)
            </h3>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Authorization Target
            </span>
            <div className="font-bold text-slate-900 text-sm">{actionTitle}</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Administrative policy enforcement requires one-time cryptographic authorization via registered credentials ({userPhone || userEmail || 'corporate identity'}).
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-sm font-medium flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm font-medium flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {simulatedCode && (
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-sm font-mono text-[11px] flex justify-between items-center">
              <span>Security Token Generated:</span>
              <span className="font-bold tracking-widest text-amg-navy">{simulatedCode}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase text-slate-600">
                  Enter 6-Digit OTP Security Code
                </label>
                {!simulatedCode && (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isRequesting}
                    className="text-[10px] text-amg-navy font-bold hover:underline"
                  >
                    {isRequesting ? 'Sending...' : 'Request Code'}
                  </button>
                )}
              </div>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border border-slate-300 p-2 text-center text-lg font-mono font-bold tracking-widest rounded-sm focus:border-amg-navy outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-1/3 py-2 border border-slate-300 bg-white font-bold text-slate-700 rounded-sm hover:bg-slate-50"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={isVerifying || otp.length < 6}
                className="w-2/3 py-2 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold rounded-sm transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Authorize Action'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
