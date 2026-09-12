import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, loadAuthorizedSubmission } from '@/lib/api-helpers';
import { getChecklistItems } from '@/lib/checklist';

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

    const items = getChecklistItems(result.submission.registrationType);

    return NextResponse.json({
      fpoId: result.submission.id,
      registrationType: result.submission.registrationType,
      items,
      note: 'A typical checklist assembled by Indian public and private sector banks for FPO loan applications. Requirements vary by lender; confirm with your branch.',
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json({ error: 'Internal server error while fetching checklist' }, { status: 500 });
  }
}