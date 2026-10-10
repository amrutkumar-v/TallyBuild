# TallyBuild AI

**Building-product cost estimation for construction projects.**

TallyBuild AI is a hackathon project for **KLE TECH HACKFEST 2026, Domain 4C — AI for Cost
Estimation of Building Products**. The product vision is a construction-tech workspace where
estimators can create project estimates, compare building-product alternatives and run
what-if scenario analysis on quantities and material prices.

This repository currently contains **Phase 00 (project foundation) and Phase 01 (premium
UI shell and dashboard)** — a fully client-side React application. There is no backend,
no database, no authentication and no AI or pricing service yet. Every number shown in the
interface is **illustrative demo data**, not real customer, market or supplier data.

## Technology stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | React 19 + TypeScript (strict mode)                       |
| Build tool | Vite 8                                                    |
| Styling    | Plain CSS with design tokens + CSS Modules                 |
| Icons      | `lucide-react`                                            |
| Routing    | `react-router-dom` (client-side routes)                   |
| Linting    | ESLint 10 + `typescript-eslint` + React Hooks rules       |

No backend, database, authentication, AI API, paid service or deployment configuration is
included at this stage.

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

## Project structure

```
src/
  components/
    layout/        App shell: sidebar, top bar, shell frame
    ui/            Reusable primitives: buttons, badges, cards, fields, empty states
    dashboard/     Dashboard-only sections (summary grid, recent estimates, explainer)
    estimates/     Estimates toolbar and table
  constants/       Navigation items, labels and page titles
  data/            Sample (demo) estimates, clearly flagged as illustrative
  estimation/      Deterministic cost-calculation core (units, rounding, catalogue)
  pages/           Route-level screens
  store/           Client-side estimates context backed by localStorage
  styles/          Global tokens and base styles
  types/           Shared TypeScript types
  utils/           Formatting and small helpers
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
  Nothing is transmitted anywhere.
- No environment variables or secrets are required for this phase, so no `.env` files
  are used. Real credentials must never be committed.

## Current limitations

- No cost-estimation engine: creating an estimate stores a local draft only.
- Product comparison and what-if analysis are designed placeholders marked
  "coming soon".
- No backend, persistence server, authentication, live pricing, product datasets or AI
  recommendations.
- Data can be cleared at any time by clearing browser site data for `localhost`.
- Deployment is not configured yet.

## Roadmap

| Phase | Scope                                                            | Status        |
| ----- | ---------------------------------------------------------------- | ------------- |
| 00    | Project foundation, tooling, design tokens, docs                 | Done          |
| 01    | Premium UI: app shell, dashboard, estimates, placeholder screens | Done          |
| 02    | FastAPI estimation engine, quantity inputs, AI-assisted estimates | Planned       |
| 03    | Product datasets, product comparison, what-if scenario analysis   | Planned       |
| 04    | Supabase persistence and/or authentication                        | Planned       |
| 05    | Deployment and demo polish                                        | Planned       |

## Contributing to this repository

See [`AGENTS.md`](./AGENTS.md) for architecture, coding rules, verification commands and
the mandatory per-phase Git workflow.
