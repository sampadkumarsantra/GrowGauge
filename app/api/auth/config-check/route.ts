import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  const rawSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
  const derived = rawSecret.length < 32;

  return NextResponse.json({
    authSecretSet: Boolean(rawSecret),
    authSecretLength: rawSecret.length,
    authSecretDerived: derived,
    googleConfigured,
    nextAuthUrl: process.env.NEXTAUTH_URL || process.env.AUTH_URL || null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
  });
}
