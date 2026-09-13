import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: please log in.' }, { status: 401 });
    }
    const user = session.user;

    const facilitator = await prisma.facilitator.findUnique({
      where: { userAccountId: user.id },
    });

    if (!facilitator) {
      return NextResponse.json({ facilitator: null, role: user.role });
    }

    const submissions = await prisma.fPOSubmission.findMany({
      where: { facilitatorId: facilitator.id },
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

    return NextResponse.json({
      facilitatorId: facilitator.id,
      name: facilitator.name,
      organization: facilitator.organization,
      totalFpos: fpos.length,
      assessedCount: fpos.filter((f) => f.band !== null).length,
      fpos,
    });
  } catch (error) {
    console.error('Error loading facilitator dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}