import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Links a legacy facilitator dashboard to the logged-in account, so the same
 * FPOs are surfaced on /dashboard and the dashboard is reachable via session
 * access after the login-first gate (§1 of Login-First PRD).
 * The caller must present a valid ?token= belonging to the facilitator.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: please log in.' }, { status: 401 });
    }

    const token = req.nextUrl.searchParams.get('token');
    const facilitator = await prisma.facilitator.findUnique({ where: { id: params.id } });
    if (!facilitator) {
      return NextResponse.json({ error: 'Facilitator not found' }, { status: 404 });
    }

    if (!token || facilitator.accessToken !== token) {
      return NextResponse.json(
        { error: 'This dashboard must be linked from its private link.' },
        { status: 403 }
      );
    }

    if (facilitator.userAccountId && facilitator.userAccountId !== session.user.id) {
      return NextResponse.json(
        { error: 'This dashboard is already linked to another account.' },
        { status: 422 }
      );
    }

    await prisma.facilitator.update({
      where: { id: facilitator.id },
      data: { userAccountId: session.user.id, email: session.user.email },
    });

    if (session.user.role === 'fpo_rep') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'facilitator' },
      });
    }

    return NextResponse.json({
      message: 'Dashboard linked to your account. It now appears on your dashboard.',
      facilitatorId: facilitator.id,
    });
  } catch (error) {
    console.error('Error linking facilitator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}