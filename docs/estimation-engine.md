# Estimation engine (Phase 02A)

A deterministic, pure-TypeScript cost-calculation core for building materials. It has no
React, network, AI or database dependencies, so it can be reused directly by the UI today
and by a FastAPI service later.

> **Demo data only.** Every product price in this module is **illustrative** and is not a
> verified market price. See [Sample data](#sample-data).

## Module layout

```
src/estimation/
  types.ts               Domain types (request, result, errors)
  units.ts               Supported units, unit families, compatibility helpers
  money.ts               Currency rounding (paise, half-up)
  catalogue.ts           Product catalogue type + lookup helpers
  data/sampleProducts.ts Illustrative sample product dataset
  calculate.ts           validateEstimateRequest + calculateEstimate
  index.ts               Public barrel export
  *.test.ts              Vitest suites
```

Consume it through the barrel:

```ts
import { calculateEstimate } from './estimation';
```

## Units

Supported units and their families (`src/estimation/units.ts`):

| Unit    | Family   | Display |
| ------- | -------- | ------- |
| `bag`   | discrete | bag     |
| `piece` | discrete | piece   |
| `each`  | discrete | each    |
| `kg`    | mass     | kg      |
| `tonne` | mass     | tonne   |
| `m`     | length   | m       |
| `m2`    | area     | m²      |
| `m3`    | volume   | m³      |

Each product declares exactly one pricing unit. A line item **may** pass a `unit`, but only
to confirm the product's unit:

- same unit → accepted;
- different unit, same family (e.g. `kg` vs `tonne`) → `UNIT_CONVERSION_UNSUPPORTED`
  (conversion is intentionally not implemented yet);
- different family (e.g. `bag` vs `kg`) → `INCOMPATIBLE_UNIT`;
- not a supported unit → `INVALID_UNIT`.

Because pricing requires an exact unit match, no conversion factors are applied and no
silent unit assumptions are made.

## Validation

`validateEstimateRequest(request, catalogue?)` returns an array of
`EstimateValidationError` (`{ code, message, lineIndex?, productId? }`). Rules:

| Code                          | Raised when                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `EMPTY_REQUEST`               | `lines` is missing or empty                                        |
| `MISSING_PRODUCT`             | `productId` is not in the catalogue                                |
| `INVALID_QUANTITY`            | quantity is not a finite number, or is negative                    |
| `INVALID_UNIT`                | line `unit` is not a supported unit                                |
| `INCOMPATIBLE_UNIT`           | line `unit` and product unit are in different families             |
| `UNIT_CONVERSION_UNSUPPORTED` | line `unit` and product unit share a family but differ             |
| `INVALID_PRICE`               | product `unitPrice` is not a finite number `> 0`                   |
| `INVALID_PRICE_SOURCE`        | product is missing price-source metadata                           |
| `NON_FINITE_RESULT`           | a subtotal or total is not finite (defensive; also raised at calc) |

Quantity `0` is valid and produces a `0` subtotal. Quantity must be `>= 0`; unit price must
be `> 0`.

## Calculation

`calculateEstimate(request, catalogue?)` returns a discriminated union:

```ts
type EstimateCalculation =
  | { ok: true; result: EstimateResult }
  | { ok: false; errors: EstimateValidationError[] };
```

It validates first and returns `{ ok: false }` if anything fails; otherwise the result is:

```ts
interface EstimateResult {
  projectName?: string;
  currency: 'INR';
  itemCount: number;
  lineResults: LineCalculationResult[]; // one entry per accepted line
  subtotal: number;
  total: number;               // equals subtotal (no tax/discount applied yet)
  priceSources: PriceSource[]; // de-duplicated provenance for every line
}
```

Per line: `lineSubtotal = roundCurrency(quantity * unitPrice)`.

### Rounding policy

- Currency precision: **2 decimals** (paise), constant `CURRENCY_DECIMALS`.
- Half-up rounding via `roundCurrency` (`Math.round((value + Number.EPSILON) * 100) / 100`),
  which corrects common binary floating-point edge cases such as `1.005 → 1.01`.
- **Each line is rounded before summing**, then the sum is rounded again. This is
  deterministic and auditable, and can differ from rounding the raw sum (e.g. two lines of
  `0.005` round to `0.01` each, total `0.02`, whereas rounding the `0.01` raw sum gives
  `0.01`). Tests pin this behaviour.

## Sample data

`data/sampleProducts.ts` provides nine products across cement, steel, masonry, aggregates,
finishes and joinery. Every price carries a `PriceSource` with
`isIllustrative: true`, the label `Illustrative demo data — not a verified market price`
and a fixed `priceDate` of `2026-09-01`.

These figures are for demonstration only. They are **not** sourced from a live pricing API
or a verified vendor list, and must not be presented as real market rates. The catalogue is
swappable: pass any `createCatalogue(products)` result as the second argument to
`calculateEstimate` / `validateEstimateRequest`.

### Worked example

```ts
calculateEstimate({
  projectName: 'Demo villa',
  lines: [
    { productId: 'cement-opc-53-grade', quantity: 320 },
    { productId: 'steel-tmt-fe500', quantity: 4.5 },
    { productId: 'brick-red-clay', quantity: 12000 },
  ],
});
```

| Product    | Quantity | Unit price | Subtotal   |
| ---------- | -------- | ---------- | ---------- |
| Cement     | 320 bag  | ₹410       | ₹1,31,200  |
| Steel      | 4.5 t    | ₹68,000    | ₹3,06,000  |
| Bricks     | 12,000   | ₹9         | ₹1,08,000  |
| **Total**  |          |            | **₹5,45,200** |

## Frontend consumption (planned)

The Phase 01 New Estimate screen currently keeps a local draft and is **not** wired to this
engine yet. A later phase will map draft line items to `EstimateRequest`, call
`calculateEstimate`, and render `lineResults`, `total` and `priceSources` (with the
illustrative label surfaced via `DemoNotice`). Invalid lines map cleanly onto per-field
validation messages via `lineIndex` / `productId`.

## FastAPI integration contract (planned)

Phase 02 will move pricing behind a service. This module defines the shape to preserve:

- **Request** — `EstimateRequest` (`projectName?`, `lines[]` with `productId`, `quantity`,
  optional `unit`, optional `label`). Maps to a JSON body.
- **Success** — `{ ok: true, result: EstimateResult }`; the server should return the same
  fields (`currency`, `itemCount`, `lineResults`, `subtotal`, `total`, `priceSources`).
- **Failure** — `{ ok: false, errors: EstimateValidationError[] }`; reuse the same
  `EstimateErrorCode` values so client handling stays identical whether calculation runs
  locally or remotely.

The pure functions here can act as the reference implementation the server is tested against.

## Verification

```bash
npm run typecheck  # tsc -b (strict)
npm run lint       # eslint .
npm test           # vitest run  (money, units, calculation suites)
npm run build      # tsc -b && vite build
```

## Known limitations

- Single currency (INR); no tax, discount, contingency, labour or GST handling.
- No unit conversion (same-family conversions are rejected).
- No live pricing, no product ratings/specifications, no persistence.
- `total` currently equals `subtotal`.
- Sample prices are fabricated for demo purposes and pinned to a single date.
