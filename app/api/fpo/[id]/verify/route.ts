import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { id: string };
}

/**
 * Public, no-token verification endpoint. By design returns ONLY
 * fpoName, band and assessment date — never raw financials.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const submission = await prisma.fPOSubmission.findUnique({
      where: { id },
      include: { scoreResult: true },
    });

    if (!submission || !submission.scoreResult) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }

    return NextResponse.json({
      fpoName: submission.fpoName,
      band: submission.scoreResult.band,
      assessedDate: submission.scoreResult.calculatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in verify endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}