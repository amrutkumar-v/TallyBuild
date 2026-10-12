# Phase 2M — Contract Repair Execution Checklist

**Status:** Planning artifact. **Documentation only.** No application code, tests, fixtures,
dependencies, configuration or migrations were changed. Nothing was committed, pushed, merged or
reset. No branch was created or switched, and no build artifacts were generated.

**Phase:** 2M. **Reviewed branch:** `wip/software-estimation-migration` (HEAD `07faa05`).
**Author role:** Amrut (contract approval, coordination, integration, regression checks, demo).

> **Honesty banner.** This is a **checklist**, not evidence of completion. The branch currently
> **fails frontend typecheck (8 errors)** and **fails backend test collection** (Phase 2M Step 1,
> below). There is **no AI, assistant, dataset, ML, Monte Carlo or confidence interval**. Every
> "required change" here is a **proposal** awaiting Amrut's approval. Nothing here authorizes
> feature/task/effort/timeline work beyond the repair boundary in §5.

---

## Step 1 — Verified current state

### 1.1 Git (verified this session)

| Item | Value |
| --- | --- |
| Branch | `wip/software-estimation-migration` |
| HEAD | `07faa0525a6336279233bf46b0f14ba6d695c9fa` |
| Upstream | `origin/wip/software-estimation-migration` — up to date (no ahead/behind) |
| Remote | `origin` = https://github.com/amrutkumar-v/TallyBuild.git |
| Staged | none |
| Tracked changes | none |
| Untracked | `docs/CONTRACT_REVIEW_PHASE_2K.md`, `docs/IMPLEMENTATION_PLAN_PHASE_2L.md`, `docs/INTEGRATION_COORDINATION.md`, `docs/INTEGRATION_READINESS.md`, `docs/PROBLEM_VALIDATION.md` (all preserved) |

### 1.2 Failure reproduction (read-only checks; both still reproduce)

| Check | Command | Result |
| --- | --- | --- |
| Frontend typecheck | `npm run typecheck` | **8 errors / 4 files** (unchanged from Phase 2K) |
| Backend tests | `.venv\Scripts\python.exe -m pytest -q` | **collection error** — `KeyError: 'customCatalogue'` at `backend/tests/test_shared_fixture.py:25`; 0 tests run |

**Exact typecheck errors:**

| # | File:line | Code | Message |
| --- | --- | --- | --- |
| 1 | `src/api/client.ts:6` | TS2769 | `ESTIMATE_NOT_FOUND` not assignable to `ApiErrorCode` |
| 2 | `src/components/layout/TopBar.tsx:4` | TS2305 | `getPageTitle` not exported from `constants/navigation` |
| 3 | `src/estimation/calculate.test.ts:5` | TS6133 | `baseRequest` declared but never read |
| 4 | `src/pages/NewEstimatePage.tsx:164` | TS2345 | `PersonnelEditorRowErrors` not assignable to `Record<string, string \| undefined>` |
| 5 | `src/pages/NewEstimatePage.tsx:165` | TS2345 | (same) |
| 6 | `src/pages/NewEstimatePage.tsx:166` | TS2345 | (same) |
| 7 | `src/pages/NewEstimatePage.tsx:184` | TS2345 | `CostLineRowErrors` not assignable to `Record<string, string \| undefined>` |
| 8 | `src/pages/NewEstimatePage.tsx:186` | TS2345 | (same) |

### 1.3 Verified facts about the two sides

- **Frontend:** project-cost domain already present — `src/estimation/types.ts` (personnel/tooling/
  infrastructure/other), `src/estimation/currencies.ts` (INR/USD/EUR/AED), WIP `NewEstimatePage`,
  `PersonnelEditor`, `CostLinesEditor`; `src/api/estimates.test.ts` already project-cost.
- **Backend:** **still material** — `backend/app/schemas.py` (`Literal["INR"]`, `MaterialProduct`,
  `EstimateRequest{lines}`, `EstimateResult{lineResults,itemCount,...}`),
  `backend/app/estimation/{calculate,catalogue,units,sample_products}.py`,
  `backend/app/routers/{products,estimates,health}.py`, tests `test_products/test_calculate/
  test_rounding/test_health/factories.py`.
- **Shared fixture:** `docs/fixtures/calculation-cases.json` is **version 2** (project-cost) and the
  TS consumer `src/estimation/shared-fixture.test.ts` matches it; the **Python consumer is v1**.

---

## Step 2 — Repair checklist

Conventions: **Owner** = Amrut / Owais / Sambram / Manju / Harshith. **Priority** P0 blocks
everything, P1 restores the baseline, P2 aligns the wire, P3 housekeeping. Every item is a proposal.

### RC-01 — Freeze shared contract + fixture decisions *(Topic 7, 9; prerequisite for all)*
- **Priority:** P0. **Reason:** the TS and Python sides disagree on models/fixture version; any code
  repair without a frozen shape will re-diverge.
- **Files:** `docs/api-contract.md`, `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` (reference only — no
  other app files).
- **Current incompatibility:** fixture v2 vs consumer v1; contract has competing shapes across
  `INTEGRATION_READINESS.md`, `INTEGRATION_COORDINATION.md`, `TEAM_HANDOFF_DOMAIN_4C.md`.
- **Required change:** approve one wire shape — flat `currency` + numeric amounts; sections
  personnel/tooling/infrastructure/other; error codes per RC-09; fixture = v2 keys
  (`rounding`, `roundingCases`, `cases`) only. Record in `docs/api-contract.md`.
- **Owner:** Amrut (approval) with Harshith + Manju.
- **Deps / handoff:** none; this gates RC-06, RC-07, RC-09, RC-11.
- **Tests:** none (documentation), but the frozen fixture must be the one both suites load.
- **Acceptance:** decisions D1–D12 in §6 resolved and written into `docs/api-contract.md`.
- **Risk / rollback:** doc-only; revert the doc edit if shape changes.

### RC-02 — `src/api/client.ts:6` — remove stale `ESTIMATE_NOT_FOUND` *(Topic 1)*
- **Priority:** P1. **Reason:** blocks typecheck.
- **Files:** `src/api/client.ts`.
- **Current incompatibility:** `KNOWN_ERROR_CODES` contains `'ESTIMATE_NOT_FOUND'`, but
  `ApiErrorCode` (`src/api/types.ts:7`) no longer includes it.
- **Required change:** delete `'ESTIMATE_NOT_FOUND'` from the `KNOWN_ERROR_CODES` set. (No
  persistence endpoint exists, so the code is unreachable.)
- **Owner:** Amrut (owns `src/api`).
- **Deps / handoff:** RC-01 (frozen transport code set).
- **Tests:** `src/api/client.test.ts` must still pass (no case asserts this code).
- **Acceptance:** error #1 gone; `ApiErrorCode` and `KNOWN_ERROR_CODES` agree.
- **Risk / rollback:** if a persistence endpoint is later added, re-introduce the code in **both**
  places in one change. Revert = re-add the string.

### RC-03 — Restore `getPageTitle` for `TopBar` *(Topic 1)*
- **Priority:** P1. **Reason:** blocks typecheck.
- **Files:** `src/constants/navigation.ts`, `src/components/layout/TopBar.tsx`.
- **Current incompatibility:** `TopBar.tsx:4` imports `getPageTitle`; `navigation.ts` now exports
  only `NAV_ITEMS`.
- **Required change:** add `getPageTitle(pathname: string): string` to `navigation.ts`, derived from
  `NAV_ITEMS` with a sensible fallback (e.g. the matched item label, else the app name). Keep
  `TopBar` usage unchanged.
- **Owner:** Owais (owns `src/constants`, `src/components/layout`).
- **Deps / handoff:** none; keep `NAV_ITEMS` shape unchanged for `Sidebar`.
- **Tests:** add/adjust a small unit test asserting a known route maps to its label and an unknown
  route falls back (pure function; runs in node env, `.test.ts`).
- **Acceptance:** error #2 gone; top bar still shows the correct page title.
- **Risk / rollback:** derive from existing `NAV_ITEMS` so no labels are duplicated; revert = undo
  the helper and the import.

### RC-04 — `src/estimation/calculate.test.ts:5` — unused `baseRequest` *(Topic 1)*
- **Priority:** P1. **Reason:** `TS6133` unused symbol under strict config.
- **Files:** `src/estimation/calculate.test.ts`.
- **Current incompatibility:** `baseRequest` helper defined but never called.
- **Required change:** either delete the helper **or** use it in the suite (prefer using it so tests
  stay terse). Do not weaken `noUnusedLocals`.
- **Owner:** Harshith (owns `src/estimation`).
- **Deps / handoff:** none.
- **Tests:** the file itself (existing assertions must remain true).
- **Acceptance:** error #3 gone; suite green.
- **Risk / rollback:** test-only; trivial revert.

### RC-05 — `NewEstimatePage.tsx` typed-error mismatches *(Topic 1, 9)*
- **Priority:** P1. **Reason:** 5 of 8 typecheck errors; blocks the whole build.
- **Files:** `src/pages/NewEstimatePage.tsx` (and, if chosen, `PersonnelEditor.tsx`,
  `CostLinesEditor.tsx`).
- **Current incompatibility:** `validateNumber(...)` (`NewEstimatePage.tsx:138`) types its `errors`
  parameter as `Record<string, string | undefined>`, but callers pass `PersonnelEditorRowErrors`
  and `CostLineRowErrors` (`PersonnelEditor.tsx:20`, `CostLinesEditor.tsx:20`), which have no index
  signature.
- **Required change (pick one, smallest safe):**
  - (a) Widen `validateNumber`'s parameter to accept the row-error unions, e.g.
    `errors: Record<string, string | undefined>` → a generic `E extends Record<string, string | undefined>`,
    or
  - (b) have `validateNumber` write into a locally-typed object cast to the target row-error type at
    the assignment site.
  Prefer (a). Do not add `any` or `// @ts-ignore`.
- **Owner:** Owais (owns `src/pages`, `src/components/estimates`).
- **Deps / handoff:** coordinate the helper signature with Harshith only if it touches estimation
  types (it should not).
- **Tests:** `src/pages/NewEstimatePage.test.ts` (server-render) must still pass; add a case if the
  helper signature changes behavior.
- **Acceptance:** errors #4–#8 gone; page renders and validates as before.
- **Risk / rollback:** page-only; revert the signature change.

### RC-06 — Backend shared-fixture consumer (collection failure) *(Topic 2, 7)*
- **Priority:** P0/P1. **Reason:** **no** backend test runs until this is fixed; it also proves TS/PY
  parity.
- **Files:** `backend/tests/test_shared_fixture.py` (consumer), `docs/fixtures/calculation-cases.json`
  (source of truth, owned by Harshith).
- **Current incompatibility:** consumer reads `FIXTURE["customCatalogue"]` (v1 material) and imports
  `SAMPLE_PRODUCT_CATALOGUE`, `EstimateRequest{lines}`, asserts `itemCount`/`lineSubtotal`/
  `productIds`; the fixture is **v2** (project-cost) with keys `rounding`, `roundingCases`, `cases`.
- **Required change:** rewrite the consumer to v2: parse `roundingCases` + `cases`; build
  `ProjectEstimateRequest` (currency + four sections); assert `currency`, `projectName`, `lineCount`,
  per-section costs, `total`, and error codes/`section`/`lineIndex`. Remove `customCatalogue` and all
  material imports. Keep the fixture identical to `docs/fixtures/calculation-cases.json`.
- **Owner:** Amrut (owns the fixture test file) with Manju (backend test suite owner) and Harshith
  (fixture data).
- **Deps / handoff:** RC-01 (frozen fixture format) and RC-07 (Python schema names) must land first
  or together.
- **Tests:** `python -m pytest` must **collect** and the fixture tests must pass.
- **Acceptance:** `pytest` exits 0; the same `cases` pass on both `src/estimation/shared-fixture.test.ts`
  and the Python consumer.
- **Risk / rollback:** keep the fixture file untouched except by Harshith; if the rewrite fails,
  revert the consumer only (fixture is already committed-in-branch state).

### RC-07 — Align TypeScript ↔ Python request/response schemas *(Topic 3)*
- **Priority:** P1. **Reason:** the backend request/response cannot satisfy the frontend client.
- **Files:** `backend/app/schemas.py`, `backend/app/estimation/{calculate,catalogue,units,
  sample_products}.py` (replace material logic), `backend/app/routers/estimates.py`.
- **Current incompatibility:** Python uses `CurrencyCode = Literal["INR"]`, `MaterialProduct`,
  `EstimateRequest{lines}`, `EstimateResult{lineResults,itemCount,subtotal,total}`; TS uses
  `ProjectEstimateRequest{currency,personnel,tooling,infrastructure,other}` and
  `ProjectEstimateResult{sections,subtotal per section,total,assumptions}`.
- **Required change:** mirror the frozen TS models in Pydantic with **identical field names**:
  `CurrencyCode`, `PersonnelLine`, `ToolingLine`, `InfrastructureLine`, `OtherCostLine`,
  `ProjectEstimateRequest`, `ProjectEstimateResult` (+ `CostSection[T]`), and
  `EstimateValidationError {code,message,section?,lineIndex?}`. Reimplement
  `backend/app/estimation/calculate.py` as the exact TS algorithm (validation order, messages,
  rounding via existing `money.round_currency`). Retire `catalogue.py`/`units.py`/`sample_products.py`
  from this path.
- **Owner:** Manju (schemas/router) + Harshith (engine mirror).
- **Deps / handoff:** RC-01 (frozen field names); Harshith → Manju wire-shape handoff.
- **Tests:** RC-06 fixture parity + `backend/tests/test_calculate.py` rewritten to project-cost.
- **Acceptance:** a project-cost request round-trips TS→PY with identical output.
- **Risk / rollback:** large but isolated to backend estimation; keep material modules untracked-
  deleted only after the mirror is green (or delete in the same reviewed change). Revert = restore
  the material modules from `121893a`.

### RC-08 — Align the health-response fields *(Topic 4)*
- **Priority:** P1. **Reason:** the frontend reads `capabilities`; the backend sends `catalogue`.
- **Files:** `backend/app/schemas.py` (`HealthResponse`), `backend/app/routers/health.py`,
  `backend/app/config.py`, `src/api/types.ts`.
- **Current incompatibility:** frontend expects
  `capabilities: { currencies: string[]; categories: string[] }` (`src/api/types.ts:26`); backend
  returns `catalogue: { products: int; currency: "INR" }` (`schemas.py:100`, `health.py:23`).
- **Required change:** adopt one shape, e.g.
  `capabilities: { currencies: ["INR","USD","EUR","AED"], methods: ["deterministic"], aiConfigured: false, historicalData: "not available" }`,
  and update `src/api/types.ts` accordingly.
- **Owner:** Manju (backend) + Amrut (frontend types).
- **Deps / handoff:** RC-01.
- **Tests:** `backend/tests/test_health.py` updated to the new body; a frontend `client.test.ts`
  case that parses the new shape.
- **Acceptance:** health body identical both sides; `NewEstimatePage` service-gate still works.
- **Risk / rollback:** `NewEstimatePage` only checks `status === 'ok'`, so removal of `catalogue` is
  safe; revert = restore the old field.

### RC-09 — Unify error codes, envelope and validation behavior *(Topic 5)*
- **Priority:** P1. **Reason:** mismatched codes/fields cause silent runtime failures and block parity.
- **Files:** `src/estimation/types.ts`, `src/api/types.ts`, `src/api/client.ts`,
  `backend/app/schemas.py`, `backend/app/errors.py`, `backend/app/routers/estimates.py`,
  `docs/api-contract.md`.
- **Current incompatibility:** TS domain set = `EMPTY_REQUEST, UNSUPPORTED_CURRENCY,
  INVALID_PERSONNEL, INVALID_TOOLING, INVALID_INFRASTRUCTURE, INVALID_OTHER, NON_FINITE_RESULT`;
  PY set = material codes. TS error uses `section`; PY uses `productId`. Docs still list
  `PRODUCT_NOT_FOUND`.
- **Required change:** freeze **one** transport set (`REQUEST_MALFORMED`, `VALIDATION_ERROR`,
  `CALCULATION_ERROR`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`; `NETWORK_ERROR` client-only) and
  **one** domain set (the TS list), mirrored in Pydantic. Freeze `details[]` as
  `{code,message,section?,lineIndex?}`. Status mapping: 400 malformed → 422 domain → 500 non-finite.
  Remove `PRODUCT_NOT_FOUND` from `docs/api-contract.md`.
- **Owner:** Amrut (TS/docs) + Manju (PY/envelope).
- **Deps / handoff:** RC-01, RC-07.
- **Tests:** `client.test.ts` envelope cases; backend HTTP tests for 400/422/500 in
  `test_calculate.py`.
- **Acceptance:** identical codes/fields on both sides; every status covered by a test.
- **Risk / rollback:** keep messages stable; revert per-file.

### RC-10 — Four-currency support without conversion *(Topic 6)*
- **Priority:** P1. **Reason:** frontend offers 4 currencies; backend hard-codes INR.
- **Files:** `backend/app/schemas.py` (`CurrencyCode`), `backend/app/config.py` (`CURRENCY`),
  `backend/app/routers/health.py`, `src/api/types.ts`, `docs/api-contract.md`.
- **Current incompatibility:** `CurrencyCode = Literal["INR"]`; `config.CURRENCY = "INR"`;
  `calculate.py` forces `currency="INR"`.
- **Required change:** `CurrencyCode = Literal["INR","USD","EUR","AED"]`; validate the requested
  currency and **echo** it; **no conversion** anywhere; `UNSUPPORTED_CURRENCY` for anything else.
  State "conversion not configured" in assumptions.
- **Owner:** Manju (backend) + Harshith (engine) + Amrut (types/docs).
- **Deps / handoff:** RC-07.
- **Tests:** fixture cases already include USD/EUR/AED/GBP (`calculation-cases.json`); add a PY
  case asserting a 422 `UNSUPPORTED_CURRENCY`.
- **Acceptance:** all four currencies round-trip; `GBP` rejected; no FX code exists.
- **Risk / rollback:** keep amounts as numbers; revert `Literal` and config in one change.

### RC-11 — Single canonical shared-fixture format + compatibility tests *(Topic 7)*
- **Priority:** P0/P1. **Reason:** the fixture is the anti-drift mechanism; both consumers must load
  the same file.
- **Files:** `docs/fixtures/calculation-cases.json` (Harshith), `src/estimation/shared-fixture.test.ts`
  (Amrut), `backend/tests/test_shared_fixture.py` (Amrut/Manju).
- **Current incompatibility:** v2 fixture vs v1 Python consumer (RC-06); TS consumer already v2.
- **Required change:** keep the v2 schema and key names; ensure both consumers parse identical keys
  and assert identical outcomes; add a guard test asserting the fixture `version`.
- **Owner:** Harshith (fixture) + Amrut (both consumers).
- **Deps / handoff:** RC-01, RC-06.
- **Tests:** both suites pass the same `roundingCases` and `cases`.
- **Acceptance:** changing the fixture cannot pass on one side and fail on the other.
- **Risk / rollback:** keep `version: 2`; bump to `3` only with both consumers updated together.

### RC-12 — Retire obsolete material-catalogue assumptions from the software path *(Topic 8)*
- **Priority:** P2. **Reason:** material modules/tests/docs mislead contributors and keep dead
  endpoints alive.
- **Files (backend):** `backend/app/estimation/{units.py,sample_products.py,catalogue.py}` (remove
  from software path), `backend/app/routers/products.py`, `backend/app/main.py` (stop including the
  products router), `backend/tests/{test_products.py,test_rounding.py,factories.py}` (rewrite or
  remove material cases), `backend/app/schemas.py` (drop `MaterialProduct`, `PriceSource`,
  `EstimateLineItem`, `ProductListResponse`).
- **Files (docs):** `docs/api-contract.md`, `docs/estimation-engine.md`, `README.md` — mark material
  sections superseded.
- **Current incompatibility:** `/api/v1/products` and the material catalogue are wired and tested.
- **Required change:** remove `/products` from the live UI path and from `main.py`; keep `money.py`
  (rounding is reused). Retire material schemas/tests. Frontend `SAMPLE_PRODUCT_CATALOGUE` is already
  gone from `src/` (confirmed). Label retirement as a proposal.
- **Owner:** Manju + Harshith (backend) + Amrut (docs). Sambram consulted on data retirement.
- **Deps / handoff:** RC-07 (new schemas must exist first).
- **Tests:** remove/replace material tests; ensure no reference to `productId`/`quantity`/
  `MaterialProduct` remains on the software path.
- **Acceptance:** no material concept in the request/response path; `pytest`/`ruff` green.
- **Risk / rollback:** deletion is the riskiest step — do it **after** the project-cost mirror is
  green, on this branch only, and keep `121893a` as the recovery point. Revert = restore files from
  `121893a`.

### RC-13 — Preserve existing UI behavior and regression tests *(Topic 9)*
- **Priority:** P1. **Reason:** repairs must not silently change UX or drop coverage.
- **Files (must stay green):** `src/estimation/money.test.ts`, `src/estimation/calculate.test.ts`,
  `src/estimation/shared-fixture.test.ts`, `src/api/client.test.ts`, `src/api/estimates.test.ts`,
  `src/pages/NewEstimatePage.test.ts`, `src/components/estimates/EstimateResultCard.test.ts`.
- **Current incompatibility:** `src/api/client.test.ts:42,48,60` still uses **material** sample data
  (`{ lines: [{ productId, quantity }] }`, `INVALID_QUANTITY`); it passes but is stale.
- **Required change:** update stale test **data** to project-cost (keep the assertions on
  envelope/transport behavior). Do not delete regression coverage. Preserve the `DemoNotice`/
  illustrative-data labelling and the offline-disables-calculate behavior.
- **Owner:** Amrut (`src/api` tests) + Owais (page/component tests).
- **Deps / handoff:** RC-05, RC-07–RC-09.
- **Tests:** the full frontend suite (`npm test`).
- **Acceptance:** `npm test` green; no UX regression; labels intact.
- **Risk / rollback:** test-only edits; revert individually.

### RC-14 — Keep the deterministic repair separate from feature/task/effort/timeline *(Topic 10)*
- **Priority:** P0 (boundary). **Reason:** amending scope here risks an unreviewable change.
- **Files:** none — this is a **scope gate**.
- **Required change:** this phase repairs **only** the existing four-section cost calculator path
  (personnel/tooling/infrastructure/other → total). **Feature, Task, Role-catalogue, Effort,
  Timeline, Scenario and AI are explicitly out of scope here** and proceed only after the baseline
  in §4 is green, under Phase 2L P3–P5.
- **Owner:** Amrut.
- **Deps / handoff:** gates all post-repair work.
- **Tests:** none.
- **Acceptance:** every file touched by this phase maps to RC-02…RC-13 within the cost-calculator
  boundary.
- **Risk / rollback:** if a proposed change needs new fields (e.g. `effort`), stop and defer it.

---

## Step 3 — Proposed repair order (smallest safe sequence)

> **Proposed, not executed.** Do not claim any step complete.

| Order | Step | Item(s) | Gate to proceed |
| --- | --- | --- | --- |
| RP-0 | Resolve shared contract + fixture decisions | RC-01 | Contract written in `docs/api-contract.md` |
| RP-1 | Repair TypeScript type errors | RC-02, RC-03, RC-04, RC-05 | `npm run typecheck` exits 0 |
| RP-2 | Repair backend collection + fixture consumer | RC-06, RC-11 | `pytest` collects and fixture tests run |
| RP-3 | Align TS↔PY schemas + health + errors + currency | RC-07, RC-08, RC-09, RC-10 | parity fixture green both sides |
| RP-4 | Retire material path + update stale tests | RC-12, RC-13 | no material concept on the software path |
| RP-5 | Run the full relevant suite | all | typecheck, lint, `npm test`, build, pytest, ruff all exit 0 |
| RP-6 | **Then** authorize feature/task + effort + timeline (2L P3–P5) | RC-14 gate | baseline green + Amrut approval |

Rationale: fix the compiler and the Python import error first (fast, low-risk), then make the two
sides agree on the wire, then remove dead material code, and only then widen scope.

**Full relevant test suite (RP-5):**

```bash
npm run typecheck
npm run lint
npm test
npm run build          # dist/ is gitignored; do not commit artifacts
# from backend/ with the venv:
python -m pytest
python -m ruff check .
python -m ruff format --check .
```

---

## Step 4 — Out of scope for this phase

- No AI, assistant, LLM, dataset, ML, Monte Carlo, confidence interval or scenario work.
- No Feature/Task/Role-catalogue/Effort/Timeline implementation (deferred to 2L P3–P5).
- No persistence, auth, deployment or currency conversion.
- No ownership or branch changes.

---

## Step 5 — Verification and report

- **Only file added this phase:** `docs/PHASE_2M_EXECUTION_CHECKLIST.md`. No existing document was
  edited or removed.
- **Preserved:** `docs/CONTRACT_REVIEW_PHASE_2K.md`, `docs/IMPLEMENTATION_PLAN_PHASE_2L.md`,
  `docs/INTEGRATION_COORDINATION.md`, `docs/INTEGRATION_READINESS.md`, `docs/PROBLEM_VALIDATION.md`,
  and the WIP branch history.
- **Read-only checks run:** `git status`/`rev-parse`, `npm run typecheck` (8 errors),
  `pytest -q` (collection error) — reported verbatim in §1.2.
- **No application code, tests, fixtures, dependencies, configuration or migrations changed. No
  commit, push, merge, PR, reset or clean. No branch created or switched. No build artifacts
  generated.**

### Outstanding decisions (require Amrut)

| # | Decision | Recommended |
| --- | --- | --- |
| D1 | Domain scope (software vs building products) | Software (provisional) |
| D2 | Money shape | Flat `currency` + numbers |
| D3 | Transport + domain error-code freeze | RC-09 lists |
| D4 | Drop `ESTIMATE_NOT_FOUND` (no persistence) | Yes (RC-02) |
| D5 | Health shape | `capabilities` (RC-08) |
| D6 | Keep `POST /estimates/calculate` path; retire `/products` | Yes (RC-12) |
| D7 | Fixture stays `version: 2` | Yes (RC-11) |
| D8 | When to retire material modules | Only after RC-07 is green (RC-12) |
| D9 | Confirm ownership map (2L §6) | Approve as written |
| D10 | Authorize RP-6 (feature/task/effort/timeline) | Only after RP-5 is green |

> Stopping here for Amrut's approval. No teammate execution prompts were generated.
