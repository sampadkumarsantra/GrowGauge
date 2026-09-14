import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/require-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { session } = auth;
    const existing = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'facilitator' },
    });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name || user.email,
        message:
          'Facilitator dashboard created. Share your invite link with the FPOs you support.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error enabling facilitator dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating facilitator dashboard' },
      { status: 500 }
    );
  }
}