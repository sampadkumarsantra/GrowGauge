import { NextResponse } from 'next/server';
import { getAuthSession, AuthSession } from '@/lib/auth';

export async function requireSession(): Promise<
  { session: AuthSession; error?: never } | { session?: never; error: NextResponse }
> {
  const session = await getAuthSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: please log in.' },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export async function requireAdmin(): Promise<
  { session: AuthSession; error?: never } | { session?: never; error: NextResponse }
> {
  const result = await requireSession();
  if (result.error) return result;
  if (result.session.user.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: admin access required.' },
        { status: 403 }
      ),
    };
  }
  return result;
}
