import { NextResponse } from 'next/server';
import { AUTH_SECRET } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    authSecretSet: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    authSecretLength: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').length,
    authSecretDerived: AUTH_SECRET.length >= 32,
    googleConfigured,
    nextAuthUrl: process.env.NEXTAUTH_URL || process.env.AUTH_URL || null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
  });
}
