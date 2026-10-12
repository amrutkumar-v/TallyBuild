# Implementation Plan — Phase 2L (Contract Freeze & Incremental MVP Plan)

**Status:** Planning artifact. **Documentation only.** No application code, tests, fixtures,
dependencies, configuration or migrations were changed. Nothing was committed, pushed, merged or
reset. No branch was created or switched.

**Phase:** 2L. **Reviewed branch:** `wip/software-estimation-migration` (HEAD `07faa05`).
**Author role:** Amrut (contract approval, coordination, integration, regression checks, demo).

> **Honesty banner.** This document **freezes a plan and a proposed contract**, not working
> software. The current branch does **not** typecheck and its backend tests do **not** collect
> (Phase 2K). There is **no AI, no assistant, no historical data, no ML and no confidence
> interval** anywhere. Everything marked *proposed* is a request for approval; everything marked
> *existing* is present in source but must be re-verified after the repairs in §7.

> **Status labels used throughout**
> `Existing and verified` · `Existing but incompatible` · `Proposed and not implemented` · `Deferred`.
> "Existing" means present in source on this branch; it does **not** mean the branch is green.

---

## 1. Verified repository state

### 1.1 Git state (verified this session)

| Item | Value |
| --- | --- |
| Working directory | `D:/TallyBuild` (single repo; no nested repo) |
| Current branch | `wip/software-estimation-migration` |
| HEAD | `07faa0525a6336279323bf46b0f14ba6d695c9fa` |
| Upstream | `origin/wip/software-estimation-migration` — up to date (no ahead/behind) |
| Remote | `origin` = https://github.com/amrutkumar-v/TallyBuild.git |
| Staged changes | none |
| Tracked working-tree changes | none |
| Untracked files | `docs/CONTRACT_REVIEW_PHASE_2K.md`, `docs/INTEGRATION_COORDINATION.md`, `docs/INTEGRATION_READINESS.md`, `docs/PROBLEM_VALIDATION.md` (all preserved; none edited) |
| Local branches | `main`, `feature/phase-01-ui-foundation`, `feature/phase-02-estimation-core`, `feature/phase-02c-backend-api`, `feature/phase-02d-frontend-integration`, `wip/software-estimation-migration` |

### 1.2 Check status (verified in Phase 2K; unchanged)

| Check | Command | Result |
| --- | --- | --- |
| Frontend typecheck | `npm run typecheck` | **FAIL** — 8 errors / 4 files (`src/api/client.ts:6`, `src/components/layout/TopBar.tsx:4`, `src/estimation/calculate.test.ts:5`, `src/pages/NewEstimatePage.tsx:164-186`) |
| Backend tests | `.venv\Scripts\python.exe -m pytest -q` | **FAIL** — collection error (`KeyError: 'customCatalogue'` at `backend/tests/test_shared_fixture.py:25`); 0 tests run |

### 1.3 Verified facts vs earlier reports

- **Verified now:** branch/HEAD/upstream/tree/untracked as above; frontend and backend share the
  *cost-calculator* domain (frontend project-cost v2, backend material v1); the shared fixture is
  v2 but its Python consumer is v1.
- **Not re-verified:** lint, `npm test`, `npm run build`, ruff. Not run this phase.
- **Superseded:** any "green baseline" claims from `PROBLEM_VALIDATION.md` §2.7 /
  `INTEGRATION_COORDINATION.md` §2 applied to `121893a`, not to this branch.

---

## 2. Approved planning direction (Amrut-approved)

Recorded as **planning choices**, not as independently confirmed hackathon scope:

1. **Product scope — Software-development cost estimation.** *(Approved planning choice.)*
2. **Migration strategy — Preserve `wip/software-estimation-migration` and repair it
   incrementally.** *(Approved planning choice; the branch is retained, not discarded.)*
3. **MVP — Deterministic cost calculator + project feature/task breakdown + effort estimation +
   timeline estimation.** *(Approved planning choice.)*
4. **AI integration — Deferred until the deterministic core works.** *(Approved planning choice.)*
5. **Git policy — No commits, pushes, merges, PRs, resets, cleans or destructive operations
   without explicit authorization.** *(Approved planning choice.)*

### 2.1 Scope discrepancy (kept explicit; not resolved)

- **Intended product direction:** software-development cost estimation.
- **Supplied PDF** (`Product_Development_Cost_calculations.pdf`): contains **software /
  product-development** cost categories (engineering hours, hourly rates, SW vendor, tools &
  licences, contingency, ASW/BSW stacks; EUR).
- **Supplied hackathon presentation:** describes **building-product / material** cost estimation
  (domain title: "AI for Cost Estimation of Building Products").
- **Official organizer-approved interpretation: not independently confirmed.** The domain title
  remains ambiguous; no verbatim statement or rubric exists in-repo or was found via search.

This document does **not** change the pitch or claim confirmation. It is an open decision (D1, §9).

---

## 3. Canonical MVP contract (frozen proposal)

**Frozen conventions**

- **Money:** a single `currency: CurrencyCode` per project/estimate; all amounts are plain JSON
  numbers in that currency, rounded 2 dp half-up. **No nested `Money` object** (keeps parity with
  current code) and **no automatic currency conversion**.
- **Effort:** canonical unit is **person-hours** (`effortHours`). Person-days are a derived value
  (`personDays = personHours / hoursPerDay`). One canonical unit per field.
- **Rates:** `hourlyRate` in currency per hour; a role's currency must equal the estimate currency.
- **Duration:** calendar `durationWeeks`; `targetDate` is an ISO `YYYY-MM-DD` date.
- **Naming:** identical field names in TypeScript and Python; `camelCase` on the wire and in both
  languages' models.

### 3.1 Entities, fields and status

#### (1) Project

| Field | Type | Unit | Req | Status |
| --- | --- | --- | --- | --- |
| `id` | `string` | — | yes | Existing and verified (frontend record only, `src/types/index.ts:20`) |
| `name` | `string` | — | yes | Existing and verified (frontend `projectName`) |
| `description` | `string` | — | yes | Existing but incompatible (frontend calls it `scope`) |
| `category` | `ProjectCategory` | — | yes | Existing and verified (frontend) |
| `complexity` | `ProjectComplexity` | — | yes | Existing and verified (frontend) |
| `currency` | `CurrencyCode` | — | yes | Existing and verified (frontend 4-currency; backend INR-only = incompatible) |
| `status` | `EstimateStatus` | — | yes | Existing and verified (frontend) |
| `origin` | `'sample' \| 'local'` | — | yes | Existing and verified (frontend) |
| `createdAt` | ISO 8601 UTC `string` | — | yes | Existing and verified (frontend) |
| `plannedStartDate` | `string \| null` | date | no | Existing and verified (frontend, user input) |
| `durationWeeks` | `number \| null` | weeks | no | Existing but incompatible — currently a **user input**; must become a **derived** value (§3.6) |
| `notes` | `string` | — | no | Existing and verified (frontend) |
| `roles` | `Role[]` | — | yes | Proposed and not implemented (rate card) |
| `features` | `Feature[]` | — | yes | Proposed and not implemented |
| `milestones` | `Milestone[]` | — | no | Proposed and not implemented |
| `capacity` | `CapacityAssumptions` | — | yes (for timeline) | Proposed and not implemented |

Backend has **no** Project model (missing). `backend/app/schemas.py` is material-only.

#### (2) Feature

| Field | Type | Unit | Req | Status |
| --- | --- | --- | --- | --- |
| `id` | `string` | — | yes | Proposed and not implemented |
| `projectId` | `string` | — | yes | Proposed and not implemented |
| `parentId` | `string \| null` | — | no | Proposed and not implemented |
| `name` | `string` | — | yes | Proposed and not implemented |
| `description` | `string` | — | no | Proposed and not implemented |
| `category` | `ProjectCategory` | — | no | Proposed and not implemented |
| `origin` | `'user' \| 'ai-draft'` | — | yes | Proposed and not implemented (AI must fill `'ai-draft'`) |
| `dependsOn` | `string[]` (feature ids) | — | no (default `[]`) | Proposed and not implemented — **Deferred** for scheduling |
| `tasks` | `Task[]` | — | yes | Proposed and not implemented |

#### (3) Task

| Field | Type | Unit | Req | Status |
| --- | --- | --- | --- | --- |
| `id` | `string` | — | yes | Proposed and not implemented |
| `featureId` | `string` | — | yes | Proposed and not implemented |
| `name` | `string` | — | yes | Proposed and not implemented |
| `roleId` | `string` | — | yes | Proposed and not implemented |
| `effortHours` | `number > 0` | **person-hours** | yes | Proposed and not implemented |
| `notes` | `string` | — | no | Proposed and not implemented |
| `dependsOn` | `string[]` (task ids) | — | no (default `[]`) | Proposed and not implemented — **Deferred** for scheduling |

A task carries **effort**, never a calendar duration. Calendar duration is derived (§3.6).

#### (4) Role / resource assignment

| Field | Type | Unit | Req | Status |
| --- | --- | --- | --- | --- |
| `Role.id` | `string` | — | yes | Proposed and not implemented |
| `Role.name` | `string` | — | yes | Proposed and not implemented |
| `Role.category` | `string` | — | no | Proposed and not implemented |
| `Role.hourlyRate` | `number ≥ 0` | currency/hour | yes | Existing but incompatible — today the rate lives on each free-text personnel line, not a catalogue |
| `Role.currency` | `CurrencyCode` | — | yes | Existing but incompatible (no currency on the current line model) |

Current code (`src/estimation/types.ts:5` `PersonnelLine {role, people, hours, hourlyRate}`) is a
**flat cost line**, not a role catalogue keyed by id. MVP proposal: add a `Role[]` rate card and
resolve tasks via `roleId`; keep the personnel line as a labelled fallback/quick path.

#### (5) Effort estimate (derived, deterministic)

| Field | Type | Unit | Status |
| --- | --- | --- | --- |
| `totalPersonHours` | `number ≥ 0` | person-hours | Proposed and not implemented |
| `personDays` | `number ≥ 0` | person-days | Proposed and not implemented |
| `byRole` | `{ roleId, personHours }[]` | person-hours | Proposed and not implemented |
| `byFeature` | `{ featureId, personHours }[]` | person-hours | Proposed and not implemented |
| `hoursPerDay` | `number > 0` | h/day | Proposed and not implemented (assumption, echoed from `CapacityAssumptions`) |
| `fteMonths` | `number ≥ 0` | months | Proposed and not implemented |

**Not implemented today:** the engine computes **cost only**; no effort is aggregated
(`src/estimation/calculate.ts`).

#### (6) Cost estimate

| Field | Type | Unit | Status |
| --- | --- | --- | --- |
| `labourCost` | `number ≥ 0` | currency | Existing and verified as `personnelCost` (rename proposed) |
| `toolingCost` | `number ≥ 0` | currency | Existing and verified |
| `infrastructureCost` | `number ≥ 0` | currency | Existing and verified |
| `otherCost` | `number ≥ 0` | currency | Existing and verified |
| `base` | `number ≥ 0` | currency | Proposed and not implemented (currently only implicit) |
| `contingencyPct` | `number ≥ 0` | % | Proposed and not implemented |
| `contingencyCost` | `number ≥ 0` | currency | Proposed and not implemented |
| `total` | `number ≥ 0` | currency | Existing and verified (cost sections only) |
| `byFeature` | `{ featureId, cost }[]` | currency | Proposed and not implemented |
| `currency` | `CurrencyCode` | — | Existing and verified |

#### (7) Timeline / milestone

| Field | Type | Unit | Status |
| --- | --- | --- | --- |
| `durationWeeks` | `number ≥ 0` | weeks | Proposed and not implemented **as a derived value** (frontend currently stores a user input) |
| `startDate` | `string \| null` | date | Existing and verified as a user input (`plannedStartDate`) |
| `capacity` | `{ teamSize, hoursPerWeek, utilisation, workingDaysPerWeek, hoursPerDay }` | mixed | Proposed and not implemented (assumptions) |
| `milestones` | `Milestone[]` | — | Proposed and not implemented |
| `Milestone.id` | `string` | — | Proposed and not implemented |
| `Milestone.name` | `string` | — | Proposed and not implemented |
| `Milestone.effortShare` | `number` (0–1) | — | Proposed and not implemented |
| `Milestone.targetDate` | `string \| null` | date | Proposed and not implemented |
| `schedulingBasis` | `'capacity-only' \| 'dependency-aware'` | — | Proposed (`capacity-only` only) |

#### (8) Assumption

| Field | Type | Status |
| --- | --- | --- |
| `assumptions` | `string[]` | Existing and verified (`src/estimation/calculate.ts:23`) |
| `Assumption.id` | `string` | Proposed and not implemented |
| `Assumption.kind` | `'scope' \| 'rate' \| 'productivity' \| 'timeline' \| 'risk' \| 'other'` | Proposed and not implemented |
| `Assumption.text` | `string` | Existing and verified (as the string itself) |
| `Assumption.source` | `'user' \| 'engine' \| 'default'` | Proposed and not implemented |

#### (9) Calculation result and errors

| Item | Type | Status |
| --- | --- | --- |
| `ProjectEstimateResult` | see `src/estimation/types.ts:58` | Existing and verified (cost sections only) |
| `effort` | `EffortEstimate` | Proposed and not implemented (additive field) |
| `timeline` | `TimelineEstimate` | Proposed and not implemented (additive field) |
| `features` | `FeatureResult[]` | Proposed and not implemented (additive field) |
| `EstimateValidationError` | `{ code, message, section?, lineIndex? }` (`src/estimation/types.ts:83`) | Existing and verified (TS) |
| Python `EstimateValidationError` | `{ code, message, lineIndex?, productId? }` (`backend/app/schemas.py:71`) | Existing but incompatible (wrong fields/codes) |
| `EstimateErrorCode` (TS) | `EMPTY_REQUEST, UNSUPPORTED_CURRENCY, INVALID_PERSONNEL, INVALID_TOOLING, INVALID_INFRASTRUCTURE, INVALID_OTHER, NON_FINITE_RESULT` | Existing and verified (TS) |
| `EstimateErrorCode` (PY) | material set | Existing but incompatible |

### 3.2 Distinctions the contract must preserve

| Must distinguish | Rule |
| --- | --- |
| **Effort vs calendar duration** | `effortHours` is calculated from tasks; `durationWeeks` is **derived** from `capacity` assumptions + total effort. They are different fields; a task never stores a duration. |
| **Resource capacity / availability vs calculated values** | `teamSize`, `hoursPerWeek`, `utilisation`, `workingDaysPerWeek`, `hoursPerDay` are **assumptions** (user/system-provided), echoed in the result and in `assumptions[]`; they are **not** calculated. |
| **Estimated vs user-provided** | Inputs: tasks, `effortHours`, rates, cost lines, capacity, milestones. Derived: effort rollups, cost per task/feature/project, `durationWeeks`, `personDays`, `fteMonths`, contingency. Mark origin in the model (`origin`/`source`). |
| **Deterministic vs future AI** | So far all calculation is deterministic. AI suggestions (feature/task drafts) must carry `origin: 'ai-draft'` and be user-reviewed; AI never produces an authoritative number. AI is **Deferred**. |
| **No invented history / no empirical validation** | No historical dataset exists; no accuracy claim (MMRE/PRED(25)/CI) may be made. Ranges are not in the MVP. |

---

## 4. Calculation behavior contract (deterministic & testable)

All formulas are pure, side-effect free, and reproducible in TS and Python with the same
`roundCurrency` (half-up, 2 dp, per line → per subtotal → per total; `src/estimation/money.ts`).

### 4.1 Task-level

- `taskLabourCost = roundCurrency(task.effortHours × role.hourlyRate)`.
- A task with unknown `roleId` → `INVALID_TASK_ROLE`.
- `task.effortHours` must be finite and `> 0` → else `INVALID_TASK_EFFORT`.

### 4.2 Rollups

- **Feature effort:** `featureEffortHours = Σ task.effortHours` (direct tasks; nested features sum
  leaves). Rounded to 2 dp.
- **Feature cost:** `featureCost = roundCurrency(Σ taskLabourCost)`.
- **Project labour:** `labourCost = roundCurrency(Σ featureCost)`.
- **Non-labour (existing):** `toolingCost = Σ roundCurrency(amount)`;
  `infrastructureCost = Σ roundCurrency(monthlyCost × months)`;
  `otherCost = Σ roundCurrency(amount)`.
- `base = labourCost + toolingCost + infrastructureCost + otherCost`.
- `contingencyCost = roundCurrency(base × contingencyPct / 100)` (if `contingencyPct` supplied ≥ 0).
- `total = roundCurrency(base + contingencyCost)`.

### 4.3 Role rates — selection

- MVP: rates are **supplied in the request** (`roles: Role[]`); the engine validates that every
  task's `roleId` resolves and that `role.currency === project.currency`.
- Backend-owned `GET /roles` rate card is **Deferred** (§5).
- If a role rate is missing/unusable → `INVALID_ROLE_RATE` (no silent default).

### 4.4 Capacity, parallelism, dependencies and timeline

**Inputs (assumptions):** `teamSize` (people > 0), `hoursPerWeek` (> 0), `utilisation`
(0 < u ≤ 1), `workingDaysPerWeek`, `hoursPerDay`.

**Derived:**

```
weeklyCapacityPersonHours = teamSize × hoursPerWeek × utilisation
rawDurationWeeks          = totalPersonHours / weeklyCapacityPersonHours
durationWeeks             = roundUpToHalfWeek(rawDurationWeeks)   // documented rule
personDays                = round2(totalPersonHours / hoursPerDay)
fteMonths                 = round2(personDays / (workingDaysPerWeek × 4.345))
```

- `roundUpToHalfWeek(x) = Math.ceil(x * 2) / 2` — prevents false precision and zero-length
  results. Documented and unit-tested.
- **Explicit limitation (must appear in every result):** this is a *capacity-only* indicative
  duration. It assumes work is fully parallelisable and that utilisation is constant. It is
  **not** a dependency-scheduled critical path.
- **Dependencies (`dependsOn`) are Deferred.** When present they are ignored for scheduling and the
  result must say so; the timeline is still `schedulingBasis: 'capacity-only'`.
- **Sum of task durations ≠ calendar duration:** because tasks carry effort (not durations), there
  is no "sum of durations". The contract states that `durationWeeks` derives from total effort ÷
  weekly capacity under the above assumptions, and never claims `Σ taskDuration`.
- If `teamSize`/`hoursPerWeek` are absent or invalid → **timeline is unavailable**: return
  `timeline: null` plus an assumption explaining why. Do **not** fabricate a duration.

### 4.5 Milestones

- Optional user input. `effortShare` values must be finite, ≥ 0, and sum to `1.0` within `±0.01`
  → else `INVALID_MILESTONES`.
- `targetDate` is computed **only** when both `startDate` and a valid `durationWeeks` exist:
  cumulative `effortShare × durationWeeks` from `startDate`. Otherwise `targetDate = null`.
- Milestones without a start date are shown as effort shares only — no invented dates.

### 4.6 Rounding and numeric validation

- Money: `roundCurrency`, 2 dp half-up, order as in §4.2.
- Effort: `personHours` rounded 2 dp; `personDays`/`fteMonths` rounded 2 dp.
- Duration: `roundUpToHalfWeek`.
- Numeric rules (reuse current): finite and `≥ 0` for cost metrics; `> 0` for task effort, team
  size, hours-per-week, hours-per-day; utilisation in `(0, 1]`. `NaN`/`Infinity` rejected.

### 4.7 Empty / invalid projects

- `currency` not in `INR|USD|EUR|AED` → `UNSUPPORTED_CURRENCY`.
- No tasks **and** no cost lines → `EMPTY_REQUEST` (return immediately).
- All failing tasks/lines are collected (not just the first); order: project → features → tasks →
  cost sections.
- Non-finite computed value → `NON_FINITE_RESULT` (HTTP 500).

### 4.8 Currency

- One currency per project/estimate; supported set `INR|USD|EUR|AED`.
- No automatic conversion; rate cards and all amounts share the project currency.
- Conversion, if ever added, is a separate pure display layer over an immutable estimate
  (**Deferred**).

### 4.9 Assumptions in every result

Every result includes a non-empty `assumptions: string[]` covering at minimum: currency (no
conversion), rate source (supplied, not market data), capacity assumptions used, the
capacity-only scheduling limitation, deferred dependencies, and any missing input whose derived
value was suppressed.

### 4.10 Missing capabilities → smallest safe implementation

| Capability | Current | Smallest safe implementation |
| --- | --- | --- |
| Feature/Task models | missing | Add types in `src/estimation/types.ts` (+ Python mirror); pure, no UI/network |
| Effort rollup | missing | Pure `sumEffortByRole/byFeature(project)` returning `EffortEstimate` |
| Timeline | missing | Pure `estimateTimeline(effortTotal, capacity)` with the §4.4 rule; returns `null` when inputs incomplete |
| Feature cost rollup | missing | Pure `rollupCostByFeature(tasks, roles)` |
| Contingency | missing | Optional `contingencyPct` on request; one roundCurrency step (§4.2) |
| Structured assumptions | strings only | Keep `string[]` for MVP; structured `Assumption[]` **Deferred** |

---

## 5. Minimum API contract

### 5.1 Current endpoints (verified)

| Endpoint | Implementation | Domain | Frontend expectation | Backend expectation | Verdict |
| --- | --- | --- | --- | --- | --- |
| `GET /api/v1/health` | `backend/app/routers/health.py:14` | material | `capabilities:{currencies,categories}` (`src/api/types.ts:26`) | `catalogue:{products,currency}` (`backend/app/schemas.py:100`) | **Existing but incompatible** — shapes differ |
| `GET /api/v1/products` | `backend/app/routers/products.py` | material | not used by current UI | material catalogue | **Existing but incompatible** (irrelevant to software MVP) |
| `POST /api/v1/estimates/calculate` | `backend/app/routers/estimates.py:12` | material `EstimateRequest{lines}` | posts `ProjectEstimateRequest` (`src/api/estimates.ts:12`) | expects `lines` | **Existing but incompatible** — payloads differ |

### 5.2 Recommended minimum surface (proposal)

1. **`GET /api/v1/health`** — retain the path, replace the body with reconciled `capabilities`.
2. **`POST /api/v1/estimates/calculate`** — retain the path, replace body/response with the
   canonical project-cost + effort + timeline contract.
3. **`GET /api/v1/products`** — **recommend replacing** with a later `GET /api/v1/roles`
   (rate card). For the MVP, **remove `/products` from the live UI path** and **Defer**
   `GET /roles` (rates supplied in the request). *Unapproved — proposal.*

Assistant endpoints remain **Deferred / explicitly unconfigured** (never a fake working AI).

### 5.3 Endpoint: `GET /api/v1/health`

- **Method/path:** `GET /api/v1/health`
- **Request:** none.
- **Proposed 200 response:**

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

- **Validation:** none. **Error:** `503 SERVICE_UNAVAILABLE` if not ready.
- **Frontend compatibility:** `src/api/types.ts:26` expects `capabilities.currencies` +
  `capabilities.categories` → **partial**; must reconcile to the shape above.
- **Backend compatibility:** currently returns `catalogue` → **incompatible**; change required.
- **Tests needed:** `backend/tests/test_health.py` asserts the new shape; a frontend
  `client.test.ts` case asserts the type parses.

### 5.4 Endpoint: `POST /api/v1/estimates/calculate`

- **Method/path:** `POST /api/v1/estimates/calculate`
- **Proposed request:**

```json
{
  "projectName": "Demo online store",
  "currency": "INR",
  "contingencyPct": 10,
  "capacity": { "teamSize": 3, "hoursPerWeek": 40, "utilisation": 1.0, "workingDaysPerWeek": 5, "hoursPerDay": 8 },
  "roles": [
    { "id": "backend", "name": "Backend Engineer", "hourlyRate": 1200, "currency": "INR" },
    { "id": "frontend", "name": "Frontend Engineer", "hourlyRate": 1100, "currency": "INR" }
  ],
  "features": [
    {
      "id": "accounts",
      "name": "Accounts",
      "origin": "user",
      "tasks": [
        { "id": "auth-api", "name": "Auth API", "roleId": "backend", "effortHours": 120 },
        { "id": "auth-ui", "name": "Auth screens", "roleId": "frontend", "effortHours": 80 }
      ]
    }
  ],
  "tooling": [{ "name": "Design suite", "amount": 24000 }],
  "infrastructure": [{ "name": "Cloud hosting", "monthlyCost": 9000, "months": 3 }],
  "other": [],
  "startDate": "2026-11-01",
  "milestones": [{ "id": "m1", "name": "MVP slice", "effortShare": 0.5 }]
}
```

- **Proposed 200 response** (numbers illustrative demo data):

```json
{
  "projectName": "Demo online store",
  "currency": "INR",
  "features": [
    { "featureId": "accounts", "effortHours": 200, "labourCost": 232000 }
  ],
  "effort": {
    "totalPersonHours": 200,
    "personDays": 25,
    "hoursPerDay": 8,
    "fteMonths": 1.15,
    "byRole": [
      { "roleId": "backend", "personHours": 120 },
      { "roleId": "frontend", "personHours": 80 }
    ],
    "byFeature": [{ "featureId": "accounts", "personHours": 200 }]
  },
  "labourCost": 232000,
  "toolingCost": 24000,
  "infrastructureCost": 27000,
  "otherCost": 0,
  "base": 283000,
  "contingencyCost": 28300,
  "total": 311300,
  "timeline": {
    "schedulingBasis": "capacity-only",
    "durationWeeks": 1.5,
    "startDate": "2026-11-01",
    "milestones": [{ "id": "m1", "name": "MVP slice", "effortShare": 0.5, "targetDate": "2026-11-05" }]
  },
  "assumptions": [
    "All amounts are calculated in INR. Live currency conversion is not configured.",
    "Rates are supplied inputs, not verified market rates.",
    "Duration is a capacity-only estimate (teamSize × hoursPerWeek × utilisation); it is not a dependency-scheduled plan.",
    "Task dependencies are not yet scheduled and are ignored for the timeline.",
    "Excludes taxes and duties."
  ],
  "method": "deterministic",
  "dataOrigin": "sample"
}
```

- **Validation:** §3–§4. Empty → `EMPTY_REQUEST`; bad currency → `UNSUPPORTED_CURRENCY`; bad
  task/role/line → `INVALID_*`; non-finite → `NON_FINITE_RESULT`.
- **Error envelope + status:**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Estimate request failed validation.",
  "details": [ { "code": "INVALID_TASK_EFFORT", "message": "Task \"auth-api\": effort hours must be greater than 0.", "section": "tasks", "lineIndex": 0 } ] } }
```

| Case | HTTP | Envelope code |
| --- | --- | --- |
| Malformed / wrong types | 400 | `REQUEST_MALFORMED` |
| Business-rule failure | 422 | `VALIDATION_ERROR` |
| Non-finite result | 500 | `CALCULATION_ERROR` |
| Unexpected | 500 | `INTERNAL_ERROR` |
| Client cannot reach server | n/a | `NETWORK_ERROR` (client-only) |

- **Frontend compatibility:** `src/api/types.ts:34` re-exports `ProjectEstimateRequest/Result` →
  **compatible after** these models are extended (additive optional fields keep old callers safe).
- **Backend compatibility:** expects material `EstimateRequest{lines}` → **incompatible**;
  requires the Python mirror + schema change.
- **Tests needed:** shared golden fixture cases (TS + PY) for: task cost, rollups, contingency,
  rounding, empty/invalid, and timeline (including the "timeline unavailable" path); one HTTP
  test per status code.

### 5.5 Deferred endpoints (not agreed, not implemented)

| Endpoint | Purpose | Status |
| --- | --- | --- |
| `GET /api/v1/roles` | Backend-owned rate card | Deferred |
| `GET/POST /api/v1/projects` | Persistence | Deferred (Sambram / Phase 04) |
| `POST /api/v1/scenarios/compare` | What-if | Deferred |
| `POST /api/v1/conversations/messages` | AI assistant | **Deferred / unconfigured** — must return 503, never a fabricated answer |

### 5.6 Frontend/backend contract drift prevention

1. **One frozen wire shape** in `docs/api-contract.md`; TS types and Pydantic models mirror it.
2. **One shared fixture** (`docs/fixtures/calculation-cases.json`) consumed by **both** suites.
3. **Additive-only changes** within `v1`; unknown fields ignored.
4. **CI-equivalent check:** typecheck + lint + vitest + build + pytest + ruff must all pass before a
   contract-affecting change is considered done.
5. **Single owner per shared file** (§6), edited only with the consuming owner's acknowledgement.

---

## 6. Integration ownership (authoritative proposal)

Names follow the approved brief: **Amrut, Owais, Sambram, Manju, Harshith**. (Older docs use
`Owasis`/`Harshit`; that spelling is superseded.)

| Owner | Role | Smallest set of files owned |
| --- | --- | --- |
| **Amrut** | Contract approval, coordination, integration, regression checks, demo | `docs/IMPLEMENTATION_PLAN_PHASE_2L.md`, `docs/api-contract.md`, `docs/CONTRACT_REVIEW_PHASE_2K.md`, `src/api/**`, `src/store/**`, `src/App.tsx`, `src/main.tsx`, root config (`vite.config.ts`, `tsconfig*.json`, `eslint.config.*`, `package.json`), `src/estimation/shared-fixture.test.ts`, `backend/tests/test_shared_fixture.py` |
| **Owais** | Frontend / UI / UX | `src/pages/**`, `src/components/**`, `src/styles/**`, `src/constants/**`, `src/data/sampleEstimates.ts` |
| **Sambram** | Database & data design | `docs/data-model.md` (new), future persistence/DDL, seed datasets, import tooling, `ExchangeRate`/historical stores |
| **Manju** | Backend API & integration | `backend/app/{main,config,errors,schemas}.py`, `backend/app/routers/**`, backend HTTP tests |
| **Harshith** | Estimation engine & related backend logic | `src/estimation/**` (except the shared-fixture test), `backend/app/estimation/**`, `docs/fixtures/**`, `docs/estimation-engine.md` |

**Shared files (change only via a reviewed contract update, acknowledged by the other owner):**

| Shared file | Primary owner | Consumer(s) |
| --- | --- | --- |
| `docs/api-contract.md` | Amrut | Manju, Harshith, Owais |
| `src/estimation/types.ts` | Harshith | Amrut (`src/api`), Owais |
| `src/api/types.ts` | Amrut | Owais |
| `backend/app/schemas.py` | Manju | Harshith (engine), Sambram |
| `docs/fixtures/calculation-cases.json` | Harshith | Amrut (fixture tests) |

**Required handoff interfaces:**

- Harshith → Manju: exact request/result field names + validation order (wire shape).
- Harshith → Amrut: the TS/Python core signatures used by `src/api` and the fixture.
- Amrut → Owais: the typed client surface (`src/api`) and result state shapes.
- Sambram → Manju: persistence DTOs (Deferred; interface only).
- Manju ↔ Amrut: HTTP status/error mapping and tests.

**Current overlap note:** the WIP migration already touched several owners' files
(`src/estimation/**`, `src/pages/**`, `src/components/**`, `src/api/**`, `src/store/**`). Repairing
this branch must respect the map above; do not create or switch branches (git policy).

---

## 7. Incremental implementation phases (proposed order only)

Each phase is small, reversible, and independently verifiable. **This is a proposal; do not
execute without Amrut's approval.**

### Phase P0 — Freeze contracts and shared fixtures *(this document)*
- **Objective:** approve §3–§5 and the §6 ownership map.
- **Files:** `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` only.
- **Deps:** none. **Owner:** Amrut.
- **Acceptance:** plan approved; decisions in §9 resolved. **Tests:** none.

### Phase P1 — Restore a compilable/tests-collecting baseline
- **Objective:** fix the 8 typecheck errors and restore backend test collection.
- **Files:** `src/api/client.ts`, `src/api/types.ts`, `src/components/layout/TopBar.tsx`,
  `src/constants/navigation.ts`, `src/estimation/calculate.test.ts`, `src/pages/NewEstimatePage.tsx`,
  `backend/tests/test_shared_fixture.py`, `docs/fixtures/calculation-cases.json`.
- **Deps:** P0. **Owners:** Amrut (api/types/tests), Owais (TopBar/pages), Harshith (calculate.test),
  Manju (backend fixture consumer).
- **Acceptance:** `npm run typecheck` exits 0; `pytest` collects and runs.
- **Tests:** existing suites. **Risk/rollback:** keep changes minimal; revert per-file if needed.

### Phase P2 — Deterministic cost core (freeze + mirror)
- **Objective:** freeze the cost-calculator subset in TS and mirror it in Python.
- **Files:** `src/estimation/**`, `backend/app/estimation/**`, `backend/app/schemas.py`,
  `docs/fixtures/calculation-cases.json`.
- **Deps:** P1. **Owners:** Harshith (engine), Manju (schemas).
- **Acceptance:** shared fixture green on **both** sides; money/rounding identical.
- **Tests:** `roundCurrency` cases; per-section and total cases.

### Phase P3 — Feature/Task breakdown + effort aggregation
- **Objective:** add Feature/Task/Role/Effort types and pure rollups (§3, §4.1–4.3).
- **Files:** `src/estimation/{types,calculate}.ts`, new pure modules, Python mirror, fixture cases.
- **Deps:** P2. **Owner:** Harshith.
- **Acceptance:** `EffortEstimate` matches hand-computed fixture values; parity both sides.
- **Tests:** task cost, feature rollup, project labour rollup, invalid task/role codes.

### Phase P4 — Timeline estimation (capacity-only)
- **Objective:** derive `durationWeeks`, `personDays`, `fteMonths`, milestones (§4.4–4.5).
- **Files:** `src/estimation/**` (+ new `timeline.ts`), Python mirror, fixture cases.
- **Deps:** P3. **Owner:** Harshith.
- **Acceptance:** documented `roundUpToHalfWeek`; "timeline unavailable" path returns `null` with an
  assumption; no claim that Σ task durations = calendar duration.
- **Tests:** capacity formula, utilisation bounds, unavailable path, milestone share validation.

### Phase P5 — Backend API surface
- **Objective:** implement the reconciled `/health` and `/estimates/calculate` (§5).
- **Files:** `backend/app/{schemas,errors}.py`, `backend/app/routers/{health,estimates}.py`,
  `backend/tests/**`.
- **Deps:** P2–P4. **Owner:** Manju (with Harshith on engine calls).
- **Acceptance:** pytest + ruff green; each status code covered; `response_model_exclude_none`.
- **Tests:** health shape; success; 400/422/500 envelopes.

### Phase P6 — Frontend integration
- **Objective:** wire the UI to the frozen API; loading/error/offline/"AI not configured" states.
- **Files:** `src/api/**`, `src/pages/**`, `src/components/**`, `src/store/**`.
- **Deps:** P5. **Owners:** Owais (UI), Amrut (client/store).
- **Acceptance:** typecheck/lint/vitest/build green; offline disables Calculate (no fabricated total).
- **Tests:** api client cases; component render (server-render) cases.

### Phase P7 — End-to-end demo + regression
- **Objective:** run the minimum viable demo (§8) and the full regression suite.
- **Files:** `docs/manual-smoke-test.md` (demo notes), demo script.
- **Deps:** P6. **Owner:** Amrut.
- **Acceptance:** all checks pass; demo walkthrough reproducible; limitations shown.
- **Tests:** full suite + timed dry-run.

---

## 8. Acceptance criteria for this documentation phase

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Plan matches verified repository state (§1) | Met |
| 2 | Implemented behavior separated from proposed (§3–§5, status labels) | Met |
| 3 | Explains how frontend/backend contract drift is prevented (§5.6) | Met |
| 4 | Defines a minimum viable end-to-end demonstration (§8.1) | Met |
| 5 | Lists decisions still requiring approval (§9) | Met |
| 6 | Identifies tests that prove the contract (§4–§5, §7) | Met |
| 7 | Preserves the scope discrepancy and existing work (§2.1, §1) | Met |

### 8.1 Minimum viable end-to-end demonstration

A judge can, with the backend running and using **labelled illustrative data**:

1. Open New Estimate; enter project details and pick one currency (INR/USD/EUR/AED).
2. Add a feature with one or two tasks (role + effort hours) and at least one non-labour cost.
3. Calculate → see per-feature/task **effort**, **labour + tooling + infra + other** cost,
   contingency, and **total** in the chosen currency.
4. See the **derived timeline** (capacity-only) and the **assumptions/limitations** panel.
5. Confirm the assistant/AI surface shows **"not configured"** (no fake AI).
6. Confirm offline behaviour disables Calculate and never fabricates a total.

Not in the MVP: real historical data, ML/parametric/analogy, statistical confidence intervals,
dependencies-aware scheduling, persistence, auth.

---

## 9. Decisions still requiring Amrut's approval

| # | Decision | Recommended |
| --- | --- | --- |
| D1 | Domain scope (software vs building products) | Software (provisional; confirm with organizers) |
| D2 | Confirm WIP branch repair vs restart | Repair `wip/software-estimation-migration` (per brief) |
| D3 | Money representation | Flat `currency` + numeric amounts (as frozen) |
| D4 | Rename `personnelCost` → `labourCost`? | Yes, with a one-release additive alias if needed |
| D5 | Contingency in MVP? | Include optional `contingencyPct` (simple, testable) |
| D6 | Roles in request vs `GET /roles` | In request for MVP; `GET /roles` Deferred |
| D7 | Timeline rounding rule | `roundUpToHalfWeek`, labelled capacity-only |
| D8 | Replace `/products` with `/roles`? | Defer `/roles`; drop `/products` from the live UI path |
| D9 | Freeze the transport error-code set (§5.4) | Approve; drop stale `ESTIMATE_NOT_FOUND`/`PRODUCT_NOT_FOUND` |
| D10 | Structured `Assumption[]` now? | Defer; keep `string[]` for MVP |
| D11 | Fixture strategy (v1 material vs v2 project) | Replace fixture and both consumers in one change (P1) |
| D12 | Ownership map (§6) sign-off | Approve as written |

---

## 10. Final report (this phase)

- **Branch / HEAD:** `wip/software-estimation-migration` @ `07faa05`; upstream
  `origin/wip/software-estimation-migration` (no ahead/behind).
- **Working-tree state:** no staged changes; no tracked changes; untracked docs
  `CONTRACT_REVIEW_PHASE_2K.md`, `INTEGRATION_COORDINATION.md`, `INTEGRATION_READINESS.md`,
  `PROBLEM_VALIDATION.md` preserved.
- **Exact files changed this phase:** **one** — `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` (new).
  No existing document was modified.
- **Verified facts vs prior reports:** re-verified git state and the Phase 2K failure status
  (typecheck 8 errors; pytest collection error). Earlier "green baseline" claims are superseded.
- **Acceptance criteria:** all seven met (§8).
- **Unresolved decisions:** D1–D12 (§9).
- **Scope discrepancy:** preserved and explicit (§2.1).

> **No application code, tests, fixtures, dependencies, configuration or migrations were changed.
> No commit, push, merge, PR, reset or clean was performed. No branch was created or switched, and
> no teammate execution prompts were generated.** Stopping here for Amrut's approval.
