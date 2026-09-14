'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Download,
  Home,
  Info,
  List,
  LogOut,
  Plus,
  Settings,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

export interface SiteNavUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: boolean;
}

const PRIMARY_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/assess', label: 'New Assessment' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

function initials(user: SiteNavUser): string {
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

function accountItems(user: SiteNavUser) {
  const items: { href: string; label: string; icon: typeof Settings }[] = [
    { href: '/settings', label: 'Profile & Settings', icon: Settings },
  ];
  if (user.role === 'facilitator') {
    items.push({ href: `/facilitator/${user.id}`, label: 'Facilitator Dashboard', icon: Users });
  }
  if (user.role === 'admin') {
    items.push({ href: '/api/admin/users/export', label: 'Excel Export', icon: Download });
  }
  items.push({ href: '/about', label: 'About', icon: Info });
  return items;
}

const desktopLink = (active: boolean) =>
  [
    'inline-flex items-center min-h-[44px] px-3 text-[14px] font-medium no-underline transition-colors',
    active
      ? 'text-ink underline decoration-indigo decoration-2 underline-offset-[7px]'
      : 'text-indigo hover:text-ink hover:underline hover:decoration-indigo/50 hover:decoration-2 hover:underline-offset-[7px]',
  ].join(' ');

const tabLabel = (active: boolean) => (active ? 'text-ink' : 'text-indigo/60');

export function SiteNav({ user }: { user: SiteNavUser | null }) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const closeAll = () => {
    setAccountOpen(false);
    setSheetOpen(false);
  };
  useEffect(() => closeAll(), [pathname]);

  const accountActive = pathname === '/settings' || pathname === '/about';

  const itemRow = (item: { href: string; label: string; icon: typeof Settings }) => {
    const Icon = item.icon;
    if (item.href.startsWith('/api/')) {
      return (
        <a key={item.href} href={item.href} className="row">
          <Icon size={16} className="shrink-0" />
          <span>{item.label}</span>
        </a>
      );
    }
    return (
      <Link key={item.href} href={item.href} className="row">
        <Icon size={16} className="shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper border-b border-paper-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          {user ? (
            <>
              {/* Mobile: just the icon mark, centred */}
              <div className="sm:hidden flex-1 flex items-center justify-center pt-0.5">
                <Link href="/dashboard" aria-label="GrowGauge dashboard" className="no-underline">
                  <GrowGaugeMark
                    variant="simplified"
                    color="full"
                    className="w-[34px]"
                    label="GrowGauge — dashboard"
                  />
                </Link>
              </div>

              {/* Desktop: wordmark + primary links + account menu */}
              <div className="hidden sm:flex flex-1 items-center justify-between gap-4">
                <Link href="/dashboard" className="no-underline hover:text-inherit" aria-label="GrowGauge — dashboard">
                  <GrowGaugeMark
                    variant="horizontal"
                    color="ink"
                    className="w-[152px]"
                    label="GrowGauge — dashboard"
                  />
                </Link>

                <nav className="flex items-center gap-1" aria-label="Primary">
                  {PRIMARY_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} className={desktopLink(pathname === l.href)}>
                      {l.label}
                    </Link>
                  ))}
                </nav>

                <div className="relative flex items-center">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    onClick={() => setAccountOpen((v) => !v)}
                    className="inline-flex items-center justify-center w-[44px] h-[44px] rounded-full bg-indigo text-paper text-[13px] font-bold tracking-wide hover:bg-indigo-soft transition-colors cursor-pointer"
                  >
                    {initials(user)}
                  </button>

                  {accountOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-paper-line shadow-md py-2"
                      >
                        {accountItems(user).map(itemRow)}
                        <div className="h-px bg-paper-line my-1" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="row w-full !text-ink"
                        >
                          <LogOut size={16} className="shrink-0" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Logged out */}
              <div className="flex-1 flex items-center justify-between">
                <Link href="/login" className="no-underline hover:text-inherit" aria-label="GrowGauge">
                  <GrowGaugeMark
                    variant="horizontal"
                    color="ink"
                    className="hidden sm:inline-block w-[152px]"
                    label="GrowGauge"
                  />
                </Link>
                <div className="sm:hidden flex-1 flex justify-center">
                  <Link href="/login" aria-label="GrowGauge" className="no-underline">
                    <GrowGaugeMark
                      variant="simplified"
                      color="full"
                      className="w-[34px]"
                      label="GrowGauge"
                    />
                  </Link>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center min-h-[44px] px-3 text-[13px] font-semibold text-paper bg-indigo no-underline hover:bg-indigo-soft transition-colors"
                >
                  Log in
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile: bottom tab bar */}
      {user && (
        <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-paper border-t border-paper-line pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4 h-14">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center gap-0.5 no-underline ${tabLabel(pathname === '/dashboard')}`}
            >
              <Home size={20} />
              <span className="text-[10px] font-semibold leading-none">Dashboard</span>
            </Link>

            <div className="relative flex items-start justify-center">
              <Link
                href="/assess"
                aria-label="New Assessment"
                className="absolute -top-4 flex items-center justify-center w-11 h-11 rounded-full bg-turmeric text-paper shadow-md hover:bg-turmeric-deep transition-colors no-underline"
              >
                <Plus size={22} />
              </Link>
              <span className={`mt-6 text-[10px] font-semibold ${tabLabel(pathname === '/assess')}`}>
                New
              </span>
            </div>

            <Link
              href="/leaderboard"
              className={`flex flex-col items-center justify-center gap-0.5 no-underline ${tabLabel(pathname === '/leaderboard')}`}
            >
              <List size={20} />
              <span className="text-[10px] font-semibold leading-none">Leaderboard</span>
            </Link>

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer ${tabLabel(accountActive)}`}
            >
              <UserIcon size={20} />
              <span className="text-[10px] font-semibold leading-none">Account</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile: account bottom sheet */}
      {user && sheetOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSheetOpen(false)} />
          <div
            role="menu"
            className="fixed bottom-0 inset-x-0 z-50 bg-paper border-t border-paper-line rounded-t-lg px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:hidden"
          >
            <div className="mx-auto w-10 h-1 rounded bg-paper-line mb-2" />
            {accountItems(user).map(itemRow)}
            <div className="h-px bg-paper-line my-1" />
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="row w-full !text-ink"
            >
              <LogOut size={16} className="shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}