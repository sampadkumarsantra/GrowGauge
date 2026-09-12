import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  factorScoresFromResult,
  getAccessToken,
  hydrateSubmission,
  loadAuthorizedSubmission,
} from '@/lib/api-helpers';
import { generateRoadmap, ROADMAP_FACTOR_NAMES } from '@/lib/roadmap';

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
    const input = hydrateSubmission(submission);

    let items = await prisma.roadmapItem.findMany({
      where: { submissionId: id },
      orderBy: [{ targetFactor: 'asc' }, { createdAt: 'asc' }],
    });

    const generated = generateRoadmap(input, factorScores);
    const currentFactors = [...new Set(generated.map((g) => g.targetFactor))].sort();
    const existingFactors = [...new Set(items.map((i) => i.targetFactor))].sort();

    const isStale =
      items.length !== generated.length ||
      JSON.stringify(currentFactors) !== JSON.stringify(existingFactors);

    if (isStale) {
      await prisma.roadmapItem.deleteMany({ where: { submissionId: id } });
      items = [];
      for (const spec of generated) {
        const created = await prisma.roadmapItem.create({
          data: {
            submissionId: id,
            stageLabel: spec.stageLabel,
            actionText: spec.actionText,
            targetFactor: spec.targetFactor,
            estimatedScoreImpact: spec.estimatedScoreImpact,
          },
        });
        items.push(created);
      }
      items.sort((a, b) => (a.targetFactor > b.targetFactor ? 1 : -1));
    }

    const serialized = items.map((item) => ({
      id: item.id,
      stageLabel: item.stageLabel,
      actionText: item.actionText,
      targetFactor: item.targetFactor,
      factorName: ROADMAP_FACTOR_NAMES[item.targetFactor as keyof typeof ROADMAP_FACTOR_NAMES] ?? item.targetFactor,
      estimatedScoreImpact: item.estimatedScoreImpact,
      completed: item.completed,
      completedAt: item.completedAt,
    }));

    return NextResponse.json({
      fpoId: submission.id,
      factorScores,
      weakestFactors: [...new Set(serialized.map((s) => s.targetFactor))],
      items: serialized,
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json({ error: 'Internal server error while generating roadmap' }, { status: 500 });
  }
}