import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';

export const metadata = {
  title: 'Profile & Settings',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getAuthSession();
  if (!session) redirect('/login?callbackUrl=/settings');

  const { user } = session;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-paper-line pb-5">
        <p className="section-kicker">Account</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink mt-1">
          Profile &amp; Settings
        </h1>
      </header>

      <section className="mt-6 sheet px-5 sm:px-6 py-5 space-y-3">
        <div className="flex justify-between gap-4 py-1 text-[13px]">
          <span className="text-ink-mute">Name</span>
          <span className="text-ink font-medium">{user.name || '\u2014'}</span>
        </div>
        <div className="flex justify-between gap-4 py-1 text-[13px]">
          <span className="text-ink-mute">Email</span>
          <span className="text-ink font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between gap-4 py-1 text-[13px]">
          <span className="text-ink-mute">Role</span>
          <span className="text-ink font-medium capitalize">
            {user.role === 'fpo_rep' ? 'FPO representative' : user.role}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-1 text-[13px]">
          <span className="text-ink-mute">Email verified</span>
          <span className={user.emailVerified ? 'text-leaf font-medium' : 'text-clay font-medium'}>
            {user.emailVerified ? 'Yes' : 'No'}
          </span>
        </div>
      </section>

      {!user.emailVerified && (
        <div className="mt-4 sheet-tint px-5 py-4 text-[13px] text-ink-soft leading-relaxed">
          <p>
            Verify your email to use every feature of your account.{' '}
            <Link
              href={`/login?unverified=1&email=${encodeURIComponent(user.email)}`}
              className="font-semibold"
            >
              Resend the verification link
            </Link>
          </p>
        </div>
      )}

      <section className="mt-6">
        <Link href="/about" className="btn btn-quiet w-full sm:w-auto">
          How the scoring works
        </Link>
      </section>
    </div>
  );
}