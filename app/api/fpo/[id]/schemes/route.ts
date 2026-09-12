import { NextRequest, NextResponse } from 'next/server';
import { factorScoresFromResult, getAccessToken, loadAuthorizedSubmission } from '@/lib/api-helpers';
import { matchSchemes } from '@/lib/schemes';

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
      return NextResponse.json({ error: 'Score result not found for this submission' }, { status: 404 });
    }

    const factorScores = factorScoresFromResult(scoreResult);
    const matched = matchSchemes(factorScores, submission.registrationType);

    return NextResponse.json({
      fpoId: submission.id,
      factorScores,
      schemes: matched,
    });
  } catch (error) {
    console.error('Error matching schemes:', error);
    return NextResponse.json({ error: 'Internal server error while matching schemes' }, { status: 500 });
  }
}