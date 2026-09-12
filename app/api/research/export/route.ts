import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  aggregateRowsToCsv,
  buildAggregateRows,
  MIN_SUBMISSIONS_PER_DISTRICT,
  MIN_SUBMISSIONS_PER_CELL,
} from '@/lib/research-export';

export const dynamic = 'force-dynamic';

/**
 * Public aggregate dataset for researchers.
 *
 * Returns only disclosure-controlled aggregates. No individual submission or
 * field that could re-identify an FPO is ever emitted.
 *
 * GET /api/research/export?format=csv|json
 */
export async function GET(req: NextRequest) {
  try {
    const formatParam = (req.nextUrl.searchParams.get('format') ?? 'json').toLowerCase();
    const isCsv = formatParam === 'csv';

    const submissions = await prisma.fPOSubmission.findMany({
      where: { scoreResult: { isNot: null } },
      include: { scoreResult: true },
    });

    const totalScoredSubmissions = submissions.length;
    const rows = buildAggregateRows(submissions);
    const bandCounts = new Map<string, number>();
    for (const row of rows) {
      bandCounts.set(row.band, (bandCounts.get(row.band) ?? 0) + row.submissionCount);
    }

    if (isCsv) {
      const csv = aggregateRowsToCsv(rows);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="growgauge-aggregate-data.csv"',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        submissionCount: totalScoredSubmissions,
        minSubmissionsRequired: {
          perDistrict: MIN_SUBMISSIONS_PER_DISTRICT,
          perCell: MIN_SUBMISSIONS_PER_CELL,
        },
        note:
          'Only disclosure-controlled aggregates are shown. Districts with fewer than ' +
          MIN_SUBMISSIONS_PER_DISTRICT +
          ' scored submissions, and individual (registrationType × band) cells with fewer than ' +
          MIN_SUBMISSIONS_PER_CELL +
          ' submissions, are suppressed.',
        bandDistribution: Object.fromEntries(bandCounts),
        rows,
      },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
    );
  } catch (error) {
    console.error('Error generating researcher export:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating researcher export' },
      { status: 500 }
    );
  }
}