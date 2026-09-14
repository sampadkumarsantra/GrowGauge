import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LedgerRow } from '@/components/ui/ledger-row';
import { ScoreTarget } from '@/components/ui/score-target';

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

  const latest = submissions.find((s) => s.scoreResult) ?? null;
  const latestScore = latest?.scoreResult?.overallScore ?? null;
  const gapToEligible = latestScore == null ? null : 60 - latestScore;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-paper-line pb-5">
        <p className="section-kicker">My dashboard</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink mt-1">
          Credit-readiness target board
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
        <div className="mt-8 border border-paper-line bg-white px-5 sm:px-6 py-12 text-center">
          <p className="section-kicker">Goal</p>
          <h2 className="mt-2 font-slab text-2xl font-semibold tracking-tight text-ink">
            Get your FPO credit-eligible
          </h2>
          <div className="max-w-md mx-auto mt-5 text-left">
            <ScoreTarget score={null} />
            <p className="mt-3 text-[12px] text-ink-mute text-center">
              Score <span className="font-semibold text-indigo">60+</span> for
              credit eligibility ·{' '}
              <span className="font-semibold text-leaf">80+</span> for bank-ready
            </p>
          </div>
          <p className="mx-auto max-w-md mt-4 text-[14px] text-ink-soft leading-relaxed">
            Complete your first assessment and we&rsquo;ll show you where your FPO
            stands against that target.
          </p>
          <Link href="/assess" className="btn btn-primary mt-5 inline-flex">
            New Assessment
          </Link>
        </div>
      ) : (
        <section className="mt-8">
          <div className="sheet px-5 sm:px-6 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <p className="section-kicker">Latest score vs target</p>
              {latest && (
                <span className="text-[12px] text-ink-mute">
                  {latest.fpoName} · {latest.district}, {latest.state}
                </span>
              )}
            </div>

            {latestScore != null ? (
              <div className="max-w-md">
                <ScoreTarget score={latestScore} />
                <p className="mt-3 text-[13px] text-ink-soft leading-relaxed">
                  {gapToEligible != null && gapToEligible > 0 ? (
                    <>
                      Your latest score is <span className="font-semibold text-ink">{latestScore.toFixed(1)}</span> —{' '}
                      <span className="font-semibold text-clay">{gapToEligible.toFixed(1)}</span> point
                      {gapToEligible < 1.9 && gapToEligible > 1.1 ? 's' : ''} below the{' '}
                      <span className="font-semibold text-indigo">60-point credit-eligibility target</span>.
                    </>
                  ) : gapToEligible != null && gapToEligible <= 0 ? (
                    <>
                      Your latest score is <span className="font-semibold text-ink">{latestScore.toFixed(1)}</span> — you&rsquo;re
                      {latestScore >= 80 ? (
                        <> <span className="font-semibold text-leaf">bank-ready</span> for lending partners.</>
                      ) : (
                        <> past the <span className="font-semibold text-indigo">credit-eligibility target</span>.</>
                      )}
                    </>
                  ) : null}
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-soft">
                Complete an assessment to see where your FPO stands against the{' '}
                <span className="font-semibold text-indigo">60-point</span> target.
              </p>
            )}

            {latest && (
              <div className="mt-4">
                <Link href={`/results/${latest.id}`} className="btn btn-quiet">
                  Open latest scorecard
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-4 mt-8 mb-3">
            <p className="section-kicker">Saved scorecards</p>
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