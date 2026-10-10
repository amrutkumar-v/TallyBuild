# Team Handoff — Domain 4C Direction Correction

**Status:** Planning document (Phase 2J). No estimation engine is implemented here. Every
"proposed" item requires owner review before it becomes a commitment. This document does
**not** claim any missing feature is built.

**Repo:** `https://github.com/amrutkumar-v/TallyBuild.git`
**Branch:** `feature/phase-02d-frontend-integration`
**Base commit:** `1bebfa3` (Phase 02D integration)

> **Read this first.** The application in this repository today is a **construction
> building-material price calculator** (quantity × unit price → INR total). The official
> hackathon domain is **project / product-development cost estimation driven by effort, tools
> and history**. These are different problems. This document explains what exists, what is
> reusable, what must change, and how the team will split the work without overlapping on the
> same files.

---

## 1. Project purpose and official Domain 4C scope

**Official domain (supplied by the project owner):** *"AI for Cost Estimation of Building
Products"* — an AI-based cost-estimation capability for a project-management activity covering
personnel, tooling and other resources.

**Scope the supplied brief asks us to plan for:**

- Project scope and work breakdown structure (WBS).
- Personnel roles, person-hours, hourly rates and labour cost.
- Tooling, software licences and relevant vendor costs.
- Cloud / infrastructure costs.
- Project timelines and schedule estimates.
- Contingency, where justified and documented.
- Estimated-versus-actual cost and effort records.
- Historical project data as the estimation base.
- Estimation methods: regression / gradient boosting, analogy-based estimation, Monte Carlo,
  COCOMO II or other parametric estimation, LLM-assisted scope decomposition, resource
  optimization.
- External integrations: Jira, Microsoft Project, finance/ERP — **assessed, not assumed**.
- Confidence intervals and scenario planning.
- KPIs: MMRE, MdMRE, PRED(25), cost/schedule variance, personnel/resource cost error,
  estimation cycle-time reduction, within-budget rate, confidence calibration, estimation bias,
  historical analogy reuse.
- Currencies: **INR (₹), EUR (€), USD ($), AED (د.إ)**.

**Honesty rules (non-negotiable).** Do not claim every named technique or integration is
mandatory unless the supplied statement establishes it. Do not invent datasets, exchange rates,
benchmark results or model performance. Mark planned work as planned.

> **Interpretation note.** The owner's supplied description reframes Domain 4C as
> project/product-development cost estimation; this handoff follows that. The repo's current
> `README.md` still describes construction "building-product" estimation. Reconciling the two
> is an explicit open question (see §11). Nothing here should be read as the verbatim organizer
> rubric — that was not available to this phase.

---

## 2. What the existing application actually does today

Verified by reading the code (not inferred from names):

- React 19 + TypeScript (strict) SPA in `src/`, plus an **optional** FastAPI + Pydantic service
  in `backend/`. No database, no auth, no AI, no deployment config.
- The New Estimate screen fetches a **product catalogue** and posts **material lines** to
  `POST /api/v1/estimates/calculate`.
- The engine is **deterministic arithmetic**: `lineSubtotal = roundCurrency(quantity × unitPrice)`,
  `subtotal = roundCurrency(Σ lineSubtotal)`, `total = subtotal` (no tax, discount, contingency,
  personnel, schedule or currency conversion). Source of truth: `src/estimation/`; Python mirrors
  it in `backend/app/estimation/`.
- The catalogue is **9 illustrative construction materials**
  (`src/estimation/data/sampleProducts.ts`, `backend/app/estimation/sample_products.py`),
  currency **INR only**, all flagged `isIllustrative: true`.
- Endpoints today: `GET /api/v1/health`, `GET /api/v1/products`,
  `POST /api/v1/estimates/calculate`. No database, auth, import or AI endpoint.
- Comparison (`ComparisonPage.tsx`) and What-if (`WhatIfPage.tsx`) are **disabled placeholders**
  ("Coming soon"), not working features.
- Drafts persist to browser `localStorage` only (`src/store/EstimatesProvider.tsx`). No actuals,
  no historical records, no knowledge of person-hours, roles, tooling or infrastructure.
- Strong engineering assets: strict typing, validation, a typed API client, a shared TS↔Python
  golden fixture (`docs/fixtures/calculation-cases.json`), and 86 frontend + 72 backend tests.

**Bottom line:** a well-built calculator for the wrong domain. It computes material prices, not
project effort/cost.

---

## 3. What was discovered to be off-domain

| Area | Current reality | Why it is off-domain |
|---|---|---|
| Cost drivers | Quantity × material unit price | Brief needs personnel/tooling/infra/effort |
| Units | Material units (`bag`, `m3`, `tonne`…) | Brief needs person-hours, roles, days |
| Products | 9 construction materials | Brief needs projects, WBS, resources |
| Record model | `Estimate` = name/location/type/amount | Missing roles, effort, schedule, actuals |
| AI | None (deterministic only) | Brief centres on AI-assisted estimation |
| Uncertainty | None | Brief needs confidence intervals / scenarios |
| KPIs | None | Brief lists MMRE, MdMRE, PRED(25), etc. |
| Currency | INR only | Brief requires INR/EUR/USD/AED |
| Data | No history, no actuals | Brief needs historical project records |
| Integrations | None | Brief names Jira/MS Project/ERP |
| Persistence | Browser localStorage only | Real estimation needs stored history/actuals |

---

## 4. What must be preserved and reused

**Reuse without modification (verified by reading the code):**

- App shell & routing: `src/App.tsx`, `src/main.tsx`, `src/components/layout/*`
  (`AppShell`, `Sidebar`, `TopBar`).
- UI primitives: `src/components/ui/*` (`Button`, `LinkButton`, `Badge`, `SectionCard`,
  `SummaryCard`, `PageHeader`, `EmptyState`, `DemoNotice`, `Fields`, `SearchField`,
  `FilterChips`, `BrandMark`, `buttonStyles`).
- Design system: `src/styles/tokens.css`, `src/styles/base.css`.
- Helper: `src/utils/cn.ts`.
- API client transport pattern: `src/api/client.ts` (fetch wrapper + error mapping).
- Backend scaffold: `backend/app/main.py`, `backend/app/config.py`, `backend/app/errors.py`
  and the router layout.
- Testing/parity infrastructure: `vitest.config.ts`, `backend/pyproject.toml`,
  `backend/tests/conftest.py`, `backend/tests/factories.py`, and the shared-fixture mechanism
  (`docs/fixtures/` + `src/estimation/shared-fixture.test.ts` +
  `backend/tests/test_shared_fixture.py`).

**Reuse with domain adaptation:**

- `src/utils/format.ts` — INR-only formatting → must become 4-currency aware.
- `src/components/estimates/LineItemsEditor.tsx` — repeatable input rows → WBS/role/tooling rows.
- `src/components/estimates/EstimateResultCard.tsx` — line breakdown → cost breakdown + CI.
- `src/pages/NewEstimatePage.tsx` — orchestration flow (fetch → validate → calculate → save).
- `src/api/{types,estimates,products}.ts`, `src/store/{EstimatesProvider.tsx,estimates-context.ts}`.
- `src/constants/{navigation.ts,labels.ts}`.
- `src/types/index.ts`.

---

## 5. What must eventually be replaced or adapted

**Replace (domain-specific; see §5.1 for the file-level list):** the material catalogue, material
units, the quantity×price calculator, the material `Estimate` types, sample construction
estimates, and the material-oriented README/docs/API contract.

**Adapt:** the reusable UI and orchestration above, plus the API client and store.

> Removal must **not** happen in this phase. The current app must stay buildable with its tests.
> Any deletion is a separate, reviewed change with a migration plan.

### 5.1 Files that may later require replacement / adaptation / archival (Task 4)

These files are **construction-material-specific and could mislead** a new contributor. Listed
exactly; **none are changed here.**

**Replace or archive (material domain):**

- `src/estimation/data/sampleProducts.ts` — hard-coded 9 construction materials.
- `src/estimation/units.ts` / `src/estimation/units.test.ts` — material measurement units
  (`bag`, `m3`, `tonne`) and family rules.
- `src/estimation/catalogue.ts` — material catalogue construction/lookup.
- `src/estimation/calculate.ts` / `src/estimation/calculate.test.ts` — quantity × unitPrice logic.
- `src/estimation/types.ts` — `MaterialProduct`, `MeasurementUnit`, material request/result types.
- `src/estimation/index.ts` — barrel re-exporting the material core.
- `src/data/sampleEstimates.ts` — sample construction estimates.
- `backend/app/estimation/sample_products.py` — material catalogue (Python mirror).
- `backend/app/estimation/units.py` — material units (Python mirror).
- `backend/app/estimation/catalogue.py` — material catalogue (Python mirror).
- `backend/app/estimation/calculate.py` — quantity × unitPrice logic (Python mirror).
- `backend/app/routers/products.py` — material product endpoint.
- `backend/app/routers/estimates.py` — material calculate endpoint.
- `backend/tests/test_products.py`, `backend/tests/test_rounding.py`, `backend/tests/test_calculate.py`
  — material-domain tests (the rounding test may be partly reusable).
- `docs/estimation-engine.md`, `docs/api-contract.md`, `docs/phase-02-integration-plan.md`
  — document the material domain and could mislead.
- `README.md` — describes "construction / building-product" estimation.

**Adapt (structure reusable, content domain-specific):**

- `src/types/index.ts` — `ProjectType` (`residential|commercial|industrial|infrastructure`) and
  material `Estimate`; needs project/effort/actuals concepts.
- `src/constants/navigation.ts`, `src/constants/labels.ts` — construction labels.
- `src/pages/ComparisonPage.tsx`, `src/pages/WhatIfPage.tsx` — "building-product alternatives"
  and "material price scenarios"; repurpose for project/scenario comparison.
- `src/pages/DashboardPage.tsx`, `src/components/dashboard/*` — construction-oriented copy
  (verify content before reuse).
- `src/components/estimates/LineItemsEditor.tsx`, `EstimateResultCard.tsx`.
- `src/utils/format.ts` — INR-only.
- `src/api/{types,products,estimates}.ts`, `src/store/*`.
- `docs/fixtures/calculation-cases.json` + `src/estimation/shared-fixture.test.ts` +
  `backend/tests/test_shared_fixture.py` — material cases; keep the mechanism, replace the data.
- `AGENTS.md` — states the construction domain; should be updated once direction is approved.

**Unverified — requires inspection before reuse:** `backend/README.md`,
`docs/PHASE_02E_READINESS.md`, `docs/PHASE_02F_TESTING.md`, `docs/PHASE_02G_DECISION_PACKAGE.md`,
`docs/PROBLEM_VALIDATION.md` (untracked, must be preserved), and the exact copy in
`DashboardPage.tsx` / `components/dashboard/*`.

---

## 6. Target user workflow and high-level architecture

**Target workflow (proposed):**

1. Create a **project** (name, domain, target currency, timeline).
2. Build a **WBS** of tasks (optionally LLM-assisted from a scope description — assistive only).
3. Assign **roles and person-hours**; rates derive labour cost.
4. Add **tooling/licence** and **cloud/infrastructure** costs.
5. Apply **contingency** (documented basis).
6. Run the **estimator** → cost breakdown + **confidence interval**; optionally compare to the
   **analogy** candidates and the **parametric** baseline.
7. Explore **scenarios** (bounded uncertainty / alternatives) against a baseline.
8. Record **actuals** when the project finishes; compute **KPIs** (MMRE, MdMRE, PRED(25), variance,
   calibration, bias, analogy reuse).
9. **Display** the estimate in INR/EUR/USD/AED from a recorded rate snapshot.

**High-level architecture (proposed):**

```
React SPA (Owasis + owner)
  ├─ Project / WBS / resource / cost input UI
  ├─ Estimate breakdown + confidence + scenario views
  └─ typed API client (reuse src/api/client.ts)
        │  REST /api/v1  (JSON)
        ▼
FastAPI service (Manju + Harshit)
  ├─ Deterministic cost engine  (labour + tooling + infra + contingency)
  ├─ Parametric (COCOMO II-style) estimator
  ├─ ML / analogy estimator + uncertainty (Monte Carlo / residual CIs)
  ├─ KPI / metrics evaluation
  └─ Currency conversion service (rate snapshot; separate from estimation)
        │
        ▼
Persistence + historical data (Sambram)
  ├─ projects, WBS, roles, allocations, tooling, infra
  ├─ estimates, actuals
  ├─ historical records (imported)
  └─ exchange rates (rate + effective date + source)
```

**Separation principle:** the estimator never performs currency conversion; conversion is a
display/derivation layer over an immutable base estimate.

---

## 7. Proposed domain concepts and data fields (needs review)

All entities below are **proposed**, to live in shared TS types and Python/pydantic schemas.

| Concept | Key fields (proposed) |
|---|---|
| **Project** | id, name, description, domain, targetCurrency, status, createdAt |
| **WBS / WorkItem** | id, projectId, parentId, phase, name, sizeMetric{type, value}, dependencies |
| **Role** | id, name, category, location, hourlyRate (Money) |
| **ResourceAllocation** | id, projectId, workItemId, roleId, personHours, rateSnapshot, derivedLabourCost |
| **ToolingCost** | id, projectId, name, vendor, type (licence/subscription/one-off), quantity, unitCost, period |
| **InfrastructureCost** | id, projectId, provider, resource, monthlyCost, durationMonths |
| **Contingency** | id, projectId, basis (percent/fixed), value, rationale |
| **Estimate** | id, projectId, method (parametric/ml/analogy), modelVersion, currency, labour/tooling/infra/contingency/total, confidence {low, high, level}, inputsHash |
| **Actual** | id, projectId, actualTotalCost, actualLabourCost, actualEffortHours, actualScheduleDays, recordedAt |
| **HistoricalRecord** | projectId, domain, language, size, roles+hours, effortTotalHours, scheduleDays, tooling/infra cost, currency, actualTotalCost, actualEffortHours, dates |
| **ExchangeRate** | base, quote, rate, effectiveDate, source, fetchedAt |
| **MetricRun** | id, modelVersion, datasetHash, splitPolicy, mmre, mdmre, pred25, coverage, bias, n |

**Cost identity (deterministic base):** `base = labour + tooling + infra`;
`total = round(base × (1 + contingency%))` or `+ fixed`. Reuse the existing rounding/money
conventions (`roundCurrency`) so behaviour stays consistent and testable.

**Scope note:** requirements A–F in the owner brief (cost model, AI techniques, historical data,
KPIs, uncertainty, currency) are the non-negotiable boundaries. Techniques (regression, gradient
boosting, analogy, Monte Carlo, COCOMO II, LLM decomposition, resource optimization) are
**assessed**, not assumed mandatory. A deterministic breakdown **must not** be labelled an AI
estimator.

---

## 8. INR / EUR / USD / AED conversion policy (proposed)

**Required:** support all four; store original; display in any; compare all four; documented rate
source; record rate + effective date; consistent breakdown conversion; conversion separated from
estimation; honest stale/unavailable handling; no invented live rates; conversion must not change
the underlying estimate.

**Policy:**

- Money = `{ amount: Decimal, currency: "INR" | "EUR" | "USD" | "AED" }`. The stored estimate keeps
  its **original currency and amount unchanged**; estimation always runs in that currency.
- **`ExchangeRate` store** (`base→quote`, `rate`, `effectiveDate`, `source`, `fetchedAt`). Source is
  a **documented** provider chosen and recorded by the owner (e.g. a central-bank reference series).
  Rates are seeded/refreshed explicitly; **no assumption of live fetching**, no fabricated values.
- **Conversion service** (pure, separate module): converts via a base currency using a single rate
  snapshot; converts each breakdown component and reconciles the total (documented rounding rule);
  never mutates the stored estimate.
- **Compare all four:** render the same immutable estimate in INR/EUR/USD/AED from one snapshot,
  each labelled with rate + date + source.
- **Stale/unavailable:** show the original amount with an explicit "rate unavailable / stale as of
  `<date>`" state; disable converted figures rather than guessing.
- **Test guarantee:** converting must not alter `Estimate.total`.

---

## 9. AI estimation, uncertainty and KPI requirements (planned)

**AI / estimation layers:**

- Deterministic base breakdown (arithmetic — **not** AI).
- COCOMO II-style parametric estimator (explainable baseline).
- ML regression / gradient boosting (size, team, domain, cost profile → cost/effort); reproducible
  (fixed seed, pinned versions, model version recorded).
- Analogy estimation (k-NN over normalised historical projects) with candidate reuse.
- Uncertainty: residual-based confidence intervals and Monte Carlo over key drivers.
- LLM-assisted WBS (optional, assistive, human-reviewed) — credentials not assumed.
- Resource optimization (optional / stretch).

**Uncertainty:** only statistically derived ranges may be called "confidence intervals"; arbitrary
ranges must be labelled as assumptions/scenarios.

**KPIs (all addressed; compute only from valid data):**

| KPI | Definition (proposed) |
|---|---|
| MMRE | mean of `|actual − est| / actual` |
| MdMRE | median of the same |
| PRED(25) | % of estimates within 25% of actual |
| Cost variance | `(est − actual) / actual` |
| Schedule variance | `(estDays − actualDays) / actualDays` |
| Personnel cost error | per-role / total labour error |
| Estimation cycle time | measured manual baseline vs tool time (mark unverified if unmeasured) |
| % within budget | % projects with `actual ≤ estimate` |
| CI calibration | coverage = % actuals within predicted interval |
| Estimation bias | mean signed error |
| Analogy reuse | % estimates with ≥1 valid historical neighbour |

Validate on a held-out split (hash by `projectId`) or k-fold CV; store each result in `MetricRun`
with `datasetHash` + `modelVersion`. **Do not report numbers until computed.** Never invent accuracy.

---

## 10. Dataset provenance, licensing and evaluation limitations

**Facts must be verified by the owner before use — nothing below is assumed accessible.**

| Source (named in brief) | Nature (verify) | Notes |
|---|---|---|
| ISBSG | Commercial software benchmarking dataset | Licensed/subscription; redistribution restricted |
| COCOMO / COCOMO II | Classic effort datasets / parametric model | Historical data may be public; verify terms |
| Desharnais | Classic software-effort dataset (~81 projects) | Small; often via research repositories |
| SEERA | Named in brief; specific meaning/archive unverified | Requires clarification |
| Organizer dataset | Preferred, authoritative | Ask organizers |
| Labelled **synthetic** | Generated from a documented process | Demo only; **never** real validation evidence |

**Limitations:** provenance and licence must be confirmed; sample sizes may be small (use
cross-validation); currency/unit normalisation required; missing-value policy required. **CSV
import/export** is a fallback for integrations **only if** the rubric permits, and must not be
presented as a live integration. Jira/Microsoft Project/ERP integration environments and
credentials are **not assumed to exist**.

---

## 11. Risks, unresolved questions and assumptions

**Risks:** wrong domain reading; dataset not accessible/licensed; "AI mandatory" unconfirmed;
integrations impossible without credentials; KPI formula/split ambiguity; scope creep across many
techniques; exchange-rate staleness.

**Unresolved questions (owner):**

1. Verbatim Domain 4C statement + rubric/weights (not available this phase).
2. Which techniques are mandatory vs suggested/scored?
3. Dataset access, licence and exact "SEERA" meaning.
4. Are Jira/MS Project/ERP environments/credentials available?
5. Exact KPI formulas, thresholds and required train/test split.
6. Documented exchange-rate source and refresh policy.
7. Reconciling the README's "construction building products" framing with the supplied
   project-cost description.

**Assumptions:** the existing shell/UI kit/API scaffold/test harness are reusable; the deterministic
calculator becomes the transparent base engine; the 6 sample estimates are UI-only; the estimation
domain layer (not the app) is what gets replaced.

---

## 12. Team ownership and integration dependencies

| Person | Role | Owns |
|---|---|---|
| **Manju** | Backend | Cost engine (deterministic), estimator/model service, estimator API endpoints |
| **Harshit** | Backend | Historical-data import + validation, currency conversion service, metrics/KPI endpoints |
| **Sambram** | Database design & data modelling | Schemas, migrations, historical/actuals persistence, `ExchangeRate` store |
| **Owasis** | UI/UX | Screens for project/WBS/resource/cost input, breakdown, scenario, KPI dashboard |
| **Project owner** | UI/UX + frontend coordination, prompt writing, integration oversight, review | Frontend coordination, shared TS types, API client, review/approval gates |

**Boundary rule:** one owner per file. Backend files → Manju/Harshit. Data schema/migrations →
Sambram. Frontend screens/components → Owasis; shared frontend types/client/coordination → owner.
Cross-cutting contracts (below) are agreed **before** edits begin; no two people edit the same file
concurrently.

---

## 13. Proposed integration contracts (Task 3)

All contracts below are **proposed** and need owner/team approval. Format: REST + JSON under
`/api/v1`, mirroring the existing envelope in `backend/app/errors.py`. Shared TS types live in
`src/types/` (owner-coordinated); server schemas in `backend/app/schemas.py` (backend-owned).

| # | Contract | Owner | Status |
|---|---|---|---|
| C1 | **Project & WBS** — `ProjectDTO`, `WorkItemDTO`; `POST/GET /projects`, `/projects/{id}/wbs` | Sambram (schema) + Manju (endpoints) | Proposed |
| C2 | **Personnel & rates** — `RoleDTO`, `ResourceAllocationDTO` | Sambram + Manju | Proposed |
| C3 | **Tooling & infrastructure** — `ToolingCostDTO`, `InfrastructureCostDTO` | Sambram + Harshit | Proposed |
| C4 | **Estimate request/response** — `EstimateRequestDTO`, `EstimateResultDTO` (breakdown + method + CI) | Manju | Proposed |
| C5 | **Currency** — `MoneyDTO`, `ExchangeRateDTO`; `GET /rates`; conversion in the display layer | Harshit (service) + owner (client) | Proposed |
| C6 | **Historical import** — `HistoricalProjectDTO`; `POST /import/history` (CSV first) | Harshit + Sambram | Proposed |
| C7 | **Actuals** — `ActualDTO`; `POST/GET /projects/{id}/actual` | Harshit + Sambram | Proposed |
| C8 | **KPIs** — `MetricRunDTO`; `GET /metrics` | Harshit | Proposed |
| C9 | **Uncertainty** — `ConfidenceIntervalDTO` embedded in estimate result | Manju | Proposed |
| C10 | **Scenario** — `ScenarioRequestDTO` / `ScenarioResultDTO` | Manju + Owasis | Proposed |

**How contracts get agreed (process):** the owner drafts/updates the shared TS types and this
document; backend owners mirror them in `schemas.py`; both sides confirm with a shared golden
fixture (reuse the existing `docs/fixtures/` mechanism + `test_shared_fixture.py` /
`shared-fixture.test.ts`) so TS and Python cannot drift. Errors reuse the existing envelope;
domain codes are additive and documented. No endpoint is implemented until its contract row is
approved.

---

## 14. Dependency-ordered implementation phases

| Phase | Depends on | Scope | Primary owners |
|---|---|---|---|
| **A — Clarification** | — | Verbatim brief/rubric, dataset access, rate source, AI mandate, integration availability | Owner |
| **B — Domain model + deterministic engine** | A | New types (TS+Python), labour/tooling/infra/contingency cost identity, shared fixture, tests | Manju (engine), Sambram (schema), owner (types) |
| **C — Historical data layer** | B | Schema, migrations, dataset acquisition/seed (real + labelled synthetic), import + validation | Sambram, Harshit |
| **D — AI estimator + uncertainty** | C | Parametric + gradient boosting + analogy, confidence intervals, Monte Carlo, reproducible API | Manju (ML), Harshit (API) |
| **E — KPIs + actuals** | D | Metrics module (MMRE/MdMRE/PRED(25)/variance/calibration/bias/analogy), actuals capture, evaluation UI | Harshit (metrics), Owasis (UI) |
| **F — Multi-currency** | B | Money model, rate store + source, conversion service, 4-currency compare, stale handling | Harshit (service), owner (client), Owasis (UI) |
| **G — Scenario planning** | D/F | Baseline vs scenario comparison; optional resource optimization | Manju, Owasis |
| **H — Integrations** | C | Jira/MS Project/ERP **if** available; else CSV fallback (labelled) | Harshit |
| **I — Polish / deploy** | all | Checks, manual smoke, demo, labelling | All |

---

## 15. Acceptance criteria per phase

| Phase | Acceptance criteria |
|---|---|
| **A** | Owner supplies the verbatim brief/rubric; dataset access, rate source, AI mandate and integration availability are confirmed or explicitly deferred. |
| **B** | TS+Python engines agree on a shared fixture; each cost element unit-tested; `typecheck`, `lint`, `test`, `build` and backend `pytest`/`ruff` green; UI shows a cost breakdown; material logic removed from the live path. |
| **C** | Import accepts a defined schema, rejects invalid rows with reasons; each dataset records provenance + real/synthetic label; currency normalisation recorded; migrations reversible. |
| **D** | Estimator returns point estimate + interval; fixed-seed reproducible; model version + `inputsHash` stored; no AI label on deterministic-only output. |
| **E** | MMRE/MdMRE/PRED(25)/variance computed on a held-out split and stored in `MetricRun`; dashboard shows n, split, source, label; no hard-coded numbers. |
| **F** | 4-currency model implemented; estimate stored in original currency; displays in all four with rate+date+source; conversion leaves the estimate unchanged (asserted by a test); stale rates shown, not fabricated. |
| **G** | Scenario diff computed from the same engine; optimizer (if built) documented and optional. |
| **H** | Integration works only where credentials/environment verified live; otherwise CSV path labelled as fallback. |
| **I** | All repo checks green; manual smoke documented. |

**Recommended next implementation phase:** Phase B (domain model + deterministic engine),
**conditional on owner approval and Phase A clarifications**.

**Confirmation for this phase:** no estimation engine was implemented; the only intended new file
is this document; the pre-existing untracked `docs/PROBLEM_VALIDATION.md` is preserved. Exact Git
status and the commit are reported in the phase summary.

---

## Smallest credible hackathon MVP

Respecting the boundaries: a **deterministic cost breakdown** (labour + tooling + infrastructure +
documented contingency from a WBS) **plus one real estimator** (gradient boosting **or** analogy on
a real, or clearly-labelled synthetic, historical dataset) **plus confidence intervals**, a validated
**MMRE/MdMRE/PRED(25) + variance** report on a held-out split, **INR/EUR/USD/AED display** from a
documented rate snapshot, and a **single scenario compare**. COCOMO II, LLM decomposition, resource
optimization and live integrations are stretch/optional pending clarification.
