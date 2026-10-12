# TallyBuild AI Estimation API

A small, dependency-light FastAPI service that reproduces the deterministic estimation core
(`src/estimation/`) over HTTP. It exposes two endpoints and stores nothing. Inputs are
project-cost sections (personnel, tooling, infrastructure, other); all figures are
illustrative demo data.

## Endpoints

| Method | Path                          | Purpose                                                         |
| ------ | ----------------------------- | ---------------------------------------------------------------- |
| `GET`  | `/api/v1/health`              | Liveness/readiness probe with supported currencies and sections  |
| `POST` | `/api/v1/estimates/calculate` | Deterministic estimate for personnel/tooling/infrastructure/other cost lines |

### `POST /api/v1/estimates/calculate`

Request body mirrors `ProjectEstimateRequest` in `src/estimation/types.ts`:

```json
{
  "projectName": "Platform build",
  "currency": "EUR",
  "personnel": [{ "role": "Lead", "people": 1, "hours": 200, "hourlyRate": 80 }],
  "tooling": [{ "name": "Design suite", "amount": 1200 }],
  "infrastructure": [{ "name": "Cloud", "monthlyCost": 900, "months": 6 }],
  "other": [{ "description": "Licence transfer", "amount": 500 }]
}
```

Response mirrors `ProjectEstimateResult` with per-section `lines` + `subtotal`,
per-section totals and an overall rounded `total`. Validation failures return the shared
error envelope with per-line `details[{ code, message, section?, lineIndex? }]`.

## Requirements

- Python 3.12+

## Setup

```bash
cd backend
python -m venv .venv
# Windows (PowerShell)
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
# macOS / Linux
# .venv/bin/python -m pip install -r requirements-dev.txt
```

## Run

```bash
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- API base: `http://localhost:8000/api/v1`
- Interactive docs: `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

The dev server allows CORS from `http://localhost:5173` and `http://127.0.0.1:5173`
(the Vite dev server). No authentication is required.

The frontend consumes this service from the New Estimate flow. In development the Vite dev
server proxies `/api` to `http://localhost:8000`, so start this service alongside `npm run
dev`. If the service is stopped the app shows an offline demo catalogue instead of failing.

## Test and lint

```bash
cd backend
.venv\Scripts\python.exe -m pytest
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m ruff format --check .
```

## Layout

```
backend/
  app/
    main.py          FastAPI app factory
    config.py        Service constants and CORS origins
    schemas.py       Pydantic request/response models (single source of wire shapes)
    errors.py        Error envelope, ApiError and exception handlers
    routers/         health and estimates endpoints
    estimation/      Pure deterministic core (money, calculate)
  tests/             pytest suite (health, calculate, rounding, shared fixtures)
  requirements.txt       Runtime dependencies
  requirements-dev.txt   Runtime + test/lint dependencies
  pyproject.toml         pytest and ruff configuration
```

## Parity with the frontend core

`app/estimation/` mirrors `src/estimation/` exactly — the same validation order, error
codes and messages, and the same half-up rounding expression. Both runtimes are pinned to
`docs/fixtures/calculation-cases.json` via the shared-fixture test suites. The TypeScript
core remains the source of truth; do not introduce new calculation rules or error codes
here.

## Not implemented

- No persistence, database or authentication (deferred to Phase 04).
- No AI or pricing service; `/estimates/calculate` is purely deterministic.
- No production hosting or extra CORS origins beyond the local Vite dev server.