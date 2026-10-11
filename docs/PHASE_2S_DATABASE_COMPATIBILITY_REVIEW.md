# Phase 2S — Evidence-Only Database Compatibility Review

**Status:** Evidence-only review. **Documentation only.** No application code, tests,
fixtures, schemas, migrations, API contracts or other documents were changed. Nothing was
staged, committed, pushed, merged or opened as a pull request. No branch was switched, reset,
cleaned, stashed or rebased.

**Author role:** Amrut (coordination, contract approval, integration, review).
**Reviewed branch:** `wip/software-estimation-migration` (HEAD `07faa05`).
**Review type:** read-only audit of the repository's *actual* sources.

**Finding labels used throughout:**

- **CONFIRMED** — directly supported by available source evidence (file + line cited).
- **CONFLICT** — available sources disagree (both sides cited).
- **UNRESOLVED** — available evidence does not establish a decision.
- **MISSING SOURCE** — a referenced source cannot be found in the inspected repository state.

> **Honesty banner.** No database, ORM, migration, schema or persistence layer exists anywhere
> in this repository. Every persistence-related item in the docs is a **proposal**, not an
> implemented feature. This review does **not** approve any proposal and does **not** invent
> the missing database-design document or the missing "six unresolved decisions". Proposals are
> never presented as implemented behaviour.

---

## 1. Purpose and review scope

This review answers one question: **what is actually confirmed, what conflicts, and what
remains undecided before database implementation could begin**, using only evidence that
exists in the repository today.

It compares:

1. The frontend's software-cost estimation request/result contract.
2. The backend's current request/response contract.
3. Supported currencies and amount representation.
4. Cost sections and calculation rules.
5. Validation and error-envelope conventions.
6. The health endpoint response.
7. The status (approved / deferred / unresolved) of persistence, estimate history, immutable
   revisions, features/tasks and chatbot conversation storage.
8. Ownership responsibilities.

**Out of scope / not done:** no migrations, no tables, no repositories, no save/retrieve
endpoints, no schema or route changes, no frontend behaviour changes, no AI/chatbot
persistence, and no repair of the frontend/backend contract mismatch found below.

**Critically missing inputs.** The Phase 2S brief named two sources that do **not** exist in
this workspace (see §3 and §9): `docs/SOFTWARE_ESTIMATION_DATABASE_DESIGN.md` and a
"compatibility review containing exactly six unresolved decisions". This review therefore
records the missing evidence and does **not** manufacture either artifact.

---

## 2. Repository state and inspection boundary

### 2.1 Git state (verified this session)

| Item | Value |
| --- | --- |
| Working directory | `D:\TallyBuild` (single repository) |
| Current branch | `wip/software-estimation-migration` |
| HEAD commit | `07faa0525a6336279323bf46b0f14ba6d695c9fa` |
| Upstream | `origin/wip/software-estimation-migration` — tracked; local == remote at `07faa05` |
| Remote | `origin` = `https://github.com/amrutkumar-v/TallyBuild.git` |
| `git fetch origin --prune` | ran (exit 0); `origin/wip/...` unchanged at `07faa05` |
| Stashes | none |
| Local branches | `main` (`b773df4`), `feature/phase-01-ui-foundation` (`9defe33`), `feature/phase-02-estimation-core` (`d0365c1`), `feature/phase-02c-backend-api` (`eba0878`), `feature/phase-02d-frontend-integration` (`121893a`), `wip/software-estimation-migration` (`07faa05`) |

### 2.2 Working-tree status (preserved, not modified by this review)

**Modified tracked files (pre-existing, uncommitted — not touched by this review):**

- `src/api/client.ts`
- `src/constants/navigation.ts`
- `src/estimation/calculate.test.ts`
- `src/pages/NewEstimatePage.tsx`

**Untracked files (pre-existing — not touched by this review):**

- `docs/CONTRACT_REVIEW_PHASE_2K.md`
- `docs/IMPLEMENTATION_PLAN_PHASE_2L.md`
- `docs/INTEGRATION_COORDINATION.md`
- `docs/INTEGRATION_READINESS.md`
- `docs/PHASE_2M_EXECUTION_CHECKLIST.md`
- `docs/PROBLEM_VALIDATION.md`
- `src/components/estimates/CostLinesEditor.module.css`

> **CONFIRMED — working tree vs HEAD divergence.** The four modified tracked files are exactly
> the four files the planning docs (`docs/CONTRACT_REVIEW_PHASE_2K.md` §1.2,
> `docs/PHASE_2M_EXECUTION_CHECKLIST.md` §1.2) list as producing **8 frontend typecheck
> errors on HEAD `07faa05`**. With the current working-tree edits present, `tsc -b` exits 0
> (see §2.3). This means the committed HEAD and the working tree do **not** have the same
> frontend contract health. Any database work must target a frozen, agreed base — not the
> ambiguous working tree.

### 2.3 Read-only checks run this session (no code changed)

| Check | Command | Result |
| --- | --- | --- |
| Frontend typecheck | `npm run typecheck` (`tsc -b`) | **PASS (exit 0)** — with current working-tree edits |
| Frontend lint | `npm run lint` (`eslint .`) | **PASS (exit 0)** |
| Frontend tests | `npm test` (`vitest run`) | **PASS — 7 files / 58 tests** |
| Frontend build | `npm run build` | **PASS** (`dist/` is gitignored; not committed) |
| Backend tests | `.venv\Scripts\python.exe -m pytest -q` | **FAIL — collection error `KeyError: 'customCatalogue'`, 0 tests run** |
| Backend lint | `.venv\Scripts\python.exe -m ruff check .` | **PASS (exit 0)** |

> **CONFLICT (documented vs observed).** `docs/CONTRACT_REVIEW_PHASE_2K.md` §1.2 and
> `docs/PHASE_2M_EXECUTION_CHECKLIST.md` §1.2 record frontend typecheck as **FAIL (8 errors)**
> on HEAD `07faa05`. The observed working tree **passes** because of the uncommitted edits in
> §2.2. The backend collection error is unchanged and reproduces.

---

## 3. Sources inspected and sources missing

### 3.1 Sources inspected (read directly)

Repository / Git:

- Git state, branches, remote-tracking refs, stashes, `git fetch` (read-only).
- Fixture structure: `docs/fixtures/calculation-cases.json` (top-level keys `version`,
  `rounding`, `roundingCases`, `cases`; `version: 2`).

Docs (complete reads):

- `docs/CONTRACT_REVIEW_PHASE_2K.md` (485 lines)
- `docs/INTEGRATION_READINESS.md` (414 lines)
- `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` (696 lines)
- `docs/PHASE_2M_EXECUTION_CHECKLIST.md` (391 lines)
- `docs/TEAM_HANDOFF_DOMAIN_4C.md` (470 lines)
- `docs/api-contract.md` (662 lines)
- `docs/estimation-engine.md` (182 lines)

Frontend source:

- `src/estimation/types.ts`, `src/estimation/currencies.ts`, `src/estimation/calculate.ts`,
  `src/estimation/index.ts`
- `src/api/types.ts`, `src/api/client.ts`, `src/api/estimates.ts`, `src/api/health.ts`,
  `src/api/index.ts`
- `src/types/index.ts`
- `src/components/estimates/EstimateResultCard.tsx`, `src/pages/NewEstimatePage.tsx` (partial)

Backend source:

- `backend/app/schemas.py`, `backend/app/config.py`, `backend/app/main.py`,
  `backend/app/errors.py`
- `backend/app/routers/health.py`, `backend/app/routers/estimates.py`,
  `backend/app/routers/products.py`
- `backend/app/estimation/calculate.py`, `backend/app/estimation/money.py`
- `backend/tests/test_shared_fixture.py` (partial), plus the test file inventory

### 3.2 Sources missing

| Referenced source | Status |
| --- | --- |
| `docs/SOFTWARE_ESTIMATION_DATABASE_DESIGN.md` (Sambram's proposed database design) | **MISSING SOURCE** — not present in the working tree, any local branch, any remote-tracking ref, any stash, or the fetched remote tree |
| A "compatibility review containing exactly six unresolved decisions" | **MISSING SOURCE** — no document in the repo defines exactly six unresolved decisions (see §8/§9) |
| `docs/data-model.md` (referenced as Sambram's ownership in `docs/TEAM_HANDOFF_DOMAIN_4C.md` §12 and `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §6) | **MISSING SOURCE** — not present |
| `backend/app/db/**` (future persistence package, per `docs/INTEGRATION_READINESS.md` §3) | **MISSING SOURCE** — does not exist |

Search evidence: glob `**/*DATABASE*.md` → none; glob `**/*{compat,Compat,COMPAT}*.md` →
none; case-insensitive searches for "software_estimation_database", "compatibility review",
"six unresolved decisions", "exactly six" → no matches anywhere.

> **CONFIRMED (absence).** No database/SQL/ORM/migration artifact exists in `backend/`. A
> case-insensitive search of `backend/` for `supabase|sql|migration|alembic|sqlalchemy|CREATE
> TABLE|database|persistence|data-model` returns exactly one hit: a prose note in
> `backend/README.md:88` stating "No persistence, database or authentication (deferred to
> Phase 04)."

---

## 4. Confirmed frontend contract

> Source of truth for calculation behaviour: `src/estimation/calculate.ts`. The docs state the
> TypeScript core is authoritative and the Python port must mirror it
> (`docs/api-contract.md:12`, `docs/estimation-engine.md`).

### 4.1 Request — `ProjectEstimateRequest` (CONFIRMED)

`src/estimation/types.ts:28`:

| Field | Type | Line |
| --- | --- | --- |
| `projectName` | `string?` | `:29` |
| `currency` | `CurrencyCode` | `:30` |
| `personnel` | `PersonnelLine[]` | `:31` |
| `tooling` | `ToolingLine[]` | `:32` |
| `infrastructure` | `InfrastructureLine[]` | `:33` |
| `other` | `OtherCostLine[]` | `:34` |

Cost-line shapes (`src/estimation/types.ts:5-26`): `PersonnelLine {role, people, hours,
hourlyRate}`; `ToolingLine {name, amount}`; `InfrastructureLine {name, monthlyCost, months}`;
`OtherCostLine {description, amount}`.

### 4.2 Result — `ProjectEstimateResult` (CONFIRMED, section-based)

`src/estimation/types.ts:58`: `projectName?`, `currency`, four `CostSection<T>`
(`personnel`/`tooling`/`infrastructure`/`other`, each `{ lines: T[]; subtotal: number }`,
`src/estimation/types.ts:53`), plus `personnelCost`, `toolingCost`, `infrastructureCost`,
`otherCost`, `lineCount`, `total`, and `assumptions: string[]`.

The result is **section-based with per-section subtotals plus four rollup cost fields and a
`total`** — this is the primary frontend output shape.

### 4.3 Currencies and amounts (CONFIRMED)

- `src/estimation/currencies.ts:1`: `SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'AED']`.
- One `currency` per request/result (`src/estimation/types.ts:30`, `:60`); no nested `Money`
  object; amounts are plain numbers.
- `assumptions` explicitly state no live conversion and no contingency
  (`src/estimation/calculate.ts:23-30`).

### 4.4 Calculation rules (CONFIRMED, cost-calculator subset only)

`src/estimation/calculate.ts:172` `calculateEstimate`:

- Personnel line cost = `roundCurrency(people × hours × hourlyRate)` (`:182`).
- Tooling cost = `roundCurrency(amount)` (`:197`).
- Infrastructure cost = `roundCurrency(monthlyCost × months)` (`:212`).
- Other cost = `roundCurrency(amount)` (`:227`).
- Total = `roundCurrency(personnelCost + toolingCost + infrastructureCost + otherCost)` (`:252`).
- Rounding: half-up, 2 dp, per line → per section → total (`src/estimation/money.ts`,
  `src/estimation/index.ts:1`).

### 4.5 Validation and error codes (CONFIRMED)

`src/estimation/calculate.ts:32` `validateEstimateRequest`:

- `EMPTY_REQUEST` when all four sections are empty (`:51-63`).
- `UNSUPPORTED_CURRENCY` when currency ∉ 4-code set (`:37-44`).
- Per-section `INVALID_PERSONNEL` / `INVALID_TOOLING` / `INVALID_INFRASTRUCTURE` /
  `INVALID_OTHER`; validation order personnel → tooling → infrastructure → other
  (`:65-167`).
- `NON_FINITE_RESULT` for non-finite computed cost/total (`src/estimation/calculate.ts:184`,
  `:254`).
- Domain code set (`src/estimation/types.ts:74`): `EMPTY_REQUEST`, `UNSUPPORTED_CURRENCY`,
  `INVALID_PERSONNEL`, `INVALID_TOOLING`, `INVALID_INFRASTRUCTURE`, `INVALID_OTHER`,
  `NON_FINITE_RESULT`.
- Domain error shape (`src/estimation/types.ts:83`): `{ code, message, section?, lineIndex? }`
  — uses **`section`**.

### 4.6 API client and health expectation (CONFIRMED)

- Base path defaults to `/api/v1` (`src/api/client.ts:14-22`).
- `calculateEstimate` POSTs to `/estimates/calculate` (`src/api/estimates.ts:12`).
- `getHealth` GETs `/health` (`src/api/health.ts:5`).
- Transport error codes (`src/api/types.ts:7`): `REQUEST_MALFORMED`, `VALIDATION_ERROR`,
  `CALCULATION_ERROR`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `NETWORK_ERROR`.
- `HealthResponse` (`src/api/types.ts:26`): `status: 'ok' | 'degraded'`, `service`, `version`,
  `timestamp`, and **`capabilities: { currencies: string[]; categories: string[] }`**
  (`src/api/types.ts:31`).
- Client wrapper `ApiResult<T>` (`src/api/types.ts:22`); unknown envelope codes fall back to
  `INTERNAL_ERROR` (`src/api/client.ts:94-100`).

---

## 5. Confirmed backend contract

> The backend is **still the material (building-products) domain** and is unchanged from the
> committed branch.

### 5.1 Request/response schemas (CONFIRMED)

`backend/app/schemas.py`:

- `CurrencyCode = Literal["INR"]` (`:12`) — **single currency**.
- Domain error codes are the **material set**: `EMPTY_REQUEST`, `MISSING_PRODUCT`,
  `INVALID_QUANTITY`, `INVALID_UNIT`, `INCOMPATIBLE_UNIT`, `UNIT_CONVERSION_UNSUPPORTED`,
  `INVALID_PRICE`, `INVALID_PRICE_SOURCE`, `NON_FINITE_RESULT` (`:14-24`).
- `PriceSource` (`:27`), `MaterialProduct {id,name,category,unit,unitPrice,priceSource}`
  (`:36`), `EstimateLineItem {productId,quantity,unit?,label?}` (`:47`).
- `EstimateRequest {projectName?, lines: EstimateLineItem[]}` (`:56`).
- `EstimateValidationError {code, message, lineIndex?, productId?}` (`:71`) — uses
  **`productId`**, not `section`.
- `EstimateResult {projectName?, currency, itemCount, lineResults[], subtotal, total,
  priceSources[]}` (`:90`).
- `CatalogueInfo {products, currency}` (`:100`).
- `HealthResponse {status:'ok', service, version, timestamp, catalogue: CatalogueInfo}`
  (`:105`) — returns **`catalogue`**.
- `ProductListResponse {count, products}` (`:113`).

### 5.2 Routes (CONFIRMED)

- `POST /api/v1/estimates/calculate` (`backend/app/routers/estimates.py:12`); maps failures to
  `422 VALIDATION_ERROR` and non-finite to `500 CALCULATION_ERROR` (`:21-33`).
- `GET /api/v1/health` (`backend/app/routers/health.py:14`); returns `catalogue`
  (`:23-26`).
- `GET /api/v1/products` (`backend/app/routers/products.py:13`).
- Routers mounted at `API_PREFIX` (`backend/app/main.py:30-32`); `API_PREFIX = "/api/v1"`
  (`backend/app/config.py:7`).
- **No persistence/save/list/retrieve route exists.**

### 5.3 Calculation and config (CONFIRMED)

- Material calculation: `lineSubtotal = round_currency(quantity × unitPrice)`;
  `subtotal = round_currency(Σ lineSubtotal)`; `total = subtotal`; currency hard-coded
  `"INR"` (`backend/app/estimation/calculate.py:206`, `:235`, `:249`).
- Rounding helper `round_currency` (half-up, 2 dp) (`backend/app/estimation/money.py:15`).
- `CURRENCY = "INR"` (`backend/app/config.py:8`).
- Error envelope `{"error": {code, message, details?}}` (`backend/app/errors.py:35-43`); the
  RequestValidationError handler returns `400 REQUEST_MALFORMED` (`:54-65`).

### 5.4 Backend tests (CONFIRMED)

Test inventory: `test_shared_fixture.py`, `test_rounding.py`, `test_products.py`,
`test_health.py`, `test_calculate.py`, plus `factories.py`, `conftest.py`.

- **Collection failure (CONFIRMED):** `backend/tests/test_shared_fixture.py:25` reads
  `FIXTURE["customCatalogue"]`, but the shared fixture `docs/fixtures/calculation-cases.json`
  is **version 2** and has only `version`, `rounding`, `roundingCases`, `cases`. Result:
  `KeyError: 'customCatalogue'`; pytest aborts during collection, so **0 backend tests run**.

---

## 6. Frontend-versus-backend compatibility table

| # | Surface | Frontend (evidence) | Backend (evidence) | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Calculate request | `ProjectEstimateRequest` — section arrays (`src/estimation/types.ts:28`) | `EstimateRequest {lines}` (`backend/app/schemas.py:56`) | **CONFLICT** |
| 2 | Calculate response | section-based `ProjectEstimateResult` (`src/estimation/types.ts:58`) | flat `EstimateResult {lineResults,itemCount,subtotal}` (`backend/app/schemas.py:90`) | **CONFLICT** |
| 3 | Cost model | personnel/tooling/infrastructure/other → total (`src/estimation/calculate.ts:244-252`) | quantity × unit price → subtotal (`backend/app/estimation/calculate.py:206`) | **CONFLICT** |
| 4 | Currency | INR/USD/EUR/AED (`src/estimation/currencies.ts:1`) | `Literal["INR"]`; `CURRENCY="INR"` (`schemas.py:12`, `config.py:8`) | **CONFLICT** |
| 5 | Amount representation | plain numbers (`src/estimation/types.ts:28-72`) | plain numbers (`schemas.py:43,52,82-96`) | **CONFIRMED (agree)** |
| 6 | One currency per estimate | single `currency` field (`types.ts:30`) | single `currency` field (`schemas.py:92`) | **CONFIRMED (agree)** |
| 7 | Domain error codes | software set (`src/estimation/types.ts:74`) | material set (`backend/app/schemas.py:14`) | **CONFLICT** |
| 8 | Domain error fields | `section`/`lineIndex` (`src/estimation/types.ts:83`) | `lineIndex`/`productId` (`backend/app/schemas.py:71`) | **CONFLICT** |
| 9 | Transport error envelope | `{error:{code,message,details?}}` read via client (`src/api/client.ts:53-67`) | identical envelope (`backend/app/errors.py:35`) | **CONFIRMED (agree)** |
| 10 | Transport codes | 5 server + `NETWORK_ERROR` (`src/api/types.ts:7`) | same 5 server codes (`backend/app/errors.py`, `routers/estimates.py`) | **CONFIRMED (agree)** |
| 11 | Status mapping | client handles non-2xx (`src/api/client.ts:129`) | 400/422/500 (`routers/estimates.py:28`, `errors.py:60`, `:70`) | **CONFIRMED (agree)** |
| 12 | `GET /health` shape | `capabilities{currencies,categories}` (`src/api/types.ts:31`) | `catalogue{products,currency}` (`schemas.py:105`) | **CONFLICT** |
| 13 | Paths | `/health`, `/estimates/calculate` (`src/api/*.ts`) | `/health`, `/estimates/calculate`, `/products` (`main.py:30-32`) | **CONFIRMED (agree on 2 shared)** |
| 14 | Rounding | half-up 2 dp per line→section→total (`src/estimation/calculate.ts:182-252`) | half-up 2 dp per line→subtotal (`backend/app/estimation/money.py:15`) | **CONFIRMED (agree on method; scope differs)** |
| 15 | Shared golden fixture | TS consumer is v2 | Python consumer expects v1 (`test_shared_fixture.py:25`) | **CONFLICT** |
| 16 | Persistence endpoints | not called (`src/api/index.ts`) | none exist (`main.py:30-32`) | **CONFIRMED (agree: absent)** |

**Net:** the transport envelope and paths agree; the **entire payload/domain layer differs**
(request shape, result shape, cost model, currency, domain error codes/fields, health body,
and the shared fixture). Rows 1–4, 7–8, 12, 15 are the blocking divergences.

> Note: The frontend's New Estimate flow posts project-cost payloads to the material backend;
> per `docs/CONTRACT_REVIEW_PHASE_2K.md` R2 this is a known blocker, mitigated in the UI by
> health-gating/offline behaviour (no fabricated total).

---

## 7. Database-related decisions supported by evidence

Each item is labelled by evidence status. "Supported by evidence" means *documented as a
proposal/plan* or *observably absent*; it does **not** mean implemented.

| # | Item | Evidence | Status |
| --- | --- | --- | --- |
| DB-1 | No database exists; MVP is stateless | `docs/api-contract.md` §1 ("Database: None for MVP"), §7; `docs/CONTRACT_REVIEW_PHASE_2K.md` §1.3; `backend/README.md:88` | **CONFIRMED** (absent) |
| DB-2 | Persistence deferred to Phase 04 | `docs/INTEGRATION_READINESS.md` §2.5; `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §5.5; `docs/TEAM_HANDOFF_DOMAIN_4C.md` §14 | **CONFIRMED** (documented, proposed) |
| DB-3 | Demo persistence is browser `localStorage` only | `docs/CONTRACT_REVIEW_PHASE_2K.md` D12; `docs/INTEGRATION_READINESS.md` §3 (owns `src/store/*`) | **CONFIRMED** (documented) |
| DB-4 | No save/list/retrieve endpoints agreed | `docs/api-contract.md` §7; `docs/INTEGRATION_READINESS.md` §2.5; `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §5.5 | **CONFIRMED** (deferred) |
| DB-5 | No project/estimate/features/tasks/history tables exist | code search (no ORM/migrations); `docs/CONTRACT_REVIEW_PHASE_2K.md` §2.4 (all `missing`) | **CONFIRMED** (absent) |
| DB-6 | Chatbot/assistant conversation storage is out of scope | `docs/api-contract.md` §1; `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §5.5 ("Deferred / unconfigured"); `docs/CONTRACT_REVIEW_PHASE_2K.md` D10 | **CONFIRMED** (deferred) |
| DB-7 | One currency per estimate; no conversion | `src/estimation/types.ts:30`; `docs/INTEGRATION_READINESS.md` §2.4; `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §4.8 | **CONFIRMED** |
| DB-8 | Section-based result is the primary output shape | `src/estimation/types.ts:58`; `docs/CONTRACT_REVIEW_PHASE_2K.md` §2.3 | **CONFIRMED** (shape exists; "primary *persisted* output" is **proposed**) |
| DB-9 | Feature/Task persistence is conditional on MVP scope decision | `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` D4, P3; `docs/PHASE_2M_EXECUTION_CHECKLIST.md` RC-14 | **UNRESOLVED** (scoped, not decided) |
| DB-10 | Estimated-vs-actual / historical records | `docs/TEAM_HANDOFF_DOMAIN_4C.md` §7, §14 (Phases C/E); `docs/INTEGRATION_READINESS.md` §2.1 `HistoricalRecord` | **UNRESOLVED** (proposed, no data, no store) |
| DB-11 | Estimate revision / immutable-revision model | no mention of "revision"/"immutable revision" anywhere in inspected docs or code | **UNRESOLVED** (no source) |
| DB-12 | Parent/child (feature/task) total double-counting rule | no consolidated totals exist; `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §4.2 defines project labour = Σ section rollups, but no persistence/aggregation rule | **UNRESOLVED** (no source) |
| DB-13 | Proposed `ExchangeRate` store | `docs/TEAM_HANDOFF_DOMAIN_4C.md` §7, §8; `docs/INTEGRATION_READINESS.md` §2.1 | **UNRESOLVED** (proposed; conversion deferred) |
| DB-14 | Persistence must not mutate the base estimate | `docs/INTEGRATION_READINESS.md` §2.4 ("Conversion … must never mutate `Estimate.total`") | **CONFIRMED** (documented rule) |

### 7.1 Database design document — MISSING SOURCE

The Phase 2S brief asked to evaluate "Sambram's proposed database design" against the code
contracts. **That document does not exist in the inspected repository state** (§3.2). The only
database-design statements available are the proposal fragments in the docs above
(`docs/TEAM_HANDOFF_DOMAIN_4C.md` §7, §12, §13, §14; `docs/INTEGRATION_READINESS.md` §2.1,
§2.5). This review therefore **cannot** confirm whether a concrete DDL/schema (columns, keys,
cardinality, migrations) is compatible: there is no DDL to check.

**Table → contract compatibility could not be evaluated because no table definitions exist.**

---

## 8. Conflicts and unresolved decisions

### 8.1 Conflicts (available sources disagree)

| ID | Conflict | Sources |
| --- | --- | --- |
| C-1 | **Money representation** — flat `currency` + numeric amounts vs nested `{amount, currency}` | `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §3 ("no nested `Money` object") and `docs/CONTRACT_REVIEW_PHASE_2K.md` D3 (flat) **vs** `docs/TEAM_HANDOFF_DOMAIN_4C.md` §8 (`Money = {amount: Decimal, currency}`) and `docs/INTEGRATION_READINESS.md` §2.4 |
| C-2 | **MVP breadth** — 4-section cost calculator vs features/tasks/effort/timeline/range | `docs/PHASE_2M_EXECUTION_CHECKLIST.md` RC-14 (cost calculator only) and `docs/CONTRACT_REVIEW_PHASE_2K.md` D4 **vs** `docs/INTEGRATION_READINESS.md` §2.1–2.3 (features/tasks/effort/range) |
| C-3 | **Contingency in MVP** | `docs/INTEGRATION_READINESS.md` §2.6 (request includes `contingencyPct`) and `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` D5 (optional) **vs** `docs/PHASE_2M_EXECUTION_CHECKLIST.md` RC-14 boundary (excludes) and `docs/CONTRACT_REVIEW_PHASE_2K.md` §2.5 (no contingency in identity) |
| C-4 | **Health shape** — `capabilities` vs `catalogue` | `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §5.3 (adopt `capabilities`) **vs** `backend/app/routers/health.py:23` (returns `catalogue`) |
| C-5 | **Error-code set** — software vs material | `docs/PHASE_2M_EXECUTION_CHECKLIST.md` RC-09 (freeze software set) **vs** `backend/app/schemas.py:14` (material set) |
| C-6 | **Owner names** — `Owais`/`Harshith` vs `Owasis`/`Harshit` | `docs/CONTRACT_REVIEW_PHASE_2K.md` §6 and `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §6 **vs** `docs/TEAM_HANDOFF_DOMAIN_4C.md` §12 |
| C-7 | **Sambram's ownership scope** — "database & data design" only vs also historical import + currency-conversion service + metrics/KPIs | `docs/CONTRACT_REVIEW_PHASE_2K.md` §6 and `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §6 **vs** `docs/TEAM_HANDOFF_DOMAIN_4C.md` §12 (Harshit owns import + currency + metrics) |
| C-8 | **Domain scope** — building products vs software development | `docs/CONTRACT_REVIEW_PHASE_2K.md` §9, D1; `docs/INTEGRATION_READINESS.md` §7 (both record the ambiguity) |
| C-9 | **Frontend typecheck status** — documented FAIL (8) vs observed PASS | docs (§2.3 here) **vs** observed working tree |

### 8.2 Unresolved decisions supported by evidence (existing sets, preserved counts)

> These are the *existing* decision lists in the repository. Their counts and grouping are
> preserved verbatim below. **This review does not merge, renumber or reduce them.**

- **`docs/CONTRACT_REVIEW_PHASE_2K.md` §7 — "Decisions requiring Amrut's approval": D1–D12**
  (domain scope; resume vs restart; money representation; MVP breadth; calculate path;
  rate-card ownership; ownership map; health shape; error-code freeze; assistant boundary;
  fixture versioning; persistence timing).
- **`docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §9 — "Decisions still requiring Amrut's approval":
  D1–D12** (same theme, re-worded for the cost-calculator MVP).
- **`docs/INTEGRATION_READINESS.md` §5 — "Unresolved decisions & blockers": 12 numbered items**
  plus a separate "Blockers" list.
- **`docs/PHASE_2M_EXECUTION_CHECKLIST.md` — "Outstanding decisions": D1–D10.**

### 8.3 The single largest unresolved item for a database

**No database requirement can be frozen** while C-1, C-2 and DB-9/DB-11/DB-12 are open,
because they determine *what would be stored*: the money type, whether features/tasks exist,
whether history/actuals exist, whether revisions are immutable, and how parent/child totals
relate. Persistence design cannot precede those answers.

---

## 9. The exact six decisions — MISSING SOURCE notice

The Phase 2S brief directed: *"First locate the compatibility review and extract its exact six
unresolved decisions… Do not invent replacements if the file is missing."* and (in the
evidence-only variant) *"Do not manufacture six decisions from the 10 items in
`INTEGRATION_READINESS.md` or the D1–D12 lists."*

**Result:** the original source could **not** be verified.

- No file in the working tree, any local branch, any remote-tracking ref, any stash, or the
  fetched remote tree contains a compatibility review with exactly six unresolved decisions.
- The closest existing sets are the four lists in §8.2 (counts 12, 12, 12+blockers, 10). None
  has six. They are **not** reduced to six here.

**Missing evidence needed to recover the original six decisions:**

1. The actual file (or message/attachment) containing the six-item list, with its title and
   author.
2. The branch/PR/commit where it lives, if it was ever committed.
3. Confirmation of whether the six items are a subset of an existing D-list (and if so, which
   D-numbers) or an independent set.

Until (1)–(3) are provided, any "six decisions" list would be fabricated and is intentionally
omitted.

---

## 10. Responsibilities and confirmations required

Ownership is itself **conflicted** (C-6, C-7). The most recent, internally consistent maps are
`docs/CONTRACT_REVIEW_PHASE_2K.md` §6 and `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §6; the older
map is `docs/TEAM_HANDOFF_DOMAIN_4C.md` §12.

| Person | Ownership per `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §6 | Ownership per `docs/TEAM_HANDOFF_DOMAIN_4C.md` §12 |
| --- | --- | --- |
| **Amrut** | Contract approval, coordination, integration, regression checks, demo; `docs/*`, `src/api/**`, `src/store/**`, root config, shared-fixture test files | Frontend coordination, shared TS types, API client, review/approval |
| **Owais** | Frontend/UI/UX: `src/pages/**`, `src/components/**`, `src/styles/**`, `src/constants/**`, `src/data/sampleEstimates.ts` | UI/UX screens (spelled "Owasis") |
| **Sambram** | Database & data design: `docs/data-model.md` (missing), future persistence/DDL, seed datasets, `ExchangeRate`/historical stores, import tooling | Database design & data modelling: schemas, migrations, historical/actuals persistence, `ExchangeRate` store |
| **Manju** | Backend API & integration: `backend/app/{main,config,errors,schemas}.py`, `backend/app/routers/**`, backend HTTP tests | Backend: deterministic cost engine, estimator/model service, estimator API endpoints |
| **Harshith** | Estimation engine: `src/estimation/**`, `backend/app/estimation/**`, `docs/fixtures/**`, `docs/estimation-engine.md` | Backend: historical-data import + validation, currency-conversion service, metrics/KPI endpoints |

**Confirmations needed before any database work:**

- **Manju (backend) must confirm:** whether the backend will be migrated to the software
  project-cost contract at all (currently material), the frozen request/result wire shapes,
  the error-code set, the health body, and whether persistence DTOs are needed in
  `backend/app/schemas.py`.
- **Harshith (engine) must confirm:** the canonical deterministic output fields (sections vs
  features/tasks/effort/timeline), contingency inclusion, and the rounding/validation contract
  to mirror.
- **Sambram (database) must confirm:** the actual database-design document, the money type,
  the revision/immutability model, feature/task persistence scope, parent/child aggregation
  rule, and the historical/actuals and `ExchangeRate` stores.
- **Owais (frontend) must confirm:** which frontend result fields survive to persistence.

---

## 11. Prioritized next actions

Order matters: contract facts must be frozen before anything is persisted.

| Priority | Action | Owner | Depends on |
| --- | --- | --- | --- |
| P0 | Produce/recover `docs/SOFTWARE_ESTIMATION_DATABASE_DESIGN.md` and the six-decision review, or confirm they were never written | Sambram (with Amrut) | — |
| P0 | Freeze the wire contract (request/result, money type, error codes, health body) per §6 conflicts | Amrut (approval) + Manju + Harshith | — |
| P0 | Decide the actual "six decisions" source-of-truth, or consolidate the four existing lists into one agreed set | Amrut | P0 (recover source) |
| P1 | Resolve C-1 (money representation) and C-2 (MVP breadth) | Amrut | P0 |
| P1 | Decide DB-9 (features/tasks persistence), DB-11 (revisions immutable), DB-12 (parent/child totals) | Amrut + Sambram | P1 (C-2) |
| P1 | Restore backend test collection (`docs/fixtures` v2 vs `test_shared_fixture.py:25`) so a regression net exists | Manju + Amrut (fixture-test owner) | P0 (contract freeze) |
| P2 | Decide persistence timing (Phase 04 vs demo) and whether `localStorage` remains the demo store | Amrut + Sambram | P1 |
| P2 | Only then define DDL/tables against the frozen contract | Sambram | P1–P2 |
| P3 | Add save/retrieve endpoints — **only after explicit team agreement** | Manju + Sambram | P2 |

No database work should begin before P0/P1 complete, because the stored shape is not yet
decided.

---

## 12. Verification limitations and evidence references

### 12.1 Limitations

1. **Missing sources.** `docs/SOFTWARE_ESTIMATION_DATABASE_DESIGN.md`, `docs/data-model.md`,
   `backend/app/db/**`, and the six-decision review could not be found anywhere (working tree,
   local refs, remote-tracking refs, stashes, fetched remote). No table/schema could be
   evaluated because none exists.
2. **Uncommitted divergence.** The working tree differs from HEAD `07faa05` (four modified
   files). Documented check status (typecheck FAIL) reflects HEAD; observed status (PASS)
   reflects the working tree. Nothing was staged, so the review did not alter this.
3. **Docs are proposals.** `docs/INTEGRATION_READINESS.md` and `docs/CONTRACT_REVIEW_PHASE_2K.md`
   explicitly label their content as proposals/unimplemented. They are cited as *documented
   intentions*, never as implemented behaviour.
4. **No database/SQL to inspect.** Compatibility of a database design with the contracts
   cannot be confirmed or refuted without the design.
5. **Backend tests cannot run** (collection error), so there is currently no backend regression
   safety net.

### 12.2 Evidence references (exact paths / symbols)

- Frontend request/result: `src/estimation/types.ts:3,5,28,53,58,74,83`.
- Frontend currencies: `src/estimation/currencies.ts:1`; amounts `src/estimation/types.ts:30`.
- Frontend calculation: `src/estimation/calculate.ts:23,32,172,182,197,212,227,252`.
- Frontend barrel: `src/estimation/index.ts:1`.
- API client: `src/api/types.ts:7,22,26,31,34`; `src/api/client.ts:14,53,94` and the modified
  `src/api/client.ts:6`; `src/api/estimates.ts:12`; `src/api/health.ts:5`; `src/api/index.ts`.
- Frontend record type: `src/types/index.ts:20`.
- Backend schemas: `backend/app/schemas.py:12,14,27,36,47,56,71,90,100,105,113`.
- Backend routes: `backend/app/main.py:30-32`; `backend/app/routers/health.py:14,23`;
  `backend/app/routers/estimates.py:12,28`; `backend/app/routers/products.py:13`.
- Backend config/errors/engine: `backend/app/config.py:7,8`; `backend/app/errors.py:35,54,67`;
  `backend/app/estimation/calculate.py:206,235,249`; `backend/app/estimation/money.py:15`.
- Backend tests: `backend/tests/test_shared_fixture.py:25`; inventory via glob.
- Fixture: `docs/fixtures/calculation-cases.json:2,9,13,23`.
- Docs: `docs/api-contract.md` §1,§6,§7,§8,§9; `docs/estimation-engine.md` (material);
  `docs/INTEGRATION_READINESS.md` §2.1–2.7,§3,§5; `docs/CONTRACT_REVIEW_PHASE_2K.md`
  §1.1–1.3,§2–§9; `docs/IMPLEMENTATION_PLAN_PHASE_2L.md` §1,§3–§6,§9;
  `docs/PHASE_2M_EXECUTION_CHECKLIST.md` §1,RC-01–RC-14,outstanding;
  `docs/TEAM_HANDOFF_DOMAIN_4C.md` §1,§7,§8,§12,§13,§14.

---

## 13. Phase 2S-B verification statement

- **Branch / HEAD inspected:** `wip/software-estimation-migration` @ `07faa05`.
- **Files created by this task:** exactly one — `docs/PHASE_2S_DATABASE_COMPATIBILITY_REVIEW.md`.
- **Files modified / deleted by this task:** none. Pre-existing uncommitted changes (§2.2)
  were preserved.
- **Application code / tests / fixtures / schemas / migrations / API contracts:** not changed.
- **Git operations:** **no staging, no commit, no push, no merge, no PR, no branch switch, no
  reset/clean/stash.** The review is presented for approval first.

> This document records missing evidence and does not fabricate the database design or the six
> decisions. Awaiting Amrut's direction before any database implementation.
