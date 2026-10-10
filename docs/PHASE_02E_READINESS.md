# Phase 2E — Official Requirements Verification & Development Readiness

- **Project:** TallyBuild AI
- **Team (as named in this brief):** SmartCoders — the repository itself names no team
- **Repository:** https://github.com/amrutkumar-v/TallyBuild.git
- **Branch:** `feature/phase-02d-frontend-integration`
- **HEAD:** `a854355` — *feat: integrate frontend with estimation API*
- **Prepared:** 2026-10-10
- **Role:** senior software architect / technical lead (read-only for application code)
- **Companion document:** `docs/PROBLEM_VALIDATION.md` (Phase 2D audit — **unchanged by this phase**)
- **Change footprint of this phase:** this document only. No application source, schema, migration, environment file, deployment setting, branch, or commit was modified.

> **Status labels used below:** `VERIFIED` (observed in code/tests/commands) · `EVIDENCE-BACKED` (reasonable inference from artefacts) · `ASSUMPTION` (unverified) · `UNKNOWN` (no source).

---

## 1. Executive summary

TallyBuild AI is a working, well-tested **construction building-material cost estimator**: a React SPA plus a deterministically mirrored FastAPI service that prices material line items (`quantity × unit price`) into an INR total. Phases 00–02D are complete and every local check passes today (typecheck, lint, **42** frontend tests, production build, **44** backend tests, Ruff check/format).

**The blocking issue is still requirements uncertainty, not code quality.** The official Domain 4C problem statement and judging rubric are **not in the repository and were not supplied**. The supplied reference PDF, `Product_Development_Cost_calculations.pdf`, describes a **software / product-development** cost model (engineering **hours**, Europe-vs-India hourly rates, **€/EUR**, SW vendor, tools & licences, ASW/BSW stacks, 10 % contingency) — a *different domain* from the construction-material estimator that is built. The domains have **not** been reconciled.

**Recommendation: hold at a provisional PIVOT — do not yet rebuild.** The safest next step is a small, sequential plan in which **P0 (requirements + domain resolution) is a blocking *human* task** (obtain the official brief and rubric), while a small amount of **domain-agnostic hardening (P1)** is safe to do **only if the team wants to keep working before the brief arrives** — because it is correct under *either* interpretation. Converting the app into a software-development budgeting tool on the strength of the PDF alone is **explicitly rejected** by the brief for this phase.

### Smallest credible hackathon-ready solution (provisional)

Regardless of which domain the official brief confirms, the minimum credible demo is the same shape:

1. A **single, honest estimation flow**: capture the required inputs → price them deterministically → show a labelled, line-by-line breakdown and total.
2. A **frontend + backend that agree** and are covered by tests.
3. **All figures visibly labelled as illustrative demo data** — no fabricated prices, ratings or specs.

The current build already realises this shape for construction materials. Under a PIVOT, only the **domain model/data** needs to change; the architecture is preserved.

---

## 2. Official requirements search (Step 2)

### 2.1 What was searched

- Full tracked tree (`src/`, `backend/`, `docs/`, root) excluding `node_modules`, `.venv`, `dist`, `.git`.
- `README.md`, `AGENTS.md`, `docs/api-contract.md`, `docs/estimation-engine.md`, `docs/phase-02-integration-plan.md`.
- File-type sweep for documents/images: the only asset in the project is `public/favicon.svg` — **no PDF/DOCX/PPTX/XLSX/image** brief anywhere in the repo.
- Git history (`git log --oneline`) and branch list.
- Repository-wide keyword scan: `problem statement | rubric | judging | Domain 4C | SmartCoders | deadline | scoring`.

### 2.2 Result

**The complete official Domain 4C problem statement, judging rubric, deliverable list, deadlines and technical constraints are NOT present in the repository.** The only official artefact is the **domain title**:

> "KLE TECH HACKFEST 2026, Domain 4C — AI for Cost Estimation of Building Products"

appearing in `README.md`, `AGENTS.md` and echoed in UI copy (`HowItHelps.tsx`, `TopBar.tsx`). `VERIFIED`.

No problem statement was fabricated or assumed.

### 2.3 Missing-information checklist

| # | Missing artefact | Why it matters | Blocking? |
| - | ---------------- | -------------- | --------- |
| 1 | Verbatim Domain 4C problem statement | Defines the actual problem & user | **Yes** |
| 2 | Judging criteria / scoring rubric | Prioritises features & demo content | **Yes** |
| 3 | Required deliverables (repo, video, deck, demo) | Submission format | Yes |
| 4 | Deadlines / milestone dates | Scope sizing | Yes |
| 5 | Meaning of "building products" (materials vs products-being-built) | Resolves the domain conflict | **Yes** |
| 6 | Required inputs & expected outputs | Drives the domain model | **Yes** |
| 7 | Required cost methodology (rates, contingency, currency, regions) | Drives the engine | Yes |
| 8 | Required data sources / datasets / evaluation method | Whether external data is expected | Yes |
| 9 | Whether AI/ML is mandated and how it is evaluated | Whether "AI" must be real | Yes |
| 10 | Technical/stack constraints | Platform choices | No |
| 11 | Team-name confirmation (brief says "SmartCoders"; repo names none) | Submission metadata | No |

**Provisional work is therefore labelled as such throughout this document.** No requirement below is treated as confirmed without an official source.

---

## 3. Current implementation re-audit (Step 3)

The Phase 2D audit described the project narratively; this section re-verifies the implementation against the actual source (existence of a file is not treated as completion).

### 3.1 Routes and functional status `VERIFIED`

| Route | Page | Status |
| ----- | ---- | ------ |
| `/` | `DashboardPage` | Functional — metrics + recent estimates (sample + local drafts) |
| `/estimates` | `EstimatesPage` | Functional — list/toolbar/filters over sample + local drafts |
| `/estimates/new` | `NewEstimatePage` | **Functional and wired to the API** (details → lines → calculate → result) |
| `/comparison` | `ComparisonPage` | Placeholder — "Coming soon", disabled controls, no fabrication |
| `/what-if` | `WhatIfPage` | Placeholder — "Coming soon", disabled controls, no fabrication |
| `*` | `NotFoundPage` | Functional |

Routing and providers: `src/App.tsx` (`EstimatesProvider` → `BrowserRouter` → `AppShell` + routes).

### 3.2 New Estimate flow — end-to-end `VERIFIED`

`src/pages/NewEstimatePage.tsx` does, in order:

1. On mount, `fetchCatalogue()` calls `getHealth()`; if unhealthy it falls back to the **offline demo catalogue** (`SAMPLE_PRODUCTS`) with `status='offline'`. If healthy, it calls `getProducts()`; zero products → `'empty'`; otherwise `online`.
2. Validates the project form (name ≥3/≤80, location ≥2/≤80, project type required, notes ≤ 500) and each material line (product chosen, quantity finite and non-negative), moving focus to the first error.
3. Builds an `EstimateRequest` from **usable** lines (product in catalogue + finite quantity ≥ 0) and calls `calculateEstimate()` → `POST /api/v1/estimates/calculate`.
3b. **Calculate is disabled** unless the catalogue is `online` and there is at least one usable line; the reason is shown via `aria-describedby`/`aria-live` (`calculate-reason`). If the service is offline the button stays disabled and the offline demo catalogue is shown instead of a fabricated total.
4. On success, renders `EstimateResultCard` (per-line subtotals, subtotal, total, price-source demo notice) and persists the draft **with `estimatedAmount`** via `useEstimates().addEstimate`.
5. On `VALIDATION_ERROR`, maps server `details` back onto specific lines via `lineIndex`/`productId` (`mapServerLineErrors`); other failures render a retryable error card.

This is a genuine, complete front-to-back integration — **not** a mock. `VERIFIED`.

### 3.3 Calculation model `VERIFIED`

- **Domain:** building materials — 9 illustrative products (cement, steel, bricks, AAC blocks, sand, aggregate, tiles, binding wire, teak door frame) in `src/estimation/data/sampleProducts.ts`, all `isIllustrative: true`, `priceDate` `2026-09-01`.
- **Formula:** per line `lineSubtotal = roundCurrency(quantity × unitPrice)`; `subtotal = roundCurrency(Σ lineSubtotal)`; `total = subtotal`. No tax, discount, labour, GST, contingency or multi-region logic.
- **Rounding:** 2-decimal (paise), half-up, applied **per line** then to the sum — `src/estimation/money.ts` and `backend/app/estimation/money.py`.
- **Units:** `bag, piece, each, kg, tonne, m, m2, m3`; same-family conversion is **rejected** (`UNIT_CONVERSION_UNSUPPORTED`) rather than silently converted.
- **Currency:** INR only.
- **Validation order & error codes** are identical on both sides: `EMPTY_REQUEST, MISSING_PRODUCT, INVALID_QUANTITY, INVALID_UNIT, INCOMPATIBLE_UNIT, UNIT_CONVERSION_UNSUPPORTED, INVALID_PRICE, INVALID_PRICE_SOURCE, NON_FINITE_RESULT`.

### 3.4 Backend API `VERIFIED`

`backend/app/` (FastAPI, Python 3.14 venv) exposes exactly three endpoints under `/api/v1`:

| Endpoint | Behaviour |
| -------- | --------- |
| `GET /health` | status/service/version/timestamp + catalogue count & currency |
| `GET /products` | illustrative catalogue with optional `category`/`search`/`unit` filters; invalid `unit` → 400 `REQUEST_MALFORMED` |
| `POST /estimates/calculate` | runs the mirrored engine; validation failure → 422 `VALIDATION_ERROR` with per-line details; non-finite → 500 `CALCULATION_ERROR` |

Error envelope is centralised in `backend/app/errors.py` (`{ "error": { code, message, details? } }`), with handlers for `ApiError`, malformed requests (400 `REQUEST_MALFORMED`) and unexpected errors (500 `INTERNAL_ERROR`). CORS is dev-scoped in `main.py`. No database, auth, AI, secrets or deployment. `VERIFIED`.

### 3.5 Frontend API client `VERIFIED`

`src/api/` is a typed, React-free client: `client.ts` (fetch wrapper with 15 s timeout via `AbortController`, JSON handling, envelope parsing, error-code normalisation, `NETWORK_ERROR` on unreachable/timeout), `health.ts`, `products.ts`, `estimates.ts`, `types.ts`, `index.ts`. Base URL resolves from `VITE_API_BASE_URL` else `/api/v1`. It **never fabricates** data — it returns a discriminated `ApiResult<T>`.

### 3.5 TypeScript ↔ Python parity `VERIFIED (by mirroring)`

The engine is mirrored by hand (`src/estimation/` ↔ `backend/app/estimation/`) and each side has its own test suite. **Caveat:** `docs/api-contract.md` §9 *specifies* a single shared golden fixture (`docs/fixtures/calculation-cases.json`) consumed by both suites — **that file/directory does not exist** (`Test-Path docs\fixtures` → `False`). Parity is therefore currently asserted by **two parallel suites that were written to match**, not by one fixture both languages execute. This is an internal-consistency risk, not a functional defect today.

### 3.5 Test coverage map and gaps `VERIFIED`

| Suite | Files | Cases |
| ----- | ----- | ----- |
| Frontend | `units.test.ts`, `money.test.ts`, `calculate.test.ts`, `api/client.test.ts`, `api/estimates.test.ts` | **42** |
| Backend | `test_health.py`, `test_products.py`, `test_calculate.py`, `test_rounding.py` | **44** |

**Gaps (evidence of absence):**
- **No** tests for `NewEstimatePage`, `LineItemsEditor`, `EstimateResultCard`, `EstimatesProvider`, `EstimatesPage`, `DashboardPage` or any other React component.
- **No** shared cross-language fixture (see 3.4).
- **No** end-to-end / browser (Playwright/RTL-integration) test proving the SPA↔FastAPI path.

### 3.6 Error handling & validation inventory `VERIFIED`

Present and reasonable: client-side field validation with focus management; server validation re-mapped to fields; offline fallback with retry; loading/empty/error/validation result states; `localStorage` guarded by `storageAvailable()` with a visible warning; timeout + network-error messaging. The main **missing** validation surface is that the frontend does not independently guard against a product existing on the server but not in the fetched catalogue (it relies on the server's `MISSING_PRODUCT`), which is acceptable.

---

## 4. Domain-mismatch analysis (Step 4)

| Claim | Classification |
| ----- | -------------- |
| Repository estimates **construction building materials** (`quantity × unit price` → INR) | `VERIFIED` |
| The reference PDF's recoverable labels describe a **product/software-development** cost model (hours, Europe/India rates, €/EUR, SW vendor, tools & licences, ASW/BSW, 10 % contingency) | `VERIFIED` (labels recovered) |
| All **numeric values and exact formulas** in the PDF are unrecoverable with available tools; none fabricated | `VERIFIED` |
| The PDF is an **official Domain 4C input** | `UNKNOWN` |
| Domain 4C actually means **product-development cost**, not construction materials | `ASSUMPTION` (medium confidence, no official source) |
| "Building products" is ambiguous (materials vs products-being-built) | `EVIDENCE-BACKED` |
| The construction build may be **off-domain** | `ASSUMPTION` — cannot be confirmed |

### 4.1 Recommendation: **CONTINUE / PIVOT / REBUILD**

**Provisional answer: PIVOT** (confidence: medium-low), **gated on P0**.

- **Why PIVOT (provisional):** the only concrete reference artefact supplied is a product-development cost model, and "building products" reads naturally as "products being built". If that is the assignment, the current construction domain is mis-scoped.
- **Why not CONTINUE as the default:** there is no official source confirming construction materials, so the current direction cannot be certified either.
- **Why not REBUILD:** the app shell, UI primitives, design tokens, deterministic-core architecture, rounding policy, TS↔Python mirror pattern, API contract, typed client and tests are **domain-agnostic**. A rebuild would discard verified, working value.
- **What flips the decision:** the official statement. If it says *construction building materials priced by quantity × rate* → **CONTINUE** (current code is largely correct; add only what the rubric rewards). If it says *cost of developing/building a product* → **PIVOT** (re-model domain & data, keep architecture).

**Explicit guardrail from this phase's brief:** do **not** convert the application into a software-development budgeting tool on the strength of the PDF alone. P1 below is therefore restricted to work that is valid under **either** interpretation.

---

## 5. Prioritized development roadmap (Step 5)

Ordered by importance. P0 is blocking and largely human; P1 is the only code work that is safe before the official brief. Verification commands are given per phase (run from repo root unless noted; backend commands from `backend/` with its `.venv`).

### P0 — Requirements & domain resolution *(blocking — process, not code)*

- **Objective:** obtain the official Domain 4C brief + rubric and resolve the construction-vs-product-development question.
- **Tasks:** chase organisers; capture the statement **verbatim**; extract the PDF's numeric values (source spreadsheet/HTML or a tool that can read it); map each rubric line to a feature.
- **Files:** update `docs/PROBLEM_VALIDATION.md` §5 statuses + `docs/PHASE_02E_READINESS.md` §4 (documentation only).
- **Dependencies:** organisers / the statement itself.
- **Acceptance:** verbatim statement + rubric recorded; §4 recommendation upgraded from provisional to decided.
- **Risks:** statement unavailable or still ambiguous.
- **Verification:** none (documentation).
- **Note:** everything below is blocked on this for *final* scoping.

### P1 — Domain-agnostic core-flow hardening *(safe only if the team keeps working pre-brief)*

- **Objective:** close the three confirmed quality gaps that matter under **either** domain.
- **Tasks:**
  1. Add the documented **shared golden fixture** (`docs/fixtures/calculation-cases.json`) and load it from both the Vitest and pytest suites to make TS↔Python parity executable, not aspirational.
  2. Add **component/interaction tests** for the New Estimate flow (validation focus, offline fallback, calculate success, `VALIDATION_ERROR` re-mapping) — no network.
  3. Add a **thin end-to-end check** (FastAPI `TestClient` + a client-side integration test, or a documented manual smoke script).
- **Files:** `docs/fixtures/**` (new), `src/estimation/*.test.ts`, `src/api/*.test.ts`, `src/components/estimates/*.test.tsx` (new), `backend/tests/*`, `vitest.config.ts` (only if needed), `docs/api-contract.md` (reference the shipped fixture).
- **Dependencies:** P0 not required for this work; it is interpretation-neutral.
- **Acceptance:** fixture loads in both suites; new tests pass; counts increase and all existing checks stay green.
- **Risks:** scope creep into feature work — keep it to tests/fixtures only.
- **Verification:** `npm run typecheck && npm run lint && npm test && npm run build`; `python -m pytest && python -m ruff check . && python -m ruff format --check .`.

### P2 — Confirm domain model / data *(conditional on P0)*

- **Objective:** align the estimation domain with the official brief.
- **Tasks (branch on P0):**
  - *If product-development:* model cost elements, engineering hours, region hourly rates, SW vendor, tools & licences, SW stacks, contingency, Phase-1 total; choose currency from the brief.
  - *If construction materials:* audit and extend the existing catalogue/logic to whatever inputs the rubric expects; keep prices labelled illustrative unless a real dataset is supplied.
- **Files:** `src/estimation/**`, `backend/app/estimation/**`, `src/types/index.ts`, `src/constants/labels.ts`, `docs/estimation-engine.md`.
- **Dependencies:** P0.
- **Acceptance:** engine tests (per element + rounding + parity) green; brief's example case reproduced exactly.
- **Risks:** unknown formulas; currency/region basis; over-fitting to guesses.
- **Verification:** as P1.

### P3 — Demo & UX polish

- **Objective:** make the confirmed flow demo-clean.
- **Tasks:** empty/loading/error copy; restrict or finish Comparison/What-If so no dead ends; confirm all demo figures carry the illustrative label.
- **Files:** `src/pages/**`, `src/components/**`.
- **Acceptance:** manual smoke of full flow; no fabricated figures; typecheck/lint/test/build green.
- **Risks:** polishing the wrong domain before P0 — do **after** P2.

### P4 — Differentiators *(only if the official rubric rewards them)*

- **Objective:** comparison / what-if / any AI, **only if the brief requires it**.
- **Guardrail:** do **not** label a deterministic calculator as "AI". AI must be a real capability, evaluated per the rubric, before it is advertised.
- **Files:** `/comparison`, `/what-if`, optional AI service.
- **Dependencies:** P0 + P2.
- **Acceptance:** whatever the rubric defines; otherwise out of scope.
- **Risks:** building unrequested features; over-claiming AI.

---

## 6. Verification performed (this phase)

All commands re-run on 2026-10-10 against HEAD `a854355` (clean tree apart from the two docs).

| # | Command | Working dir | Result |
| - | ------- | ----------- | ------ |
| 1 | `git status` / `git rev-parse HEAD` / `git log --oneline` | root | branch `feature/phase-02d-frontend-integration`, HEAD `a854355`, only untracked docs |
| 2 | `npm run typecheck` (`tsc -b`) | root | exit 0 |
| 3 | `npm run lint` (`eslint .`) | root | exit 0 |
| 4 | `npm test` (`vitest run`) | root | 5 files, **42 passed** |
| 5 | `npm run build` (`tsc -b && vite build`) | root | built OK; `dist/index-*.js` 321.30 kB / 101.25 kB gzip (`dist/` gitignored) |
| 6 | `python -m pytest -q` | `backend/` | **44 passed**, 1 pre-existing `StarletteDeprecationWarning` (httpx/testclient) |
| 7 | `python -m ruff check .` | `backend/` | All checks passed |
| 8 | `python -m ruff format --check .` | `backend/` | 23 files already formatted |
| 9 | `Test-Path docs\fixtures` | root | `False` — shared golden fixture documented in `api-contract.md` §9 is **not** present |

No application code, schema, environment file or deployment config was changed; no branch switch, commit or push occurred.

---

## 7. Open questions for the organisers

1. Verbatim Domain 4C problem statement (exact wording of "building products").
2. Is `Product_Development_Cost_calculations.pdf` an official input, and what is its role?
3. Required users/use-cases and required inputs/outputs.
4. Required cost methodology (quantity × rate, hours × hourly rate, contingency, regions, currency).
5. Required data sources/datasets and how quality is evaluated.
6. Is AI/ML mandatory, and how is it judged?
7. Judging rubric, weights, deliverables, deadlines and any stack restrictions.
8. Confirm team name ("SmartCoders").

---

## Appendix A — Files inspected this phase

| Area | Files |
| ---- | ----- |
| Git | `status`, `rev-parse HEAD`, `log --oneline`, branch |
| Docs | `PROBLEM_VALIDATION.md`, `api-contract.md`, `estimation-engine.md`, `phase-02-integration-plan.md` |
| Frontend | `src/App.tsx`, `src/pages/{NewEstimate,Comparison,WhatIf}Page.tsx`, `src/components/estimates/{LineItemsEditor,EstimateResultCard}.tsx`, `src/store/EstimatesProvider.tsx`, `src/api/{index,client,estimates,products,health,types}.ts`, `src/estimation/**` (via tests) |
| Backend | `backend/app/{main,schemas,errors}.py`, `backend/app/routers/{health,products,estimates}.py`, `backend/app/estimation/calculate.py`, `backend/tests/**` |
| Search | repo-wide keyword scan; file-type sweep (`Test-Path docs\fixtures`) |

## Appendix B — Changes made by this phase

- **Created:** `docs/PHASE_02E_READINESS.md` (this file).
- **Changed / deleted / committed / pushed:** none. `docs/PROBLEM_VALIDATION.md` is untouched.

---

## Phase 2F update (2026-10-10) — gap closed, findings preserved

The Phase 2F testing brief (executed after this audit) closed **P1 task 1** above and the
verification item #9 gap:

- `docs/fixtures/calculation-cases.json` now **exists** and is loaded by **both** test suites
  (`src/estimation/shared-fixture.test.ts` via Vite `?raw`; `backend/tests/test_shared_fixture.py`
  from disk), so TypeScript↔Python parity is executable rather than aspirational. All cases pass
  on both sides with no engine change.
- Component tests were added for the New Estimate flow, but as **server-render** tests only:
  no DOM/browser or `@testing-library` dependency is installed and Phase 2F was not allowed to
  install one, so true interaction tests remain open (documented in `docs/PHASE_02F_TESTING.md`
  §5/§6, covered manually in `docs/manual-smoke-test.md`).
- Verification counts moved: frontend `npm test` 5 files / 42 tests → **9 files / 86 tests**;
  backend pytest 44 → **72 passed**; all other checks still green.

No finding or recommendation in the body above was altered. Remaining open items are unchanged:
**P0 (obtain the official Domain 4C brief/rubric) is still blocking** and the construction-vs-
product-development question is still unresolved.
