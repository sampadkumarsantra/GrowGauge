import { getAuthSession } from '@/lib/auth';

export async function getSessionUser() {
  const session = await getAuthSession();
  if (!session) return null;
  return session.user;
}