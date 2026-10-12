# Integration Readiness & Product Contract — TallyBuild AI (Domain 4C)

**Status:** Coordination artifact for team review. **Proposal only.** Nothing in this
document is implemented, tested or approved. No application code was changed to produce it.
It is left **uncommitted** until the team (and Amrut) explicitly agree.

**Purpose:** give the five-person team one shared picture of (1) the exact repository state,
(2) a draft product contract with example API payloads, (3) who owns which files, (4) the
minimum demo, (5) what is still undecided, and (6) the order in which work integrates.

> **Honesty banner.** This repository currently ships a *deterministic, construction-material*
> estimation demo (Phases 00–02D) plus a **paused, unverified, non-compiling** partial migration
> toward software-development estimation on branch `wip/software-estimation-migration`. There is
> **no** AI, LLM, historical dataset, database, auth, live FX or prediction service anywhere in
> the repo. Every shape and payload below is a **proposal**. Do not present anything here as
> working, validated or accurate.

> **Scope risk (unresolved).** The hackathon domain title is *"AI for Cost Estimation of
> Building Products"* while the supplied product brief and references describe *software*
> development cost estimation. The official statement/rubric could not be located. Do **not**
> treat the software interpretation as officially confirmed. See §7.

---

## 1. Repository state report (verified this session)

**Branch & history**

| Ref | Commit | Tracks origin? |
| --- | --- | --- |
| `main` | `b773df4` | yes (`origin/main`) |
| `feature/phase-01-ui-foundation` | `9defe33` | yes |
| `feature/phase-02-estimation-core` | `d0365c1` | yes |
| `feature/phase-02c-backend-api` | `eba0878` | yes |
| `feature/phase-02d-frontend-integration` | `121893a` | yes (unchanged) |
| **`wip/software-estimation-migration` (checked out)** | **`07faa05`** | yes |

**Working tree:** clean except two **untracked** docs — `docs/INTEGRATION_COORDINATION.md`
(new) and `docs/PROBLEM_VALIDATION.md` (pre-existing audit). No stashes. Nothing staged.

**Verified current state**

- `origin` = `https://github.com/amrutkumar-v/TallyBuild.git`; all six branches exist on origin.
- The **only** code that is committed-and-pushed as "wip" is `07faa05` on the WIP branch
  (43 files: 31 modified, 8 deleted, 4 added, parent `121893a`). It is **unverified**:
  `tsc -b` fails, so `npm run typecheck`, `npm test` and `npm run build` do **not** pass on it.
- `main` and the four `feature/*` branches still hold the **material-domain** app; the last
  fully green state on disk is `feature/phase-02d-frontend-integration` (`121893a`).
- The `backend/` service is **untouched** — still material units / product catalogue / quantity
  × price.
- No AI/ML, no historical data, no DB, no auth, no live FX, no Jira/ERP integration anywhere.

**Environment / tooling (unchanged)**

- Frontend: Vite + React + TS (strict, `verbatimModuleSyntax`), Vitest (node env, `.test.ts`
  only — no JSX/component-render libs), ESLint.
- Backend: FastAPI + Pydantic, pytest + ruff, Python 3.14 (`backend\.venv`).

**Checks status:** not re-run since the WIP edits. The material-domain baseline was green
(typecheck 0 / lint 0 / 86 frontend tests / 72 backend tests). The WIP branch is **not** green.

---

## 2. Draft product contract (for approval — not implemented)

### 2.0 Product concept

A **conversational** assistant for estimating the cost of building/developing software:

> user describes the work → assistant asks clarifying questions → together they decompose it
> into **features → tasks** → the assistant proposes **effort, team/staffing, timeline and
> cost** → the app shows **feature-wise and resource-wise** breakdowns, explicit **assumptions**,
> an **uncertainty range**, and a **cumulative spending timeline** → the user keeps chatting,
> tweaks scope/rates/team and **re-estimates**, and can run **what-if scenarios**.

**Hard separation (central rule for this project):**

- The **assistant** (AI) only *interprets* natural language and proposes a *draft* feature/task
  breakdown, clarifying questions and narrative. It **never** owns authoritative numbers.
- The **deterministic engine** performs **all** arithmetic (effort, cost, totals, timelines) and
  emits the numbers + assumptions the UI displays.
- Any number shown must be traceable to a deterministic estimate result. The assistant may
  *reference* a number; it may not *invent* one.
- A deterministic breakdown **must never** be labelled an "AI estimate".

### 2.1 Core entities (proposed shared TS types + Pydantic mirrors)

All money is the `Money` object described in §2.4. All ids are opaque strings.

| Entity | Key fields (proposed) |
| --- | --- |
| **Project** | `id`, `name`, `shortDescription`, `domain`, `targetCurrency: CurrencyCode`, `status: 'draft'\|'estimating'\|'complete'`, `createdAt` (ISO UTC) |
| **ConversationTurn** | `id`, `projectId`, `role: 'user'\|'assistant'`, `text`, `referencedFeatureIds: string[]`, `createdAt` |
| **Feature** | `id`, `projectId`, `parentId: string\|null`, `name`, `description`, `category`, `origin: 'ai-draft'\|'user-edited'\|'user'`, `dependencies: string[]` |
| **Task** | `id`, `featureId`, `name`, `roleId`, `personHours` (> 0), `notes?` |
| **Role** | `id`, `name`, `category`, `location`, `hourlyRate: Money` |
| **Assumption** | `id`, `projectId`, `kind: 'scope'\|'rate'\|'productivity'\|'timeline'\|'risk'\|'other'`, `text`, `source: 'user'\|'engine'\|'assistant-draft'` |
| **Estimate** | `id`, `projectId`, `method: 'deterministic'\|'parametric'\|'analogy'\|'ml'`, `modelVersion: string`, `currency: CurrencyCode`, `effort {personHours, personDays, fteMonths}`, `cost {labour, tooling, infrastructure, contingency, total}`, `range {low, likely, high}`, `timeline {durationWeeks, milestones: Milestone[]}`, `assumptions: Assumption[]`, `inputsHash`, `createdAt` |
| **Milestone** | `id`, `projectId`, `name`, `targetDate: string\|null`, `effortShare: number` (0–1) |
| **Scenario** | `id`, `projectId`, `baseEstimateId`, `name`, `changes: ScenarioChange[]`, `resultEstimateId` |
| **ScenarioChange** | `field` (e.g. `"roleId:backend"`, `"featureId:X.personHours"`), `from`, `to`, `rationale` |
| **HistoricalRecord** | `id`, `domain`, `language`, `size`, `effortHours`, `scheduleDays`, `cost: Money`, `actual: {cost: Money, effortHours, scheduleDays}`, `dataOrigin: 'sample'\|'imported'\|'real'`, `provenanceNote` |
| **ExchangeRate** | `base: CurrencyCode`, `quote: CurrencyCode`, `rate` (> 0), `effectiveDate` (`YYYY-MM-DD`), `source`, `fetchedAt` |

`dataOrigin` and `priceSource.isIllustrative` (existing pattern) are **mandatory**: synthetic
demo data must be labelled everywhere and can never be used as validation evidence.

### 2.2 Deterministic cost identity (reuse existing money/rounding)

```
labour         = Σ over tasks (personHours × role.hourlyRate)
tooling        = Σ tooling line amounts
infrastructure = Σ (monthlyCost × months)
base           = labour + tooling + infrastructure
contingency    = base × contingencyPct        // pct + rationale recorded, never invented
total          = roundCurrency(base + contingency)
```

- `roundCurrency` = existing half-up, 2-dp expression; applied **per line, per subtotal, then to
  the total**, identical in TS and Python (see `docs/api-contract.md` §4.4 and §9).
- `fteMonths`/`durationWeeks` derive from `personHours` and an **explicit, editable**
  `hoursPerWeek` + `teamSize` assumption — the derivation is shown, not hidden.

### 2.3 The low / likely / high range

| Field | Meaning | How produced (allowed methods) |
| --- | --- | --- |
| `range.likely` | the deterministic point estimate | deterministic engine only |
| `range.low` / `range.high` | a documented band | `'assumption'` or `'statistical'` — **must be tagged** |

- `range.method: 'assumption-spread'` → driven by user/engine-assumed **variance** (e.g. ±X%),
  labelled as an *assumption/scenario band*, **never** a confidence interval.
- `range.method: 'statistical'` → only if derived from real historical residuals / a real
  model, with `n`, `modelVersion`, `datasetHash` recorded. Until such data exists, statistical
  ranges are **not available** and the UI must say so.

### 2.4 Currency policy (no silent mixing)

- `Money = { amount: number, currency: CurrencyCode }`, `CurrencyCode = 'INR'|'USD'|'EUR'|'AED'`.
- One `targetCurrency` per project; the engine computes entirely in that currency.
- **No implicit conversion** and **no invented FX**. Conversion (if ever added) is a *separate,
  pure display layer* over an immutable original estimate, using a recorded `ExchangeRate`
  snapshot; it must never mutate `Estimate.total`.
- Unavailable/stale rates → show the original amount and an explicit
  "rate unavailable / stale as of `<date>`" state; disable converted figures.

### 2.5 Candidate endpoints (proposal)

| Endpoint | Class | Notes |
| --- | --- | --- |
| `GET /api/v1/health` | MVP | capabilities incl. `currencies`, `methods`, `aiConfigured: false` |
| `GET /api/v1/roles` | MVP | rate card (roles + `hourlyRate: Money`), eventually backend-owned |
| `POST /api/v1/estimates/calculate` | MVP | **deterministic**; mirrors the TS core exactly |
| `POST /api/v1/scenarios/compare` | Stretch | pure; base + changes → deltas |
| `POST /api/v1/conversations/messages` | Deferred | AI assistant boundary — **not configured**; behind an adapter, key never in repo |
| `POST/GET /api/v1/projects` etc. | Deferred | persistence (Phase 04 / Sambram) |

**All non-2xx responses reuse the existing envelope** (`docs/api-contract.md` §6):
`{ "error": { "code": ApiErrorCode, "message": string, "details"?: [...] } }`. New domain codes
must be added deliberately and mirrored in TS + Python **in the same reviewed change**; do not
rename or silently drop existing codes.

### 2.6 Example payloads (illustrative demo numbers only)

`GET /api/v1/health` → 200

```json
{
  "status": "ok",
  "service": "tallybuild-api",
  "version": "0.1.0",
  "timestamp": "2026-10-11T09:00:00.000Z",
  "capabilities": {
    "currencies": ["INR", "USD", "EUR", "AED"],
    "methods": ["deterministic"],
    "aiConfigured": false,
    "historicalData": "not available"
  }
}
```

`POST /api/v1/estimates/calculate` request (deterministic)

```json
{
  "projectName": "Demo online store",
  "currency": "INR",
  "contingencyPct": 10,
  "teamSize": 3,
  "hoursPerWeek": 40,
  "personnel": [
    { "role": "Backend Engineer", "people": 1, "hours": 240, "hourlyRate": 1200 },
    { "role": "Frontend Engineer", "people": 1, "hours": 200, "hourlyRate": 1100 }
  ],
  "tooling": [{ "name": "Design suite (annual)", "amount": 24000 }],
  "infrastructure": [{ "name": "Cloud hosting", "monthlyCost": 9000, "months": 3 }],
  "other": []
}
```

`POST /api/v1/estimates/calculate` → 200 (shape TBD by the team; numbers illustrative)

```json
{
  "projectName": "Demo online store",
  "currency": "INR",
  "personnel": {
    "lines": [
      { "role": "Backend Engineer", "people": 1, "hours": 240, "hourlyRate": 1200, "cost": 288000 },
      { "role": "Frontend Engineer", "people": 1, "hours": 200, "hourlyRate": 1100, "cost": 220000 }
    ],
    "subtotal": 508000
  },
  "tooling": { "lines": [{ "name": "Design suite (annual)", "amount": 24000, "cost": 24000 }], "subtotal": 24000 },
  "infrastructure": { "lines": [{ "name": "Cloud hosting", "monthlyCost": 9000, "months": 3, "cost": 27000 }], "subtotal": 27000 },
  "other": { "lines": [], "subtotal": 0 },
  "personnelCost": 508000,
  "toolingCost": 24000,
  "infrastructureCost": 27000,
  "otherCost": 0,
  "base": 559000,
  "contingency": 55900,
  "total": 614900,
  "effort": { "personHours": 440, "personDays": 55, "fteMonths": 1.83 },
  "timeline": { "durationWeeks": 3.67, "milestones": [] },
  "assumptions": [
    "Rates are illustrative demo data — not verified market rates.",
    "Contingency 10% applied to base (user-supplied).",
    "Effort derived from 40 h/week and a 3-person team (user-supplied)."
  ],
  "range": { "low": 584155, "likely": 614900, "high": 645645, "method": "assumption-spread" },
  "dataOrigin": "sample"
}
```

`POST /api/v1/estimates/calculate` → 422 (validation, envelope reused)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Estimate request failed validation.",
    "details": [
      { "code": "INVALID_PERSONNEL", "message": "Personnel line 2: hours must be a finite number greater than 0.", "section": "personnel", "lineIndex": 1 }
    ]
  }
}
```

`POST /api/v1/conversations/messages` → **503** while AI is not configured (illustrative;
shows the honest "not configured" state, not a fake answer)

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Assistant is not configured on this deployment. The deterministic estimator remains available.",
    "details": []
  }
}
```

### 2.7 Frontend behaviour contract

- States: `idle → loading → ready → error`, plus `offline` when health/API is unreachable.
- **Gate** the Calculate action on a successful health check; when offline, disable Calculate
  and show a labelled offline/demo state — **never** fabricate a total.
- Loading: inline spinners/skeletons with `aria-busy`; errors: mapped from the envelope with a
  retry; validation: field-level messages from `details[]`.
- All AI/assistant surfaces must render a clear **"assistant not configured"** state until a
  provider is actually wired; no mock answers presented as real.

---

## 3. File-ownership & dependency map (proposal)

**Rule:** one owner per file/module; do not edit another owner's files without explicit
agreement. Contracts (this doc + `docs/api-contract.md`) are owned by Amrut and changed only by
reviewed agreement on **both** sides of the TS/Python boundary.

| Owner | Owns (modules) | May depend on |
| --- | --- | --- |
| **Amrut** (lead/contracts/integration/testing/demo) | `docs/*` (contracts, this file), `src/App.tsx`, `src/main.tsx`, `src/store/*`, `src/api/client.ts`, root build/lint/test config | everything (integration), but edits others' files only via review |
| **Owais** (frontend/UI-UX) | `src/components/**`, `src/pages/**`, `src/styles/**`, `src/constants/*` | `src/estimation` (types), `src/api` (client/types), `src/store`, `src/ui` primitives |
| **Sambram** (database/data design) | persistence/data design: `docs/data-model.md`, future `backend/app/db/**`, dataset schemas + import tooling, `ExchangeRate`/historical stores | `backend/app/schemas.py` (types), estimation types |
| **Manju** (backend APIs) | `backend/app/main.py`, `config.py`, `errors.py`, `schemas.py`, `backend/app/routers/**`, `backend/tests/**` (API-level) | `backend/app/estimation/**` (engine), Pydantic |
| **Harshith** (estimation engine + backend logic) | `src/estimation/**`, `backend/app/estimation/**`, `docs/fixtures/**`, shared-fixture tests | money/rounding conventions only (no UI/network) |

**Dependency graph (arrows = "depends on")**

```
        docs/contracts (Amrut)
                 │  (both sides must match)
   ┌─────────────┴───────────────┐
   ▼                             ▼
src/estimation (Harshith)   backend/app/estimation (Harshith)   [source of truth → mirror]
   ▲    ▲                             ▲
   │    │ types                       │
   │    └────── src/api (Amrut) ──────┘ (client/types/health)
   │                     ▲
   │                     │
   └── src/pages + components (Owais) ──► src/store (Amrut)
                                   ▲
backend/app/routers (Manju) ──► backend/app/schemas (Manju) ──► persistence/data (Sambram, future)
```

**Contention hotspots to watch:** `src/types/index.ts`, `src/api/types.ts`,
`backend/app/schemas.py`, `docs/api-contract.md`, `src/constants/*` — these are shared surfaces;
change them only via a reviewed contract update.

---

## 4. Minimum demo checklist (proposed)

The smallest end-to-end path that is honest and demoable. Each item is a hard requirement for
"demo-ready"; anything not done must be visibly marked "not implemented".

**Must have**

- [ ] App loads; one `h1` per page; existing shell/routing/tokens reused.
- [ ] `GET /health` succeeds and gates the Calculate action; offline state is labelled and
      disables calculation (no fabricated total).
- [ ] User enters/loads a project scope + personnel/tooling/infra lines.
- [ ] `POST /estimates/calculate` returns a **deterministic** breakdown (sections + subtotals +
      contingency + total + effort + assumptions), mirrored exactly by the TS core.
- [ ] Result card shows breakdown, total, and explicit **assumptions**; all demo numbers
      labelled illustrative.
- [ ] Low/likely/high range shown **only** with its method tag (assumption vs statistical).
- [ ] Currency shown without silent mixing; unsupported/unavailable conversion is disabled.
- [ ] Persistent `DemoNotice` / sample-data labelling wherever figures appear.
- [ ] Typecheck, lint, frontend tests, build, backend pytest + ruff all exit 0.

**Stretch (only if time)**

- [ ] Scenario compare (base vs changed inputs).
- [ ] Assistant chat surface (must render "not configured" honestly if no provider).
- [ ] Sample historical records feeding an *assumption-based* range.

**Explicitly out of the minimum demo:** real historical datasets, ML/parametric/analogy
models, statistical confidence intervals, live FX, persistence, auth, Jira/ERP.

---

## 5. Unresolved decisions & blockers

**Decisions needing a call (owner)**

1. Domain scope: building products vs software development — **organizer confirmation**
   (Amrut). Blocks everything downstream.
2. Whether to resume/complete the WIP migration or restart from `121893a` cleanly (Amrut + all).
3. Final `estimate` response shape (nested sections vs flat) — Harshith + Manju + Amrut.
4. Error-code set for the software domain (rename/keep material codes?) — Harshith + Manju.
5. `range` representation and which methods are in the demo — Harshith + Amrut.
6. Currency: amounts as JSON numbers vs decimal strings; conversion in/out of demo — Sambram + Amrut.
7. Rate-card ownership (backend `GET /roles` vs frontend sample) — Manju + Owais.
8. Assistant boundary (provider, adapter contract, credentials, "not configured" UX) — Amrut + Owais.
9. Historical data source/licence, or none in the demo — Sambram + Amrut.
10. Persistence timing (Phase 04 vs demo) — Sambram.
11. Component-test strategy (server-render only; no jsdom/RTL) — Amrut + Owais.
12. File-ownership map (§3) sign-off — all.

**Blockers**

- Official Domain 4C statement/rubric/datasets/deadlines — **unavailable**.
- Reference PDF numeric formulas not extractable; official status unknown.
- No historical/actuals data and no AI stack → no real uncertainty/accuracy claims possible.
- WIP branch does not typecheck → not a usable base until fixed or discarded by decision.
- No browser E2E harness (component tests are server-render only).

---

## 6. Proposed integration sequence (one phase = one reviewed change)

Order matters: lock the contract and the engine before UI wiring.

1. **Gate 0 — scope confirmation.** Amrut records the official interpretation. Decide
   resume-WIP vs restart-from-`121893a`. *No code.*
2. **Contract freeze (Amrut, reviewed by all).** Land this doc + `docs/api-contract.md` update
   on the agreed base branch. *Docs only.*
3. **Engine (Harshith).** Finish `src/estimation` + `backend/app/estimation` to the frozen
   contract; shared fixtures green on both sides. Branch e.g. `feature/xx-estimation-core`.
4. **Backend API (Manju).** Schemas + routers + tests against the frozen engine; health first.
5. **Frontend integration (Owais).** Pages/components/state against the frozen API; loading/
   error/offline/AI-not-configured states.
6. **Data/persistence (Sambram).** Only if the demo needs it; otherwise defer with a labelled
   "not configured" state.
7. **Integration & demo (Amrut).** Amrut merges *reviewed* changes into the integration branch,
   runs the full checklist (§4), and tags the demo.

Each step: verify → review → commit → push on the owner's branch, reporting branch, commit
hash, push status and checks. **Never** push to `main`; **never** merge another person's work.

---

## 7. Scope-risk record (do not remove)

- Domain title vs brief disagree (building products vs software development). The software
  interpretation is **unconfirmed**. Closest authority is the owner-supplied description in
  `docs/TEAM_HANDOFF_DOMAIN_4C.md` §1.
- Until confirmed, all software-domain work is **provisional** and this contract is a
  **proposal**. Do not claim official alignment.

---

## 8. Requested approval

Please confirm, and I (Amrut) will only then proceed:

1. The domain interpretation (§7) and whether to resume the WIP branch or restart.
2. The contract in §2 (entities, endpoints, error reuse, range + currency rules).
3. The ownership map in §3.
4. The minimum demo in §4 and the sequence in §6.

Until approved: **no application code changes, no commits, no pushes.**
