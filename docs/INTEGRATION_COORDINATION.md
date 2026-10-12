# TallyBuild AI — Integration & Delivery Coordination (Domain 4C)

**Status:** Coordination artifact. **No application code is changed by this document.** Every
schema, endpoint and field name below is **PROVISIONAL** and requires sign-off from the owning
teammates (Manju, Sambram) and the frontend/engine owners (Owais, Harshith) before it is treated
as final. Nothing here claims a missing feature is built.

**Author:** Amrut (scope, shared contracts, integration, verification, demo).
**Repo:** https://github.com/amrutkumar-v/TallyBuild.git
**Branch at writing time:** `feature/phase-02d-frontend-integration`
**Commit:** `121893a` (`docs: add Domain 4C team handoff`)

> **Read this first.** The shipped app today is a *construction building-material price
> calculator* (quantity × unit price → INR total). The owner-supplied Domain 4C description
> reframes the task as *project / product-development cost estimation driven by effort, tools and
> history*. **Gate 1 (confirm the official brief) is still open**, so the whole plan below is
> gated. Do not rebuild or re-model until Gate 1 closes.

---

## 1. Gate 1 — official requirements verification

**Result: the official Domain 4C problem statement and judging rubric are NOT available.**

Evidence gathered this session:

| Source checked | Result |
| -------------- | ------ |
| Repository (`docs/`, README, AGENTS, UI copy) | Only the domain **title** appears: *"KLE TECH HACKFEST 2026, Domain 4C — AI for Cost Estimation of Building Products"*. No statement, rubric, deliverables, deadlines or datasets. |
| Web search — `"KLE Tech" Hackfest 2026 "Domain 4C"` | No matching official statement. |
| Web search — `KLE Technological University Hackfest 2026 problem statement domains` | Multiple **unrelated** KLE Tech events surfaced (IGNITRIX Agentic AI Hackathon, Hack Genesis, TECHNIVEX, CIVILATHON, HACKFEST'26 Devpost, etc.). None is this domain. |
| Reference PDF `Product_Development_Cost_calculations.pdf` (outside repo) | A **software/product-development** cost model (effort hours, Europe-vs-India rates, EUR, SW vendor, tools & licences, ASW/BSW stacks, 10 % contingency). **Authority unconfirmed.** |

**Closest authoritative source — the owner's supplied description** (`docs/TEAM_HANDOFF_DOMAIN_4C.md` §1):
an AI-based cost-estimation capability for a project-management activity covering personnel,
tooling and other resources, with WBS, person-hours/rates, tooling/licences, cloud/infra,
timelines, contingency, estimated-vs-actual records, historical data, parametric/Monte-Carlo/
analogy methods, Jira/Project/ERP integrations *(assessed, not assumed)*, confidence intervals,
KPIs (MMRE, MdMRE, PRED(25), variances…), and currencies **INR, EUR, USD, AED**.

**The unresolved conflict (must be confirmed with organizers):** "building products" can mean
(a) construction **building materials**, or (b) the cost of **building a product** (product
development). The repo implemented (a); the brief/PDF point to (b).

**Exact questions to send the organizers** (already drafted in `docs/PHASE_02G_DECISION_PACKAGE.md` §Gate):
verbatim statement; meaning of "building products"; whether the PDF is official and what role it
plays; required inputs/outputs; methodology; datasets; whether AI/ML is mandated or a
deterministic calculator is acceptable; accuracy/explainability bar; deliverables, rubric,
weightings, deadline, deployment constraints.

**Gate 1 exit criteria:** verbatim statement + rubric recorded in `docs/`, and the interpretation
note in `docs/TEAM_HANDOFF_DOMAIN_4C.md` §50 marked resolved (construction **or** product
development). Until then: **scope frozen, no engine/data re-model, no endpoint renames.**

---

## 2. Current repository state (verified this session)

- **Branch:** `feature/phase-02d-frontend-integration`; **HEAD** `121893a`; remote
  `origin` = `amrutkumar-v/TallyBuild.git`. **No current work is committed.**
- **Working tree is mid-migration and currently BROKEN.** `npm run typecheck` (`tsc -b`) fails:
  - `src/api/client.ts:6` — `ESTIMATE_NOT_FOUND` is not in `ApiErrorCode`
  - `src/components/layout/TopBar.tsx:4` — `getPageTitle` no longer exported from `constants/navigation`
  - `src/estimation/calculate.test.ts:5` — unused `baseError`/`baseRequest`
  - `src/pages/NewEstimatePage.tsx` — 5× typed-error/`Record<string,string|undefined>` mismatches
- ~40 files modified/deleted and 4 new files untracked (see `git status`) — this is a **partial,
  unverified domain migration** I performed before the pause. It overlaps **Owais's** frontend and
  **Harshith's** estimation-engine ownership. **Owner decision required** (see §9).
- **Backend (`backend/`) is untouched** and remains material-domain (units/catalogue/43ish tests).
- Checks **not** run since the migration edits: `lint`, `test`, `build`, `pytest`, `ruff`.
- Baseline immediately before the migration (on clean `121893a`): typecheck/lint/build green,
  86 frontend tests, 72 backend tests, ruff green. *(Per `docs/PROBLEM_VALIDATION.md` §2.7.)*

---

## 3. Sprint tracker (7-hour window)

Legend — Status: `pending` · `in progress` · `blocked` · `verified`.

| # | Task | Owner | Status | Dependency / blocker | Expected deliverable | Verification evidence |
|---|------|-------|--------|----------------------|----------------------|-----------------------|
| 1 | Confirm official Domain 4C statement + rubric | Amrut | **blocked** | Organizers | Verbatim note in `docs/` | Source URL/email + recorded text |
| 2 | Freeze MVP scope (Gate 2) | Amrut + all | **blocked** | #1 | Signed scope section in this doc | Owner sign-off comments |
| 3 | Shared integration contract sign-off | Amrut + owners | **pending** | #2 | `docs/` contract, no open placeholders | Manju/Sambram agree endpoints+schema |
| 4 | Domain data model + seed demo dataset | Sambram | **pending** | #3 | Schema + seed fixtures | Model loads; a seeded project renders |
| 5 | Estimation engine (effort→cost→schedule) | Harshith | **pending** | #3 | `src/estimation/**` + `backend/app/estimation/**` (mirror) | Shared golden fixture passes both sides |
| 6 | Backend API (projects/estimate/scenario) | Manju | **pending** | #3 | `backend/app/{schemas,routers}` | `pytest` + curl request/response log |
| 7 | Frontend flow (project→features→estimate→timeline) | Owais | **pending** | #3, #4, #5 | `src/pages/**`, `src/components/**` | typecheck/lint/vitest/build green |
| 8 | Integration wiring (client + contract) | Amrut | **pending** | #4, #5, #6, #7 | `src/api/**` | E2E request succeeds against backend |
| 9 | Scenario comparison + what-if (one assumption) | Owais + Harshith | **pending** | #7, #8 | working compare view | Changed assumption → different total |
| 10 | Preserve or discard the uncommitted migration | Amrut + Owais + Harshith | **pending** | decision | WIP branch **or** clean revert | `git status` reflects chosen outcome |
| 11 | End-to-end demo rehearsal | Amrut | **pending** | #9 | demo script walkthrough | timed dry-run log |
| 12 | Final verification + integration report | Amrut | **pending** | all | report + limitations | all check commands run, output pasted |

**Critical path:** 1 → 2 → 3 → (4,5,6,7 in parallel) → 8 → 9 → 11 → 12.

---

## 4. MVP scope (frozen shape, pending Gate 2)

A judge should be able to, end-to-end:

1. Enter a realistic project description.
2. Review/edit a feature (WBS) breakdown.
3. Generate an effort + cost estimate via a defined, disclosed method.
4. View a timeline and a cost breakdown.
5. Change one assumption and compare the result.
6. See assumptions, uncertainty and limitations.

**Explicitly out of scope unless the rubric requires it:** auth, elaborate settings, real
Jira/ERP integrations, multiple AI providers, deployment polish. If time is short, ship #1–#6.

---

## 5. Draft integration contract — PROVISIONAL (owners must sign off)

> Do not treat any name below as final. Manju (backend) and Sambram (data) must agree; Owais
> (frontend) and Harshith (engine) must confirm field names match their types.

### 5.1 Canonical data structures (candidate)

```
Project      { id, name, description, currency, createdAt, owner? }
RoleRate     { id, name, region, hourlyRate, currency }
Feature      { id, projectId, name, description?, category, complexity,
               estimatedHours, roleId?, dependsOn: string[] }
Milestone    { id, projectId, name, plannedStart, plannedEnd, plannedSpend }
Estimate     { id, projectId, currency, method, effortHours,
               labourCost, toolingCost, infrastructureCost, contingencyCost,
               total, assumptions: string[], confidence?: {...}, createdAt }
Scenario     { id, estimateId, name, overrides, result: EstimateSummary }
```

### 5.2 Field rules (candidate)

- **Currency:** one currency per estimate; supported set `INR | USD | EUR | AED`; **no live FX**,
  no silent mixing; conversion is "not configured".
- **Numbers:** non-negative finite; money rounded 2-dp **half-up** (reuse existing `roundCurrency`
  policy); hours rounded per the engine's documented rule (to be confirmed by Harshith).
- **Nullability:** `description?`, `roleId?`, `confidence?`, `dependsOn` default `[]`; timestamps
  ISO-8601 strings; ids opaque strings.
- **Units:** hours (h), money (currency units), duration (weeks), rates (currency/hour).

### 5.3 Endpoints (candidate — NOT final)

- `GET  /api/v1/health` — unchanged shape (carry over).
- `POST /api/v1/estimates/calculate` — **keep the path**; request body changes to project +
  features + rates + currency; response is the estimate breakdown.
- `GET/POST /api/v1/projects` — only if persistence is in scope (Sambram/Manju).
- `POST /api/v1/scenarios/compare` — only if comparison is in scope.

**Error envelope (carry over — already implemented and domain-agnostic):**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ { "section": "...", "lineIndex": 0, "message": "..." } ] } }
```

### 5.4 File ownership (avoid overlap)

| Owner | Owns |
| ----- | ---- |
| **Owais** | `src/pages/**`, `src/components/**`, `src/styles/**`, `src/App.tsx`, `src/main.tsx`, `src/utils/format.ts`, `src/types/index.ts` (UI-facing types) |
| **Harshith** | `src/estimation/**`, `backend/app/estimation/**`, `docs/estimation-engine.md`, `docs/fixtures/**` |
| **Manju** | `backend/app/{main,config,schemas,errors}.py`, `backend/app/routers/**`, `backend/tests/**` |
| **Sambram** | data model, schema/DDL, seed datasets, persistence layer, `docs/data-model.md` |
| **Amrut** | `docs/**` contracts, `src/api/**` (client + wiring), integration tests, demo |

**Rule:** any change to a shared shape (`src/types/index.ts`, `backend/app/schemas.py`,
`src/estimation/types.ts`) must be proposed via the contract doc first and acknowledged by the
consuming owner. No teammate edits another's owned file without agreement.

### 5.5 State representation

- **Loading:** explicit `checking`/`loading` state, never a fabricated value.
- **Validation:** client-side field errors for UX; server `VALIDATION_ERROR` shown as a summary.
- **Failure/offline:** disable the calculation and explain why; never invent a total.

### 5.6 Demo data vs real vs persisted

- Demo/sample data flagged `isIllustrative` and labelled in UI (`DemoNotice`).
- Calculated estimates are deterministic arithmetic and labelled as such (not "AI prediction"
  unless an actual model exists and is disclosed).
- Persisted drafts limited to browser `localStorage` unless Sambram adds a server store.

---

## 6. Bounded deliverables (interface stubs first)

Request early stubs before full implementations:

- **Owais:** static project→feature→estimate screen with mock estimate JSON; then wire to `src/api`.
- **Harshith:** `calculateEstimate(candidateRequest) → candidateResult` with a golden fixture,
  before UI/back-end wiring; publish request/response JSON.
- **Manju:** OpenAPI-level endpoint stubs returning the error envelope and a sample estimate;
  then real logic.
- **Sambram:** one seeded demo project + feature breakdown + rates JSON, before any DB.

---

## 7. Demo script (conditional on Gate 2)

1. Open Dashboard → note the "illustrative demo data" label.
2. New Estimate → enter a project description; show the feature breakdown.
3. Calculate → show effort, cost breakdown, and the disclosed method + assumptions.
4. Show the timeline/milestone spending.
5. Change one assumption → recalculate → show the comparison and the delta.
6. Close on the assumptions/uncertainty/limitations panel (honesty requirement).

---

## 8. Integration report template (fill at the end)

- Branch/commit shipped; remote confirmed; PR link.
- What is **functional** vs **stubbed** vs **missing** (table).
- Verification evidence: exact commands + pasted results (typecheck/lint/test/build/pytest/ruff).
- Known limitations and demo-data disclosures.
- Deployment status (or "not deployed — local only").

---

## 9. Open decision required before further work

The working tree contains an **uncommitted, unverified partial migration** made before Gate 1
closed. Recommended handling (pick one, explicitly):

- **(A) Preserve on a WIP branch** — commit as `wip(domain-4c): partial project-cost migration
  (unverified)` on a throwaway branch, leave `feature/phase-02d-frontend-integration` clean.
- **(B) Discard** — revert the working tree to clean `121893a` and re-do the work under the
  confirmed scope with correct ownership.
- **(C) Keep in place** — resume the migration after Gate 1 (risks landing off-scope work).

Do not push or commit until an owner chooses. No destructive git has been run.
