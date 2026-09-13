import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { ScorecardPdfDocument } from '@/components/report/ScorecardPdfDocument';
import { getChecklistItems } from '@/lib/checklist';
import { getAuthSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = req.nextUrl.searchParams.get('token');

    const submission = await prisma.fPOSubmission.findUnique({
      where: { id },
      include: { scoreResult: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'FPO submission not found' }, { status: 404 });
    }

    const session = await getAuthSession();
    const isOwner = Boolean(session?.user && submission.userId === session.user.id);
    const tokenValid = Boolean(token && submission.accessToken === token);

    if (!isOwner && !tokenValid) {
      return NextResponse.json(
        { error: 'Unauthorized: accessToken is required as query parameter (?token=...)' },
        { status: token ? 403 : 401 }
      );
    }

    if (!submission.scoreResult) {
      return NextResponse.json({ error: 'Score result not found for this submission' }, { status: 404 });
    }

    let parsedSuggestions: string[] = [];
    try {
      parsedSuggestions = JSON.parse(submission.scoreResult.suggestions);
    } catch {
      parsedSuggestions = [];
    }

    const pdfData = {
      submission: {
        fpoName: submission.fpoName,
        state: submission.state,
        district: submission.district,
        registrationType: submission.registrationType,
        activeMembers: submission.activeMembers,
        revenueYear1: submission.revenueYear1,
        activeBuyersCount: submission.activeBuyersCount,
        contractSalesPct: submission.contractSalesPct,
      },
      scoreResult: {
        overallScore: submission.scoreResult.overallScore,
        band: submission.scoreResult.band,
        factorScores: {
          membership: submission.scoreResult.membershipScore,
          revenueStability: submission.scoreResult.revenueStabilityScore,
          costEfficiency: submission.scoreResult.costEfficiencyScore,
          diversification: submission.scoreResult.diversificationScore,
          marketLinkage: submission.scoreResult.marketLinkageScore,
          governance: submission.scoreResult.governanceScore,
        },
        narrativeSummary: submission.scoreResult.narrativeSummary,
        suggestions: parsedSuggestions,
        dataCompletenessFlag: submission.scoreResult.dataCompletenessFlag,
        calculatedAt: submission.scoreResult.calculatedAt.toISOString(),
      },
      checklist: getChecklistItems(submission.registrationType),
    };

    // Render PDF Document to Buffer
    const brandIconPng = readFileSync(join(process.cwd(), 'public', 'growgauge-ink.png'));
    const pdfBuffer = await renderToBuffer(
      React.createElement(
        ScorecardPdfDocument,
        {
          ...pdfData,
          brandIcon: `data:image/png;base64,${brandIconPng.toString('base64')}`,
        } as React.ComponentProps<typeof ScorecardPdfDocument> & DocumentProps
      ) as React.ReactElement<DocumentProps>
    );

    const safeFpoName = submission.fpoName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `FPO_Scorecard_${safeFpoName}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Failed to generate PDF report' }, { status: 500 });
  }
}
