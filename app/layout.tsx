import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

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
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'GrowGauge — FPO Credit-Readiness Scorecard',
    description:
      'A free, open-methodology credit-readiness diagnostic for Indian Farmer Producer Organizations.',
    type: 'website',
    images: [{ url: '/opengraph.png', width: 1200, height: 630 }],
  },
};

const NAV_LINKS = [
  { href: '/assess', label: 'Assess' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/facilitator', label: 'Facilitators' },
  { href: '/about', label: 'Methodology' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <header className="sticky top-0 z-40 bg-indigo border-b border-black/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center no-underline hover:text-inherit">
              <GrowGaugeMark
                variant="horizontal"
                color="paper"
                className="w-[152px]"
                label="GrowGauge — home"
              />
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="hidden sm:inline-flex px-3 py-1.5 text-[13px] font-medium text-paper/75 no-underline hover:text-paper hover:underline hover:decoration-paper/60 hover:decoration-2 hover:underline-offset-4"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/assess"
                className="inline-flex items-center px-3.5 py-1.5 text-[13px] font-semibold text-paper border border-paper/40 rounded-[2px] no-underline hover:bg-paper/10 hover:text-paper"
              >
                Start assessment
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-indigo border-t border-black/20 mt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-3">
              <GrowGaugeMark
                variant="horizontal"
                color="paper"
                className="w-[136px]"
                label="GrowGauge"
              />
              <p className="text-[13px] leading-relaxed text-paper/65 max-w-xs">
                An open-methodology credit-readiness diagnostic for Indian Farmer Producer
                Organisations, built on citable economic models — HHI, CV, Operating Ratio.
              </p>
            </div>

            <div>
              <h4 className="section-kicker text-paper/60 mb-3">Platform</h4>
              <ul className="space-y-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/assess', label: 'Assess an FPO' },
                  { href: '/leaderboard', label: 'District leaderboard' },
                  { href: '/research', label: 'Researcher dataset' },
                  { href: '/facilitator', label: 'Facilitator dashboard' },
                  { href: '/about', label: 'Scoring methodology' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-paper/70 no-underline hover:text-paper hover:underline hover:decoration-paper/60 hover:underline-offset-4"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="section-kicker text-paper/60 mb-3">Research</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/research"
                    className="text-[13px] text-paper/70 no-underline hover:text-paper hover:underline hover:decoration-paper/60 hover:underline-offset-4"
                  >
                    Open aggregate dataset
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-[13px] text-paper/70 no-underline hover:text-paper hover:underline hover:decoration-paper/60 hover:underline-offset-4"
                  >
                    Scoring methodology
                  </Link>
                </li>
              </ul>
              <p className="text-[13px] leading-relaxed text-paper/65 mt-3">
                Scoring weights and quantitative models were formulated in research collaboration
                with agricultural economists at{' '}
                <span className="text-paper/90 font-semibold">ICAR-IARI Jharkhand</span>.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 pt-8 border-t border-paper/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-paper/50">
            <p>© {new Date().getFullYear()} GrowGauge. Open methodology for farmer institutionalisation.</p>
            <p>This is a self-assessment tool, not an official credit rating.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}