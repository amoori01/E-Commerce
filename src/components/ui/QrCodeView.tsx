'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeView({ value, size = 160, className = '' }: QrCodeViewProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    let isMounted = true;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0B0B0C',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white rounded-xl flex items-center justify-center p-2 border border-slate-200 animate-pulse ${className}`}
      >
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`bg-white p-2 rounded-xl shadow-md border border-slate-200 inline-block shrink-0 ${className}`}>
      <img
        src={dataUrl}
        alt={`QR Code for ${value}`}
        width={size}
        height={size}
        className="block rounded-lg"
      />
    </div>
  );
}
