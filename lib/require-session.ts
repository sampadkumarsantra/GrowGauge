import { NextResponse } from 'next/server';
import { AuthSession } from '@/lib/auth';

export type GuardResult = { user: AuthSession['user'] } | NextResponse;

export function requireUser(session: AuthSession | null): GuardResult {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: please log in.' }, { status: 401 });
  }
  return { user: session.user };
}

export function isGuardError(result: GuardResult): result is NextResponse {
  return !('user' in result);
}