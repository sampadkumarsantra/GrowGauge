import { NextRequest, NextResponse } from 'next/server';
import { factorScoresFromResult, getAccessToken, hydrateSubmission, loadAuthorizedSubmission } from '@/lib/api-helpers';
import { ROADMAP_FACTOR_NAMES, getWeakestFactors } from '@/lib/roadmap';

interface RouteContext {
  params: { id: string };
}

const RATE_LIMIT_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const requestLog = new Map<string, number[]>();

function isRateLimited(submissionId: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(submissionId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_PER_HOUR) {
    requestLog.set(submissionId, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(submissionId, recent);
  return false;
}

const SYSTEM_PROMPT = [
  'You are a plain-language assistant inside an FPO Credit-Readiness scorecard tool.',
  'You answer questions about the scoring methodology ONLY using the user\'s own factor score data provided in the conversation.',
  'Rules:',
  '1. Ground every answer in the provided factor scores and the documented scoring models (Membership 15%, Revenue Stability 20% via Coefficient of Variation, Cost Efficiency 20% via Operating Ratio, Diversification 15% via HHI, Market Linkage 15%, Governance 15%).',
  '2. Never give financial, investment, tax, or legal advice. Explain scoring and improvement logic only.',
  '3. Do not guess unknown data. If asked something you cannot answer from the score data, say so and suggest re-reading their factor breakdown.',
  '4. Keep answers concise, conversational, and easy for a non-financial reader to follow.',
].join(' ');

export async function POST(req: NextRequest, { params }: RouteContext) {
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

    if (isRateLimited(submission.id)) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait an hour before asking more questions.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) {
      return NextResponse.json({ error: 'A non-empty `question` field is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          answer: null,
          error:
            'AI Score Assistant is not configured on this deployment. Add OPENAI_API_KEY to enable it.',
          available: false,
        },
        { status: 503 }
      );
    }

    const factorScores = factorScoresFromResult(scoreResult);
    const input = hydrateSubmission(submission);
    const weakest = getWeakestFactors(factorScores);

    const factorSummary = {
      fpoBand: scoreResult.band,
      overallScore: scoreResult.overallScore,
      district: submission.district,
      state: submission.state,
      factorScores: {
        membership: factorScores.membership,
        revenueStability: factorScores.revenueStability,
        costEfficiency: factorScores.costEfficiency,
        diversification: factorScores.diversification,
        marketLinkage: factorScores.marketLinkage,
        governance: factorScores.governance,
      },
      twoWeakestFactors: weakest.map((f) => ROADMAP_FACTOR_NAMES[f]),
      dataCompletenessFlag: scoreResult.dataCompletenessFlag,
    };

    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `My FPO's score data: ${JSON.stringify(factorSummary)}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error('LLM provider error:', aiRes.status, await aiRes.text());
      return NextResponse.json(
        { error: 'The AI assistant service returned an error. Please try again shortly.' },
        { status: 502 }
      );
    }

    const aiJson = await aiRes.json();
    const answer = aiJson?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json({ error: 'The AI assistant returned an empty response' }, { status: 502 });
    }

    return NextResponse.json({ answer, available: true });
  } catch (error) {
    console.error('Error in AI score assistant:', error);
    return NextResponse.json({ error: 'Internal server error while answering' }, { status: 500 });
  }
}