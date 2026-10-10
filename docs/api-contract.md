# API Contract — TallyBuild AI

**Status:** Phase 02B planning document. **Nothing in this document is implemented yet.**
There is currently no backend in this repository. This contract describes the API that the
FastAPI backend (Phase 02) is expected to expose and the frontend is expected to consume.

The deterministic TypeScript estimation core in `src/estimation/` is the **source of truth**
for calculation behaviour. The backend must reproduce it exactly; it must not introduce new
calculation rules or error codes. See [§4 Source of truth](#4-source-of-truth--estimation-core).

> **Demo data.** All product prices in this contract are **illustrative** and carry an
> explicit `priceSource.isIllustrative = true` flag. They are not verified market prices and
> must never be presented as such. See `src/estimation/data/sampleProducts.ts`.

---

## 1. Scope

| Item | Decision |
| ---- | -------- |
| Architecture | Frontend (React SPA) → REST/JSON → FastAPI (Python) |
| API style | REST, JSON, versioned path prefix `/api/v1` |
| MVP endpoints | `GET /api/v1/health`, `GET /api/v1/products`, `POST /api/v1/estimates/calculate` |
| Deferred (not MVP) | Saving/listing/retrieving estimates (needs persistence design, Phase 04) |
| Authentication | None for MVP. Reserved for Phase 04. |
| Database | None for MVP. |
| AI/service integration | Out of scope here. The calculate endpoint is deterministic. |

**Non-goals for this phase:** writing backend code, wiring the UI to an API, adding
dependencies, or changing estimation behaviour.

---

## 2. Conventions

- **Base path:** `/api/v1`
- **Content type:** `application/json; charset=utf-8` on every request and response body.
  UTF-8 matters because labels and messages contain characters such as `₹`, `×`, `—`, `→`.
- **Versioning:** the major version is the path segment (`v1`). Backwards-incompatible
  changes require `/api/v2`. Additive, optional fields may be added to responses within
  `v1`; clients must ignore unknown fields.
- **Currency:** INR only. Amounts are JSON numbers in **rupees**, rounded to **2 decimals**
  (paise). The backend must not emit currency symbols inside JSON values; symbol/locale
  formatting is a frontend concern (`Intl.NumberFormat('en-IN', …)` in `src/utils/format.ts`).
- **Units:** the canonical unit enum is fixed and matches the core (see §4.1).
- **Timestamps:** ISO 8601 UTC for instants (`generatedAt`, `createdAt`). `priceDate` is a
  calendar date `YYYY-MM-DD`.
- **CORS (dev):** the frontend dev server runs on `http://localhost:5173` and the API on
  `http://localhost:8000`. The backend must allow that origin in development. Production
  origins are TBD.
- **Auth header:** none in MVP. When Phase 04 adds auth, expect
  `Authorization: Bearer <token>`; endpoints may then return `401`/`403`.

---

## 3. Developer setup (proposed, not applied)

The frontend currently makes **no** network calls. When integration begins we propose a Vite
dev proxy so the app can call same-origin `/api`:

```ts
// vite.config.ts — PROPOSED, do not apply in this phase
server: {
  proxy: { '/api': 'http://localhost:8000' },
}
```

Do not implement this until the backend exists. Until then the app must keep working fully
offline (see the integration plan).

---

## 4. Source of truth — estimation core

The backend must mirror `src/estimation/` exactly. Summary:

### 4.1 Units and families

| Unit | Family | Display |
| ---- | ------ | ------- |
| `bag`, `piece`, `each` | `discrete` | bag / piece / each |
| `kg`, `tonne` | `mass` | kg / tonne |
| `m` | `length` | m |
| `m2` | `area` | m² |
| `m3` | `volume` | m³ |

Each product declares exactly one canonical pricing unit. A line may pass `unit`, but pricing
requires an **exact unit match**; the engine applies **no conversion factors**:

- line unit equals product unit → accepted;
- different unit, **same family** (e.g. `kg` vs `tonne`) → `UNIT_CONVERSION_UNSUPPORTED`;
- different family (e.g. `bag` vs `kg`) → `INCOMPATIBLE_UNIT`;
- not in the enum → `INVALID_UNIT`.

### 4.2 Products

A product (`MaterialProduct` in `src/estimation/types.ts`) has: `id`, `name`, `category`,
`unit`, `unitPrice` (> 0), and `priceSource`:

```ts
interface PriceSource {
  label: string;          // e.g. "Illustrative demo data — not a verified market price"
  priceDate: string;      // "YYYY-MM-DD"
  currency: 'INR';
  isIllustrative: true;   // literal type — never false in this project
}
```

### 4.3 Validation rules

- `lines` must be a non-empty array → otherwise `EMPTY_REQUEST`.
- Per line: unknown `productId` → `MISSING_PRODUCT`.
- `quantity` must be a finite number and `>= 0` → otherwise `INVALID_QUANTITY`.
  (`0` is valid and yields a `0` subtotal; negative quantity is rejected.)
- `unit` (if present) validated as in §4.1.
- product `unitPrice` must be finite and `> 0` → otherwise `INVALID_PRICE`.
- `priceSource` must be present and well-formed → otherwise `INVALID_PRICE_SOURCE`.
- If a subtotal or total is not finite → `NON_FINITE_RESULT`.

Error object shape (core `EstimateValidationError`):

```ts
interface EstimateValidationError {
  code: EstimateErrorCode;
  message: string;
  lineIndex?: number;   // 0-based index into request.lines
  productId?: string;
}
```

**Error codes (do not rename or add):** `EMPTY_REQUEST`, `MISSING_PRODUCT`,
`INVALID_QUANTITY`, `INVALID_UNIT`, `INCOMPATIBLE_UNIT`, `UNIT_CONVERSION_UNSUPPORTED`,
`INVALID_PRICE`, `INVALID_PRICE_SOURCE`, `NON_FINITE_RESULT`.

Validation collects **all** failing lines (not just the first). Within a single line, an
unknown product short-circuits that line's other checks.

### 4.4 Rounding and totals (must match exactly)

- Currency precision: 2 decimals (paise). Constant `CURRENCY_DECIMALS = 2`.
- Rounding is **half-up** and is applied **per line**, then the sum is rounded again.
- TS reference (`src/estimation/money.ts`):

  ```ts
  Math.round((value + Number.EPSILON) * 100) / 100
  ```

- Python reference (must be used, not `round()`, which is banker's rounding):

  ```python
  import math, sys
  def round_currency(value: float) -> float:
      return math.floor((value + sys.float_info.epsilon) * 100 + 0.5) / 100
  ```

  For non-negative `value`, `math.floor(x + 0.5) == math.round(x)`, so this reproduces the
  TypeScript result bit-for-bit on IEEE-754 doubles.

- `lineSubtotal = roundCurrency(quantity * unitPrice)`.
- `subtotal = roundCurrency(sum(line.lineSubtotal))`; `total = subtotal` (no tax/discount yet).

> Parity note: both runtimes use IEEE-754 binary64. Using the **same expression** is what
> preserves identical output. Do not substitute `Decimal`/`ROUND_HALF_UP` unless the
> frontend core is changed in lockstep — mixed strategies can disagree on values whose
> binary representation sits below a midpoint (e.g. `8.575`). See §9.

---

## 5. Endpoints

Legend: **MVP** = required for the hackathon MVP; **Deferred** = not required now.

### 5.1 `GET /api/v1/health` — MVP

**Purpose:** liveness/readiness probe; lets the frontend show an honest "backend
unavailable" state and gate the "Calculate" action.

**Auth:** none.

**Request:** no body, no query parameters.

**200 response:**

```json
{
  "status": "ok",
  "service": "tallybuild-api",
  "version": "0.1.0",
  "timestamp": "2026-10-10T09:00:00.000Z",
  "catalogue": { "products": 9, "currency": "INR" }
}
```

| Field | Type | Notes |
| ----- | ---- | ----- |
| `status` | `"ok"` | literal; add `"degraded"` only if a real dependency exists |
| `service` | string | stable service id |
| `version` | string | API/service semantic version |
| `timestamp` | string | ISO 8601 UTC |
| `catalogue.products` | integer | number of priced products available |
| `catalogue.currency` | `"INR"` | fixed |

**Error:** `503` if the service is not ready (envelope in §6).

---

### 5.2 `GET /api/v1/products` — MVP

**Purpose:** the product catalogue that drives the quantity/material input rows and the
product picker. This is the priced dataset the calculate endpoint resolves `productId`
against.

**Auth:** none.

**Query parameters (all optional, for MVP keep the response full/unpaginated):**

| Param | Type | Notes |
| ----- | ---- | ----- |
| `category` | string | exact match filter |
| `search` | string | case-insensitive substring on `name`/`id` |
| `unit` | string | filter by canonical unit enum |

**200 response:**

```json
{
  "count": 3,
  "products": [
    {
      "id": "cement-opc-53-grade",
      "name": "OPC 53 Grade Cement",
      "category": "Cement",
      "unit": "bag",
      "unitPrice": 410,
      "priceSource": {
        "label": "Illustrative demo data — not a verified market price",
        "priceDate": "2026-09-01",
        "currency": "INR",
        "isIllustrative": true
      }
    },
    {
      "id": "steel-tmt-fe500",
      "name": "TMT Steel Bar Fe500",
      "category": "Steel",
      "unit": "tonne",
      "unitPrice": 68000,
      "priceSource": {
        "label": "Illustrative demo data — not a verified market price",
        "priceDate": "2026-09-01",
        "currency": "INR",
        "isIllustrative": true
      }
    },
    {
      "id": "brick-red-clay",
      "name": "Red Clay Brick",
      "category": "Masonry",
      "unit": "piece",
      "unitPrice": 9,
      "priceSource": {
        "label": "Illustrative demo data — not a verified market price",
        "priceDate": "2026-09-01",
        "currency": "INR",
        "isIllustrative": true
      }
    }
  ]
}
```

**Validation:** filters are optional; unknown filters return an **empty** `products` array
(not a 404) with `count: 0`.

**Empty-catalogue behaviour:** if no products are configured, return
`{ "count": 0, "products": [] }` with **200**. The frontend must render an empty state and
disable calculation rather than inventing products.

**Error:** `400` for a malformed `unit` value in the query (envelope in §6). (Alternatively
the backend may treat it as an empty result — decide and keep it consistent.)

**Single source of truth (open question):** the backend should own the catalogue and the
frontend should fetch it. The frontend's current hard-coded `SAMPLE_PRODUCT_CATALOGUE`
becomes a fallback/demo fixture only. See §10.

---

### 5.3 `POST /api/v1/estimates/calculate` — MVP

**Purpose:** run the deterministic estimate for a set of line items. **Pure** — computes and
returns; stores nothing.

**Auth:** none.

**Request body:**

```json
{
  "projectName": "Demo villa",
  "lines": [
    { "productId": "cement-opc-53-grade", "quantity": 320, "unit": "bag", "label": "Foundation" },
    { "productId": "steel-tmt-fe500", "quantity": 4.5, "unit": "tonne", "label": "Reinforcement" },
    { "productId": "brick-red-clay", "quantity": 12000, "unit": "piece" }
  ]
}
```

Schema (reuses the core `EstimateRequest`):

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |
| `projectName` | string | no | echoed back; trimmed; max 120 chars recommended |
| `lines` | array | yes | min length 1 |
| `lines[].productId` | string | yes | must resolve in the catalogue |
| `lines[].quantity` | number | yes | finite, `>= 0` |
| `lines[].unit` | enum | no | must equal the product's canonical unit if provided |
| `lines[].label` | string | no | display hint; echoed back |

**200 response** (body is the core `EstimateResult`; the HTTP status conveys success):

```json
{
  "projectName": "Demo villa",
  "currency": "INR",
  "itemCount": 3,
  "lineResults": [
    {
      "productId": "cement-opc-53-grade",
      "productName": "OPC 53 Grade Cement",
      "category": "Cement",
      "unit": "bag",
      "quantity": 320,
      "unitPrice": 410,
      "lineSubtotal": 131200,
      "label": "Foundation",
      "priceSource": {
        "label": "Illustrative demo data — not a verified market price",
        "priceDate": "2026-09-01",
        "currency": "INR",
        "isIllustrative": true
      }
    },
    {
      "productId": "steel-tmt-fe500",
      "productName": "TMT Steel Bar Fe500",
      "category": "Steel",
      "unit": "tonne",
      "quantity": 4.5,
      "unitPrice": 68000,
      "lineSubtotal": 306000,
      "label": "Reinforcement",
      "priceSource": {
        "label": "Illustrative demo data — not a verified market price",
        "priceDate": "2026-09-01",
        "currency": "INR",
        "isIllustrative": true
      }
    },
    {
      "productId": "brick-red-clay",
      "productName": "Red Clay Brick",
      "category": "Masonry",
      "unit": "piece",
      "quantity": 12000,
      "unitPrice": 9,
      "lineSubtotal": 108000,
      "priceSource": {
        "label": "Illustrative demo data — not a verified market price",
        "priceDate": "2026-09-01",
        "currency": "INR",
        "isIllustrative": true
      }
    }
  ],
  "subtotal": 545200,
  "total": 545200,
  "priceSources": [
    {
      "label": "Illustrative demo data — not a verified market price",
      "priceDate": "2026-09-01",
      "currency": "INR",
      "isIllustrative": true
    }
  ]
}
```

**Validation errors → `422`** with the envelope (§6). The `details` array carries the core
`EstimateValidationError` objects. Example (two failing lines):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Estimate request failed validation.",
    "details": [
      { "code": "MISSING_PRODUCT", "message": "Line 1: product \"gypsum-board\" is not in the catalogue.", "lineIndex": 0, "productId": "gypsum-board" },
      { "code": "INVALID_QUANTITY", "message": "Line 2: quantity must not be negative.", "lineIndex": 1, "productId": "cement-opc-53-grade" }
    ]
  }
}
```

Unit error examples:

```json
{ "code": "UNIT_CONVERSION_UNSUPPORTED", "message": "Line 1: unit \"kg\" is compatible with \"tonne\" but unit conversion is not supported yet.", "lineIndex": 0, "productId": "steel-tmt-fe500" }
```
```json
{ "code": "INCOMPATIBLE_UNIT", "message": "Line 1: unit \"kg\" is incompatible with \"bag\".", "lineIndex": 0, "productId": "cement-opc-53-grade" }
```
```json
{ "code": "INVALID_UNIT", "message": "Line 1: unit \"litre\" is not supported.", "lineIndex": 0, "productId": "cement-opc-53-grade" }
```

**Malformed JSON / wrong types → `400`** with `code: "REQUEST_MALFORMED"`.

**Non-finite result (numeric overflow) → `500`** with `code: "CALCULATION_ERROR"` and the
core code `NON_FINITE_RESULT` in `details`. Under validated inputs this is not expected.

**Idempotency:** the endpoint is pure and side-effect free; repeated identical requests yield
identical responses.

---

## 6. Error envelope

All non-2xx responses use one envelope:

```ts
interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: EstimateValidationError[];
  };
}
```

`ApiErrorCode` (transport/envelope layer — **new**, API-only):

| Code | HTTP | Meaning |
| ---- | ---- | ------- |
| `REQUEST_MALFORMED` | 400 | Body is not valid JSON or violates the JSON schema (wrong types, unknown-required). |
| `VALIDATION_ERROR` | 422 | Body is well-formed but fails business rules. `details[]` carries the core error codes. |
| `PRODUCT_NOT_FOUND` | 404 | A specific product id was requested and does not exist (only if such an endpoint is added). |
| `ESTIMATE_NOT_FOUND` | 404 | Deferred persistence endpoint: id not found. |
| `CALCULATION_ERROR` | 500 | Calculation could not produce a finite result (`NON_FINITE_RESULT`). |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |
| `SERVICE_UNAVAILABLE` | 503 | Service not ready (e.g. health check failing). |

**Important:** `code: VALIDATION_ERROR` is the *envelope* code; the domain codes
(`MISSING_PRODUCT`, `INVALID_QUANTITY`, …) live inside `details[].code` and must be preserved
verbatim from the core. Do not invent new domain codes.

`field` may be added to each `details[]` entry as an **optional, additive** hint pointing at
the offending request path (e.g. `"lines[1].quantity"`) to simplify form mapping. It is not
part of the core type and must remain optional.

---

## 7. Deferred endpoints (persistence — NOT MVP)

These are documented for completeness only. The repository has **no** persistence and Phase 04
owns the storage design (Supabase). Do **not** implement these in Phase 02. Any adoption
requires explicit agreement (see §10) and a storage/auth design.

Provisional shapes (subject to change):

- `POST /api/v1/estimates` — save an estimate. Body: project metadata (from the New Estimate
  form: `projectName`, `location`, `projectType`, `notes`) plus `lines` and/or a calculated
  `result`. Returns `201` with a saved-estimate resource including a server `id`.
- `GET /api/v1/estimates` — list saved estimates (filter by `status`, `projectType`).
- `GET /api/v1/estimates/{estimate_id}` — retrieve one saved estimate; `404`
  `ESTIMATE_NOT_FOUND` if absent.

Reserved saved-estimate resource (aligns with the existing `Estimate` type in
`src/types/index.ts`):

```ts
interface SavedEstimate {
  id: string;
  projectName: string;
  location: string;
  projectType: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  createdAt: string;              // ISO 8601 UTC
  status: 'draft' | 'in-review' | 'approved';
  estimatedAmount: number | null; // null until calculated
  notes?: string;
  lines?: EstimateLineItem[];
  result?: EstimateResult;
}
```

Until these exist, the frontend keeps its current browser-only (`localStorage`) drafts.

---

## 8. Frontend integration types (proposed)

### 8.1 Reuse from the existing core (already implemented)

Import from `src/estimation`:

- `CurrencyCode`, `PriceSource`, `MaterialProduct`
- `MeasurementUnit`
- `EstimateLineItem`, `EstimateRequest`
- `LineCalculationResult`, `EstimateResult`
- `EstimateErrorCode`, `EstimateValidationError`, `EstimateCalculation`

Existing non-core types in `src/types/index.ts`: `Estimate`, `EstimateStatus`, `ProjectType`,
`EstimateOrigin`, `NewEstimateFormValues`, `NewEstimateFormErrors`, `EstimateDraftInput`.

### 8.2 Proposed new API types (to live in `src/api/types.ts` when integration starts)

```ts
import type {
  EstimateRequest,
  EstimateResult,
  EstimateValidationError,
} from '../estimation';

// Envelope / transport codes (API layer only)
export type ApiErrorCode =
  | 'REQUEST_MALFORMED'
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'ESTIMATE_NOT_FOUND'
  | 'CALCULATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'; // client-side only: fetch failed / offline / timeout

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: EstimateValidationError[];
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  catalogue: { products: number; currency: 'INR' };
}

export interface ProductListResponse {
  count: number;
  products: MaterialProduct[]; // imported from ../estimation
}

// Calculate: request reuses the core type; success body is the core result.
export type CalculateEstimateRequest = EstimateRequest;
export type CalculateEstimateResponse = EstimateResult;

// Client-side result wrapper produced by the API client.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string; status: number | null; details?: EstimateValidationError[] } };
```

A thin client function would return `EstimateCalculation`-compatible output:

```ts
// proposed, not implemented
async function calculateEstimateViaApi(
  request: CalculateEstimateRequest,
): Promise<EstimateCalculation> // { ok:true, result } | { ok:false, errors }
```

so existing UI code that already understands `EstimateCalculation` can consume it unchanged.

### 8.3 Classification

| Type | Status |
| ---- | ------ |
| `MaterialProduct`, `PriceSource`, `EstimateRequest`, `EstimateResult`, `EstimateValidationError`, `EstimateCalculation`, `MeasurementUnit`, `EstimateErrorCode` | **Existing (implemented)** in `src/estimation/` |
| `Estimate`, `EstimateStatus`, `ProjectType`, form types | **Existing (implemented)** in `src/types/` |
| `ApiErrorCode`, `ApiErrorResponse`, `HealthResponse`, `ProductListResponse`, `ApiResult<T>`, `CalculateEstimateRequest`, `CalculateEstimateResponse` | **Proposed** (do not create until integration starts) |
| `SavedEstimate`, persistence endpoints | **Proposed / deferred (Phase 04)** |
| Line-item input UI, API client, result UI | **Not implemented** — Phase 02C |

---

## 9. TypeScript ↔ Python parity

Risk: the two runtimes could diverge. Mitigations:

1. **Same formula** for rounding (§4.4). Never use Python `round()` (banker's rounding).
2. **Same validation order and codes** (§4.3). Aggregate all errors; unknown product
   short-circuits only its own line.
3. **Same unit family map** (§4.1).
4. **Shared golden fixtures.** Both test suites must pass the identical cases below. Store
   them once (e.g. `docs/fixtures/calculation-cases.json`) and load from both sides.

### 9.1 Shared golden test cases

Catalogue fixture = the 9 sample products with integer prices. "custom" fixtures add
fractional-price products only for rounding checks.

| # | Input (lines) | Expected outcome |
| - | ------------- | ---------------- |
| 1 | cement 320 bag; steel 4.5 tonne; brick 12000 piece | `ok`; subtotals 131200 / 306000 / 108000; `total` 545200 |
| 2 | brick 0 piece | `ok`; subtotal 0; `total` 0 |
| 3 | cement 2.5 bag | `ok`; subtotal 1025 |
| 4 | brick −5 piece | `ok:false`; `INVALID_QUANTITY` lineIndex 0 |
| 5 | brick quantity `NaN`/`Infinity` | `ok:false`; `INVALID_QUANTITY` |
| 6 | productId `"does-not-exist"` | `ok:false`; `MISSING_PRODUCT` |
| 7 | cement unit `"kg"` | `ok:false`; `INCOMPATIBLE_UNIT` |
| 8 | steel unit `"kg"` | `ok:false`; `UNIT_CONVERSION_UNSUPPORTED` |
| 9 | cement unit `"litre"` | `ok:false`; `INVALID_UNIT` |
| 10 | `lines: []` | `ok:false`; `EMPTY_REQUEST` |
| 11 | custom price 0.005 × qty 1, twice | `ok`; subtotals 0.01 / 0.01; `total` 0.02 |
| 12 | custom price 0.004 × qty 1 | `ok`; subtotal 0; `total` 0 |
| 13 | custom price 33.333 (unit `m`) × qty 3 | `ok`; subtotal 100; `total` 100 |
| 14 | custom price 0 | `ok:false`; `INVALID_PRICE` |
| 15 | multi-line (line 0 bad product, line 1 negative qty) | `ok:false`; errors length 2, codes `MISSING_PRODUCT`, `INVALID_QUANTITY` |

Values `0.005`, `0.004`, `33.333`, `1.005`, `2.675` and their expected rounding results are
already pinned in `src/estimation/money.test.ts` and `calculate.test.ts`; the Python port
must reproduce them.

> Known limitation (accepted): the `+ Number.EPSILON` trick guarantees half-up only for
> values within ~1 ULP of a midpoint. At larger magnitudes a stored value just below a
> midpoint (e.g. `8.575`) rounds down. This is inherent to binary floats and must be
> mirrored identically by Python — do not "fix" it on one side only. All sample prices are
> integers, so this never arises with the shipped catalogue.

---

## 10. Decisions requiring backend-teammate agreement

1. **Catalogue ownership.** Backend serves `GET /products` as the single source of truth and
   the frontend replaces `SAMPLE_PRODUCT_CATALOGUE`. (Recommended.)
2. **Transport vs domain error codes.** Adopt the envelope in §6 (`VALIDATION_ERROR`
   envelope; core codes preserved in `details[]`). Or an alternative: return the core union
   shape directly with HTTP 200. We recommend status-code-based envelopes.
3. **Validation→HTTP mapping** (§5.3, §6): 400 malformed, 422 domain, 500 calculation.
4. **Rounding implementation** (§4.4): adopt the shared `round_currency` expression.
5. **Shared golden fixtures** location and format (§9.1) so CI on both sides runs them.
6. **Persistence scope** (§7): confirm `POST/GET /estimates` stay deferred to Phase 04.
7. **CORS/dev origin** (§2) and the proposed Vite proxy (§3).
8. **AI features**: confirm they are out of scope for this deterministic endpoint.

---

## 11. Non-goals

- No backend, database, auth, secrets or deployment config is added by this phase.
- The frontend is not connected to any API in this phase.
- No new calculation rules, error codes or unit conversions are introduced.
- No fabricated success responses or silent fallbacks to invented estimates.
