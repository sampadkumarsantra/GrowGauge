import { NextRequest, NextResponse } from 'next/server';
import { calculateScore, FPOSubmissionInput } from '@/lib/scoring';
import { validateFPOSubmission } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body: FPOSubmissionInput = await req.json();

    const validation = validateFPOSubmission(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed for simulation',
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Pure, stateless calculation - does NOT save to DB
    const scoreResult = calculateScore(body);

    return NextResponse.json({
      overallScore: scoreResult.overallScore,
      band: scoreResult.band,
      factorScores: scoreResult.factorScores,
      narrativeSummary: scoreResult.narrativeSummary,
      suggestions: scoreResult.suggestions,
      dataCompletenessFlag: scoreResult.dataCompletenessFlag,
      calculatedAt: scoreResult.calculatedAt,
      isSimulated: true,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error('Error in POST /api/score/simulate:', error);
    return NextResponse.json(
      { error: 'Internal server error during score simulation' },
      { status: 500 }
    );
  }
}
