'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { FPOSubmissionInput, ProductRevenueShare } from '@/lib/scoring';
import { Button } from '@/components/ui/button';
import { Field, TextInput, Select, Toggle } from '@/components/ui/field';
import { VoiceTextInput } from '@/components/ui/voice-input';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Toast } from '@/components/ui/toast';

interface StepValidation {
  [key: string]: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const STEPS = [
  { num: 1, title: 'Org basics', heading: 'Organisation basics', desc: 'Identification and legal registration classification.' },
  { num: 2, title: 'Membership', heading: 'Shareholders & membership scale', desc: 'Collective commercial viability and two-year retention.' },
  { num: 3, title: 'Financials', heading: 'Financial history — revenue & cost', desc: 'Feeds the Coefficient of Variation and Operating Ratio models.' },
  { num: 4, title: 'Diversification', heading: 'Crop & product diversification', desc: 'Measured with the Herfindahl-Hirschman Index (HHI).' },
  { num: 5, title: 'Market linkage', heading: 'Market linkage & off-takers', desc: 'Buyer diversity, forward contracts, and price capture.' },
  { num: 6, title: 'Governance', heading: 'Governance & statutory diligence', desc: 'The compliance pre-conditions institutional lenders demand.' },
];

const FIELD_NOTE: Record<string, string> = {
  activeMembers: 'NABARD considers 200 active members the baseline for commercial scale.',
  members2YrAgo: 'Enter 0 if the FPO is under 2 years old — the retention factor is then scored neutrally.',
  revenueYear1: 'Used to compute revenue stability and the operating ratio.',
  activeBuyersCount: 'Includes institutional buyers, retail chains, processors, and mandis.',
  contractSalesPct: 'Pre-agreed volume or minimum-price agreements signed before harvest.',
  agmCountLastYear: 'One AGM per year is the statutory minimum.',
  boardMeetingsLastYear: 'Quarterly meetings demonstrate active board oversight.',
};

function AssessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFacilitatorId = searchParams.get('facilitatorId');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<StepValidation>({});

  const [formData, setFormData] = useState<FPOSubmissionInput>({
    fpoName: '',
    state: 'Jharkhand',
    district: '',
    registrationType: 'Producer Company',
    activeMembers: 150,
    members2YrAgo: 120,
    revenueYear1: 4200000,
    revenueYear2: 3800000,
    revenueYear3: 3500000,
    costYear1: 3100000,
    costYear2: 2900000,
    costYear3: 2700000,
    products: [
      { name: 'Paddy', revenueSharePct: 70 },
      { name: 'Vegetables', revenueSharePct: 30 },
    ],
    activeBuyersCount: 4,
    contractSalesPct: 40,
    estimatedPriceRealizationPct: 55,
    auditedAccounts: true,
    agmCountLastYear: 1,
    boardMeetingsLastYear: 5,
    email: '',
    facilitatorId: referralFacilitatorId,
    optedIntoLeaderboard: false,
  });

  const loadSampleProfile = () => {
    setFormData({
      fpoName: 'Pragati Kisan Producer Co. Ltd.',
      state: 'Jharkhand',
      district: 'Ranchi',
      registrationType: 'Producer Company',
      activeMembers: 150,
      members2YrAgo: 120,
      revenueYear1: 4200000,
      revenueYear2: 3800000,
      revenueYear3: 3500000,
      costYear1: 3100000,
      costYear2: 2900000,
      costYear3: 2700000,
      products: [
        { name: 'Paddy', revenueSharePct: 70 },
        { name: 'Vegetables', revenueSharePct: 30 },
      ],
      activeBuyersCount: 4,
      contractSalesPct: 40,
      estimatedPriceRealizationPct: 55,
      auditedAccounts: true,
      agmCountLastYear: 1,
      boardMeetingsLastYear: 5,
      email: '',
      facilitatorId: referralFacilitatorId,
      optedIntoLeaderboard: false,
    });
    setStepErrors({});
  };

  const validateStep = (step: number): boolean => {
    const errors: StepValidation = {};

    if (step === 1) {
      if (!formData.fpoName.trim()) errors.fpoName = 'FPO name is required';
      if (!formData.state.trim()) errors.state = 'State is required';
      if (!formData.district.trim()) errors.district = 'District is required';
    }

    if (step === 2) {
      if (formData.activeMembers <= 0) errors.activeMembers = 'Must have at least 1 active member';
      if (formData.members2YrAgo < 0) errors.members2YrAgo = 'Cannot be negative (use 0 if under 2 years old)';
    }

    if (step === 3) {
      if (!formData.revenueYear1 || formData.revenueYear1 <= 0) {
        errors.revenueYear1 = 'Year 1 revenue is required and must be > 0';
      }
      if (formData.costYear1 === undefined || formData.costYear1 === null || formData.costYear1 < 0) {
        errors.costYear1 = 'Year 1 operating cost cannot be negative';
      }
    }

    if (step === 4) {
      if (!formData.products || formData.products.length === 0) {
        errors.products = 'Add at least one product or commodity';
      } else {
        formData.products.forEach((p, idx) => {
          if (!p.name.trim()) errors[`product_name_${idx}`] = 'Product name required';
          if (p.revenueSharePct === undefined || p.revenueSharePct <= 0) {
            errors[`product_share_${idx}`] = 'Share must be > 0%';
          }
        });
      }
    }

    if (step === 5) {
      if (formData.activeBuyersCount < 0) errors.activeBuyersCount = 'Cannot be negative';
      if (formData.contractSalesPct < 0 || formData.contractSalesPct > 100) {
        errors.contractSalesPct = 'Must be between 0% and 100%';
      }
      if (
        formData.estimatedPriceRealizationPct !== null &&
        formData.estimatedPriceRealizationPct !== undefined &&
        (formData.estimatedPriceRealizationPct < 0 || formData.estimatedPriceRealizationPct > 100)
      ) {
        errors.estimatedPriceRealizationPct = 'Must be between 0% and 100%';
      }
    }

    if (step === 6) {
      if (formData.agmCountLastYear < 0) errors.agmCountLastYear = 'Cannot be negative';
      if (formData.boardMeetingsLastYear < 0) errors.boardMeetingsLastYear = 'Cannot be negative';
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpTo = (step: number) => {
    if (step >= currentStep) return;
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { name: '', revenueSharePct: 10 }],
    }));
  };

  const handleRemoveProduct = (index: number) => {
    if (formData.products.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleProductChange = (index: number, field: keyof ProductRevenueShare, val: string | number) => {
    setFormData((prev) => {
      const updated = [...prev.products];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, products: updated };
    });
  };

  const totalProductShare = formData.products.reduce(
    (sum, p) => sum + (Number(p.revenueSharePct) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: FPOSubmissionInput = {
        ...formData,
        activeMembers: Number(formData.activeMembers),
        members2YrAgo: Number(formData.members2YrAgo),
        revenueYear1: Number(formData.revenueYear1),
        revenueYear2: formData.revenueYear2 ? Number(formData.revenueYear2) : null,
        revenueYear3: formData.revenueYear3 ? Number(formData.revenueYear3) : null,
        costYear1: Number(formData.costYear1),
        costYear2: formData.costYear2 ? Number(formData.costYear2) : null,
        costYear3: formData.costYear3 ? Number(formData.costYear3) : null,
        activeBuyersCount: Number(formData.activeBuyersCount),
        contractSalesPct: Number(formData.contractSalesPct),
        estimatedPriceRealizationPct:
          formData.estimatedPriceRealizationPct !== null &&
          formData.estimatedPriceRealizationPct !== undefined &&
          formData.estimatedPriceRealizationPct !== ('' as unknown)
            ? Number(formData.estimatedPriceRealizationPct)
            : null,
        agmCountLastYear: Number(formData.agmCountLastYear),
        boardMeetingsLastYear: Number(formData.boardMeetingsLastYear),
      };

      const res = await fetch('/api/fpo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error('Something went wrong saving your assessment — your answers are still here. Try again.');
      }

      const data = await res.json();
      router.push(`/results/${data.id}?token=${data.accessToken}`);
    } catch (err: unknown) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const page = STEPS[currentStep - 1];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <p className="section-kicker mb-2">FPO credit-health diagnostic</p>
          <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">
            Step-by-step organisational assessment
          </h1>
          <p className="text-[12px] text-ink-mute mt-2">
            Aim for <span className="font-semibold text-indigo">60+ (Moderate)</span> = credit
            eligible · <span className="font-semibold text-leaf">80+ (Strong)</span> = bank-ready
          </p>
        </div>
        <Button variant="quiet" type="button" onClick={loadSampleProfile} className="shrink-0 self-start">
          <Sparkles className="w-4 h-4" />
          Fill sample mid-stage FPO
        </Button>
      </div>

      <div className="mb-8">
        <ProgressSteps current={currentStep} total={6} labels={STEPS.map((s) => s.title)} onJump={jumpTo} />
      </div>

      <div className="sheet p-5 sm:p-8">
        <form onSubmit={handleSubmit}>
        <div className={currentStep === 1 ? 'fade-in' : 'fade-in'} key={currentStep}>
          <div className="border-b border-paper-line pb-4 mb-6 -mx-5 sm:-mx-8 px-5 sm:px-8">
            <h2 className="font-slab text-xl font-semibold text-ink">{page.heading}</h2>
            <p className="text-[13px] text-ink-soft mt-0.5">{page.desc}</p>
          </div>

          {/* ── STEP 1: Org basics ── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <Field label="FPO legal name" error={stepErrors.fpoName}>
                <VoiceTextInput
                  placeholder="e.g. Birsa Munda Krishi Producer Co. Ltd."
                  value={formData.fpoName}
                  onChange={(e) => setFormData({ ...formData, fpoName: e.target.value })}
                  onTranscript={(t) => setFormData({ ...formData, fpoName: t })}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="State" error={stepErrors.state}>
                  <Select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="District" error={stepErrors.district}>
                  <VoiceTextInput
                    placeholder="e.g. Ranchi, Hazaribagh"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    onTranscript={(t) => setFormData({ ...formData, district: t })}
                  />
                </Field>
              </div>

              <Field label="Legal registration structure" hint="Producer Companies follow Part IXA of the Companies Act.">
                <Select
                  value={formData.registrationType}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationType: e.target.value })
                  }
                >
                  <option value="Producer Company">Producer Company (Companies Act)</option>
                  <option value="Cooperative">Cooperative Society</option>
                  <option value="Society">Registered Society</option>
                </Select>
              </Field>
            </div>
          )}

          {/* ── STEP 2: Membership ── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <Field label="Current active farmer shareholders" hint={FIELD_NOTE.activeMembers} error={stepErrors.activeMembers}>
                <VoiceTextInput
                  type="number"
                  min={1}
                  value={formData.activeMembers}
                  onChange={(e) =>
                    setFormData({ ...formData, activeMembers: Number(e.target.value) })
                  }
                  onTranscript={(t) =>
                    setFormData({ ...formData, activeMembers: Number(t.replace(/[^0-9]/g, '')) || 0 })
                  }
                />
              </Field>
              <Field label="Total active members 2 years ago" hint={FIELD_NOTE.members2YrAgo} error={stepErrors.members2YrAgo}>
                <VoiceTextInput
                  type="number"
                  min={0}
                  value={formData.members2YrAgo}
                  onChange={(e) =>
                    setFormData({ ...formData, members2YrAgo: Number(e.target.value) })
                  }
                  onTranscript={(t) =>
                    setFormData({ ...formData, members2YrAgo: Number(t.replace(/[^0-9]/g, '')) || 0 })
                  }
                />
              </Field>
            </div>
          )}

          {/* ── STEP 3: Financial history ── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="sheet-tint p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Most recent year revenue (₹)" error={stepErrors.revenueYear1}>
                  <VoiceTextInput
                    type="number"
                    min={1}
                    placeholder="e.g. 4200000"
                    value={formData.revenueYear1}
                    onChange={(e) =>
                      setFormData({ ...formData, revenueYear1: Number(e.target.value) })
                    }
                    onTranscript={(t) =>
                      setFormData({ ...formData, revenueYear1: Number(t.replace(/[^0-9]/g, '')) || 0 })
                    }
                  />
                </Field>
                <Field label="Most recent year operating cost (₹)" error={stepErrors.costYear1}>
                  <VoiceTextInput
                    type="number"
                    min={0}
                    placeholder="e.g. 3100000"
                    value={formData.costYear1}
                    onChange={(e) =>
                      setFormData({ ...formData, costYear1: Number(e.target.value) })
                    }
                    onTranscript={(t) =>
                      setFormData({ ...formData, costYear1: Number(t.replace(/[^0-9]/g, '')) || 0 })
                    }
                  />
                </Field>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft mb-3">
                  Prior years — optional for FPOs under 3 years old
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Year 2 revenue (₹)">
                    <VoiceTextInput
                      type="number"
                      placeholder="Leave empty if under 2 yrs"
                      value={formData.revenueYear2 ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          revenueYear2: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      onTranscript={(t) =>
                        setFormData({
                          ...formData,
                          revenueYear2: t.replace(/[^0-9]/g, '') ? Number(t.replace(/[^0-9]/g, '')) : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Year 2 cost (₹)">
                    <VoiceTextInput
                      type="number"
                      placeholder="Leave empty if under 2 yrs"
                      value={formData.costYear2 ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costYear2: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      onTranscript={(t) =>
                        setFormData({
                          ...formData,
                          costYear2: t.replace(/[^0-9]/g, '') ? Number(t.replace(/[^0-9]/g, '')) : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Year 3 revenue (₹)">
                    <VoiceTextInput
                      type="number"
                      placeholder="Leave empty if under 3 yrs"
                      value={formData.revenueYear3 ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          revenueYear3: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      onTranscript={(t) =>
                        setFormData({
                          ...formData,
                          revenueYear3: t.replace(/[^0-9]/g, '') ? Number(t.replace(/[^0-9]/g, '')) : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Year 3 cost (₹)">
                    <VoiceTextInput
                      type="number"
                      placeholder="Leave empty if under 3 yrs"
                      value={formData.costYear3 ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costYear3: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      onTranscript={(t) =>
                        setFormData({
                          ...formData,
                          costYear3: t.replace(/[^0-9]/g, '') ? Number(t.replace(/[^0-9]/g, '')) : null,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Diversification ── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-ink-soft">
                  List products and the share of revenue each contributes.
                </p>
                <Button variant="link" type="button" onClick={handleAddProduct}>
                  + Add crop / product
                </Button>
              </div>

              {stepErrors.products && <p className="field-error">{stepErrors.products}</p>}

              <div className="space-y-2.5">
                {formData.products.map((p, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2.5 sm:items-start p-3.5 bg-paper-tile border border-paper-line"
                  >
                    <div>
                      <VoiceTextInput
                        placeholder="e.g. Paddy, Mustard, Vegetables, Honey"
                        value={p.name}
                        onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                        onTranscript={(t) => handleProductChange(idx, 'name', t)}
                      />
                      {stepErrors[`product_name_${idx}`] && (
                        <p className="field-error">{stepErrors[`product_name_${idx}`]}</p>
                      )}
                    </div>
                    <div className="relative">
                      <TextInput
                        type="number"
                        min={1}
                        max={100}
                        className="pr-8 text-right font-mono italic"
                        value={p.revenueSharePct}
                        onChange={(e) =>
                          handleProductChange(idx, 'revenueSharePct', Number(e.target.value))
                        }
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-ink-mute font-semibold">%</span>
                      {stepErrors[`product_share_${idx}`] && (
                        <p className="field-error">{stepErrors[`product_share_${idx}`]}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(idx)}
                      disabled={formData.products.length <= 1}
                      className="self-center sm:self-start justify-self-end text-[12px] font-semibold text-ink-mute hover:text-clay disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[13px] pt-1 border-t border-paper-line">
                <span className="text-ink-soft">Total revenue share</span>
                <span
                  className={
                    Math.abs(totalProductShare - 100) <= 2
                      ? 'font-mono font-bold text-leaf'
                      : 'font-mono font-bold text-clay'
                  }
                >
                  {totalProductShare}%
                  {Math.abs(totalProductShare - 100) > 2 && ' — should total ~100%'}
                </span>
              </div>
            </div>
          )}

          {/* ── STEP 5: Market linkage ── */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <Field label="Active institutional off-takers / buyers" hint={FIELD_NOTE.activeBuyersCount} error={stepErrors.activeBuyersCount}>
                <VoiceTextInput
                  type="number"
                  min={0}
                  value={formData.activeBuyersCount}
                  onChange={(e) =>
                    setFormData({ ...formData, activeBuyersCount: Number(e.target.value) })
                  }
                  onTranscript={(t) =>
                    setFormData({ ...formData, activeBuyersCount: Number(t.replace(/[^0-9]/g, '')) || 0 })
                  }
                />
              </Field>
              <Field label="Share of sales covered by formal supply contracts (%)" hint={FIELD_NOTE.contractSalesPct} error={stepErrors.contractSalesPct}>
                <VoiceTextInput
                  type="number"
                  min={0}
                  max={100}
                  value={formData.contractSalesPct}
                  onChange={(e) =>
                    setFormData({ ...formData, contractSalesPct: Number(e.target.value) })
                  }
                  onTranscript={(t) =>
                    setFormData({ ...formData, contractSalesPct: Number(t.replace(/[^0-9]/g, '')) || 0 })
                  }
                />
              </Field>
              <Field
                label="Farmer's share of consumer rupee (%)"
                optional
                hint="An estimate of the retail price your FPO captures. If unknown, leave blank — scoring falls back to buyer and contract data."
                error={stepErrors.estimatedPriceRealizationPct}
              >
                <VoiceTextInput
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 55"
                  value={formData.estimatedPriceRealizationPct ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedPriceRealizationPct: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  onTranscript={(t) =>
                    setFormData({
                      ...formData,
                      estimatedPriceRealizationPct: t.replace(/[^0-9]/g, '')
                        ? Number(t.replace(/[^0-9]/g, ''))
                        : null,
                    })
                  }
                />
              </Field>
            </div>
          )}

          {/* ── STEP 6: Governance ── */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="sheet-tint p-4">
                <Toggle
                  checked={!!formData.auditedAccounts}
                  onChange={(v) => setFormData({ ...formData, auditedAccounts: v })}
                  label="Statutory accounts audited by a chartered accountant"
                  hint="Mandatory for bank loan underwriting under RBI guidelines."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="AGMs held in the last year" hint={FIELD_NOTE.agmCountLastYear} error={stepErrors.agmCountLastYear}>
                  <VoiceTextInput
                    type="number"
                    min={0}
                    value={formData.agmCountLastYear}
                    onChange={(e) =>
                      setFormData({ ...formData, agmCountLastYear: Number(e.target.value) })
                    }
                    onTranscript={(t) =>
                      setFormData({ ...formData, agmCountLastYear: Number(t.replace(/[^0-9]/g, '')) || 0 })
                    }
                  />
                </Field>
                <Field label="Board meetings documented last year" hint={FIELD_NOTE.boardMeetingsLastYear} error={stepErrors.boardMeetingsLastYear}>
                  <VoiceTextInput
                    type="number"
                    min={0}
                    value={formData.boardMeetingsLastYear}
                    onChange={(e) =>
                      setFormData({ ...formData, boardMeetingsLastYear: Number(e.target.value) })
                    }
                    onTranscript={(t) =>
                      setFormData({ ...formData, boardMeetingsLastYear: Number(t.replace(/[^0-9]/g, '')) || 0 })
                    }
                  />
                </Field>
              </div>

              <div className="sheet-tint p-4">
                <Toggle
                  checked={!!formData.optedIntoLeaderboard}
                  onChange={(v) => setFormData({ ...formData, optedIntoLeaderboard: v })}
                  label="Join the district leaderboard?"
                  hint="Shows only your name and score band, never financial data."
                />
              </div>

              <Field label="Email address for a report copy" optional hint="Used solely for report delivery, never marketing.">
                <VoiceTextInput
                  type="email"
                  placeholder="fpo.manager@example.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onTranscript={(t) => setFormData({ ...formData, email: t.replace(/\s+/g, '') })}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 pt-5 border-t border-paper-line flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <Button variant="quiet" type="button" onClick={handleBack}>
              Previous
            </Button>
          ) : (
            <span />
          )}

          {currentStep < 6 ? (
            <Button variant="primary" type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Computing scorecard…
                </>
              ) : (
                'Calculate my score'
              )}
            </Button>
          )}
        </div>
        </form>
      </div>

      <Toast show={!!submitError} tone="error">
        {submitError}
      </Toast>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-ink-mute">Loading…</div>
      }
    >
      <AssessForm />
    </Suspense>
  );
}