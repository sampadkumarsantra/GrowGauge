import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderBadgeSvg } from '@/lib/badge';
import { ScoreBand } from '@/lib/scoring';

interface RouteContext {
  params: { id: string };
}

/**
 * Public, no-token shareable badge. Contains band + date + name only —
 * the same data-minimization contract as GET /api/fpo/:id/verify.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const submission = await prisma.fPOSubmission.findUnique({
      where: { id },
      include: { scoreResult: true },
    });

    if (!submission || !submission.scoreResult) {
      return NextResponse.json({ error: 'Badge record not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify/${id}`;

    const svg = renderBadgeSvg({
      fpoName: submission.fpoName,
      band: submission.scoreResult.band as ScoreBand,
      assessedDate: submission.scoreResult.calculatedAt.toISOString(),
      verifyUrl,
    });

    const safeFpoName = submission.fpoName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `inline; filename="FPO_Badge_${safeFpoName}.svg"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating badge:', error);
    return NextResponse.json({ error: 'Failed to generate badge' }, { status: 500 });
  }
}