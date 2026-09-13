import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: please log in.' }, { status: 401 });
    }
    const user = session.user;

    const submissions = await prisma.fPOSubmission.findMany({
      where: { userId: user.id },
      include: {
        scoreResult: true,
        roadmapItems: { select: { completed: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const ledger = submissions.map((s) => ({
      id: s.id,
      fpoName: s.fpoName,
      district: s.district,
      state: s.state,
      registrationType: s.registrationType,
      updatedAt: s.updatedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      overallScore: s.scoreResult?.overallScore ?? null,
      band: s.scoreResult?.band ?? null,
      cycle: s.fpoGroupId,
      roadmapCompleted: s.roadmapItems.filter((r) => r.completed).length,
      roadmapTotal: s.roadmapItems.length,
    }));

    return NextResponse.json({ submissions: ledger });
  } catch (error) {
    console.error('Error listing user submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}