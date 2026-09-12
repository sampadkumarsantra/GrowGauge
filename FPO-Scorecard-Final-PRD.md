# Final PRD — FPO Scorecard
## Self-Serve Financial Health & Credit-Readiness Platform for Farmer Producer Organizations

**Version:** 3.3 — Final (supersedes all earlier drafts — use only this file going forward). All scoring factors now use named, citable economic/statistical models; equations, worked examples, and a economic-basis table are integrated directly into Section 10 and Appendix A.
**Author:** [Your Name], ICAR IARI Jharkhand
**Audience:** AI coding agent (Antigravity) — this is the single source of truth for the build.

---

## 0. Instructions for the Build Agent

- Build strictly in the phase order given in Section 20. Do not implement Phase 2/3 features before Phase 1 (MVP) is complete and passes Section 18's checklist.
- Everything in Section 2 ("Out of Scope for MVP") must NOT be built unless explicitly requested later.
- The scoring engine (Section 10) must be implemented as a pure, stateless, unit-tested module — no side effects, no database calls inside it. Both the submit flow and the what-if simulator must call this same module so results never diverge.
- Where this document states an assumption, follow it by default. Flag it back to the user only if it blocks a decision the doc doesn't answer.
- Use the exact data model (Section 8) and API contracts (Section 9) as the source of truth — don't invent extra fields or endpoints without a reason tied back to a feature in Section 4.

---

## 1. Product Overview

FPOs (Farmer Producer Organizations) in India can't access institutional credit easily because they have no standardized way to demonstrate financial health. Existing tools (e.g., NABARD's Lendability Assessment framework) are internal, bank-facing, and invisible to the FPO itself.

This product is a **free, self-serve web app** where an FPO representative enters organizational/financial data and instantly receives a transparent 0–100 health score, a plain-language breakdown of what's driving it, a "what-if" simulator to test improvements, and a shareable PDF report suitable for a bank.

---

## 2. Goals & Non-Goals

**Goals:**
- Self-assessment in under 10 minutes, on mobile or desktop
- Fully transparent, explainable scoring (no black-box ML)
- Actionable, specific improvement guidance
- A shareable, professional report

**Out of Scope for MVP (do not build):**
- User accounts with passwords / full auth system
- Payment processing or any monetization
- Native mobile app
- Multi-language UI (structure text for future translation, but ship English-only)
- Any machine-learning-based scoring — must stay deterministic and explainable
- Real integration with actual banks or NABARD systems
- Admin moderation tools (defer to Phase 2 if peer benchmarking is added)

---

## 3. Users & Personas

1. **FPO representative** (CEO, accountant, board member) — primary user, fills the form, wants a clear score and next steps
2. **Bank loan officer** — secondary, receives the shared PDF report as a quick pre-screening reference
3. **CBBO / researcher** — secondary, may use it across multiple FPOs for comparison

*(Note: this PRD spec's own rigor — explicit edge cases, defensible formulas, documented methodology — is itself useful evidence for an academic/CV audience. That audience doesn't "use" the software, so it's addressed in Section 22 rather than listed as a persona here.)*

---

## 4. Feature Set

### Phase 1 — MVP

| Feature | User Story | Acceptance Criteria |
|---|---|---|
| Multi-step input form | As an FPO rep, I want to enter my org's data step by step so it doesn't feel overwhelming | Given the form, When I complete all required fields and submit, Then I receive a score within 2 seconds and am redirected to my results page |
| Score calculation engine | As an FPO rep, I want a fair, explainable score | Given valid submission data, When the scoring function runs, Then it returns an overall score, 6 factor sub-scores, and a plain-language reason per factor |
| Results dashboard | As an FPO rep, I want to see my score and understand it visually | Given a calculated score, When I view the results page, Then I see the overall score + band, a chart of the 6 factors, and 2–3 specific improvement suggestions |
| What-if simulator | As an FPO rep, I want to test changes before acting on them | Given my results page, When I adjust a slider (e.g., add members), Then the score recalculates live without saving to my actual record until I confirm |
| Shareable PDF report | As an FPO rep, I want something professional to hand to a bank | Given a completed scorecard, When I click "Download Report," Then I get a clean PDF with FPO name, score, band, and factor breakdown |
| Save/revisit via link | As an FPO rep, I want to come back to my scorecard later without creating a password | Given a submission, When I save it, Then I get a unique private link that reloads my exact data and score |

### Phase 2

- Peer benchmarking (anonymized comparison vs. district/state/crop averages) — requires a critical mass of submissions
- Optional email capture to send the report/link automatically
- Basic full accounts (email + password) for FPOs managing multiple yearly submissions

### Phase 3 (Stretch)

- Hindi/regional language support
- PWA / offline-first form for low-connectivity areas
- Public aggregate map/dashboard of FPO health by region (research/CV showcase value)

---

## 5. Information Architecture (Sitemap)

```
/                      → Landing page (what this is, CTA to start)
/assess                → Multi-step input form
/results/[id]          → Results dashboard (score, chart, suggestions, simulator)
/results/[id]/report   → PDF generation endpoint (triggers download, not a page)
/benchmark             → (Phase 2) Peer comparison page
/about                 → Methodology explanation (your scoring logic, in plain language)
```

---

## 6. Page-by-Page UI Specification

### `/` — Landing Page
- Hero: one-line value prop + "Check Your FPO's Score" CTA button
- Short "How it works" (3 steps: Enter data → Get score → Improve & share)
- Trust note: "Your data stays private. Nothing is shared without your permission."

### `/assess` — Input Form
- Multi-step wizard (not one long form): Step 1 = Org basics, Step 2 = Membership, Step 3 = Financials (3-year revenue/cost), Step 4 = Products/diversification, Step 5 = Market linkage, Step 6 = Governance
- Progress indicator at top
- Each step validates before allowing "Next"
- "Back" always available without losing entered data
- Final step: "Calculate My Score" button
- States: empty (default), validation error (inline, field-level), submitting (spinner), error (submission failed — retry option)

### `/results/[id]` — Results Dashboard
- Top: Overall score (large number) + band label (Strong/Moderate/Developing/Early Stage) with a color indicator
- Radar or bar chart: 6 factor sub-scores
- Plain-language narrative block (template-generated, see Section 10)
- "Top improvement areas" — 2–3 cards, each naming the weakest factor + one concrete suggestion
- "What-If Simulator" section: sliders/inputs for the key adjustable variables, live-recalculating a preview score (clearly labeled "Preview — not saved" until confirmed)
- "Download Report" button
- "Save my link" — shows the private URL + copy button
- States: loading (skeleton), loaded, simulator-active (preview mode), error (submission not found)

### `/about` — Methodology Page
- Explains the 6 factors and why they matter, in plain language
- Explicitly states this is a self-assessment tool, not an official bank rating
- Good place to link your written methodology note (CV material — see Section 22)

---

## 7. Design System (Lightweight)

- **Typography:** one clean sans-serif (e.g., Inter), 2 weights max for MVP
- **Color palette:** neutral base (white/gray) + one primary accent (suggest an earthy green, fitting the agri theme) + score-band colors (red/amber/light-green/dark-green for the 4 bands)
- **Components needed:** Button (primary/secondary), Input field (text/number), Select dropdown, Multi-step progress bar, Card, Slider, Radar/bar chart wrapper, Toast/inline error message
- Mobile-first: single-column layouts, large tap targets, minimal text per screen (target users may be on small/older phones)

---

## 8. Data Model

```
FPOSubmission
- id                    UUID, primary key
- accessToken           string, unique, used for private-link retrieval (no login needed)
- fpoName               string, required
- state                 string, required
- district              string, required
- registrationType      enum ["Producer Company", "Cooperative", "Society"], required
- activeMembers         integer, required, > 0
- members2YrAgo         integer, required, >= 0 (0 allowed if FPO is < 2 years old — see Section 11 edge cases)
- revenueYear1          float, required, >= 0
- revenueYear2          float, optional (null if FPO too new)
- revenueYear3          float, optional (null if FPO too new)
- costYear1             float, required, >= 0
- costYear2             float, optional
- costYear3             float, optional
- products              JSON array of { name: string, revenueSharePct: float }, at least 1 entry required, percentages should sum to ~100
- activeBuyersCount      integer, required, >= 0
- contractSalesPct       float, required, 0–100
- estimatedPriceRealizationPct  float, optional, 0–100 (FPO's estimate of what share of the final consumer/retail price it captures — see Section 10, Market Linkage)
- auditedAccounts        boolean, required
- agmCountLastYear       integer, required, >= 0
- boardMeetingsLastYear  integer, required, >= 0
- email                  string, optional (for report delivery)
- createdAt              timestamp
- updatedAt              timestamp

ScoreResult
- id                    UUID, primary key
- submissionId          UUID, foreign key → FPOSubmission
- overallScore           float (0–100)
- band                   enum ["Strong", "Moderate", "Developing", "Early Stage"]
- membershipScore        float
- revenueStabilityScore  float
- costEfficiencyScore    float
- diversificationScore   float
- marketLinkageScore     float
- governanceScore        float
- narrativeSummary       text
- suggestions            JSON array of strings
- dataCompletenessFlag   boolean (true if fewer than 3 years of revenue data was available)
- calculatedAt           timestamp
```

**Note:** `products` is stored as JSON rather than a separate table to keep the MVP schema simple — fine for SQLite/Postgres JSON columns. A single combined `FPOSubmission` table (rather than a separate org-record + submission-history split) is a deliberate simplification consistent with the no-accounts access model in Section 12; revisit only if Phase 2 full accounts are built.

---

## 9. API Specification

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/fpo` | Create a new submission, calculate + persist score | None (public) |
| GET | `/api/fpo/:id` | Retrieve a submission + its score | Requires `accessToken` query param matching the record |
| PATCH | `/api/fpo/:id` | Update submission fields, recalculate + persist score | Requires matching `accessToken` |
| POST | `/api/score/simulate` | Stateless what-if calculation — takes a full submission payload (possibly modified), returns a score WITHOUT saving | None (public, rate-limited) |
| GET | `/api/fpo/:id/report` | Generate and stream a PDF report | Requires matching `accessToken` |
| GET | `/api/benchmark?district=&crop=` | (Phase 2) Return anonymized aggregate stats | None (public) |

**Example — POST /api/fpo request body (includes the optional price-realization field):**
```json
{
  "fpoName": "Sample FPO",
  "state": "Jharkhand",
  "district": "Ranchi",
  "registrationType": "Producer Company",
  "activeMembers": 150,
  "members2YrAgo": 120,
  "revenueYear1": 4200000,
  "revenueYear2": 3800000,
  "revenueYear3": 3500000,
  "costYear1": 3100000,
  "costYear2": 2900000,
  "costYear3": 2700000,
  "products": [{ "name": "Paddy", "revenueSharePct": 70 }, { "name": "Vegetables", "revenueSharePct": 30 }],
  "activeBuyersCount": 4,
  "contractSalesPct": 40,
  "estimatedPriceRealizationPct": 55,
  "auditedAccounts": true,
  "agmCountLastYear": 1,
  "boardMeetingsLastYear": 5
}
```

**Example — response (POST /api/fpo or /api/score/simulate):**
```json
{
  "id": "uuid-here",
  "accessToken": "token-here",
  "overallScore": 68.4,
  "band": "Moderate",
  "factorScores": {
    "membership": 72.5,
    "revenueStability": 85.1,
    "costEfficiency": 61.0,
    "diversification": 58.0,
    "marketLinkage": 55.0,
    "governance": 76.7
  },
  "narrativeSummary": "Your FPO shows stable revenue and solid governance, but relies heavily on a single crop and has limited buyer diversity...",
  "suggestions": [
    "Diversify beyond paddy — even one additional crop would meaningfully reduce risk",
    "Grow your buyer base beyond 4 active buyers to strengthen market linkage"
  ],
  "dataCompletenessFlag": false
}
```

---

## 10. Scoring Engine

Must be implemented as a single pure module (e.g. `lib/scoring.ts`) exporting one function: `calculateScore(submission) → ScoreResult`. No database access inside this function — it takes data in, returns a result, nothing else.

**Formulas and mathematical models:**

```
// Membership Strength (weight 15%)
retention_rate = members2YrAgo > 0 ? min(activeMembers / members2YrAgo, 1.5) : 1.0
size_score = min(activeMembers / 200, 1) * 50
retention_score = min(retention_rate, 1.2) / 1.2 * 50
membership_score = size_score + retention_score

// Revenue Stability (weight 20%) — based on the Coefficient of Variation (CV), the standard
// dispersion/risk measure used in farm income analysis: CV = std_dev / mean
available_years = [revenueYear1, revenueYear2, revenueYear3].filter(v => v != null)
mean_revenue = average(available_years)
std_dev = standard_deviation(available_years)
coefficient_of_variation = mean_revenue > 0 ? std_dev / mean_revenue : 1
revenue_stability_score = max(0, 100 - (coefficient_of_variation * 100))
// if available_years.length < 3, set dataCompletenessFlag = true

// Cost-to-Revenue Efficiency (weight 20%) — based on the Operating Ratio, a standard farm
// business analysis metric: Operating Ratio = operating costs / gross revenue (lower is better)
avg_cost = average of available cost years (matched to available revenue years)
avg_revenue = mean_revenue (from above)
operating_ratio = avg_revenue > 0 ? avg_cost / avg_revenue : 1
cost_efficiency_score = max(0, min(100, (1.1 - operating_ratio) / 0.4 * 100))

// Diversification (weight 15%) — based on the Herfindahl-Hirschman Index (HHI), the standard
// concentration/risk measure from industrial and agricultural economics:
// HHI = Σ(revenue_share_i)², ranges 0 (fully diversified) to 1 (single product)
hhi = sum((product.revenueSharePct / 100)^2 for each product in products)
diversification_score = (1 - hhi) * 100

// Market Linkage Strength (weight 15%) — buyer count and contract share as before, plus (if
// provided) the Farmer's Share of the Consumer Rupee: a standard agricultural marketing
// economics concept measuring how much of the final retail price the producer actually captures
buyer_score = min(activeBuyersCount / 10, 1) * 50
contract_score = (contractSalesPct / 100) * 50
if (estimatedPriceRealizationPct is provided):
  price_realization_score = min(max(estimatedPriceRealizationPct, 0), 100)
  market_linkage_score = (min(activeBuyersCount / 10, 1) * 30) + ((contractSalesPct / 100) * 30) + (price_realization_score * 0.4)
else:
  market_linkage_score = buyer_score + contract_score  // fallback: original 50/50 split, unchanged behavior

// Governance & Compliance (weight 15%)
audited_points = auditedAccounts ? 40 : 0
agm_points = min(agmCountLastYear / 1, 1) * 30
board_points = min(boardMeetingsLastYear / 4, 1) * 30
governance_score = audited_points + agm_points + board_points

// Overall — Weighted Composite Index method (the standard approach for constructing
// multi-dimensional socioeconomic/risk indices from heterogeneous sub-indicators)
overall = (membership_score * 0.15) + (revenue_stability_score * 0.20) +
          (cost_efficiency_score * 0.20) + (diversification_score * 0.15) +
          (market_linkage_score * 0.15) + (governance_score * 0.15)

// Band
band = overall >= 80 ? "Strong" : overall >= 60 ? "Moderate" : overall >= 40 ? "Developing" : "Early Stage"
```

**Economic basis of each factor** (cite these directly in your methodology note):

| Factor | Economic/statistical measure used | Note |
|---|---|---|
| Revenue Stability | Coefficient of Variation (CV) | Standard dispersion/risk measure in farm income analysis |
| Cost Efficiency | Operating Ratio | Standard farm business analysis metric (opex / gross revenue) |
| Diversification | Herfindahl-Hirschman Index (HHI) | Standard concentration measure, industrial & agricultural economics |
| Membership Strength | Retention rate + scale | Simple demographic ratio, not a named econ index |
| Market Linkage | Buyer count + contract share + Farmer's Share of the Consumer Rupee | Third component is a standard ag-marketing economics concept (farm price / retail price capture); optional field, falls back to buyer+contract only if not provided |
| Governance | Compliance heuristic | Not econometric — a proxy for institutional maturity |
| Overall composite | Weighted Composite Index method | Standard technique for combining heterogeneous sub-indicators into one score |

**Worked example** (ties directly to Appendix A, Profile 3 — Mid-stage, moderate FPO, with price realization data):
```
HHI = 0.70² + 0.30² = 0.49 + 0.09 = 0.58  →  diversification_score = (1 - 0.58) * 100 = 42
CV  = std_dev([4.2M, 3.8M, 3.5M]) / mean([4.2M, 3.8M, 3.5M]) ≈ 0.362M / 3.83M ≈ 0.0945
      → revenue_stability_score = 100 - 9.45 ≈ 90.5
Operating Ratio = avg_cost / avg_revenue = 2.9M / 3.83M ≈ 0.757
      → cost_efficiency_score = (1.1 - 0.757) / 0.4 * 100 ≈ 85.8
Market Linkage (with estimatedPriceRealizationPct = 55):
      = (min(4/10,1)*30) + (0.40*30) + (55*0.4) = 12 + 12 + 22 = 46
```
*(These are illustrative hand-calculations for sanity-checking the implementation — the unit tests in Section 16 should assert the same numbers.)*

**Narrative & suggestions:** generate from a template keyed to the two lowest-scoring factors — e.g., a lookup table mapping each factor + score range to a pre-written sentence. Keep this deterministic (no free-text LLM generation) for MVP so output is consistent and explainable.

---

## 11. Business Rules & Edge Cases

- **FPO younger than 3 years:** allow `revenueYear2`/`revenueYear3` (and matching cost fields) to be null. Scoring engine must handle 1 or 2 available years gracefully and set `dataCompletenessFlag: true`. Show a note on the results page: "Limited financial history — score may refine as more data is added."
- **Zero or missing revenue:** block submission with a validation error; revenue for at least one year is mandatory (can't divide by zero in cost ratio).
- **Products percentages don't sum to ~100:** show a soft validation warning (not a hard block) asking the user to check their numbers.
- **New FPO with `members2YrAgo = 0`:** treat retention rate as 1.0 (neutral) rather than dividing by zero.
- **Simulator vs. saved record:** the what-if simulator must never overwrite the saved submission unless the user explicitly clicks "Save these changes" — always default to preview-only.
- **`estimatedPriceRealizationPct` not provided:** Market Linkage falls back to the original buyer-count + contract-share split (50/50) — never block submission on this field being missing, since many FPOs won't know their retail-price comparison.

---

## 12. Access Model (No Full Auth for MVP)

- No passwords. On submission, generate a random `accessToken` and return it as part of the private results URL (e.g. `/results/{id}?token={accessToken}`).
- This token is required to view/edit/download that submission — treat it like a bearer secret (don't log it, don't expose it in analytics).
- Optional: capture an email at submission time purely to send the link/report — not used for login.
- Phase 2 can add real accounts if multi-year submission history per FPO becomes a priority.

---

## 13. Security & Data Handling

- All traffic over HTTPS.
- Sanitize/validate all inputs server-side (not just client-side) before persisting or scoring.
- Rate-limit `/api/score/simulate` and `/api/fpo` (POST) to prevent abuse, since both are unauthenticated.
- Treat FPO financial data as confidential business data: don't expose raw submissions in any public endpoint. Only `/api/benchmark` (Phase 2) should ever return data, and only in anonymized/aggregated form.
- No unnecessary personal data collection — email is optional and single-purpose (report delivery), not used for tracking.

---

## 14. Non-Functional Requirements

- Target page load under 2–3 seconds on a typical 3G/4G rural connection — keep JS bundle lean, avoid heavy client-side libraries beyond what's listed in Section 15.
- Mobile-first responsive design (majority of users likely on phones).
- Basic accessibility: semantic HTML, labeled form fields, AA color contrast on score bands.
- Structure all UI copy as centralized strings (even though only English ships in MVP) so Phase 3 translation doesn't require a rewrite.

---

## 15. Tech Architecture

**Recommended stack (single repo, agent-friendly):**
- **Framework:** Next.js (App Router) + TypeScript — combines frontend + API routes in one project, easiest for an AI agent to scaffold coherently
- **Styling:** Tailwind CSS
- **ORM/DB:** Prisma + SQLite for local/dev, PostgreSQL (e.g. Neon or Supabase) for production
- **Charts:** Recharts
- **PDF generation:** `@react-pdf/renderer` (renders the report as a React component, exports to PDF server-side)
- **Hosting:** Vercel (frontend + API routes), with the Postgres DB hosted separately (Neon/Supabase free tier is enough for MVP)

**Suggested folder structure:**
```
/app
  /page.tsx                → landing
  /assess/page.tsx         → input form
  /results/[id]/page.tsx   → results dashboard
  /about/page.tsx
  /api/fpo/route.ts
  /api/fpo/[id]/route.ts
  /api/fpo/[id]/report/route.ts
  /api/score/simulate/route.ts
/lib
  /scoring.ts               → pure scoring engine (Section 10)
  /narrative-templates.ts   → suggestion/narrative generation
  /validation.ts            → shared server + client validation rules
/components
  /forms, /charts, /ui      → reusable UI pieces
/prisma
  /schema.prisma
```

**Environment variables needed:**
```
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

---

## 16. Testing Plan

- **Unit tests (priority — this is the credibility core of the product):** test `calculateScore()` against the sample profiles in Appendix A; assert exact expected sub-scores and overall score/band, including the worked example in Section 10.
- Edge case tests: zero `members2YrAgo`, only 1 year of revenue data, single-product FPO, `auditedAccounts: false`, `estimatedPriceRealizationPct` omitted (fallback path).
- Basic integration test: submit → receive score → retrieve via `accessToken` → matches.
- Manual QA: complete the full form flow on an actual mobile browser before considering MVP done.

---

## 17. Deployment Plan

1. Push repo to GitHub.
2. Connect to Vercel, set environment variables.
3. Provision a free-tier Postgres instance (Neon/Supabase), run `prisma migrate deploy`.
4. Verify `/assess` → `/results/[id]` flow end-to-end on the live URL before sharing with any real FPO.

---

## 18. Definition of Done (MVP Completion Checklist)

Phase 1 is complete when all of the following are true:

- [ ] A user can complete the input form in under 10 minutes
- [ ] Score output is generated in under 2 seconds with a clear factor-by-factor breakdown
- [ ] Every sample profile in Appendix A produces the expected score/band when run through the scoring engine
- [ ] The PDF report exports correctly and looks presentable enough to hand to a bank
- [ ] Save/revisit via the private access-token link works correctly
- [ ] The what-if simulator recalculates live and never overwrites the saved record without explicit confirmation
- [ ] Every Phase 1 feature in Section 4 passes its stated acceptance criteria

Do not begin Phase 2 until every box above is checked.

---

## 19. Success Metrics (Post-Launch Tracking)

Distinct from Section 18 — these are ongoing metrics to watch *after* MVP ships, not a completion gate:

- Form completion rate (started vs. finished)
- Average time to complete the form
- Number of unique submissions
- Distribution of scores/bands across submissions (useful both for tuning weights and for your CV write-up)

---

## 20. Roadmap

- **Phase 1 (MVP, ~2–3 weeks with AI-assisted build):** Sections 4 (Phase 1 row), 5, 6 (minus `/benchmark`), 8, 9 (minus benchmark endpoint), 10, 11, 12, 13, 15, 16, 17 — completion verified against Section 18
- **Phase 2 (~1–2 weeks):** Peer benchmarking, email capture, optional accounts
- **Phase 3 (stretch):** Localization, PWA/offline support, public aggregate dashboard

---

## 21. Open Questions (flag to the user, don't guess silently)

- Do you want the report to carry your name/IARI affiliation as "methodology by," for CV traceability?
- Should the `/about` methodology page be public from day one, or added once you're ready to publish your write-up?

---

## 22. Benefits Traceability Matrix

This section exists to answer one question directly: **does this PRD deliver the benefits of the product, in full?** Honest answer: it delivers everything software can deliver. A few benefits depend on what happens *after* the build — no PRD can specify those into existence, so they're marked accordingly rather than glossed over.

| Benefit | Delivered by this PRD? | Where |
|---|---|---|
| Free, instant self-assessment where none existed before | **Yes** | Sections 4, 10, 12 |
| Shows specific weak points, not just one opaque number | **Yes** | Sections 6, 10 |
| What-if prioritization before acting | **Yes** | Sections 4, 9, 11 |
| Professional PDF strengthens bank conversations | **Yes** | Sections 4, 15 |
| Zero-cost, no-login adoption barrier removed | **Yes** | Section 12 |
| Edge-case, field-aware design (new FPOs, thin data) | **Yes** | Section 11 |
| Honest scope — not framed as an official credit rating | **Yes** | Sections 2, 6 (`/about`) |
| Scoring grounded in named economic/statistical models, not ad-hoc heuristics | **Yes** | Section 10 (CV, Operating Ratio, HHI, Farmer's Share of Consumer Rupee, Weighted Composite Index) |
| Standardized snapshot reduces bank due-diligence effort | **Partially** — the artifact exists; whether banks actually use it isn't something software can guarantee | Section 9 (report endpoint) |
| Reduced information asymmetry between FPOs and lenders | **Partially** — same reasoning; requires real-world trust-building over time | N/A — outside build scope |
| Regional/district pattern insights | **Partially** — infrastructure is specced, but needs real submission volume post-launch | Section 4 Phase 2, Section 9 benchmark endpoint |
| Soft incentive for FPOs to formalize (audits, AGMs) | **Indirect** — the governance factor is designed to reward this, but it only works once real FPOs see and act on their scores | Section 10 |
| "Problem → solution → tested" narrative for your application | **No — outside PRD scope** | Requires you to pilot the live app with a real FPO |
| Primary data/evidence to cite in your motivation letter | **No — outside PRD scope** | Depends on adoption after launch, not the build |
| A written methodology note for your application | **No — outside PRD scope** | The formulas (Section 10, Appendix A) are the reasoning; turning them into prose is a separate writing task |

**Bottom line:** hand this PRD to Antigravity and you'll get a complete, working, credible product, with real economic models under the hood — every row marked Yes or Partially is fully specified and buildable. The rows marked "outside PRD scope" are the ones that need you: piloting it with a real FPO, and writing the methodology note. Both are worth doing once the app is live — happy to help draft either when you're ready.

---

## 23. Scaling & Validation Roadmap (Beyond MVP — Not for Initial Build)

This section is explicitly out of scope for the Phase 1 build (Section 2, Section 20) — it exists so growth beyond your own pilot has an honest, documented path instead of being left implicit.

1. **Empirical weight validation** — the current 15/20/20/15/15/15 weighting and score bands (Section 10) are theoretically grounded (CV, Operating Ratio, HHI) but not statistically calibrated. Once enough real submissions exist, weights should be validated against actual outcomes (loan approval/repayment data, where available) rather than left as fixed judgment calls.
2. **Regional/crop-specific weighting** — a single weight set may not fairly compare, e.g., a horticulture FPO in Maharashtra against a paddy-dominant FPO in Jharkhand. Future work: segment scoring profiles by state or primary crop category once submission volume supports it.
3. **Legal & compliance layer** — before collecting real financial data from real organizations at any scale, add: a privacy policy, explicit data-retention/deletion terms, and consent language on the `/assess` form. Not built or specced in Sections 1–22; required before wider-than-pilot use.
4. **Infrastructure scaling** — free-tier Vercel/Neon (Section 15) is sufficient for MVP and a small pilot. Beyond that: connection pooling, a dedicated Postgres instance, and CDN/caching for the `/benchmark` endpoint once traffic grows.
5. **Anti-gaming safeguards for peer benchmarking** — Phase 2's `/api/benchmark` (Section 4, Section 9) currently has no protection against fabricated or duplicate submissions skewing the "peer average." Future work: minimum-submission thresholds before showing a district/crop average, basic outlier detection, and possibly light verification (e.g., matching against NABARD/SFAC FPO registries) before a submission counts toward public benchmarks.

None of these block the Phase 1 build — they're the honest answer to "will this scale," documented so it isn't silently assumed away.

---

## Appendix A: Sample Test Profiles (for unit tests + manual sanity-check)

**Profile 1 — Established, diversified FPO:**
`activeMembers: 300, members2YrAgo: 250, revenue: [5.5M, 5.2M, 4.8M], cost: [3.8M, 3.6M, 3.4M], products: [Paddy 40%, Vegetables 35%, Pulses 25%], activeBuyers: 8, contractSalesPct: 60, estimatedPriceRealizationPct: 62, auditedAccounts: true, agm: 1, boardMeetings: 6`
→ Expect overall score in the "Strong" band (80+). HHI = 0.40²+0.35²+0.25² = 0.345 → diversification_score ≈ 65.5.

**Profile 2 — New, single-crop FPO:**
`activeMembers: 60, members2YrAgo: 0, revenue: [1.2M, null, null], cost: [1.0M, null, null], products: [Paddy 100%], activeBuyers: 1, contractSalesPct: 0, estimatedPriceRealizationPct: not provided, auditedAccounts: false, agm: 0, boardMeetings: 1`
→ Expect overall score in the "Early Stage" band (<40), `dataCompletenessFlag: true`. HHI = 1.0 → diversification_score = 0. Market Linkage uses the fallback (no price-realization field) path.

**Profile 3 — Mid-stage, moderate, with price-realization data:**
`activeMembers: 150, members2YrAgo: 120, revenue: [4.2M, 3.8M, 3.5M], cost: [3.1M, 2.9M, 2.7M], products: [Paddy 70%, Vegetables 30%], activeBuyers: 4, contractSalesPct: 40, estimatedPriceRealizationPct: 55, auditedAccounts: true, agm: 1, boardMeetings: 5`
→ Expect overall score in the "Moderate" band (60–79). Full worked calculation for this profile is in Section 10. (This matches the API example in Section 9.)

## Appendix B: Glossary (for agent + non-Indian reviewers)

- **FPO:** Farmer Producer Organization — a legal entity (Producer Company, Cooperative, or Society) collectively owned by farmers
- **NABARD:** National Bank for Agriculture and Rural Development — apex development bank overseeing FPO credit policy
- **CBBO:** Cluster Based Business Organization — implementing agencies that support FPO formation/growth
- **AGM:** Annual General Meeting — a governance compliance indicator
- **MSP:** Minimum Support Price — government-guaranteed crop price floor (referenced context, not directly used in this scoring model)
- **HHI:** Herfindahl-Hirschman Index — concentration measure, sum of squared market/revenue shares
- **CV:** Coefficient of Variation — standard deviation divided by the mean, a measure of relative dispersion
