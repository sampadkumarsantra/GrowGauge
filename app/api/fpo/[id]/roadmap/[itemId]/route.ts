import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken, loadAuthorizedSubmission } from '@/lib/api-helpers';

interface RouteContext {
  params: { id: string; itemId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, itemId } = params;
    const token = getAccessToken(req);
    const result = await loadAuthorizedSubmission(id, token);

    if (result.status !== null) {
      return NextResponse.json(result.body, { status: result.status });
    }

    const body = await req.json().catch(() => ({}));
    const completed = typeof body.completed === 'boolean' ? body.completed : undefined;

    if (completed === undefined) {
      return NextResponse.json(
        { error: 'A boolean `completed` field is required' },
        { status: 400 }
      );
    }

    const item = await prisma.roadmapItem.findFirst({
      where: { id: itemId, submissionId: id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 });
    }

    const updated = await prisma.roadmapItem.update({
      where: { id: itemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      stageLabel: updated.stageLabel,
      actionText: updated.actionText,
      targetFactor: updated.targetFactor,
      estimatedScoreImpact: updated.estimatedScoreImpact,
      completed: updated.completed,
      completedAt: updated.completedAt,
    });
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    return NextResponse.json({ error: 'Internal server error while updating roadmap item' }, { status: 500 });
  }
}