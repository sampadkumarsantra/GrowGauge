import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MIN_SUBMISSIONS_PER_DISTRICT = 3;

function quartile(sorted: number[], q: number): number {
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function filterOutliers(scores: number[]): Set<number> {
  const sorted = [...scores].sort((a, b) => a - b);
  if (sorted.length < 4) return new Set<number>();
  const q1 = quartile(sorted, 0.25);
  const q3 = quartile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return new Set(sorted.filter((s) => s < lower || s > upper));
}

/**
 * Opted-in submissions ranked by score within a district.
 * Visibility is gated: the leaderboard only appears once a district has a
 * minimum number of opted-in submissions, and a basic IQR outlier check keeps
 * extreme/fabricated scores from distorting the ranking.
 */
export async function GET(req: NextRequest) {
  try {
    const district = req.nextUrl.searchParams.get('district')?.trim();
    const state = req.nextUrl.searchParams.get('state')?.trim() ?? null;

    if (!district) {
      return NextResponse.json(
        { error: 'A district query parameter is required (e.g. ?district=Ranchi)' },
        { status: 400 }
      );
    }

    const where = { district, optedIntoLeaderboard: true, scoreResult: { isNot: null } };
    const all = await prisma.fPOSubmission.findMany({
      where: { ...where, ...(state ? { state } : {}) },
      include: { scoreResult: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalInDistrict = await prisma.fPOSubmission.count({
      where: { district },
    });

    const available = all.length >= MIN_SUBMISSIONS_PER_DISTRICT && totalInDistrict >= 5;

    let entries: { fpoName: string; band: string; score: number }[] = [];
    if (available) {
      const outlierScores = filterOutliers(all.map((s) => s.scoreResult!.overallScore));
      const ranked = all
        .filter((s) => !outlierScores.has(s.scoreResult!.overallScore))
        .sort((a, b) => b.scoreResult!.overallScore - a.scoreResult!.overallScore);

      entries = ranked.map((s) => ({
        fpoName: s.fpoName,
        band: s.scoreResult!.band,
        score: s.scoreResult!.overallScore,
      }));
    }

    return NextResponse.json({
      district,
      state: state ?? null,
      optedInCount: all.length,
      totalInDistrict,
      minSubmissionsRequired: MIN_SUBMISSIONS_PER_DISTRICT,
      available,
      entryCount: entries.length,
      entries,
      message: available
        ? null
        : 'This district has not yet reached enough opted-in assessments to publish a fair leaderboard. Encourage more FPOs to complete the scorecard.',
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error while fetching leaderboard' }, { status: 500 });
  }
}