import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import { SiteNav } from '@/components/ui/site-nav';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://growgauge.in'),
  title: {
    default: 'GrowGauge — FPO Credit-Readiness Scorecard',
    template: '%s — GrowGauge',
  },
  description:
    'A free, open-methodology credit-readiness diagnostic for Indian Farmer Producer Organizations. Objective 0–100 score, what-if simulator, and a bank-ready report.',
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/growgauge-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    siteName: 'GrowGauge',
    title: 'GrowGauge — FPO Credit-Readiness Scorecard',
    description:
      'A free, open-methodology credit-readiness diagnostic for Indian Farmer Producer Organizations.',
    type: 'website',
    images: [{ url: '/opengraph.png', width: 1200, height: 630, alt: 'GrowGauge credit-readiness scorecard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrowGauge — FPO Credit-Readiness Scorecard',
    description:
      'A free, open-methodology credit-readiness diagnostic for Indian Farmer Producer Organizations.',
    images: ['/opengraph.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#2f3e5c',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  const user = session?.user ?? null;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Zilla+Slab:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <SiteNav user={user} />

        <main className="flex-1 pb-16 sm:pb-0">{children}</main>

        <footer className="bg-indigo border-t border-black/20 mt-20 pb-20 sm:pb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-paper/60">
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium text-paper/75">
              {[
                { href: '/about', label: 'About' },
                { href: '/research', label: 'Research' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="no-underline hover:text-paper hover:underline hover:underline-offset-4"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <p>
              Methodology developed by{' '}
              <span className="text-paper/85 font-semibold">GrowGauge, ICAR-IARI Jharkhand</span>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}