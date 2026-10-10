# Phase 02 Integration Plan — TallyBuild AI

**Status:** planning only. This document is a handoff for the frontend and backend teammates.
No application code is written or changed in Phase 02B. See
[`docs/api-contract.md`](./api-contract.md) for the wire contract and
[`docs/estimation-engine.md`](./estimation-engine.md) for the deterministic core.

## 0. Where we are

- Phase 00, 01 and 02A are complete and pushed. `main` has Phases 00–01; the Phase 02A
  estimation core lives on `feature/phase-02-estimation-core` (commit
  `e61e13cc858c0857d62ef509569e1c1a9e4aae91`).
- `src/estimation/` is a pure, tested, deterministic calculation core (26 tests). It is **not**
  wired into the UI.
- The New Estimate form (`src/pages/NewEstimatePage.tsx`) captures **project details only**
  (name, location, type, notes) and saves a browser-local draft with `estimatedAmount: null`.
  There are **no line items yet** and **no network calls anywhere**.
- There is no backend, persistence, auth or live pricing.

## 1. Target data flow

```
New Estimate form (project details + line items)
   → client-side validation (shape, required fields, units)
   → API client  (POST /api/v1/estimates/calculate, timeout + error handling)
   → FastAPI backend  (validate; resolve products; reproduce the deterministic core)
   → structured JSON response  (lineResults, subtotals, total, priceSources)
   → estimate results UI  (line breakdown, total, illustrative-price labels)
```

Hard rule: if the backend is unavailable or returns an error, the UI shows an honest,
actionable state. It **never** fabricates a final estimate and never silently substitutes a
local calculation as if it were the server's answer.

## 2. Frontend tasks

Ordered; each item is a discrete PR.

1. **Line-item input UI** (extends the New Estimate screen)
   - Add a repeatable "material line" row: product picker, quantity, unit, optional label.
   - Use existing primitives (`Fields.tsx`, `Button`, `SectionCard`) and design tokens.
   - Enforce the 2A rules client-side for immediate feedback: quantity is a finite number
     `>= 0`; unit must match the product's canonical unit; reuse the core's unit enum.
   - Provide add/remove line, keyboard + `aria` support, and a designed empty state.
   - Keep the form usable when the catalogue cannot be loaded (see §6).

2. **Product catalogue source**
   - Fetch `GET /api/v1/products`; while unavailable, fall back to the existing
     `SAMPLE_PRODUCT_CATALOGUE` **clearly labelled "offline demo catalogue"** (demo data).
   - Never hide that a fallback catalogue is in use.

3. **API client module** (`src/api/`)
   - `types.ts` — proposed types from contract §8.
   - `client.ts` — `fetch` wrapper with base URL, JSON headers, `AbortController` timeout,
     and mapping of HTTP status → `EstimateCalculation` / `ApiResult`.
   - `products.ts` — `getProducts()`.
   - `estimates.ts` — `calculateEstimateViaApi(request): Promise<EstimateCalculation>`.
   - Map `details[].lineIndex` / `productId` back to form fields.
   - No new dependencies (use the platform `fetch`).

4. **Result UI**
   - Render `lineResults` as a table: product, quantity + unit, unit price, line subtotal.
   - Show `total` (reuse `formatCurrency` from `utils/format.ts`).
   - Surface `priceSources[].label` / `priceDate` as the illustrative-price notice
     (reuse `DemoNotice`).
   - States: loading, success, validation errors, network failure, empty catalogue.

5. **Wire the flow**
   - "Calculate estimate" button: disabled with a reason until there is ≥ 1 valid line and a
     catalogue is available; shows a loading state while the request is in flight.
   - On success, replace the draft's "not estimated" amount with the returned `total`
     (store it alongside the local draft). **Do not** persist to a server (no persistence yet).

6. **Tests**
   - Unit-test the API client against mocked `fetch` responses (200, 422, 400, 500, network
     error) using Vitest (already installed).
   - Component tests for loading/error/empty states are desirable but optional for the MVP.

## 3. Backend teammate tasks

1. **FastAPI app skeleton** under a new top-level directory (e.g. `backend/`), independent of
   the frontend build.
2. **`GET /api/v1/health`** per contract §5.1.
3. **`GET /api/v1/products`** per contract §5.2, serving the same product ids/units/prices as
   `src/estimation/data/sampleProducts.ts` (illustrative, with `priceSource`).
4. **`POST /api/v1/estimates/calculate`** per contract §5.3, reproducing the core:
   - the same unit/family map and exact-match pricing;
   - the same validation rules and error codes;
   - the same `round_currency` expression (contract §4.4).
5. **Error envelope** per contract §6, with domain codes preserved in `details[]`.
6. **CORS** for `http://localhost:5173` in development.
7. **Tests** (pytest) that run the shared golden fixtures (contract §9.1) and assert equality
   with the TypeScript core's expected outputs.
8. **Do not implement persistence/auth/AI** in Phase 02.

## 4. Shared responsibilities

| Area | Frontend | Backend | Both |
| ---- | -------- | ------- | ---- |
| Product catalogue data | fetch + fallback + labelling | owns/serves dataset | agree on ids/units/prices |
| Validation messages | map to fields; UX copy | authoritative codes | keep code strings identical |
| Rounding parity | core is reference | reproduces core | shared golden fixtures in CI |
| Error handling | states + retry UX | envelope + status codes | agreed status mapping |
| Illustrative labelling | visible notice (`DemoNotice`) | `priceSource.isIllustrative` | never present as real prices |
| Contract changes | flag + adapt client | flag + adapt server | update `docs/api-contract.md` together |

## 5. Dependencies and implementation order

1. **Agree contract decisions** (contract §10) — blocker for everything else.
2. Backend: health + products endpoints.
3. Frontend: API client + product fetching (can start against health/products).
4. Backend: calculate endpoint + golden-fixture tests.
5. Frontend: line-item UI + result UI + wire calculate.
6. End-to-end smoke test with both running locally.
7. Docs updated; Phase 02 detached from Phase 02A branch as agreed.

The frontend can begin (1)–(3) against a stub/health endpoint before calculate exists; it must
keep working offline throughout.

## 6. UX states (must be designed, not assumed)

- **Loading:** calculate button shows a spinner/disabled "Calculating…"; results region shows
  a skeleton or "Calculating your estimate…". Inputs remain visible; do not clear the form.
- **Client validation errors:** inline per-field, mirroring the core rules; focus the first
  invalid field (pattern already used in `NewEstimatePage.validate`).
- **Server validation errors (`422`):** map `details[]` by `lineIndex`/`productId` onto the
  matching line row; show the server `message`. Do not discard server messages.
- **Malformed request (`400`) / internal error (`500`):** generic, honest error banner
  ("We couldn't calculate this estimate. Please check your inputs and try again."), with a
  retry action.
- **Network failure / timeout / offline:** "Can't reach the estimation service." Offer
  **Retry**. Do not auto-fall-back to a local total. Optionally offer an explicit
  "estimate locally (demo)" action that is clearly labelled as a client-side demo result —
  only if the team agrees; otherwise the local core stays used solely by unit tests.
- **Empty catalogue:** if `GET /products` returns `count: 0`, show an empty state
  ("No products available yet"), disable calculate with a stated reason, and never invent
  products.
- **Backend unavailable at load:** app stays fully usable (dashboard/estimates/sample data
  continue to work); a non-blocking banner states the estimation service is offline and the
  Calculate action is disabled with that reason.
- **Illustrative prices:** whenever results or catalogue data are shown, display the
  `priceSource.label` and `priceDate` (via `DemoNotice`) so prices are never mistaken for
  verified market rates.

## 7. Acceptance criteria

- `GET /health` returns `200` with the documented body; frontend reflects readiness honestly.
- `GET /products` returns the sample products with `priceSource.isIllustrative = true`.
- `POST /estimates/calculate` returns, for the 3-line example, line subtotals
  131200 / 306000 / 108000 and `total` 545200.
- All 15 golden cases (contract §9.1) pass on **both** the TypeScript core and the Python
  backend, with identical codes and numbers.
- Frontend unit/integration tests cover 200 / 400 / 422 / 500 / network-error paths.
- No number is displayed as a real market price; every priced surface is labelled illustrative.
- The app remains fully functional with the backend stopped (no crash, honest offline state).
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass on the frontend.
- No persistence/auth/AI is claimed or implemented in Phase 02.

## 8. Integration checklist

- [ ] Contract decisions in `docs/api-contract.md` §10 agreed by both teammates.
- [ ] `GET /api/v1/health` implemented and consumed.
- [ ] `GET /api/v1/products` implemented; frontend fetches it with a labelled offline fallback.
- [ ] `POST /api/v1/estimates/calculate` implemented and matches the core exactly.
- [ ] Shared golden fixtures wired into both test suites and passing.
- [ ] Envelope + status-code mapping implemented and handled by the client.
- [ ] CORS configured for local dev; Vite proxy added (dev only).
- [ ] Line-item input and result UI shipped with loading/validation/error/empty states.
- [ ] Illustrative-price labelling visible on catalogue and results.
- [ ] Offline/no-backend behaviour verified.
- [ ] Frontend gates green (typecheck, lint, test, build).
- [ ] Docs updated; phase committed separately per `AGENTS.md`.

## 9. Risks and mitigations

| Risk | Mitigation |
| ---- | ---------- |
| TS/Python rounding disagreement | same expression + shared golden fixtures (§9 contract) |
| Divergent product ids/units | backend owns the dataset; ids copied from the core |
| Silent fake success when offline | explicit offline states; no fabricated totals |
| Scope creep into persistence/AI | deferred endpoints marked; Phase 04 owns storage |
| Error-code drift | codes fixed in the core; `details[]` preserves them verbatim |

## 10. Recommendation for the next implementation phase

Proceed to **Phase 02C — Backend estimation API** (backend teammate) first: implement
`health`, `products` and `calculate` plus golden-fixture tests, so the frontend has a stable
target. Then **Phase 02D — Frontend integration** (this role): API client, line-item input,
result UI, and offline/error states. Keep the deterministic core as the shared reference and
do not enable persistence or AI until later phases.
