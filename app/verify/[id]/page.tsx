'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

interface VerifyData {
  fpoName: string;
  band: string;
  assessedDate: string;
}

const BAND_TEXT: Record<string, string> = {
  Strong: 'text-leaf',
  Moderate: 'text-indigo',
  Developing: 'text-ink',
  'Early Stage': 'text-clay',
};

export default function VerifyPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerifyData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState('');

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.origin + `/verify/${id}` : '';
    setVerifyUrl(url);

    (async () => {
      try {
        const res = await fetch(`/api/fpo/${id}/verify`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Verification record not found');
        }
        const json: VerifyData = await res.json();
        setData(json);
        if (url) {
          const qr = await QRCode.toDataURL(url, { width: 220, margin: 1 });
          setQrDataUrl(qr);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load verification record');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-ink-soft text-sm">
        Verifying…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-slab text-2xl font-semibold text-ink">Verification not found</h1>
        <p className="text-sm text-ink-soft leading-relaxed">{error}</p>
        <Link href="/" className="btn-link">
          Back home
        </Link>
      </div>
    );
  }

  const bandText = BAND_TEXT[data.band] ?? 'text-clay';
  const date = new Date(data.assessedDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 print:py-4">
      <div className="bg-white border border-paper-line print:border-gray-300 print:text-ink">
        <div className="px-6 sm:px-10 py-8 sm:py-10">
          {/* Certificate header — plain, no pills */}
          <div className="mb-8 border-b border-paper-line pb-6">
            <GrowGaugeMark variant="simplified" color="ink" className="w-8 mb-3" />
            <p className="section-kicker mb-2">GrowGauge · verified assessment</p>
            <h1 className="font-slab text-3xl font-semibold text-ink">Certificate of Assessment</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-8 sm:gap-10">
            <div className="flex-1 space-y-5">
              <div>
                <p className="text-[12px] text-ink-mute uppercase tracking-widest">
                  confirms that the organisation
                </p>
                <h2 className="font-slab text-3xl sm:text-4xl font-semibold text-ink mt-1 leading-tight">
                  {data.fpoName}
                </h2>
              </div>

              <div className="space-y-2.5 text-[14px] text-ink leading-relaxed">
                <p className="flex flex-col sm:flex-row sm:items-baseline gap-x-2">
                  <span className="text-ink-mute">completed a credit-readiness assessment on</span>
                  <strong className="font-semibold text-ink">{date}</strong>
                </p>
                <p className="flex flex-col sm:flex-row sm:items-baseline gap-x-2">
                  <span className="text-ink-mute">with an overall band of</span>
                  <strong className={`font-semibold ${bandText}`}>{data.band}</strong>
                </p>
              </div>

              <p className="text-[12px] leading-relaxed text-ink-mute pt-2">
                This certificate verifies only the score band and assessment date of a
                self-declared financial-health assessment. It is not an official credit rating and
                does not disclose any financial data.
              </p>
            </div>

            <div className="shrink-0">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`Verification QR for ${data.fpoName}`}
                  className="w-40 h-40 bg-white border border-paper-line p-2"
                />
              ) : (
                <div className="w-40 h-40 border border-paper-line flex items-center justify-center text-ink-mute text-xs">
                  QR unavailable
                </div>
              )}
              <p className="text-center text-[11px] text-ink-mute mt-2 print:hidden">
                Scan to verify online
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-5 border-t border-paper-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
            <p className="text-[12px] text-ink-mute break-all">
              Verify at: <span className="font-mono">{verifyUrl}</span>
            </p>
          </div>
        </div>

        <div className="border-t border-paper-line px-6 sm:px-10 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="btn-link">
            Print / Save certificate
          </button>
          <a
            href={`/api/fpo/${id}/badge`}
            download
            className="text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
          >
            Download badge SVG
          </a>
          <Link href="/" className="btn-link">
            Back home
          </Link>
        </div>
      </div>

      <p className="text-center text-[12px] text-ink-mute mt-6 print:hidden">
        Powered by GrowGauge — FPO Credit-Readiness Scorecard.
      </p>
    </div>
  );
}