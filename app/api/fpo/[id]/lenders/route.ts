import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, loadAuthorizedSubmission } from '@/lib/api-helpers';
import { matchLenders } from '@/lib/lenders';
import { ScoreBand } from '@/lib/scoring';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);
    const result = await loadAuthorizedSubmission(id, token);

    if (result.status !== null) {
      return NextResponse.json(result.body, { status: result.status });
    }

    const { submission, submission: { scoreResult } } = result;
    if (!scoreResult) {
      return NextResponse.json(
        { error: 'Score result not found for this submission' },
        { status: 404 }
      );
    }

    const lenders = matchLenders(scoreResult.band as ScoreBand, {
      registrationType: submission.registrationType,
      activeMembers: submission.activeMembers,
    });

    return NextResponse.json({
      fpoId: submission.id,
      band: scoreResult.band,
      lenders,
    });
  } catch (error) {
    console.error('Error matching lenders:', error);
    return NextResponse.json(
      { error: 'Internal server error while matching lenders' },
      { status: 500 }
    );
  }
}