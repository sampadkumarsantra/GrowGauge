import nodemailer from 'nodemailer';

type MailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function configuredTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(params: MailParams): Promise<{ delivered: boolean; reason?: string }> {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[growgauge:mail:dev] To: ${params.to}\nSubject: ${params.subject}\n\n${params.text}`);
      return { delivered: false, reason: 'dev-log' };
    }
    return { delivered: false, reason: 'smtp-unconfigured' };
  }

  try {
    const sender = process.env.SMTP_FROM ?? `GrowGauge <${process.env.SMTP_USER}>`;
    await configuredTransport().sendMail({
      from: sender,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { delivered: true };
  } catch (err) {
    console.error('[growgauge:mail] delivery failed:', err);
    return { delivered: false, reason: 'smtp-error' };
  }
}

export function getRequestIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
