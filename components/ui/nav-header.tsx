'use client';

import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

const NAV_LINKS = [
  { href: '/assess', label: 'Assess', desktop: true },
  { href: '/leaderboard', label: 'Leaderboard', desktop: true },
  { href: '/facilitator', label: 'Facilitators', desktop: true },
  { href: '/about', label: 'Methodology', desktop: true },
];

const linkClass =
  'px-3 py-1.5 text-[13px] font-medium text-paper/75 no-underline hover:text-paper hover:underline hover:decoration-paper/60 hover:decoration-2 hover:underline-offset-4';

export function NavHeader({ authed }: { authed: boolean }) {
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {NAV_LINKS.map(({ href, label, desktop }) => (
        <Link
          key={href}
          href={href}
          className={`${desktop ? 'hidden sm:inline-flex' : 'inline-flex'} ${linkClass}`}
        >
          {label}
        </Link>
      ))}

      {authed ? (
        <>
          <Link href="/dashboard" className="inline-flex items-center px-3 py-1.5 text-[13px] font-semibold text-paper no-underline hover:text-paper/80">
            My dashboard
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-paper/75 no-underline hover:text-paper hover:underline hover:underline-offset-4 cursor-pointer"
          >
            Log out
          </button>
        </>
      ) : (
        <Link href="/login" className="inline-flex items-center px-3 py-1.5 text-[13px] font-semibold text-paper no-underline hover:text-paper/80">
          Log in
        </Link>
      )}

      <Link
        href="/assess"
        className="inline-flex items-center px-3.5 py-1.5 text-[13px] font-semibold text-paper border border-paper/40 rounded-[2px] no-underline hover:bg-paper/10 hover:text-paper"
      >
        Start assessment
      </Link>
    </nav>
  );
}