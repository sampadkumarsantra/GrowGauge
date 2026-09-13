import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
  const nextauthUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || '';
  const databaseUrl = process.env.DATABASE_URL || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const checks = {
    authSecretSet: authSecret.length >= 32,
    authSecretLength: authSecret.length,
    nextauthUrlSet: Boolean(nextauthUrl),
    nextauthUrl: nextauthUrl,
    databaseUrlSet: Boolean(databaseUrl),
    databaseUrlHasPostgres: databaseUrl.startsWith('postgres'),
    appUrl: appUrl,
  };

  console.log('[auth/config-check]', JSON.stringify(checks));

  return NextResponse.json(
    { ok: checks.authSecretSet && checks.nextauthUrlSet && checks.databaseUrlSet, checks },
    { status: 200 }
  );
}