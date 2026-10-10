# TallyBuild AI

**Building-product cost estimation for construction projects.**

TallyBuild AI is a hackathon project for **KLE TECH HACKFEST 2026, Domain 4C — AI for Cost
Estimation of Building Products**. The product vision is a construction-tech workspace where
estimators can create project estimates, compare building-product alternatives and run
what-if scenario analysis on quantities and material prices.

This repository currently contains **Phase 00 (project foundation), Phase 01 (premium UI
shell and dashboard) and Phase 02 (deterministic estimation)**: a React SPA, a pure
TypeScript estimation core in `src/estimation/`, an API contract in `docs/api-contract.md`,
a FastAPI service in `backend/` that reproduces the core over HTTP, and a typed frontend API
client (`src/api/`) that **wires the New Estimate flow to that service**. When the service
is unreachable the app stays usable and shows a clearly labelled offline demo catalogue
instead of fabricating prices. There is no database, no authentication and no AI or pricing
service yet. Every number shown in the interface and returned by the API is **illustrative
demo data**, not real customer, market or supplier data.

## Technology stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | React 19 + TypeScript (strict mode)                       |
| Build tool | Vite 8                                                    |
| Styling    | Plain CSS with design tokens + CSS Modules                 |
| Icons      | `lucide-react`                                            |
| Routing    | `react-router-dom` (client-side routes)                   |
| Linting    | ESLint 10 + `typescript-eslint` + React Hooks rules       |
| API (opt.) | FastAPI + Pydantic + uvicorn (Python) in `backend/`       |

The FastAPI service is standalone and optional at build time: the browser app calls it only
through the New Estimate flow and stays fully usable when it is not running. No database,
authentication, AI API, paid service or deployment configuration is included at this stage.

## Getting started

### Prerequisites

- Node.js 20.19+ or 22.12+ (Node 24 recommended)
- npm 10+

### Setup

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` (Vite prints the exact URL).

### Available scripts

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start the Vite development server with hot module reload  |
| `npm run typecheck` | Run the TypeScript compiler in build-check mode (no emit) |
| `npm run lint`      | Run ESLint across the project                             |
| `npm test`          | Run the Vitest unit-test suites once                      |
| `npm run test:watch`| Run Vitest in watch mode during development               |
| `npm run build`     | Type-check, then produce an optimized production build    |
| `npm run preview`   | Serve the production build locally for smoke testing      |

### Backend (optional, used by the New Estimate flow)

The FastAPI service in `backend/` prices the material lines submitted from the New Estimate
screen. It is optional: with it stopped, the app still loads and shows an honest "offline
demo catalogue" state. See [`backend/README.md`](./backend/README.md) for details.

```bash
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

| Command | What it does |
| ------- | ------------ |
| `python -m pytest` | Run the backend test suite |
| `python -m ruff check .` | Lint the backend |
| `python -m ruff format --check .` | Check backend formatting |

### Running the frontend and backend together

1. Start the backend on port `8000` (command above).
2. In a second terminal, start the frontend: `npm run dev` (`http://localhost:5173`).

In development the Vite dev server proxies `/api` to `http://localhost:8000` (see
`server.proxy` in `vite.config.ts`), so the browser issues same-origin requests to
`/api/v1/*`. To point the frontend at a different API host, set `VITE_API_BASE_URL`
(see `.env.example`); leave it unset to use the proxy.

Production deployment of the API (hosting, CORS origins, environment) is **not configured
yet** — only the local development flow is wired. The backend CORS allowlist currently
covers the local Vite origins only.

## Project structure

```
src/
  api/             Typed estimation-API client (fetch wrapper, endpoints, error mapping)
  components/
    layout/        App shell: sidebar, top bar, shell frame
    ui/            Reusable primitives: buttons, badges, cards, fields, empty states
    dashboard/     Dashboard-only sections (summary grid, recent estimates, explainer)
    estimates/     Estimates toolbar/table + New Estimate line-items and result views
  constants/       Navigation items, labels and page titles
  data/            Sample (demo) estimates, clearly flagged as illustrative
  estimation/      Deterministic cost-calculation core (units, rounding, catalogue)
  pages/           Route-level screens
  store/           Client-side estimates context backed by localStorage
  styles/          Global tokens and base styles
  types/           Shared TypeScript types
  utils/           Formatting and small helpers

backend/                    FastAPI estimation service (optional, called by the UI)
  app/
    routers/       HTTP endpoints (health, products, estimates)
    estimation/    Python port of the deterministic core
  tests/           pytest suite
```

## Design system

`src/styles/tokens.css` is the single source of truth for:

- **Colour** — deep charcoal/navy shell (`--color-shell`), warm amber accent
  (`--color-accent`), light neutral surfaces (`--color-canvas`, `--color-surface`) and
  semantic status colours.
- **Typography** — a system font stack, a modular size scale and weight tokens.
- **Spacing** — a 4px-based scale (`--space-1` … `--space-10`).
- **Radii, shadows, transitions and layout metrics** (sidebar width, top bar height).

Component styles live next to their component as `*.module.css` files and must reference
tokens instead of hard-coded values. Breakpoints used in media queries: `640px`, `768px`,
`1024px` and `1280px`.

## Data and privacy notes

- Sample estimates are hard-coded in `src/data/sampleEstimates.ts` and labelled as
  illustrative throughout the UI.
- Estimates created in the UI are stored **only in your browser** via `localStorage`.
- When you click **Calculate estimate**, the material lines you entered are sent to the
  locally running estimation API (`/api/v1/estimates/calculate`). No other data leaves the
  browser and nothing is sent to any third party.
- No secrets are required. `.env.example` documents the optional `VITE_API_BASE_URL`; real
  credentials or `.env` files must never be committed.

## Current limitations

- The estimation engine is wired into the New Estimate flow only. Other screens
  (comparison, what-if) are still designed placeholders marked "coming soon".
- The backend is wired for **local development** (Vite proxy) only; production API hosting,
  CORS and deployment are not configured yet.
- Product comparison and what-if analysis are not implemented.
- No persistence server, authentication, live pricing, product datasets or AI
  recommendations.
- Data can be cleared at any time by clearing browser site data for `localhost`.
- Deployment is not configured yet.

## Roadmap

| Phase | Scope                                                            | Status        |
| ----- | ---------------------------------------------------------------- | ------------- |
| 00    | Project foundation, tooling, design tokens, docs                 | Done          |
| 01    | Premium UI: app shell, dashboard, estimates, placeholder screens | Done          |
| 02    | FastAPI estimation engine, quantity inputs, AI-assisted estimates | Partial — core, API and New Estimate wiring done; AI estimates pending |
| 03    | Product datasets, product comparison, what-if scenario analysis   | Planned       |
| 04    | Supabase persistence and/or authentication                        | Planned       |
| 05    | Deployment and demo polish                                        | Planned       |

## Contributing to this repository

See [`AGENTS.md`](./AGENTS.md) for architecture, coding rules, verification commands and
the mandatory per-phase Git workflow.
