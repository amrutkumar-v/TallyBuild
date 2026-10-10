# Phase 2F — Testing & Reliability Improvements

- **Project:** TallyBuild AI
- **Repository:** https://github.com/amrutkumar-v/TallyBuild.git
- **Branch:** `feature/phase-02d-frontend-integration`
- **HEAD at start and end:** `a854355`
- **Run date:** 2026-10-10
- **Scope:** automated verification only — no product-domain change, no new user-facing feature, no dependency, no commit/push/deploy.
- **Companion documents:** `docs/PROBLEM_VALIDATION.md`, `docs/PHASE_02E_READINESS.md` (previous findings preserved), `docs/api-contract.md` (§9 fixtures), `docs/manual-smoke-test.md`.

> No official Domain 4C problem statement or rubric was available, so no speculative AI, price
> prediction, comparison or software-development-budgeting work was done. Only the existing
> estimation contract was exercised.

---

## 1. Changes made

1. **Created the shared golden fixture** `docs/fixtures/calculation-cases.json` — the single
   source of truth documented in `docs/api-contract.md` §9 but previously missing. It contains
   the documented rounding cases and estimate cases (valid, multi-line, zero quantity, invalid
   quantity, invalid/non-finite price, rounding boundaries, missing/invalid fields, unit errors,
   multi-line failures). Expected values were **derived by hand from the documented rounding
   rules**, not produced by running the implementation.
2. **Frontend fixture test** `src/estimation/shared-fixture.test.ts` loads the JSON via Vite's
   `?raw` import and runs the TypeScript core (`roundCurrency`, `calculateEstimate`) against every
   case.
- **Backend fixture test** `backend/tests/test_shared_fixture.py` loads the **same** JSON file
  from disk and runs the Python core against the same cases.
- **Focused component tests** (server-rendered, no DOM libraries needed):
  `EstimateResultCard.test.ts`, `LineItemsEditor.test.ts`, `NewEstimatePage.test.ts`.
- **Manual smoke-test document** `docs/manual-smoke-test.md`, because no browser-automation
  tooling exists (see §6).
- A short, clearly separated **Phase 2F note** appended to `docs/PHASE_02E_READINESS.md`
  recording that the shared-fixture gap it identified is now closed. No existing findings there
  were altered.

No estimation behaviour, API schema, contract, dependency, script, or environment file was
changed. The fixture asserts the **existing** contract; no business rule was invented.

## 2. Files created or modified

**Created**

| File | Purpose |
| ---- | ------- |
| `docs/fixtures/calculation-cases.json` | Shared TS/Python golden fixture (source: `api-contract.md` §9) |
| `src/estimation/shared-fixture.test.ts` | TS engine runs every fixture case |
| `src/components/estimates/EstimateResultCard.test.ts` | Result card states (idle/loading/success/validation-error/error) |
| `src/components/estimates/LineItemsEditor.test.ts` | Loading/empty/offline/line-rendering/error states |
| `src/pages/NewEstimatePage.test.ts` | Initial page render, required fields, disabled calculate, no fabricated total |
| `backend/tests/test_shared_fixture.py` | Python engine + rounding run every fixture case |
| `docs/manual-smoke-test.md` | Reproducible manual smoke procedure |
| `docs/PHASE_02F_TESTING.md` | This report |

**Modified**

| File | Change |
| ---- | ------ |
| `docs/PHASE_02E_READINESS.md` | Appended a short "Phase 2F update" note only (no existing text changed) |

**Untouched:** all application source (`src/**` except new `*.test.ts` files), all backend
source (`backend/app/**`), `package.json`, `vitest.config.ts`, `tsconfig*.json`, `eslint.config.js`,
`backend/pyproject.toml`, environment files, and all dependency manifests/locks.

## 3. Test cases covered

### 3.1 Shared fixture (`docs/fixtures/calculation-cases.json`)

**Rounding primitive (`roundingCases`, 8):** `1.005 → 1.01`, `2.675 → 2.68`, `0.005 → 0.01`,
`10.124 → 10.12`, `1.111 → 1.11`, `100 → 100`, `4100 → 4100`, `0 → 0` — plus the documented
precision (`currencyDecimals = 2`).

**Estimate cases (19):**

| id | Expectation |
| -- | ----------- |
| `normal-valid-estimate` | ok; `[131200, 306000, 108000]`, total `545200` |
| `single-line-subtotal` | ok; `[4100]`, total `4100` |
| `zero-quantity` | ok; `[0]`, total `0` |
| `invalid-negative-quantity` | `INVALID_QUANTITY`, line 0 |
| `invalid-nan-quantity` | `INVALID_QUANTITY` |
| `invalid-infinite-quantity` | `INVALID_QUANTITY` |
| `missing-product` | `MISSING_PRODUCT`, `does-not-exist` |
| `incompatible-unit` | `INCOMPATIBLE_UNIT` |
| `unit-conversion-unsupported` | `UNIT_CONVERSION_UNSUPPORTED` |
| `unsupported-unit` | `INVALID_UNIT` |
| `empty-lines` | `EMPTY_REQUEST` |
| `rounding-half-paise-twice` | ok; `[0.01, 0.01]`, total `0.02` |
| `rounding-down-sub-paise` | ok; `[0]`, total `0` |
| `rounding-fractional-quantity` | ok; `[100]` (`33.333 × 3 = 99.999 → 100`) |
| `invalid-price-zero` | `INVALID_PRICE` |
| `invalid-price-negative` | `INVALID_PRICE` |
| `invalid-price-non-finite` | `INVALID_PRICE` |
| `invalid-price-source` | `INVALID_PRICE_SOURCE` |
| `multiple-failing-lines` | `[MISSING_PRODUCT, INVALID_QUANTITY]`, lines `[0, 1]` |

Every case declares its catalogue (`sample` = the 9 built-in products; `custom` = products
defined in the fixture). Non-finite numbers are encoded as the strings `"Infinity"`/`"-Infinity"`/
`"NaN"` and are converted by each harness. The invalid-`priceSource` product travels as
`"priceSource": null`.

### 3.2 Component tests (15)

- **`EstimateResultCard` (5):** idle renders nothing; loading shows the busy state; success shows
  the line item, formatted total and the illustrative-price notice; transport error shows a retry
  action and **no** total; validation-error shows a summary and **no** total.
- **`LineItemsEditor` (6):** loading, empty-catalogue, offline demo fallback (asserts no total is
  fabricated), populated line (product + quantity + unit hint), no-lines empty state, per-field
  errors.
- **`NewEstimatePage` (4):** exactly one `<h1>`; required fields present; catalogue loading state;
  **Calculate** is disabled and **no** total is rendered before the catalogue loads.

## 4. TypeScript ↔ Python parity results

The identical JSON fixture is loaded by both suites (`?raw` import in Vitest;
`Path(...).read_text()` in pytest). Both implementations pass **all** fixture cases:

- Rounding: 8/8 identical outputs.
- Estimates: 19/19 identical outcomes (success values, error codes, `lineIndex`, `productId`).

No mismatch was discovered, so **no engine change was made** and no correction/regression test
was required. This closes the gap recorded in `docs/PHASE_02E_READINESS.md` (§3.4 / §6 item 9)
where parity was previously asserted only by parallel suites rather than one shared fixture.

## 5. Component-test results

15/15 passing. The tests use **server rendering** (`react-dom/server` `renderToString`) in the
existing `environment: 'node'` Vitest setup, rendering the real page/component trees (including
`MemoryRouter` and `EstimatesProvider`). This is feasible because only `react`/`react-dom` are
installed.

**Limitation:** no DOM is available (`jsdom`, `happy-dom`, `@testing-library/react`,
`@testing-library/user-event`, `@testing-library/jest-dom` are **not** installed and Phase 2F
must not install them). Therefore these are **not** interaction tests: they assert rendered
markup and static state, and cannot simulate typing, clicks, focus moves, or async state
transitions (e.g. an actual failed calculation). Those interactive paths are covered by the
manual procedure in `docs/manual-smoke-test.md` and by the pure-logic tests of the API client and
estimation core.

## 6. Was browser-level automation available?

**No.** No Playwright, Cypress or Puppeteer dependency or configuration exists, and this phase is
not allowed to install packages. Therefore:

- **No** automated browser/end-to-end test was added, and none is claimed.
- A reproducible **manual** smoke procedure was documented instead:
  `docs/manual-smoke-test.md` (backend startup, frontend startup, product loading, estimate
  calculation, validation, API-error handling, offline fallback).

## 7. Exact verification commands and outcomes

Run from the repository root unless noted; backend commands run from `backend/` with its `.venv`.

| Command | Result |
| ------- | ------ |
| `npm run typecheck` (`tsc -b`) | exit 0 |
| `npm run lint` (`eslint .`) | exit 0 (no warnings) |
| `npm test` (`vitest run`) | **9 files, 86 tests passed** (was 5 files / 42) |
| `npm run build` (`tsc -b && vite build`) | built OK; bundle hashes unchanged from before this phase (`index-CyckKYM7.js`, `index-CuKnnkz_.css`) → no production source change |
| `python -m pytest -q` (backend) | **72 passed**, 1 pre-existing `StarletteDeprecationWarning` |
| `python -m ruff check .` (backend) | All checks passed |
| `python -m ruff format --check .` (backend) | 24 files already formatted |

Test growth: frontend **42 → 86** (+44: 29 fixture, 15 component); backend **44 → 72** (+28:
8 rounding + 1 precision + 19 estimates).

## 8. Any unresolved failures or limitations

- **No failing tests.** All checks above exit 0.
- **No DOM test environment.** Component tests cannot exercise DOM events, focus management or
  asynchronous state transitions (e.g. offline→online retry, calculate success/failure) without
  installing `jsdom`/`@testing-library/*`, which is prohibited this phase. These paths remain
  covered only by the manual smoke procedure. **Reported, not forced.**
- **No automated browser E2E** (see §6).
- **Known, accepted rounding limitation** (inherited, unchanged): the `+ EPSILON` half-up trick is
  exact only within ~1 ULP of a midpoint; larger values just below a midpoint round down. This is
  mirrored identically in both languages and covered by the fixture; it does not arise with the
  integer-priced shipped catalogue.

## 9. Remaining risks before the official problem statement is obtained

- **Domain mismatch is unresolved.** The repo estimates construction **materials**; the supplied
  PDF describes product/software-development cost. If Domain 4C is product-development cost, the
  domain model and data (not the tests/architecture) would need to change; the new shared fixture
  and component tests are written against the **current** contract and would need updating then.
- **No official rubric**, so the "smallest credible" feature set is still an assumption. Test
  effort was therefore deliberately limited to hardening what already exists rather than
  speculating on new features.
- **Parity is fixture-deep, not HTTP-deep:** the shared fixture exercises the two calculation
  cores directly; the FastAPI envelope (status codes/envelope shape) is covered by the existing
  pytest HTTP tests, not by a cross-language over-the-wire comparison.
- **Manual-only E2E** means regressions in browser interaction are caught by a human, not CI,
  until a browser-automation dependency is approved.

---

## Appendix — Changes made by this phase

- **Created:** the eight files listed in §2 under "Created" (one being this report).
- **Modified:** `docs/PHASE_02E_READINESS.md` (appended note only).
- **Unchanged:** all application/backend source, config, dependencies, environment and deployment
  files.
- **Git:** no commit, push, deploy, branch switch or config change was performed.
