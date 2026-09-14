export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-paper-line pb-5">
        <p className="section-kicker">Legal</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink mt-1">
          Privacy Policy
        </h1>
      </header>

      <div className="mt-6 space-y-5 text-[14px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">What we collect</h2>
          <p>
            When you create an account we collect your email address and the name you choose. If you
            sign in with Google, we collect your name and profile photo from that account. When you
            complete an assessment, the FPO data you enter (financials, membership, governance) is
            stored on your account.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">Why we collect it</h2>
          <p>
            We collect this data to provide the credit-readiness scoring tool, let you save and
            revisit your assessment history, and — only if you explicitly opt in — publish an
            anonymised aggregate on the district leaderboard.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">We never sell your data</h2>
          <p>
            Your personal data and assessment responses are never sold or shared with third parties
            for marketing. Aggregates used for research are anonymised and cannot be traced back to
            an individual.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">Data deletion</h2>
          <p>
            You can request deletion of your account and all associated data at any time by emailing{' '}
            <a href="mailto:privacy@growgauge.in" className="font-semibold">
              privacy@growgauge.in
            </a>
            . We process deletion requests within 30 days.
          </p>
        </section>
      </div>
    </div>
  );
}