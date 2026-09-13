export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://growgauge.in').replace(/\/$/, '');
}

function brandHtml(body: string): string {
  return `
    <div style="font-family:'Public Sans',Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e2a1f">
      <p style="font-size:13px;color:#565f58">GrowGauge — FPO credit-readiness scorecard</p>
      ${body}
      <p style="font-size:11px;color:#747d74;margin-top:32px;line-height:1.5">
        If you did not request this, you can safely ignore this email.<br/>
        GrowGauge · Open methodology for farmer institutionalisation
      </p>
    </div>`;
}

export function verificationEmail(to: string, token: string): { subject: string; text: string; html: string } {
  const link = `${appBaseUrl()}/verify-email/${token}`;
  const subject = 'Verify your email — GrowGauge';
  const text = `Verify your email to save assessments to your account permanently and to claim existing scorecards.\n\n${link}`;
  const html = brandHtml(`
    <h1 style="font-size:20px">Verify your email</h1>
    <p style="font-size:14px;line-height:1.6">
      Confirm this email to save assessments to your account permanently and to claim
      scorecards you created before logging in existed.
    </p>
    <p><a href="${link}" style="font-size:14px;font-weight:600;color:#2f3e5c">Verify my email →</a></p>
    <p style="font-size:12px;color:#747d74">Or paste this link into your browser:<br/>${link}</p>
  `);
  return { subject, text, html };
}

export function resetPasswordEmail(to: string, token: string): { subject: string; text: string; html: string } {
  const link = `${appBaseUrl()}/reset-password/${token}`;
  const subject = 'Reset your password — GrowGauge';
  const text = `We received a password reset request for your GrowGauge account.\n\n${link}\n\nThis link expires in 1 hour.`;
  const html = brandHtml(`
    <h1 style="font-size:20px">Reset your password</h1>
    <p style="font-size:14px;line-height:1.6">
      We received a request to reset the password on your GrowGauge account.
      This link expires in 1 hour.
    </p>
    <p><a href="${link}" style="font-size:14px;font-weight:600;color:#2f3e5c">Reset my password →</a></p>
    <p style="font-size:12px;color:#747d74">If you did not request a reset, ignore this email — your password will not change.</p>
  `);
  return { subject, text, html };
}