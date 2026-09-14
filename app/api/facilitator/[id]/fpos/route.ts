import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/require-session';

interface RouteContext {
  params: { id: string };
}

/**
 * Returns all FPOs referred through this facilitator, with their scores.
 * Authorizes via the logged-in session: only the facilitator whose account
 * id matches :id can view this dashboard.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { session } = auth;
    if (session.user.role !== 'facilitator' || session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden: this dashboard belongs to another account' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Facilitator not found' }, { status: 404 });
    }

    const submissions = await prisma.fPOSubmission.findMany({
      where: { facilitatorId: id },
      include: { scoreResult: true },
      orderBy: { createdAt: 'desc' },
    });

    const fpos = submissions.map((sub) => ({
      id: sub.id,
      fpoName: sub.fpoName,
      state: sub.state,
      district: sub.district,
      createdAt: sub.createdAt.toISOString(),
      overallScore: sub.scoreResult?.overallScore ?? null,
      band: sub.scoreResult?.band ?? null,
    }));

    const assessedCount = fpos.filter((f) => f.band !== null).length;

    return NextResponse.json({
      facilitatorId: user.id,
      name: user.name || user.email,
      totalFpos: fpos.length,
      assessedCount,
      fpos,
    });
  } catch (error) {
    console.error('Error listing facilitator FPOs:', error);
    return NextResponse.json({ error: 'Internal server error while listing FPOs' }, { status: 500 });
  }
}