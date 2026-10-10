# AGENTS.md — TallyBuild AI

Guidance for AI agents (and humans) working on this repository.

## Project overview

TallyBuild AI is a hackathon project for KLE TECH HACKFEST 2026, Domain 4C — AI for Cost
Estimation of Building Products. It is a construction-tech workspace for creating
building-product cost estimates, comparing product alternatives and running what-if
scenario analysis.

**Current status:** Phase 00 (foundation) and Phase 01 (premium UI) are implemented, plus
Phase 02A (a deterministic, pure-TS estimation core under `src/estimation/` — units,
rounding, sample catalogue, `calculateEstimate`), Phase 02B (API contract docs under
`docs/`) and Phase 02C (a FastAPI service under `backend/` that reproduces the core over
HTTP — health, products and calculate endpoints, pytest-tested).

The TS core and the FastAPI service are **not yet wired into the UI**. The app is fully
client-side and the browser UI makes no server calls. There is no database, authentication,
AI service, pricing API or deployment config. All displayed figures and API prices are
illustrative demo data.

**Never claim unimplemented functionality works.** Placeholders must be visibly marked as
coming soon, and demo values must be labelled as illustrative.

## Architecture

```
src/
  main.tsx                 Entry point: mounts App, imports global styles
  App.tsx                  Route table (react-router) and providers
  components/
    layout/                AppShell (sidebar + top bar + outlet), Sidebar, TopBar
    ui/                    Reusable primitives shared across pages
      Button.tsx           button element + shared buttonClass()
      LinkButton.tsx       router link styled as a button
      buttonStyles.ts      shared button class logic (kept separate for fast refresh)
      Badge.tsx            status/tone chips
      SectionCard.tsx      titled content surface
      SummaryCard.tsx      dashboard metric card
      PageHeader.tsx       page-level h1 + description + actions
      EmptyState.tsx       designed empty / no-results states
      DemoNotice.tsx       "illustrative demo data" banner
      Fields.tsx           FormField, TextField, SelectField, TextAreaField
      SearchField.tsx      labelled search input with clear button
      FilterChips.tsx      single-select chip group (aria-pressed buttons)
      BrandMark.tsx        logo mark
    dashboard/             Dashboard-only sections (SummaryGrid, RecentEstimates, HowItHelps)
    estimates/             EstimatesToolbar + EstimatesTable
  constants/               navigation.ts (nav items, page titles), labels.ts (enum labels)
  data/sampleEstimates.ts  Hard-coded demo estimates (origin: 'sample')
  estimation/              Pure-TS deterministic cost core (units, rounding, catalogue,
                           calculateEstimate) — no React/network; see docs/estimation-engine.md
  pages/                   Route screens: Dashboard, Estimates, Comparison, WhatIf,
                           NewEstimate, NotFound
  store/                   estimates-context.ts (context + hook), EstimatesProvider.tsx
  styles/tokens.css        Design tokens (single source of truth)
  styles/base.css          Reset, element defaults, focus styles, utilities
  types/index.ts           Shared types (Estimate, status unions, form types, ...)
  utils/                   format.ts (currency/date), cn.ts (class joiner)
backend/
  app/
    main.py                FastAPI app factory + CORS
    config.py              Service constants (name, version, API prefix, CORS origins)
    schemas.py             Pydantic request/response models (single source of wire shapes)
    errors.py              Error envelope, ApiError, exception handlers
    routers/               health.py, products.py, estimates.py
    estimation/            Python port of the estimation core (units, money, catalogue,
                           calculate) — mirrors src/estimation/ exactly
  tests/                   pytest suite (health, products, calculate, rounding)
  pyproject.toml           pytest + ruff configuration (ruff line-length 100)
```

Data flow: `EstimatesProvider` holds sample estimates plus locally created drafts,
persists user drafts and the sample-data toggle to `localStorage`, and exposes them via
`useEstimates()`. Pages derive filtered views locally. The browser app makes no server call;
the FastAPI service in `backend/` is an independent, optional implementation of the estimation
core. The TypeScript core is the source of truth — `backend/app/estimation/` must mirror it
exactly (same error codes, messages, validation order and rounding).

## Coding rules

### TypeScript

- Strict mode is on. No `any` (lint error) and no implicit `unknown` casts.
- Import types with `import type` (`verbatimModuleSyntax` is enabled).
- Prefer discriminated unions and literal unions over enums.
- Keep types in `src/types/index.ts` unless they are local to one module.

### Styling

- Use design tokens (`var(--color-*)`, `var(--space-*)`, `var(--shadow-*)`, …). Never
  hard-code colours, magic spacing or shadow values in component CSS.
- Component styles go in a colocated `*.module.css` file; global tokens and resets live
  in `src/styles/`. Import global CSS only from `src/main.tsx`.
- Media-query breakpoints: `640px`, `768px`, `1024px`, `1280px`. The sidebar collapses
  below `1024px`.
- Keep transitions short (`--transition-fast` / `--transition-base`) and respect
  `prefers-reduced-motion` (already handled globally).

### Components and UI

- Split UI into reusable components; pages compose components and must stay readable.
- One `h1` per page (in `PageHeader`); the top bar page title is not a heading.
- Every interactive element must do something real. No dead buttons, placeholder links
  or `href="#"`. Disabled controls must communicate why they are disabled.
- Labels, `aria-*` attributes and keyboard support are mandatory for forms, icon-only
  buttons, navigation and filter controls. Use the `.visually-hidden` utility for
  screen-reader-only text.
- Design empty, no-results, validation and storage-error states where relevant.
- Use `lucide-react` for icons; no emoji as icons.
- Currency: INR via `formatCurrency` / `formatCurrencyShort` from `utils/format.ts`.
- Demo/sample data must be flagged as illustrative (use `DemoNotice`).

### Scope

- The only backend is the Phase 02 FastAPI service in `backend/` (a mirror of the TS core).
  Do not add a database, auth, AI API, paid service, secrets or extra endpoints without
  agreement.
- Do not add dependencies without checking they are justified; prefer the existing stack.
- Do not fabricate prices, ratings or specifications.

## Verification commands

Run all of these from the repository root before considering any change complete:

```bash
npm install        # or npm ci when package-lock.json exists
npm run typecheck  # tsc -b (strict), must exit 0
npm run lint       # eslint ., must exit 0 (warnings should be fixed too)
npm test           # vitest run, must exit 0
npm run build      # tsc -b && vite build, must exit 0
npm run dev        # manual smoke test: app loads, routes and filters work
```

Backend (run from `backend/` with its `.venv` activated):

```bash
python -m pytest         # must exit 0
python -m ruff check .   # must exit 0
python -m ruff format --check .
```

If a check cannot run, say so explicitly. Never claim a check passed when it did not.

## Git workflow (mandatory)

- Work in this repository only. Never create a nested Git repository.
- Never run destructive commands: `git reset --hard`, `git clean -fd`, force-push, or
  anything that overwrites existing user work. Preserve unrelated changes.
- **Every phase must be verified and committed separately.** One phase = one branch
  (or a clearly separated commit on `main`) containing only that phase's files, after
  all verification commands pass.
- Before committing: review `git status` and `git diff`; confirm no secrets, build
  output, `node_modules/` or unrelated files are staged.
- Commit messages: imperative, descriptive, scoped to the phase, e.g.
  `feat(phase-01): add dashboard, estimates table and placeholder screens`.
- Push only the intended branch to `origin`
  (`https://github.com/amrutkumar-v/TallyBuild.git`), never force-push. Re-confirm
  remote and branch immediately before pushing.

## Phase roadmap

| Phase | Scope                                                             |
| ----- | ----------------------------------------------------------------- |
| 00    | Foundation: Vite + React + TS, design tokens, docs, lint/build     |
| 01    | Premium UI: shell, dashboard, estimates, comparison/what-if stubs, new-estimate form |
| 02    | FastAPI estimation engine, quantity/material inputs, AI estimates  |
| 03    | Product datasets, product comparison, what-if scenario analysis    |
| 04    | Supabase persistence and/or authentication                         |
| 05    | Deployment and demo polish                                         |
