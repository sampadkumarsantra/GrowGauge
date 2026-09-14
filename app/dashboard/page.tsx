import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LedgerRow } from '@/components/ui/ledger-row';

function bandTone(band: string | null): 'indigo' | 'leaf' | 'neutral' | 'clay' {
  if (band === 'Strong') return 'leaf';
  if (band === 'Moderate') return 'indigo';
  if (band === 'Developing') return 'neutral';
  if (band === 'Early Stage') return 'clay';
  return 'neutral';
}

export const metadata = {
  title: 'My dashboard',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect('/login?callbackUrl=/dashboard');

  const submissions = await prisma.fPOSubmission.findMany({
    where: { userId: session.user.id },
    include: { scoreResult: true },
    orderBy: { updatedAt: 'desc' },
  });

  const unverified = !session.user.emailVerified;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-paper-line pb-5">
        <p className="section-kicker">My scorecards</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink mt-1">
          Dashboard
        </h1>
        <p className="text-[13px] text-ink-mute mt-0.5">
          {session.user.role === 'facilitator' ? (
            <>
              Facilitator account ·{' '}
              <Link href={`/facilitator/${session.user.id}`} className="font-semibold">
                Open your referral dashboard
              </Link>
            </>
          ) : (
            `${submissions.length} saved scorecard${submissions.length === 1 ? '' : 's'}`
          )}
        </p>
        {session.user.role === 'admin' && (
          <div className="mt-2">
            <a
              href="/api/admin/users/export"
              className="text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
            >
              Export all users (.xlsx)
            </a>
          </div>
        )}
      </header>

      {unverified && (
        <div className="mt-6 sheet-tint px-5 sm:px-6 py-4 text-[13px] text-ink-soft leading-relaxed">
          <p>
            Your email is not verified yet. Verify it to reset your password.{' '}
            <Link
              href={`/login?unverified=1&email=${encodeURIComponent(session.user.email)}`}
              className="font-semibold"
            >
              Resend the verification link
            </Link>
          </p>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="mt-8 border border-paper-line bg-white px-5 sm:px-6 py-10 text-center">
          <p className="text-[14px] text-ink-soft leading-relaxed">
            No saved scorecards yet. Complete an assessment while logged in and it will appear here
            — or <Link href="/assess" className="font-semibold">assess an FPO</Link> now.
          </p>
          <p className="mt-3 text-[12px] text-ink-mute">
            Have an older scorecard link? Open it from your saved email and choose{' '}
            <em>&ldquo;Save this scorecard to my account&rdquo;</em>.
          </p>
        </div>
      ) : (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <p className="section-kicker">Saved assessments</p>
            <span className="text-[12px] text-ink-mute">Updated newest first</span>
          </div>

          <div className="sheet px-5 sm:px-6 py-2">
            <div className="ledger">
              {submissions.map((s, idx) => (
                <Link
                  key={s.id}
                  href={`/results/${s.id}`}
                  className="no-underline block fade-in"
                  style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                >
                  <LedgerRow
                    label={s.fpoName}
                    sub={`${s.district}, ${s.state} \u00b7 ${s.registrationType}${
                      s.scoreResult ? ` \u00b7 ${s.scoreResult.band}` : ''
                    }`}
                    value={s.scoreResult ? s.scoreResult.overallScore.toFixed(1) : '\u2014'}
                    pct={s.scoreResult?.overallScore ?? 0}
                    tone={bandTone(s.scoreResult?.band ?? null)}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
