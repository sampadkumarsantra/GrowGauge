'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Download, Copy } from 'lucide-react';
import { FactorScores, FPOSubmissionInput, ScoreBand, ScoreResult } from '@/lib/scoring';
import { ChecklistItem as ChecklistItemType } from '@/lib/checklist';
import { Button, buttonClass } from '@/components/ui/button';
import { LedgerRow } from '@/components/ui/ledger-row';
import { ChecklistItem as ChecklistItemRow } from '@/components/ui/checklist-item';
import { ScoreHistoryChart } from '@/components/ui/line-chart';
import { ScoreTarget } from '@/components/ui/score-target';
import { AssistantPanel, AssistantMessage } from '@/components/ui/assistant-panel';
import { Toast } from '@/components/ui/toast';
import { Toggle } from '@/components/ui/field';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

interface RoadmapItemDTO {
  id: string;
  stageLabel: string;
  actionText: string;
  targetFactor: string;
  factorName: string;
  estimatedScoreImpact: number;
  completed: boolean;
  completedAt: string | null;
}

interface SchemeDTO {
  name: string;
  description: string;
  link: string;
  score: number;
}

interface LenderDTO {
  lenderType: string;
  description: string;
  typicalUseCase: string;
  rationale: string;
}

interface HistoryPoint {
  id: string;
  date: string;
  overallScore: number;
  band: string;
  factorScores: FactorScores;
}

const ROADMAP_STAGES = ['0-30 days', '30-90 days', '90+ days'];

const SUGGESTED_QUESTIONS = [
  'Why is my overall score what it is?',
  'Which single change would raise my score the most?',
  'What does my weakest factor really measure?',
  'How does the scoring model work?',
];

const FACTOR_META: { key: keyof FactorScores; label: string; model: string; weight: number }[] = [
  { key: 'membership', label: 'Membership Strength', model: 'Scale + 2-yr retention', weight: 15 },
  { key: 'revenueStability', label: 'Revenue Stability', model: 'Coefficient of Variation', weight: 20 },
  { key: 'costEfficiency', label: 'Cost Efficiency', model: 'Operating Ratio', weight: 20 },
  { key: 'diversification', label: 'Diversification', model: 'Herfindahl–Hirschman Index', weight: 15 },
  { key: 'marketLinkage', label: 'Market Linkage', model: "Buyers, contracts, farmer's share", weight: 15 },
  { key: 'governance', label: 'Governance', model: 'Audit + AGM + board', weight: 15 },
];

function bandClasses(band: ScoreBand): { text: string; bg: string; label: string } {
  switch (band) {
    case 'Strong':
      return { text: 'text-leaf', bg: 'bg-leaf-tint', label: 'Strong' };
    case 'Moderate':
      return { text: 'text-indigo', bg: 'bg-indigo-tint', label: 'Moderate' };
    case 'Developing':
      return { text: 'text-ink', bg: 'bg-paper-tile', label: 'Developing' };
    default:
      return { text: 'text-clay', bg: 'bg-clay-tint', label: 'Early Stage' };
  }
}

function Results() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVerify, setCopiedVerify] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [savedData, setSavedData] = useState<{
    submission: FPOSubmissionInput & { id: string; fpoGroupId?: string | null };
    scoreResult: ScoreResult;
  } | null>(null);

  const [simulatedValues, setSimulatedValues] = useState({
    activeMembers: 150,
    activeBuyersCount: 4,
    contractSalesPct: 40,
    estimatedPriceRealizationPct: 55,
    auditedAccounts: true,
  });
  const [simulatedScore, setSimulatedScore] = useState<ScoreResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [roadmapItems, setRoadmapItems] = useState<RoadmapItemDTO[]>([]);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const [schemes, setSchemes] = useState<SchemeDTO[]>([]);
  const [lenders, setLenders] = useState<LenderDTO[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItemType[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [newCycleLoading, setNewCycleLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [badgeQr, setBadgeQr] = useState<string | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AssistantMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiWaiting, setAiWaiting] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);

  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : '';

  // ── Mount: load everything ──
  useEffect(() => {
    (async () => {
      if (!id) {
        setError('Missing submission ID in the URL. Check your link.');
        setLoading(false);
        return;
      }

      const qs = token ? `?token=${encodeURIComponent(token)}` : '';

      let data: any;
      try {
        const res = await fetch(`/api/fpo/${id}${qs}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            errData.error || 'Failed to load scorecard. Open it from the link where you saved it.'
          );
        }
        data = await res.json();
        setSavedData({ submission: data, scoreResult: data.scoreResult });
        setSimulatedValues({
          activeMembers: data.activeMembers,
          activeBuyersCount: data.activeBuyersCount,
          contractSalesPct: data.contractSalesPct,
          estimatedPriceRealizationPct: data.estimatedPriceRealizationPct ?? 50,
          auditedAccounts: data.auditedAccounts,
        });
        setSimulatedScore(data.scoreResult);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Error loading scorecard');
        setLoading(false);
        return;
      }

      // Roadmap
      try {
        const r = await fetch(`/api/fpo/${id}/roadmap${qs}`);
        if (r.ok) {
          const d = await r.json();
          setRoadmapItems(d.items ?? []);
        }
      } catch {
        /* optional */
      }

      // Schemes
      try {
        const r = await fetch(`/api/fpo/${id}/schemes${qs}`);
        if (r.ok) {
          const d = await r.json();
          setSchemes(d.schemes ?? []);
        }
      } catch {
        /* optional */
      }

      // Lenders
      try {
        const r = await fetch(`/api/fpo/${id}/lenders${qs}`);
        if (r.ok) {
          const d = await r.json();
          setLenders(d.lenders ?? []);
        }
      } catch {
        /* optional */
      }

      // Checklist
      try {
        const r = await fetch(`/api/fpo/${id}/checklist${qs}`);
        if (r.ok) {
          const d = await r.json();
          setChecklist(d.items ?? []);
        }
      } catch {
        /* optional */
      }

      // History
      if (data.fpoGroupId) {
        try {
          const r = await fetch(`/api/fpo/group/${data.fpoGroupId}/history${qs}`);
          if (r.ok) {
            const d = await r.json();
            setHistory(d.history ?? []);
          }
        } catch {
          /* optional */
        }
      }

      // QR for the public verification page
      const url = typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : '';
      if (url) {
        QRCode.toDataURL(url, { width: 200, margin: 1 })
          .then(setBadgeQr)
          .catch(() => null);
      }

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const saved = savedData;

  // ── What-if simulation ──
  const triggerSimulation = useCallback(
    (next: typeof simulatedValues) => {
      if (!saved) return;
      setIsSimulating(true);
      fetch('/api/score/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...saved.submission, ...next }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res) setSimulatedScore(res);
        })
        .catch(() => undefined)
        .finally(() => setIsSimulating(false));
    },
    [saved]
  );

  const handleSliderChange = (field: keyof typeof simulatedValues, val: number | boolean) => {
    const next = { ...simulatedValues, [field]: val };
    setSimulatedValues(next);
    if (simulateTimer.current) clearTimeout(simulateTimer.current);
    simulateTimer.current = setTimeout(() => triggerSimulation(next), 250);
  };

  const isSimulationDirty = saved
    ? simulatedValues.activeMembers !== saved.submission.activeMembers ||
      simulatedValues.activeBuyersCount !== saved.submission.activeBuyersCount ||
      simulatedValues.contractSalesPct !== saved.submission.contractSalesPct ||
      simulatedValues.estimatedPriceRealizationPct !==
        (saved.submission.estimatedPriceRealizationPct ?? 50) ||
      simulatedValues.auditedAccounts !== saved.submission.auditedAccounts
    : false;

  const handleResetSimulation = () => {
    if (!saved) return;
    const initial = {
      activeMembers: saved.submission.activeMembers,
      activeBuyersCount: saved.submission.activeBuyersCount,
      contractSalesPct: saved.submission.contractSalesPct,
      estimatedPriceRealizationPct: saved.submission.estimatedPriceRealizationPct ?? 50,
      auditedAccounts: saved.submission.auditedAccounts,
    };
    setSimulatedValues(initial);
    setSimulatedScore(saved.scoreResult);
  };

  const handleSaveSimulation = async () => {
    if (!saved || !token) return;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await fetch(`/api/fpo/${id}?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatedValues),
      });
      if (!res.ok) throw new Error('Failed to update record');
      const updated = await res.json();
      setSavedData((prev) =>
        prev
          ? { submission: { ...prev.submission, ...simulatedValues }, scoreResult: updated }
          : null
      );
      setSaveMessage('Changes saved to your permanent record.');
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Roadmap toggle ──
  const toggleRoadmapItem = async (item: RoadmapItemDTO) => {
    if (!id || !token) return;
    const next = !item.completed;
    setRoadmapItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: next } : i))
    );
    try {
      const res = await fetch(`/api/fpo/${id}/roadmap/${item.id}?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: next }),
      });
      if (!res.ok) throw new Error('Failed to update roadmap item');
    } catch (err) {
      setRoadmapItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i))
      );
      setRoadmapError(err instanceof Error ? err.message : 'Failed to update roadmap item');
    }
  };

  const toggleChecklist = (itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleNewCycle = async () => {
    if (!id || !token) return;
    setNewCycleLoading(true);
    try {
      const res = await fetch(`/api/fpo/${id}/new-cycle?token=${token}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start a new assessment cycle');
      const data = await res.json();
      window.location.href = `/results/${data.id}?token=${data.accessToken}`;
    } catch {
      setSaveError('Failed to start a new assessment cycle. Please try again.');
      setNewCycleLoading(false);
    }
  };

  const handleSaveToAccount = async () => {
    if (!id || !token) {
      setSaveError('This scorecard link is missing its access token. Use the full private link.');
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch(`/api/fpo/${id}/claim?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(
          `/results/${id}?token=${encodeURIComponent(token)}`
        )}`;
        return;
      }
      if (!res.ok) throw new Error('Failed to save scorecard');
      setClaimed(true);
      setSaveMessage('Scorecard saved to your dashboard.');
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save scorecard. Please try again.'
      );
    } finally {
      setClaiming(false);
    }
  };

  // ── Copy links ──
  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const copyVerify = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      setCopiedVerify(true);
      setTimeout(() => setCopiedVerify(false), 2500);
    }
  };

  // ── AI assistant ──
  const sendAiQuestion = async (questionOverride?: string) => {
    const question = (questionOverride ?? aiInput).trim();
    if (!question || aiWaiting) return;
    setAiMessages((prev) => [...prev, { role: 'user', content: question }]);
    setAiInput('');
    setAiWaiting(true);
    try {
      const res = await fetch(`/api/fpo/${id}/ask?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (res.status === 503) {
        const data = await res.json();
        setAiAvailable(false);
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              data.error ??
              'The AI Score Assistant is not configured on this deployment yet. Your roadmap and suggestions still explain what to do.',
          },
        ]);
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error ?? 'Sorry, I could not answer that right now. Please try again.',
          },
        ]);
      } else {
        const data = await res.json();
        setAiMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not reach the assistant. Please try again.' },
      ]);
    } finally {
      setAiWaiting(false);
    }
  };

  // ── States ──
  if (loading) {
    return (
      <div
        role="status"
        className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-ink-soft text-sm"
      >
        <svg viewBox="0 0 48 48" width={72} height={72} className="gauge-loader" aria-hidden>
          <circle
            cx="24"
            cy="24"
            r="18.5"
            fill="none"
            stroke="#1E2A1F"
            strokeWidth="4"
            opacity="0.12"
          />
          <circle
            className="gauge-loader-arc"
            cx="24"
            cy="24"
            r="18.5"
            fill="none"
            stroke="#C1861A"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(135 24 24)"
            pathLength={100}
          />
        </svg>
        <span>Retrieving scorecard…</span>
      </div>
    );
  }

  if (error || !saved) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-slab text-2xl font-semibold text-ink">Scorecard access error</h1>
        <p className="text-sm text-ink-soft leading-relaxed">{error}</p>
        <Link href="/assess" className={buttonClass('primary', 'inline-flex')}>
          Start a new assessment
        </Link>
      </div>
    );
  }

  const activeScore = simulatedScore || saved.scoreResult;
  const band = bandClasses(activeScore.band);
  const groupLabel =
    activeScore.band === 'Developing' ? 'Developing operational capacity' :
    activeScore.band === 'Moderate' ? 'Credit eligible, targeted gaps remain' :
    activeScore.band === 'Strong' ? 'Highly credit-ready and bankable' :
    'Early-stage institutional formation';

  const distanceToTarget =
    activeScore.overallScore >= 80
      ? `Above the Strong band (80+) — ${(activeScore.overallScore - 80).toFixed(1)} pt${activeScore.overallScore - 80 === 1 ? '' : 's'} to spare`
      : activeScore.overallScore >= 60
        ? `${(60 - activeScore.overallScore).toFixed(1)} pt${activeScore.overallScore - 60 === 1 ? '' : 's'} above the Moderate band (60+)`
        : `${(60 - activeScore.overallScore).toFixed(1)} pt${60 - activeScore.overallScore === 1 ? '' : 's'} below the Moderate band — target 60`;

  const roadmapGroups = ROADMAP_STAGES.map((stage) => ({
    stage,
    items: roadmapItems.filter((i) => i.stageLabel === stage),
  }));
  const roadmapDone = roadmapItems.filter((i) => i.completed).length;

  const historyChartData = history.map((h) => ({
    label: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    score: h.overallScore,
  }));

  const simLeversMeta = [
    { field: 'activeMembers' as const, label: 'Active farmer members', min: 20, max: 600, step: 10, fmt: (v: number) => String(v) },
    { field: 'activeBuyersCount' as const, label: 'Active off-takers / buyers', min: 0, max: 20, step: 1, fmt: (v: number) => String(v) },
    { field: 'contractSalesPct' as const, label: 'Forward contract sales share', min: 0, max: 100, step: 5, fmt: (v: number) => `${v}%` },
    { field: 'estimatedPriceRealizationPct' as const, label: "Farmer's share of consumer rupee", min: 20, max: 90, step: 5, fmt: (v: number) => `${v}%` },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* ── 1 · Score hero ── */}
      <section>
        <GrowGaugeMark variant="full" color="ink" className="w-16 mb-3" />
        <p className="section-kicker mb-1">Credit-readiness scorecard</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink leading-snug">
          {saved.submission.fpoName}
        </h1>
        <p className="text-[13px] text-ink-mute mt-0.5">
          {saved.submission.district}, {saved.submission.state} · {saved.submission.registrationType}
        </p>

        <div className={`mt-6 ${band.bg} px-6 sm:px-8 py-8 border-l-4 border-current ${band.text}`}>
          <p className="section-kicker mb-2">Overall score</p>
          <div className="reveal" key={activeScore.overallScore}>
            <p className="font-slab text-7xl sm:text-8xl font-semibold leading-none text-turmeric tabular-nums">
              {activeScore.overallScore.toFixed(1)}
            </p>
            <p className={`mt-2 text-[15px] font-semibold ${band.text}`}>
              {band.label} · {groupLabel}
            </p>
            {isSimulationDirty && (
              <p className="mt-1 text-[12px] text-ink-soft">Preview — not saved yet.</p>
            )}
          </div>
          <p className="mt-6 max-w-2xl text-[14px] text-ink-soft leading-relaxed">
            {activeScore.narrativeSummary}
          </p>
          {activeScore.dataCompletenessFlag && (
            <p className="mt-3 text-[12px] text-ink-mute">
              Limited financial history (under 3 years). The score will refine as audited years are recorded.
            </p>
          )}
          <div className="mt-6 max-w-md">
            <ScoreTarget score={activeScore.overallScore} />
            <p className="mt-2 text-[12px] text-ink-soft">
              {activeScore.band === 'Strong' ? 'Band position:' : 'Distance to target:'} {distanceToTarget}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-paper-line pb-4">
          <button type="button" onClick={copyShareLink} className="btn-link">
            {copiedLink ? 'Private link copied' : 'Copy private link'}
          </button>
          <a href={token ? `/api/fpo/${id}/report?token=${encodeURIComponent(token)}` : `/api/fpo/${id}/report`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4">
            <Download className="w-3.5 h-3.5" />
            Download the PDF report
          </a>
          <Link href={`/verify/${id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4">
            Verification certificate
          </Link>
          <a href={`/api/fpo/${id}/badge`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4">
            Badge SVG
          </a>
          <button type="button" onClick={handleNewCycle} disabled={newCycleLoading} className="btn-link disabled:opacity-50">
            {newCycleLoading ? 'Starting a new cycle…' : 'Start a new assessment cycle'}
          </button>
          {claimed ? (
            <Link href="/dashboard" className="btn-link">
              Saved — open My Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSaveToAccount}
              disabled={claiming}
              className="btn-link disabled:opacity-50"
            >
              {claiming ? 'Saving…' : 'Save to my account'}
            </button>
          )}
        </div>
      </section>

      {/* ── 2 · Factor ledger with inline what-if sliders ── */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <p className="section-kicker">Factor ledger</p>
          {isSimulationDirty && (
            <span className="text-[12px] text-indigo font-medium">
              {isSimulating ? 'Recalculating…' : 'Adjust below, then save to keep changes.'}
            </span>
          )}
        </div>

        <div className="sheet px-5 sm:px-6 py-4">
          <div className="ledger">
            {FACTOR_META.map((f) => (
              <div key={f.key} className={f.key === 'marketLinkage' || f.key === 'membership' || f.key === 'governance' ? 'border-b border-paper-line last:border-0' : undefined}>
                <LedgerRow
                  label={`${f.label} · ${f.weight}%`}
                  sub={f.model}
                  value={activeScore.factorScores[f.key].toFixed(1)}
                  pct={activeScore.factorScores[f.key]}
                  tone={f.key === 'governance' ? 'neutral' : 'indigo'}
                />

                {f.key === 'membership' && (
                  <SliderRow
                    label="Number of active members"
                    value={simulatedValues.activeMembers}
                    min={20}
                    max={600}
                    step={10}
                    fmt={(v) => String(v)}
                    onChange={(v) => handleSliderChange('activeMembers', v)}
                  />
                )}

                {f.key === 'marketLinkage' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 px-0 pb-1">
                    {simLeversMeta
                      .filter((l) => l.field !== 'activeMembers')
                      .map((l) => (
                        <SliderRow
                          key={l.field}
                          label={l.label}
                          value={simulatedValues[l.field]}
                          min={l.min}
                          max={l.max}
                          step={l.step}
                          fmt={l.fmt}
                          onChange={(v) => handleSliderChange(l.field, v)}
                        />
                      ))}
                  </div>
                )}

                {f.key === 'governance' && (
                  <div className="px-0 pb-1">
                    <Toggle
                      checked={simulatedValues.auditedAccounts}
                      onChange={(v) => handleSliderChange('auditedAccounts', v)}
                      label="Statutory audit completed"
                      hint="Audited accounts carry 40 of 100 points in the governance factor."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {isSimulationDirty && (
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-paper-line">
              <Button variant="quiet" onClick={handleSaveSimulation} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save these changes'}
              </Button>
              <Button variant="link" onClick={handleResetSimulation}>
                Reset to saved
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── 3 · Priority suggestions ── */}
      {activeScore.suggestions.length > 0 && (
        <section className="mt-10">
          <p className="section-kicker mb-3">Priority improvements</p>
          <div className="sheet px-5 sm:px-6 py-4">
            <ol className="space-y-3">
              {activeScore.suggestions.map((sug, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
                  <span className="font-mono text-[12px] font-bold text-ink-mute pt-0.5 shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{sug}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── 4 · Things to do: roadmap + bank checklist ── */}
      <section className="mt-10">
        <p className="section-kicker mb-3">Things to do</p>

        {roadmapGroups.some((g) => g.items.length > 0) && (
          <div className="sheet px-5 sm:px-6 py-5 mb-5">
            <div className="flex items-baseline justify-between gap-4 mb-4 pb-3 border-b border-paper-line">
              <div>
                <h2 className="font-slab text-xl font-semibold text-ink">Improvement roadmap</h2>
                <p className="text-[13px] text-ink-soft mt-0.5">
                  A staged plan built from your two weakest factors. Check off each action as you complete it.
                </p>
              </div>
              <span className="text-[12px] font-mono text-ink-mute whitespace-nowrap">
                {roadmapDone}/{roadmapItems.length}
              </span>
            </div>

            {roadmapError && (
              <p className="text-[12px] text-clay mb-3">{roadmapError}</p>
            )}

            <div className="space-y-6">
              {roadmapGroups.map(({ stage, items }) => (
                <div key={stage}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft mb-2">
                    {stage}
                  </p>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-[13px] text-ink-mute">No actions remaining in this window.</p>
                    ) : (
                      items.map((item) => (
                        <ChecklistItemRow
                          key={item.id}
                          checked={item.completed}
                          onToggle={() => toggleRoadmapItem(item)}
                          label={item.actionText}
                          meta={
                            <span className="inline-flex items-center gap-2 text-[11px] font-semibold">
                              <span className="text-indigo">{item.factorName}</span>
                              <span className="text-leaf">+{item.estimatedScoreImpact.toFixed(1)} pts</span>
                            </span>
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {checklist.length > 0 && (
          <div className="sheet px-5 sm:px-6 py-5">
            <div className="flex items-baseline justify-between gap-4 mb-4 pb-3 border-b border-paper-line">
              <div>
                <h2 className="font-slab text-xl font-semibold text-ink">Bank application checklist</h2>
                <p className="text-[13px] text-ink-soft mt-0.5">
                  Documents commonly requested for a {saved.submission.registrationType} institutional loan application.
                </p>
              </div>
              <span className="text-[12px] font-mono text-ink-mute whitespace-nowrap">
                {checkedItems.size}/{checklist.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checklist.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  checked={checkedItems.has(item.id)}
                  onToggle={() => toggleChecklist(item.id)}
                  label={item.label}
                  recommended={!item.required}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 5 · Government schemes ── */}
      {schemes.length > 0 && (
        <section className="mt-10">
          <p className="section-kicker mb-3">Relevant government schemes</p>
          <div className="sheet px-5 sm:px-6 py-4 divide-y divide-paper-line">
            {schemes.map((s, idx) => (
              <div key={idx} className="flex items-start justify-between gap-6 py-3">
                <div>
                  <p className="text-[14px] font-semibold text-ink leading-snug">{s.name}</p>
                  <p className="text-[13px] text-ink-soft leading-relaxed mt-0.5">
                    {s.description} Verify current guidelines on the linked portal.
                  </p>
                </div>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
                >
                  Open →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6 · Which lender fits you ── */}
      {lenders.length > 0 && (
        <section className="mt-10">
          <p className="section-kicker mb-3">Which lender fits you</p>
          <div className="sheet px-5 sm:px-6 py-4 divide-y divide-paper-line">
            <p className="pt-1 pb-3 text-[13px] text-ink-soft leading-relaxed">
              Realistic lender types matched to your {band.label} credit-readiness band. These are
              general categories — check current lending windows with each institution directly.
            </p>
            {lenders.map((l, idx) => (
              <div key={idx} className="py-3">
                <p className="text-[14px] font-semibold text-ink leading-snug">{l.lenderType}</p>
                <p className="text-[13px] text-ink-soft leading-relaxed mt-0.5">
                  {l.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7 · Score history ── */}
      {history.length > 0 && (
        <section className="mt-10">
          <p className="section-kicker mb-3">Score history</p>
          <div className="sheet px-5 sm:px-6 py-5">
            {history.length > 1 ? (
              <ScoreHistoryChart data={historyChartData} />
            ) : (
              <p className="text-[13px] text-ink-soft py-2">
                1 assessment cycle recorded. Start a new cycle to track progress over time.
              </p>
            )}

            <table className="data-table mt-5">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Overall</th>
                  {FACTOR_META.map((f) => (
                    <th key={f.key} className="text-right hidden md:table-cell">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap text-ink">
                      {new Date(h.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-right font-mono font-bold text-ink">{h.overallScore.toFixed(1)}</td>
                    {FACTOR_META.map((f) => (
                      <td key={f.key} className="text-right font-mono text-ink-soft hidden md:table-cell">
                        {h.factorScores[f.key as keyof FactorScores].toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 8 · AI assistant (collapsed by default) ── */}
      <section className="mt-10">
        <AssistantPanel
          open={aiOpen}
          onToggle={() => setAiOpen((o) => !o)}
          available={aiAvailable}
          messages={aiMessages}
          waiting={aiWaiting}
          input={aiInput}
          onInput={setAiInput}
          onSend={sendAiQuestion}
          suggested={SUGGESTED_QUESTIONS}
          summary="Ask a question in plain language and the assistant answers only from this assessment — why the score is what it is, and which single change moves it most."
        />
      </section>

      {/* ── 9 · Verified badge + re-visit ── */}
      <section className="mt-10 sheet px-5 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-ink">Verified assessment</p>
            <p className="text-[13px] text-ink-soft leading-relaxed mt-1 max-w-md">
              A public verification page confirms the band and assessment date of this FPO — never
              its financial data. Attach the badge to funding applications or shared reports.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button type="button" onClick={copyVerify} className="btn-link">
                {copiedVerify ? (
                  'Verify link copied'
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    Copy verify link
                  </span>
                )}
              </button>
              <Link
                href={`/verify/${id}`}
                className="text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
              >
                Open verification certificate
              </Link>
              <a
                href={`/api/fpo/${id}/badge`}
                className="text-[13px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
              >
                Download badge SVG
              </a>
            </div>
          </div>
          {badgeQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={badgeQr}
              alt="QR code linking to the verification certificate"
              className="w-28 h-28 bg-white border border-paper-line p-1 shrink-0"
            />
          ) : (
            <div className="w-28 h-28 bg-paper-tile border border-paper-line shrink-0" />
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-paper-line flex items-center justify-between gap-4">
          <p className="text-[12px] text-ink-mute">
            Bookmark this page — its link carries a private access token; treat it like a password.
          </p>
          <button type="button" onClick={copyShareLink} className="btn-link whitespace-nowrap shrink-0">
            {copiedLink ? 'Link copied' : 'Copy private link'}
          </button>
        </div>
      </section>

      <Toast show={!!saveMessage} tone="success">{saveMessage}</Toast>
      <Toast show={!!saveError} tone="error">{saveError}</Toast>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="px-1 pb-1">
      <div className="flex justify-between text-[12px]">
        <span className="text-ink-soft font-medium">{label}</span>
        <span className="font-mono font-bold text-ink">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={<div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-ink-mute">Loading…</div>}
    >
      <Results />
    </Suspense>
  );
}