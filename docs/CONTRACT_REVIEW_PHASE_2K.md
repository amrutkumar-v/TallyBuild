# Contract Review — Phase 2K (Domain 4C)

**Status:** Contract-review artifact for the five-person team. **Documentation only.** No
application code, dependencies, configuration, migrations or tests were changed. Nothing was
committed, pushed or merged. No branch was switched.

**Author role:** Amrut (coordination, contract approval, integration, testing, demo).
**Review date:** 2026-10-11. **Reviewed branch:** `wip/software-estimation-migration`
(HEAD `07faa05`).

**Purpose:** review the proposed product contract in `docs/INTEGRATION_READINESS.md` against the
**actual current code**, record the verified baseline, specify canonical models, endpoints, error
format and ownership, and list every decision and risk that blocks safe parallel work.

> **Honesty banner.** Nothing below is implemented unless explicitly marked
> **[implemented]**. The repository currently has **no AI, no assistant endpoint, no historical
> dataset, no ML, no Monte Carlo and no confidence intervals**. The intended product is a
> *conversational software-development cost-estimation assistant*; today's code is a narrower
> deterministic cost calculator mid-migration. Every schema/field marked **[proposed]** is a
> request for approval, not a claim.

---

## 1. Verified repository state and baseline

### 1.1 Git state (verified this session)

| Item | Value |
| --- | --- |
| Working directory | `D:/TallyBuild` (single repository, no nested repo) |
| Current branch | `wip/software-estimation-migration` |
| HEAD commit | `07faa0525a6336279323bf46b0f14ba6d695c9fa` (`wip(domain-4c): partial software-estimation migration (unverified; typecheck failing)`) |
| Upstream tracking | `origin/wip/software-estimation-migration` — **up to date**, no ahead/behind |
| Remote | `origin` = https://github.com/amrutkumar-v/TallyBuild.git |
| Stash | none |
| Tracked working-tree changes | **none** (tracked tree clean) |
| Untracked files | `docs/INTEGRATION_COORDINATION.md`, `docs/INTEGRATION_READINESS.md`, `docs/PROBLEM_VALIDATION.md` (all preserved; none modified) |

Branches present locally and on origin: `main` (`b773df4`), `feature/phase-01-ui-foundation`
(`9defe33`), `feature/phase-02-estimation-core` (`d0365c1`), `feature/phase-02c-backend-api`
(`eba0878`), `feature/phase-02d-frontend-integration` (`121893a`),
`wip/software-estimation-migration` (`07faa05`).

**History (newest first):** `07faa05` → `121893a` (Domain 4C handoff) → `1bebfa3` (shared
fixtures) → `a854355` (frontend↔API integration) → `eba0878` (estimation API) → `d0365c1` (API
contract).

### 1.2 Check status — re-verified, **both failing** (this contradicts the older green baseline)

| Check | Command | Result |
| --- | --- | --- |
| Frontend typecheck | `npm run typecheck` (`tsc -b`) | **FAIL — 8 errors across 4 files** |
| Backend tests | `.venv\Scripts\python.exe -m pytest -q` | **FAIL — collection error** (`KeyError: 'customCatalogue'`), 0 tests run |

**Frontend errors (exact):**

- `src/api/client.ts:6` — `ESTIMATE_NOT_FOUND` used in `KNOWN_ERROR_CODES` but not a member of
  `ApiErrorCode` (`src/api/types.ts:7`).
- `src/components/layout/TopBar.tsx:4` — `getPageTitle` is no longer exported from
  `src/constants/navigation.ts`.
- `src/estimation/calculate.test.ts:5` — `baseRequest` declared but never used.
- `src/pages/NewEstimatePage.tsx:164,165,166,184,186` — `PersonnelEditorRowErrors` /
  `CostLineRowErrors` passed where `Record<string, string | undefined>` is expected (no index
  signature).

**Backend error (exact):** `backend/tests/test_shared_fixture.py:25` reads
`FIXTURE["customCatalogue"]`, but the fixture `docs/fixtures/calculation-cases.json` is now
**version 2** and has no `customCatalogue` key → pytest aborts during collection, so **no**
backend test executes.

> **Baseline correction.** `docs/PROBLEM_VALIDATION.md` §2.7 and `docs/INTEGRATION_COORDINATION.md`
> §2 describe a green baseline (typecheck 0 / 86 frontend tests / 72 backend tests) that applied
> **before** the WIP migration edits. That baseline no longer holds on the current branch. The
> last fully green state on disk is `feature/phase-02d-frontend-integration` (`121893a`).

### 1.3 What the code actually is right now

- **Frontend** is mid-migration to a **project/software cost** domain: a multi-currency
  (`INR/USD/EUR/AED`) calculator with four cost sections — personnel, tooling, infrastructure,
  other (`src/estimation/types.ts:28`, `src/estimation/calculate.ts:172`).
- The estimation core is **deterministic** and pure; the UI (`src/pages/NewEstimatePage.tsx`)
  posts a `ProjectEstimateRequest` to `POST /estimates/calculate` via `src/api/`.
- **Backend is still the material domain** and was **not** migrated: `backend/app/schemas.py`
  defines `CurrencyCode = Literal["INR"]`, `MaterialProduct`, `EstimateRequest{lines}`,
  `EstimateResult{lineResults, subtotal,...}`; routers are `health`, `products`, `estimates`
  (material). `backend/app/config.py:8` hard-codes `CURRENCY = "INR"`.
- **The shared fixture is v2 (project-cost)** but its backend consumer is v1 (material). The
  TS↔Python "mirror" that the docs rely on is therefore **broken at both ends**.

---

## 2. Proposed canonical data models and field definitions

**Scope note.** The current WIP code implements only the **cost calculator subset** (personnel/
tooling/infrastructure/other → a total). The intended product also needs **features, tasks,
effort, timeline, assumptions and uncertainty**; those do **not** exist yet. Both are listed so
the team can decide what the MVP must include (see §7).

Legend — **Status:** `implemented (TS)` · `implemented (PY)` · `partial` · `missing` ·
`proposed`.

### 2.1 Enums

| Type | Members | Status |
| --- | --- | --- |
| `CurrencyCode` | `'INR' \| 'USD' \| 'EUR' \| 'AED'` | implemented (TS, `src/estimation/currencies.ts:1`); **not** in PY (`Literal["INR"]`) |
| `CostSectionKey` | `'personnel' \| 'tooling' \| 'infrastructure' \| 'other'` | implemented (TS, `src/estimation/types.ts:3`) |
| `EstimateMethod` | `'deterministic'` only; `'parametric' \| 'analogy' \| 'ml'` **reserved, not implemented** | proposed |
| `FeatureOrigin` | `'ai-draft' \| 'user-edited' \| 'user'` | proposed |
| `AssumptionKind` | `'scope' \| 'rate' \| 'productivity' \| 'timeline' \| 'risk' \| 'other'` | proposed |
| `EstimateErrorCode` (TS) | `EMPTY_REQUEST, UNSUPPORTED_CURRENCY, INVALID_PERSONNEL, INVALID_TOOLING, INVALID_INFRASTRUCTURE, INVALID_OTHER, NON_FINITE_RESULT` | implemented (TS, `src/estimation/types.ts:74`) |
| `EstimateErrorCode` (PY) | material set (`MISSING_PRODUCT, INVALID_QUANTITY, …`) | implemented (PY) — **mismatched** |

### 2.2 Cost-line models **[implemented (TS)]**

Field names must be frozen; the Python mirror will use identical names.

| Model | Fields (type, unit, nullability) |
| --- | --- |
| `PersonnelLine` | `role: string` (non-empty), `people: number ≥ 0`, `hours: number ≥ 0`, `hourlyRate: number ≥ 0` (currency/hour) |
| `ToolingLine` | `name: string` (non-empty), `amount: number ≥ 0` (currency) |
| `InfrastructureLine` | `name: string` (non-empty), `monthlyCost: number ≥ 0` (currency/month), `months: number ≥ 0` |
| `OtherCostLine` | `description: string` (non-empty), `amount: number ≥ 0` (currency) |

### 2.3 Request/result models **[implemented (TS), narrower than the intended contract]**

`ProjectEstimateRequest` (`src/estimation/types.ts:28`):

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `projectName` | `string?` | no | trimmed; blank → `undefined` |
| `currency` | `CurrencyCode` | yes | one currency per estimate |
| `personnel` | `PersonnelLine[]` | yes | may be empty |
| `tooling` | `ToolingLine[]` | yes | may be empty |
| `infrastructure` | `InfrastructureLine[]` | yes | may be empty |
| `other` | `OtherCostLine[]` | yes | may be empty |

`ProjectEstimateResult` (`src/estimation/types.ts:58`):

| Field | Type | Notes |
| --- | --- | --- |
| `projectName` | `string?` | echo |
| `currency` | `CurrencyCode` | echo |
| `personnel` / `tooling` / `infrastructure` / `other` | `CostSection<T>` = `{ lines: T[]; subtotal: number }` | lines carry an added `cost: number` |
| `personnelCost` / `toolingCost` / `infrastructureCost` / `otherCost` | `number` | rounded subtotals |
| `lineCount` | `number` | total lines |
| `total` | `number` | rounded sum of the four subtotals |
| `assumptions` | `string[]` | **static strings** (`src/estimation/calculate.ts:23`), not structured |

**Missing vs the intended contract** (all `proposed`/`missing`): `method`, `modelVersion`,
`effort {personHours, personDays, fteMonths}`, `timeline {durationWeeks, milestones[]}`,
`range {low, likely, high, method}`, structured `Assumption[]`, `dataOrigin`, `inputsHash`.

### 2.4 Project / record / collaboration models **[missing or partial]**

| Model | Fields | Status |
| --- | --- | --- |
| `Estimate` (frontend record) | `id, projectName, scope, category, complexity, currency, createdAt, plannedStartDate: string\|null, durationWeeks: number\|null, estimatedAmount: number\|null, actualAmount: number\|null, status, origin, notes?` (`src/types/index.ts:20`) | partial — no features/effort/range |
| `Feature` | `id, projectId, parentId, name, description, category, origin, dependencies[]` | **missing** |
| `Task` | `id, featureId, name, roleId, personHours` | **missing** |
| `Role` / rate card | `id, name, category, location, hourlyRate` | **missing** — current model uses free-text `role` + per-line `hourlyRate`, no catalogue |
| `Assumption` | `id, kind, text, source` | **missing** — only `string[]` |
| `Milestone` | `id, name, targetDate, effortShare` | **missing** |
| `Scenario` / `ScenarioChange` | `id, baseEstimateId, name, changes[], resultEstimateId` | **missing** |
| `HistoricalRecord` | `dataOrigin: 'sample'\|'imported'\|'real'`, effort, cost, actuals | **missing** |
| `ExchangeRate` | `base, quote, rate, effectiveDate, source, fetchedAt` | **missing** |
| `Money` | `{ amount: number; currency: CurrencyCode }` | **proposed alternative** — current code uses bare numbers + a single `currency` field (§7 D3) |

### 2.5 Deterministic cost identity **[implemented (TS), must be mirrored]**

```
personnelCost      = Σ roundCurrency(people × hours × hourlyRate)
toolingCost        = Σ roundCurrency(amount)
infrastructureCost = Σ roundCurrency(monthlyCost × months)
otherCost          = Σ roundCurrency(amount)
total              = roundCurrency(personnelCost + toolingCost + infrastructureCost + otherCost)
```

`roundCurrency` = half-up, 2 dp, applied per line then per subtotal then to the total
(`src/estimation/money.ts`; documented in `docs/api-contract.md` §4.4). The Python port must use
the same expression (never Python `round()`), or the mirror diverges.

---

## 3. Request and response examples for each agreed endpoint

**Agreed MVP endpoints (exactly two):**

1. `GET /api/v1/health` — liveness + capabilities
2. `POST /api/v1/estimates/calculate` — deterministic estimate

Everything else (`GET /roles`, `POST /scenarios/compare`, `POST/GET /projects`,
`POST /conversations/messages`) is **deferred / not agreed** (§3.4).

> **Current mismatch warning.** The backend today implements the **material** shapes for these
> two paths (`backend/app/schemas.py`), so the project-cost payloads below are **proposed and
> do not match the running backend**. See §8 R1/R2.

### 3.1 `GET /api/v1/health`

**Proposed 200 response** (reconciles the frontend expectation `src/api/types.ts:26` with the
backend's current `catalogue` field):

```json
{
  "status": "ok",
  "service": "tallybuild-api",
  "version": "0.1.0",
  "timestamp": "2026-10-11T09:00:00.000Z",
  "capabilities": {
    "currencies": ["INR", "USD", "EUR", "AED"],
    "sections": ["personnel", "tooling", "infrastructure", "other"],
    "methods": ["deterministic"],
    "aiConfigured": false,
    "historicalData": "not available"
  }
}
```

**Conflict:** the WIP frontend type is
`capabilities: { currencies: string[]; categories: string[] }` (`src/api/types.ts:31`) but the
running backend returns `catalogue: { products, currency }` (`backend/app/schemas.py:100`,
`backend/app/routers/health.py:23`). This must be reconciled to **one** shape (§7 D8).

### 3.2 `POST /api/v1/estimates/calculate`

**Proposed request** (matches `ProjectEstimateRequest`):

```json
{
  "projectName": "Demo online store",
  "currency": "INR",
  "personnel": [{ "role": "Backend Engineer", "people": 1, "hours": 240, "hourlyRate": 1200 }],
  "tooling": [{ "name": "Design suite", "amount": 24000 }],
  "infrastructure": [{ "name": "Cloud hosting", "monthlyCost": 9000, "months": 3 }],
  "other": []
}
```

**Proposed 200 response** (matches `ProjectEstimateResult`; numbers illustrative demo data):

```json
{
  "projectName": "Demo online store",
  "currency": "INR",
  "personnel": {
    "lines": [{ "role": "Backend Engineer", "people": 1, "hours": 240, "hourlyRate": 1200, "cost": 288000 }],
    "subtotal": 288000
  },
  "tooling": { "lines": [{ "name": "Design suite", "amount": 24000, "cost": 24000 }], "subtotal": 24000 },
  "infrastructure": { "lines": [{ "name": "Cloud hosting", "monthlyCost": 9000, "months": 3, "cost": 27000 }], "subtotal": 27000 },
  "other": { "lines": [], "subtotal": 0 },
  "personnelCost": 288000,
  "toolingCost": 24000,
  "infrastructureCost": 27000,
  "otherCost": 0,
  "lineCount": 3,
  "total": 339000,
  "assumptions": [
    "All amounts are calculated in INR. Live currency conversion is not configured, so each estimate stays in the currency you choose.",
    "Personnel cost = people × hours × hourly rate per team line.",
    "Infrastructure cost = monthly cost × months per resource line.",
    "Excludes taxes, duties and contingency unless you add them as an \"other\" cost line."
  ]
}
```

**Proposed 422 validation response** (envelope reused, §4):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Estimate request failed validation.",
    "details": [
      {
        "code": "INVALID_PERSONNEL",
        "message": "Personnel line 1: hourly rate must be a finite number that is 0 or more.",
        "section": "personnel",
        "lineIndex": 0
      }
    ]
  }
}
```

### 3.3 Response envelope and status mapping

| Case | HTTP | Envelope code | Domain codes in `details[]` |
| --- | --- | --- | --- |
| Success | 200 | — | — |
| Malformed body / wrong types | 400 | `REQUEST_MALFORMED` | none |
| Business-rule failure | 422 | `VALIDATION_ERROR` | `EMPTY_REQUEST`, `UNSUPPORTED_CURRENCY`, `INVALID_PERSONNEL`, `INVALID_TOOLING`, `INVALID_INFRASTRUCTURE`, `INVALID_OTHER` |
| Non-finite result | 500 | `CALCULATION_ERROR` | `NON_FINITE_RESULT` |
| Unexpected server error | 500 | `INTERNAL_ERROR` | none |
| Client cannot reach server | n/a (client-only) | `NETWORK_ERROR` | none |

### 3.4 Deferred endpoints (proposed, **not agreed**, **not implemented**)

- `GET /api/v1/roles` — rate card. Not agreed (§7 D6).
- `POST /api/v1/scenarios/compare` — base + changes → deltas. Not agreed.
- `POST /api/v1/projects`, `GET /api/v1/projects` — persistence. Not agreed (Sambram, Phase 04).
- `POST /api/v1/conversations/messages` — assistant boundary. Not agreed, **not configured**;
  must return `503 SERVICE_UNAVAILABLE` rather than a fabricated answer until a provider exists.

---

## 4. Error format and validation rules

### 4.1 Envelope **[implemented (PY); TS type drift]**

`backend/app/errors.py` implements one envelope for every non-2xx response:

```json
{ "error": { "code": "<ApiErrorCode>", "message": "<string>", "details": [ /* optional */ ] } }
```

`details[]` entries carry domain errors. The WIP TS domain error (`EstimateValidationError`,
`src/estimation/types.ts:83`) is `{ code, message, section?, lineIndex? }`. The backend's
`EstimateValidationError` (`backend/app/schemas.py:71`) is `{ code, message, lineIndex?, productId? }`
— **different fields** (`section` vs `productId`). Freeze one shape.

### 4.2 Transport code set — freeze this list

| Code | Where | Note |
| --- | --- | --- |
| `REQUEST_MALFORMED` | TS + PY | ok |
| `VALIDATION_ERROR` | TS + PY | ok |
| `CALCULATION_ERROR` | TS + PY | ok |
| `INTERNAL_ERROR` | TS + PY | ok |
| `SERVICE_UNAVAILABLE` | TS + PY | reserved |
| `NETWORK_ERROR` | TS only | client-only, never sent by server |
| `PRODUCT_NOT_FOUND` | docs only | **stale** (material); remove from `docs/api-contract.md` |
| `ESTIMATE_NOT_FOUND` | `src/api/client.ts:6` only | **stale**; causes typecheck error — drop or re-add to `ApiErrorCode` (§7 D9) |

### 4.3 Validation rules **[implemented (TS), `src/estimation/calculate.ts`]**

- `currency` must be one of `INR|USD|EUR|AED` → else `UNSUPPORTED_CURRENCY`.
- At least one line across the four sections → else `EMPTY_REQUEST` (returns immediately).
- Each line: required text fields non-empty; numeric fields finite and `≥ 0`
  (`0` is valid; negative and `NaN`/`Infinity` are rejected).
- All failing lines are collected (not just the first); validation order is personnel → tooling
  → infrastructure → other.
- If a computed cost or the total is not finite → `NON_FINITE_RESULT` (500).

**Units:** hours (h), money (currency units), duration (weeks), rates (currency/hour). Money is
rounded 2 dp half-up per the identity in §2.5.

---

## 5. Separation between AI interpretation and deterministic estimation

**Principle (must hold in code, data and UI):**

1. **AI (not implemented):** interprets natural language, proposes a *draft* feature/task
   breakdown, asks clarifying questions, and writes explanations. It **never** owns a number.
2. **Deterministic engine (implemented):** computes all effort/cost/totals and emits the numbers
   and assumptions shown to the user.
3. **Traceability:** every displayed figure traces to a `ProjectEstimateResult`. The assistant may
   *reference* a number; it may not *invent* one.
4. **Labelling:** deterministic output must never be labelled "AI", "prediction" or "confidence
   interval". `EstimateMethod` distinguishes `deterministic` from reserved `parametric|analogy|ml`
   (none implemented).
5. **Demo data:** synthetic/sample values must be labelled (`DemoNotice` and `dataOrigin`),
   never presented as market rates or validation evidence.

**Current status:** the assistant boundary is **not implemented**; no AI endpoint exists. Until it
does, any assistant UI must render an explicit "assistant not configured" state.

---

## 6. File ownership and integration dependencies

Owner names follow the latest brief (**Amrut, Owais, Sambram, Manju, Harshith**). Note the older
docs use `Owasis` and `Harshit` (`docs/TEAM_HANDOFF_DOMAIN_4C.md` §12) and assign overlapping
ownership; §7 D7 asks Amrut to freeze the mapping below.

| Owner | Owns (proposed) | Depends on |
| --- | --- | --- |
| **Amrut** — coordination, contract approval, integration, testing, demo | `docs/**` (contracts incl. this file, `docs/api-contract.md`), `src/api/**`, `src/store/**`, `src/App.tsx`, `src/main.tsx`, root config (`vite.config.ts`, `tsconfig*.json`, `eslint.config.*`, `package.json`), `src/estimation/shared-fixture.test.ts`, `backend/tests/test_shared_fixture.py` | all modules |
| **Owais** — frontend/UI/UX | `src/pages/**`, `src/components/**`, `src/styles/**`, `src/constants/**`, `src/data/sampleEstimates.ts` | `src/estimation` (types), `src/api`, `src/store`, `src/utils/format.ts` |
| **Sambram** — database & data design | `docs/data-model.md`, future persistence/DDL, seed datasets, `ExchangeRate`/historical stores, import tooling | `backend/app/schemas.py` types, `src/estimation` types |
| **Manju** — backend API & integration | `backend/app/{main,config,errors,schemas}.py`, `backend/app/routers/**`, backend API tests | `backend/app/estimation/**` |
| **Harshith** — estimation engine & backend estimation logic | `src/estimation/**`, `backend/app/estimation/**`, `docs/fixtures/**`, `docs/estimation-engine.md` | money/rounding conventions only |

**Shared surfaces (change only via a reviewed contract update):** `src/estimation/types.ts`,
`src/types/index.ts`, `src/api/types.ts`, `backend/app/schemas.py`, `docs/api-contract.md`,
`docs/fixtures/calculation-cases.json`.

**Dependency graph**

```
docs/contracts (Amrut)
      │  both runtimes must match
      ├───────────────┬───────────────────────────┐
      ▼               ▼                           ▼
src/estimation   backend/app/estimation      src/types + src/api
 (Harshith)        (Harshith, mirror)           (Amrut)
      ▲                    ▲                         ▲
      │ types              │ schemas                 │ client
src/pages + components (Owais) ──► src/store (Amrut) │
      ▲                                             │
backend/app/routers (Manju) ──► backend/app/schemas (Manju) ──► persistence (Sambram, future)
```

**Note on current file reality:** the WIP migration touched files owned by several people
(`src/estimation/**`, `src/pages/**`, `src/components/**`, `src/api/**`, `src/store/**`). That
overlap is why §7 D2 (resume vs restart) must be decided before parallel work begins.

---

## 7. Decisions requiring Amrut's approval

| # | Decision | Why it blocks | Recommended option |
| --- | --- | --- | --- |
| D1 | **Domain scope** — building products vs software development (see §9) | Everything downstream | `SOFTWARE` (provisional; confirm with organizers) |
| D2 | **WIP migration** — resume `wip/software-estimation-migration` or restart clean from `121893a` under correct ownership | Avoids off-scope/overlapping edits | Restart on a fresh branch from `121893a`; keep WIP branch as historical reference |
| D3 | **Money representation** — flat `currency` + numeric amounts vs nested `{ amount, currency }` | Field-shape churn across TS+PY+docs | Flat `currency` + numbers (matches current code) |
| D4 | **MVP breadth** — is the MVP the current **cost calculator** (4 sections → total) or must it include **features/tasks/effort/timeline/range**? | Defines engine + UI + API scope | Ship calculator first; add features/tasks/effort next; range only as a labelled assumption band |
| D5 | **`calculate` endpoint path** — keep `POST /estimates/calculate` | Client + server parity | Keep the existing path |
| D6 | **Rate-card ownership** — `GET /roles` from backend vs frontend sample list | Determines DTO + who seeds data | Backend-owned catalogue; frontend sample only as labelled fallback |
| D7 | **Freeze the ownership map + names** in §6 (and retire `Owasis`/`Harshit` spellings) | Prevent two people editing one file | Approve §6 as written |
| D8 | **Reconcile `GET /health` shape** — `capabilities` (frontend) vs `catalogue` (backend) | Frontend reads `capabilities`; backend sends `catalogue` | Adopt §3.1 `capabilities`; migrate backend |
| D9 | **Freeze the error-code set** (§4.2) and remove `PRODUCT_NOT_FOUND` / `ESTIMATE_NOT_FOUND` drift | Typecheck + hidden runtime errors | Adopt §4.2; fix `src/api/client.ts:6` |
| D10 | **Assistant boundary** — provider, adapter contract, credential handling, "not configured" UX | Prevents fake-AI claims | No provider now; render 503/"not configured" honestly |
| D11 | **Shared-fixture versioning** — how v1 (material) and v2 (project) coexist / are retired | Both test suites currently cannot run | Replace fixture + both consumers in one reviewed change |
| D12 | **Persistence timing** — Phase 04 vs demo; `localStorage` only for now | Scope + Sambram's work | `localStorage` only for the demo |

---

## 8. Migration and integration risk checklist

Severity: **Blocker** (stops parallel work) · **High** · **Medium** · **Low**.

| ID | Risk | Evidence | Severity | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | TS↔Python mirror broken: fixture is v2 but backend is v1 | `backend/tests/test_shared_fixture.py:25` `KeyError`; `backend/app/schemas.py:12` `Literal["INR"]` | **Blocker** | Migrate backend engine+schemas to the project domain and rewrite the fixture consumer (D11) |
| R2 | Frontend posts project-cost payloads to a material backend | `src/api/estimates.ts:12` vs `backend/app/routers/estimates.py:17`, `backend/app/schemas.py:56` | **Blocker** | Do not wire until backend matches; keep health-gated/offline UX |
| R3 | Frontend typecheck fails (8 errors) | `npm run typecheck` output (§1.2) | **High** | Fix the 4 files as one reviewed change (Amrut/Owais/Harshith) |
| R4 | `GET /health` shape mismatch | `src/api/types.ts:31` vs `backend/app/schemas.py:105` | **High** | Adopt §3.1 (D8) |
| R5 | Error-code drift (`ESTIMATE_NOT_FOUND`, `PRODUCT_NOT_FOUND`) | `src/api/client.ts:6`; `docs/api-contract.md:451` | **High** | Freeze §4.2 (D9); update stale docs |
| R6 | Domain error field mismatch (`section` vs `productId`) | `src/estimation/types.ts:83` vs `backend/app/schemas.py:71` | **Medium** | Freeze one `details[]` shape in the canonical schema |
| R7 | Overlapping ownership from the WIP migration; docs disagree on owner names | WIP diff touches `src/estimation/**`, `src/pages/**`, `src/components/**`; `TEAM_HANDOFF` §12 vs §6 | **High** | Decide D2; freeze §6 (D7) |
| R8 | Intended contract entities (Feature/Task/effort/timeline/range/Scenario) absent | §2.4 all `missing` | **Medium** | Scope explicitly via D4; mark unbuilt as "not implemented" in UI |
| R9 | Documentation drift (api-contract.md, estimation-engine.md describe materials) | `docs/api-contract.md`, `docs/estimation-engine.md` | **Medium** | Rewrite docs in the same change that migrates the domain |
| R10 | Backend cannot run tests until R1 fixed → no regression safety net | pytest collection error (§1.2) | **High** | Fix R1 before any backend PR is trusted |
| R11 | Currency model inconsistency (TS 4-currency numbers vs PY INR-only) | `src/estimation/currencies.ts:1` vs `backend/app/config.py:8` | **High** | Migrate backend currency to `CurrencyCode`; keep one currency per estimate, no conversion |
| R12 | No AI/assistant, dataset, ML or uncertainty anywhere | repo-wide; §5 | **Low** (expected) | Keep out of the demo; label any surface "not configured" |

---

## 9. Scope discrepancy (recorded neutrally)

Stated without judgment; **not** a change of scope, pitch or claim:

- The **intended product direction** (per the current brief) is **software-development cost
  estimation**.
- The supplied **PDF** (`Product_Development_Cost_calculations.pdf`) contains **software/product-
  development** cost categories (engineering hours, hourly rates, SW vendor, tools & licences,
  contingency, ASW/BSW stacks; EUR).
- The supplied **hackathon PPT** describes **building-product / material** cost estimation
  (domain title: "AI for Cost Estimation of Building Products").
- The **official organizer-approved interpretation has not been independently confirmed** (no
  verbatim statement or rubric was found in-repo or via search).

This remains an **open decision for Amrut** (D1). No scope change is made by this document.

---

## 10. Verification and final report

- **Files touched by this phase:** exactly one — `docs/CONTRACT_REVIEW_PHASE_2K.md` (new,
  untracked). No existing file was edited, overwritten or removed.
- **Preserved untracked docs:** `docs/INTEGRATION_COORDINATION.md`, `docs/INTEGRATION_READINESS.md`,
  `docs/PROBLEM_VALIDATION.md` — untouched.
- **Application code / deps / config / migrations / tests:** **not changed.**
- **Branch:** `wip/software-estimation-migration`; **HEAD:** `07faa05`; upstream unchanged
  (nothing pushed). No branch switched; no merge.
- **Read-only checks run for this review:** `npm run typecheck` (8 errors) and
  `backend pytest` (collection error) — reported verbatim in §1.2. No destructive git ran.
- **Unresolved decisions:** D1–D12 (§7). **Contract conflicts:** R1–R12 (§8), especially R1/R2
  (TS↔PY mirror) and R5/R6/R8 (error + shape + scope).

> **No application code was changed and no commit or push was performed.** This contract review
> is complete; implementation phases must not start until Amrut resolves §7 and approves.
