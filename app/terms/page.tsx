export const metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-paper-line pb-5">
        <p className="section-kicker">Legal</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink mt-1">
          Terms of Service
        </h1>
      </header>

      <div className="mt-6 space-y-5 text-[14px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">The service</h2>
          <p>
            GrowGauge provides a free, self-serve credit-readiness diagnostic for Indian Farmer
            Producer Organisations. Scores are produced by an open, published methodology and are
            intended for guidance only.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">Not financial advice</h2>
          <p>
            A GrowGauge score is a self-assessment indicator, not a credit rating, funding guarantee,
            or financial advice. Lending decisions remain entirely with banks and financial
            institutions.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">Your data</h2>
          <p>
            You are responsible for the accuracy of the data you enter. See our{' '}
            <a href="/privacy" className="font-semibold">
              Privacy Policy
            </a>{' '}
            for how we handle it. You may request deletion of your account and data at any time.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">Acceptable use</h2>
          <p>
            Do not misuse the service, attempt to access another user&rsquo;s data, submit false
            institutional data, or use the tools to generate misleading finance documents. We may
            terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="font-slab text-lg font-semibold text-ink mb-1">Contact</h2>
          <p>
            Questions about these terms? Email{' '}
            <a href="mailto:privacy@growgauge.in" className="font-semibold">
              privacy@growgauge.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}