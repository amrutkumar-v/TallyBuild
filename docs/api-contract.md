# API contract — TallyBuild AI

**Status:** implemented. The FastAPI service in `backend/` exposes the endpoints below and
the typed frontend client in `src/api/` consumes them from the New Estimate flow. Both
runtimes are pinned to the same golden fixture (`docs/fixtures/calculation-cases.json`).

The deterministic TypeScript estimation core in `src/estimation/` is the **source of truth**
for calculation behaviour. The backend reproduces it exactly and must not introduce new
calculation rules or error codes.

**Demo data only.** Every amount shown in the UI or returned by the API is **illustrative**
and is not verified customer, market or supplier data.

---

## 1. Scope

| Item          | Decision                                                          |
| ------------- | ----------------------------------------------------------------- |
| Architecture  | Frontend (React SPA) → REST/JSON → FastAPI (Python)               |
| API style     | REST, JSON, versioned path prefix `/api/v1`                       |
| Endpoints     | `GET /api/v1/health`, `POST /api/v1/estimates/calculate`          |
| Persistence   | None. The service is stateless.                                   |
| Auth          | None. Reserved for a later phase.                                 |
| Currencies    | `INR`, `USD`, `EUR`, `AED`                                        |
| Cost sections | `personnel`, `tooling`, `infrastructure`, `other`                 |

CORS allows the local Vite dev origins (`http://localhost:5173`, `http://127.0.0.1:5173`).
In development the Vite server also proxies `/api` to `http://localhost:8000`.

---

## 2. Conventions

- **Rounding.** Each line cost, each section subtotal and the grand total are rounded
  **half-up to 2 decimal places** (see `roundCurrency`). Rounding happens per line, then per
  section, then once more for the total — never on raw unrounded sums.
- **Validation order.** Currency first, then an empty-request check, then per-section,
  per-line field checks in the order described in §5. The first failing stage short-circuits
  where noted.
- **Project name.** Optional; trimmed, and treated as `null` when blank.
- **Unknown fields.** Ignored (`extra="ignore"`) on every request model.

---

## 3. `GET /api/v1/health`

Liveness/readiness probe. No auth, no parameters.

**200 OK**

```json
{
  "status": "ok",
  "service": "tallybuild-api",
  "version": "0.1.0",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "capabilities": {
    "currencies": ["INR", "USD", "EUR", "AED"],
    "categories": ["personnel", "tooling", "infrastructure", "other"]
  }
}
```

The frontend uses `capabilities.currencies` / `capabilities.categories` to populate the
currency selector and to confirm the service is online. When the request fails the app shows
a labelled offline state and disables calculation.

---

## 4. `POST /api/v1/estimates/calculate`

Deterministic estimate over four independent cost sections. Sections are optional and
default to empty lists.

### Request

```json
{
  "projectName": "Platform rebuild",
  "currency": "EUR",
  "personnel": [{ "role": "Lead engineer", "people": 2, "hours": 120, "hourlyRate": 75 }],
  "tooling": [{ "name": "Design suite", "amount": 1200 }],
  "infrastructure": [{ "name": "Cloud hosting", "monthlyCost": 900, "months": 6 }],
  "other": [{ "description": "Licence transfer", "amount": 500 }]
}
```

| Field            | Type              | Notes                                                    |
| ---------------- | ----------------- | -------------------------------------------------------- |
| `projectName`    | `string \| null`  | Optional; trimmed; blank → `null`.                       |
| `currency`       | `string`          | Required. Must be one of the supported currencies.       |
| `personnel[]`    | `PersonnelLine[]` | `role: string`, `people`, `hours`, `hourlyRate: number`. |
| `tooling[]`      | `ToolingLine[]`   | `name: string`, `amount: number`.                        |
| `infrastructure[]` | `InfrastructureLine[]` | `name: string`, `monthlyCost`, `months: number`. |
| `other[]`        | `OtherCostLine[]` | `description: string`, `amount: number`.                 |

**Cost formulas.** Personnel = `people × hours × hourlyRate`. Infrastructure =
`monthlyCost × months`. Tooling and other = the given `amount`.

### Response

**200 OK** — mirrors the request with per-line `cost` values added, per-section `subtotal`s,
per-section totals and the overall total.

```json
{
  "projectName": "Platform rebuild",
  "currency": "EUR",
  "personnel": {
    "lines": [
      { "role": "Lead engineer", "people": 2, "hours": 120, "hourlyRate": 75, "cost": 18000 }
    ],
    "subtotal": 18000
  },
  "tooling": {
    "lines": [{ "name": "Design suite", "amount": 1200, "cost": 1200 }],
    "subtotal": 1200
  },
  "infrastructure": {
    "lines": [{ "name": "Cloud hosting", "monthlyCost": 900, "months": 6, "cost": 5400 }],
    "subtotal": 5400
  },
  "other": {
    "lines": [{ "description": "Licence transfer", "amount": 500, "cost": 500 }],
    "subtotal": 500
  },
  "personnelCost": 18000,
  "toolingCost": 1200,
  "infrastructureCost": 5400,
  "otherCost": 500,
  "lineCount": 4,
  "total": 25100,
  "assumptions": [
    "All amounts are calculated in EUR. Live currency conversion is not configured, so each estimate stays in the currency you choose.",
    "Personnel cost = people × hours × hourly rate per team line.",
    "Infrastructure cost = monthly cost × months per resource line.",
    "Excludes taxes, duties and contingency unless you add them as an \"other\" cost line."
  ]
}
```

### Errors

Validation failures return **422 Unprocessable Entity** with the shared error envelope (§5).
The response has no partial result.

---

## 5. Error envelope

All handled errors share one shape:

```json
{
  "error": {
    "code": "INVALID_PERSONNEL",
    "message": "Personnel line 1: role is required.",
    "details": [
      {
        "code": "INVALID_PERSONNEL",
        "message": "Personnel line 1: role is required.",
        "section": "personnel",
        "lineIndex": 0
      }
    ]
  }
}
```

- `error.code` — the first error's code.
- `error.message` — the first error's message.
- `error.details[]` — every validation issue, in the order produced. Each entry has
  `code`, `message` and, where relevant, `section` (`personnel | tooling | infrastructure |
  other`) and `lineIndex` (**0-based**).

### Error codes

| Code                   | Raised when                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `UNSUPPORTED_CURRENCY` | `currency` is missing or not in the supported set.                  |
| `EMPTY_REQUEST`        | All four sections are empty. Returned on its own (short-circuits).  |
| `INVALID_PERSONNEL`    | A personnel line has a blank `role` or a non-finite/negative number. |
| `INVALID_TOOLING`      | A tooling line has a blank `name` or a non-finite/negative `amount`. |
| `INVALID_INFRASTRUCTURE` | An infrastructure line has a blank `name` or a non-finite/negative `monthlyCost` / `months`. |
| `INVALID_OTHER`        | An other-cost line has a blank `description` or a non-finite/negative `amount`. |
| `NON_FINITE_RESULT`    | A line cost or the grand total is not a finite number.              |

Numeric fields must be **finite and ≥ 0**. Text fields must be non-empty after trimming.

---

## 6. Source of truth

- **Types:** `src/estimation/types.ts` (request, result, error, section types).
- **Behaviour:** `src/estimation/calculate.ts` (`validateEstimateRequest`,
  `calculateEstimate`) and `src/estimation/money.ts` (`roundCurrency`).
- **Backend mirror:** `backend/app/estimation/` and `backend/app/schemas.py` — same codes,
  messages, validation order and rounding.
- **Golden fixture:** `docs/fixtures/calculation-cases.json`, exercised by both
  `src/estimation/*.test.ts` and `backend/tests/test_shared_fixture.py`.
