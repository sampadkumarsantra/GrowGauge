import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getAuthSession();
  redirect(session ? '/dashboard' : '/login');
}