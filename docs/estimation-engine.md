# Estimation engine (deterministic cost core)

A deterministic, pure-TypeScript cost-calculation core for project estimates (personnel,
tooling, infrastructure and other costs). It has no React, network, AI or database
dependencies, so it runs unchanged in the UI and in tests, and is mirrored exactly by the
FastAPI service in `backend/`.

> **Demo data only.** Every figure is **illustrative** and is not verified customer, market
> or supplier data.

## Module layout

```
src/estimation/
  types.ts               Domain types (request, result, sections, errors, calculation)
  currencies.ts          Supported currencies + isSupportedCurrency
  money.ts               roundCurrency (half-up to 2 decimals) and CURRENCY_DECIMALS
  calculate.ts           validateEstimateRequest + calculateEstimate
  index.ts               Public barrel export
  *.test.ts              Vitest suites (unit + shared golden fixture)
```

Consume it through the barrel:

```ts
import { calculateEstimate } from '../estimation';
```

## Behaviour

- **Cost formulas.** Personnel = `people × hours × hourlyRate`; infrastructure =
  `monthlyCost × months`; tooling and other use the given `amount`.
- **Rounding.** `roundCurrency` rounds **half-up to 2 decimal places**. Each line cost, each
  section subtotal and the grand total are rounded — never on raw unrounded sums.
- **Validation.** `validateEstimateRequest` checks the currency, then rejects an entirely
  empty request, then checks each line (non-empty text; finite, ≥ 0 numbers). It returns the
  list of `EstimateValidationError`s; `calculateEstimate` short-circuits on the first failing
  stage and, if a computed cost or the total is not finite, returns `NON_FINITE_RESULT`.
- **Result.** On success the result carries per-line `cost`s, per-section `subtotal`s,
  per-section totals, a `lineCount`, the rounded `total` and the `assumptions` list.

See [`docs/api-contract.md`](./api-contract.md) for the exact error codes, messages and wire
shapes, and `docs/fixtures/calculation-cases.json` for the golden cases shared with the
backend.

## Source of truth

This TypeScript core is the **source of truth**. `backend/app/estimation/` mirrors it — the
same validation order, codes, messages and rounding — and must not introduce new rules. Both
runtimes are pinned to the shared fixture via `shared-fixture.test.ts` and
`backend/tests/test_shared_fixture.py`.
