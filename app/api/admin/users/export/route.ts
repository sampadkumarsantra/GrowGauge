import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-session';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    include: {
      accounts: { select: { provider: true } },
      submissions: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Users');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Sign-up Method', key: 'signUpMethod', width: 18 },
    { header: 'Email Verified', key: 'emailVerified', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 22 },
    { header: 'Last Login', key: 'lastLoginAt', width: 22 },
    { header: 'Linked Submissions', key: 'linkedSubmissions', width: 18 },
  ];

  for (const user of users) {
    const hasPassword = Boolean(user.passwordHash);
    const hasGoogle = user.accounts.some((a) => a.provider === 'google');
    const signUpMethod = hasPassword && hasGoogle ? 'both' : hasGoogle ? 'Google' : 'password';

    sheet.addRow({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      signUpMethod,
      emailVerified: user.emailVerified ? 'yes' : 'no',
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || '',
      linkedSubmissions: user.submissions.length,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="growgauge-users.xlsx"',
    },
  });
}
