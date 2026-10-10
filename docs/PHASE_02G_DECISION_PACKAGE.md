# Phase 02G — Decision Package: Requirements Verification & Product Direction

- **Project:** TallyBuild AI
- **Team (as named in the brief):** SmartCoders — the repository itself names no team
- **Repository:** https://github.com/amrutkumar-v/TallyBuild.git
- **Branch:** `feature/phase-02d-frontend-integration`
- **HEAD (verified):** `a854355` — `feat: wire frontend to estimation API`
- **Working tree:** clean except for untracked Phase 02E/02F/02G documents and test files (no application code modified)
- **Date:** 2026-10-10
- **Role of this document:** read-only decision support. It creates **exactly one** new file. It does not modify the audit, readiness, testing or application files, and it makes **no** irreversible product decision.

> **Bottom line up front:** the code is in good shape and fully verifiable, but **the assignment is still not confirmed**. The official Domain 4C problem statement and judging rubric are **absent**, and the one reference artefact supplied (a PDF) points at a *different* domain. The direction therefore stays at a **provisional PIVOT**, gated on obtaining the official brief. Nothing should be rebuilt or re-modeled until Gate 1 is satisfied.

---

## 1. Executive summary

TallyBuild AI currently implements a **deterministic construction building-materials cost estimator**: a React SPA plus a FastAPI service that price material line items (`quantity × unit price`) into an INR total, with hand-mirrored TypeScript/Python engines, a shared golden fixture, and passing automated checks.

**Technical readiness is high and verified.** **Problem alignment is unverified.** Those are two different questions and this package keeps them apart:

| Question | Answer | Basis |
| -------- | ------ | ----- |
| Does the software work and pass its checks? | **Yes** — 86 frontend tests, 72 backend tests, typecheck/lint/build/ruff all green | Verified this repository |
| Does the software satisfy the official Domain 4C hackathon brief? | **Unknown — cannot be claimed** | No official brief or rubric exists in the repo or the brief |

The blocking risk is **requirements uncertainty**, not code quality. The official statement and rubric were never provided, and the supplied reference PDF (`Product_Development_Cost_calculations.pdf`) describes a **software / embedded product-development** cost model (engineering hours, Europe-vs-India hourly rates, €/EUR, SW vendor, tools & licences, ASW/BSW stacks, 10 % contingency) — a *different* domain from the construction-material estimator that is built. The two have **not** been reconciled.

**Provisional direction: PIVOT (confidence: medium-low), gated on Gate 1.** Preserve the domain-agnostic architecture and re-model only the domain/data **if and when** the official brief confirms product-development cost. The single highest-value action is a **human one**: request the official statement and rubric from the organisers. No irreversible decision is made in this phase.

---

## 2. Current technical readiness

**Verified stack and behaviour** (source of truth: `src/estimation/` mirrored by `backend/app/estimation/`):

- Deterministic `quantity × unitPrice` in **INR**, 2-decimal half-up rounding applied per line then to the sum; `total = subtotal` (no tax/discount/contingency).
- Units `bag, piece, each, kg, tonne, m, m2, m3`; same-family conversion intentionally **rejected** (`UNIT_CONVERSION_UNSUPPORTED`); no silent conversion.
- 9 illustrative products (`isIllustrative: true`, `priceDate 2026-09-01`); no live pricing, no external data.
- Identical validation order and error codes on both runtimes: `EMPTY_REQUEST, MISSING_PRODUCT, INVALID_QUANTITY, INVALID_UNIT, INCOMPATIBLE_UNIT, UNIT_CONVERSION_UNSUPPORTED, INVALID_PRICE, INVALID_PRICE_SOURCE, NON_FINITE_RESULT`.
- FastAPI exposes exactly three endpoints under `/api/v1`: `GET /health`, `GET /products`, `POST /estimates/calculate`, with a centralised error envelope.
- Typed, React-free frontend client (`src/api/`) that **never fabricates** data and falls back to a **labelled** offline demo catalogue.

**Functional vs placeholder:**

| Area | State |
| ---- | ----- |
| App shell, routing, design tokens, UI primitives | Functional |
| Dashboard, Estimates list + filters | Functional (sample + local drafts) |
| New Estimate → calculate → result (SPA ↔ API) | Functional, genuine end-to-end wiring |
| Deterministic estimation core; TS↔Python parity | Functional; shared golden fixture |
| FastAPI service; typed frontend client | Functional; tested |
| Product comparison (`/comparison`), What-if (`/what-if`) | Placeholder ("coming soon") |
| Persistence, auth, AI/ML, live pricing, deployment | Missing |

**Test / build evidence** (Phase 02F, re-confirmed as recorded):

| Command | Result |
| ------- | ------ |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | **9 files, 86 tests passed** |
| `npm run build` | OK; bundle hashes unchanged → no production source change |
| `python -m pytest -q` (backend) | **72 passed**, 1 pre-existing deprecation warning |
| `python -m ruff check .` / `ruff format --check .` | passed / 24 files formatted |

**Shared golden fixture:** `docs/fixtures/calculation-cases.json` is consumed by **both** `src/estimation/shared-fixture.test.ts` (Vite `?raw`) and `backend/tests/test_shared_fixture.py` (from disk); both engines pass 8/8 rounding and 19/19 estimate cases with no mismatch. This closes the parity gap the 02E audit had flagged.

**Known testing limits (unchanged):** no DOM/browser-automation dependency is installed, so component tests are **server-render** only and there is **no automated browser E2E**; interaction coverage is manual (`docs/manual-smoke-test.md`). Parity is fixture-deep (cores invoked directly), not over-the-wire.

**Readiness vs alignment (the key separation).** Passing tests proves *implementation consistency* — it does **not** prove the project satisfies the official hackathon brief. Every check above would still pass even if construction materials turn out to be the wrong domain.

> Note on records: `docs/PHASE_02E_READINESS.md` §6 records the *pre-02F* counts (42 / 44); its appended Phase 2F note and `docs/PHASE_02F_TESTING.md` record the current 86 / 72. The 02E parity subsection that says the fixture is absent was superseded by the same note. Those files were **not** edited here.

---

## 3. Evidence register

Classification legend: **CONFIRMED** (verified in this repository / artefact) · **INFERRED** (reasonable but unconfirmed) · **UNKNOWN** (no evidence) · **REQUIRES ORGANIZER CONFIRMATION** (only the organisers can settle it).

| # | Item | Status | Available evidence | Missing evidence | Next action |
| - | ---- | ------ | ------------------ | ---------------- | ----------- |
| 1 | Target user & problem to solve | **REQUIRES ORGANIZER CONFIRMATION** | Repo assumes a construction estimator; PDF implies a product-development cost engineer | Official user and problem statement | Obtain brief (Gate 1); confirm user + problem |
| 2 | Cost domain ("building products" meaning) | **UNKNOWN** (conflicting) | Domain title only; PDF = product/software-dev cost; repo built construction materials | Official definition of "building products" | Ask organisers to clarify materials vs products-being-built |
| 3 | Required inputs & output format | **UNKNOWN** | Repo uses material lines + project meta → INR subtotal/total; PDF implies hours, rates, vendor, tools, stacks → "Total, Phase 1 Scope" | Official input list & output format | Obtain statement; map inputs/outputs |
| 4 | Whether AI/ML is mandatory and what it must do | **UNKNOWN** | No AI in repo; PDF is deterministic arithmetic; domain title says "AI for…" | Official AI requirement & evaluation criteria | Ask organisers explicitly |
| 5 | Required datasets / external data sources | **UNKNOWN** | Only 9 in-repo illustrative products; no external ingestion | Official datasets or confirmation none are required | Ask organisers; do not fabricate data |
| 6 | Required accuracy, validation & explainability | **UNKNOWN** | Deterministic rounding, validation codes, tests (self-imposed) | Official accuracy/explainability bar | Keep current rigour; align once stated |
| 7 | Expected demo & submission deliverables | **UNKNOWN** | None recorded | Deliverable list (repo/video/deck/demo), format, deadlines | Ask organisers (part of request) |
| 8 | Judging rubric & scoring weights | **UNKNOWN** | None; "acceptance criteria" appears only in the team's own plan doc | Official rubric and weights | Ask organisers (priority) |
| 9 | Restrictions (frameworks, APIs, data, internet) | **UNKNOWN** | Repo uses React + FastAPI; no stated constraints | Official stack/data/internet restrictions | Ask organisers |
| 10 | Presentation, documentation & deployment | **UNKNOWN** | No deployment config; no submission format recorded | Required deck/docs/deployment expectations | Ask organisers |

**Method note (per the phase brief):** no item is marked CONFIRMED merely because the current implementation does it. Where the repository implements something (e.g. validation order, TS↔Python parity), that is an *internal* fact, not evidence of an *official* requirement.

---

## 3a. Evidence register — verified internal facts (for contrast)

These are **CONFIRMED about the repository**, and deliberately separated from the official-requirement items above:

| Internal fact | Evidence |
| ------------- | -------- |
| Engine prices **construction materials** `quantity × unit price` → INR | `src/estimation/`, `backend/app/estimation/`, fixture, docs |
| Phases 00–02D complete; 02E/02F docs + tests added | Git history + docs |
| All local checks pass (86 FE / 72 BE) | Phase 02F §7 |
| Shared golden fixture exists and both runtimes pass it | `docs/fixtures/calculation-cases.json` + both suites |
| Official brief/rubric absent from repository | `docs/` contains only team-authored engineering docs; repo-wide scan |
| Only the **domain title** appears | `README.md`, `AGENTS.md`, `HowItHelps.tsx`, `TopBar.tsx` |
| PDF labels describe a product/software-dev cost model in EUR | `docs/PROBLEM_VALIDATION.md` §3.1 |

---

## 4. Reference PDF assessment

**File:** `D:\Temp\Product_Development_Cost_calculations.pdf` (~727 KB), **outside the repository**. The repo contains no PDF and no large data files.

### 4.1 Recoverable content (CONFIRMED — labels only)

Extracted text (via a dependency-free Node `zlib` content-stream read) is **only** the following structure:

- **Summary table** headers: `Cost element`, `Hours`, `€/h`, `Cost €`.
- **Row labels:** `Eur engineering`, `India engineering`, `SW Vendor`, `Tools, licences (see breakdown)`, `Contingency, engineering 10 %`, `Contingency, tools`, `Total, Phase 1 Scope`.
- **"Tools and licenses" table** (`Tool | Note | Cost €`): `Peak CAN` (`Procure`), `Altium, J-Link probes, CI server`.
- **"SW Stacks" table** (`SW Stacks | Note | Cost €`): `ASW+BSW stacks` (`Procure`).
- The `€` glyph is present → **Euro** currency.

### 4.2 What the labels support vs what is only inferred

| Claim | Status |
| ----- | ------ |
| The PDF is a **product/software-development cost model** with engineering **hours**, **€/h**, two regions (Europe, India), SW vendor, tools & licences, ASW/BSW stacks, contingencies, and a Phase 1 total | **Supported** (labels recovered) |
| It targets an **embedded/automotive-style** product (Peak CAN, Altium, J-Link, ASW/BSW = AUTOSAR-oriented) | **Inferred** (high confidence) |
| The PDF is an **official Domain 4C input** | **Unknown** |
| Domain 4C therefore means product-development cost, not construction | **Inferred** (medium confidence — no official source) |

### 4.3 Why the PDF's official status is unknown

The PDF sits **outside** the repository, was not supplied alongside the official statement, and no organiser-provided list ties it to Domain 4C. It is therefore a *reference artefact of unknown authority* — useful as a signal, not as an assignment.

### 4.4 What is missing and needed

- All **numeric values** (hours, hourly rates, vendor/tool/stack costs, contingency amounts, totals) — not extractable with available tools; the figures appear to be rendered as vector/graphic content.
- The exact **formulas** (e.g. whether India hours derive from Europe hours; how each contingency is applied).
- The **original source file** (spreadsheet/HTML/readable PDF) that contains those numbers, or written confirmation of the intended model.

### 4.3 Why no software-development-budgeting conversion should be implemented now

1. The PDF is **deterministic arithmetic**, not a verified specification, and is **not proven to be official**.
2. Its **numbers are unrecoverable** with available tools; implementing anyway would require **fabricating** prices/rates — explicitly forbidden.
3. The phase guardrail forbids converting the app into a software-development budgeting tool on the strength of the PDF alone.
4. Building it prematurely risks delivering the **wrong domain** while discarding nothing useful (the architecture is reusable regardless), and would mislabel speculative figures as if they were grounded.

**No PDF number is estimated, guessed or substituted anywhere in this package.**

---

## 5. Decision matrix — Continue / Pivot / Rebuild

> **No irreversible decision is made here.** The official brief remains unavailable, so the matrix is a *plan for deciding*, not a decision.

### A. CONTINUE — keep the construction-material estimator

| Aspect | Assessment |
| ------ | ---------- |
| **Supporting evidence** | The domain title literally reads "building products"; construction materials are "building products" in common usage. The code is complete, tested and demo-ready today. |
| **Evidence against** | The only concrete reference artefact (PDF) is a different domain; "building products" also reads as "products being built". No official source confirms materials. |
| **Must be confirmed** | That Domain 4C means construction building materials priced by quantity × rate. |
| **Cost/risk of proceeding prematurely** | Low technical cost (code already exists), but **high alignment risk**: could finish a polished demo for the wrong problem. |
| **Reusable** | Everything currently built. |

### B. PIVOT — re-model the domain, reuse the architecture *(provisional recommendation)*

| Aspect | Assessment |
| ------ | ---------- |
| **Supporting evidence** | The only concrete reference artefact is a product-development cost model; "building products" reads naturally as "products being built"; the "AI for…" title leaves AI open. |
| **Evidence against** | Requires the official statement to confirm the domain; exact formulas/numbers and currency are unknown; would invalidate the current catalogue/fixture cases. |
| **Must confirm** | Official inputs (hours, rates, regions, vendor, tools, stacks), methodology, contingency rules, currency, and whether AI is mandated. |
| **Cost/risk if premature** | Medium–high rework risk: modelling the wrong formulas, wrong currency, or a domain the rubric does not reward. Acceptable **only** after Gate 1. |
| **Reusable** | App shell, routing, design tokens, UI primitives; deterministic-core **pattern** (typed request → validation → calculation → result); rounding policy; TS↔Python mirror + shared-fixture approach; FastAPI scaffolding; typed client; tests & scripts. |

### B is the retained provisional direction because:

- It is the only direction supported by a *concrete supplied artefact*, and
- It preserves essentially all existing verified work — a rebuild is unnecessary.

But it stays **provisional (medium-low confidence)** because **no official source confirms it**.

### C. REBUILD — discard and start over

| Aspect | Assessment |
| ------ | ---------- |
| **Supporting evidence** | None found. The existing architecture is domain-agnostic and the engines are trivially re-modeled. |
| **Evidence against** | The shell, UI primitives, deterministic-core architecture, rounding policy, parity-fixture pattern, API contract, typed client and tests are all reusable under **either** domain. A rebuild would discard verified, working value for no architectural gain. |
| **Must confirm** | Only warranted if the official brief demands a fundamentally incompatible stack/data model (e.g. mandatory real-time ML over organiser datasets). |
| **Cost/risk** | Highest; justified only by a hard, official constraint. |
| **Reusable** | N/A (by definition). |

**Conclusion:** REBUILD is not warranted on present evidence; PIVOT remains provisional; CONTINUE cannot be certified without the brief. **Do not act on any of the three until Gate 1.**

---

## 6. Organizer request message (ready to copy)

> **Subject:** Domain 4C — request for the official problem statement and judging details
>
> Dear Hackfest Team,
>
> We are working on **Domain 4C — AI for Cost Estimation of Building Products** and want to make sure we build to the official brief. Could you please share:
>
> 1. The complete official Domain 4C problem statement.
> 2. The judging rubric and the weighting of each criterion.
> 3. The required features and expected deliverables (repository, demo, video, presentation, etc.).
> 4. Whether AI/ML is mandatory, and how it will be evaluated.
> 5. Any official datasets, reference documents or sample inputs for this domain.
> 6. Clarification on whether the document `Product_Development_Cost_calculations.pdf` is an official reference for Domain 4C, and what role it plays.
> 7. If it is official, a readable PDF, spreadsheet or source file containing its numeric values (hours, rates, tool/licence and vendor costs, contingency amounts).
> 8. Any technical restrictions (frameworks, APIs, data sources, internet access) and the submission/deadline requirements.
>
> The wording "building products" could mean construction/building materials or products being developed, so an explicit clarification would help us scope correctly. Thank you for your support — we are happy to align with whatever the brief specifies.
>
> Best regards,
> Team SmartCoders

---

## 7. Decision gates

| Gate | Purpose | Required evidence to pass | Work that must wait until it passes |
| ---- | ------- | ------------------------- | ----------------------------------- |
| **Gate 1** | Official brief & rubric obtained | Verbatim Domain 4C statement + rubric recorded (numbers/source file for the PDF, if applicable) | All domain changes; any engine/DDL re-model; scoping decisions |
| **Gate 2** | Requirements mapped to current implementation | Each official requirement traced to "implemented / partial / missing" with the specific files | Feature work not yet justified by the map |
| **Gate 3** | Product direction approved | Team sign-off on **A / B / C** in §5, informed by Gates 1–2 | Any hand-off to a new build phase; commit of domain changes |
| **Gate 4** | Next implementation phase selected & planned | Chosen phase (e.g. domain re-model, AI feature) with acceptance criteria and verification commands | Coding the chosen phase |
| **Gate 5** | Final demo & submission readiness verified | Full local checks green; manual smoke pass; deliverables produced to the rubric; demo rehearsed | Submission / deployment |

**Already satisfied / safe to have done before Gate 1:** interpretation-neutral hardening (the shared golden fixture, component-render tests, manual smoke doc) — they are valid under **either** domain.

---

## 8. Recommended next action

1. **Send the §6 request** to the hackathon organisers *(Gate 1)*. This is blocking and is the highest-value action available; it requires no code.
2. **Freeze product direction** at the provisional PIVOT. **Do not** model product-development cost, add AI, add persistence, or change the domain until the brief arrives.
3. **Optionally**, once Gate 1 lands, run **Gate 2** (a one-page requirement→implementation trace) and only then select the Gate 4 phase. If Gate 1 confirms construction materials, downgrade the recommendation to **CONTINUE** and add only what the rubric rewards.
4. Keep the current build demo-ready as a fallback in case the brief is delayed.

No feature is implemented, and no commit, push, deploy or branch change is performed in this phase.

---

## 9. Explicit limitations & unresolved questions

**Limitations**

- **No official brief or rubric was available**; every domain conclusion is provisional and gated on Gate 1.
- **The PDF's official status is unknown** and its numeric values/formulas are **unrecoverable** with available tools; none were fabricated.
- **Parity is fixture-deep, not HTTP-deep:** the shared fixture exercises the two calculation cores directly, not an over-the-wire comparison.
- **No browser automation** is installed, so end-to-end interaction is covered only by the manual procedure in `docs/manual-smoke-test.md`.
- **Naming/metadata:** the brief says "SmartCoders"; the repository names no team.
- This package reasons from **existing** documents (the audit, readiness, testing and engine/contract docs) and did not re-run the suites in this phase; the Phase 02F results (86 FE / 72 BE) are treated as the latest verified evidence.

**Unresolved questions for the organisers** (all **REQUIRES ORGANIZER CONFIRMATION**)

1. Verbatim Domain 4C problem statement; exact meaning of "building products".
2. Construction materials **or** products being developed (product-development cost)?
3. Is `Product_Development_Cost_calculations.pdf` an official reference, and what is its role?
4. Required inputs and output format; required cost methodology (rates, regions, contingency, currency).
5. Is AI/ML mandatory, and how is it evaluated?
6. Required datasets/data sources and how data quality is judged.
7. Required accuracy, validation and explainability.
8. Judging rubric, weights, deliverables, deadlines and technical restrictions.
9. Confirmation of the team name.

---

## Appendix — Scope of this phase

- **Created:** `docs/PHASE_02G_DECISION_PACKAGE.md` (this file) — the **only** file created.
- **Modified / deleted / committed / pushed:** none. The audit (`docs/PROBLEM_VALIDATION.md`), readiness (`docs/PHASE_02E_READINESS.md`), testing (`docs/PHASE_02F_TESTING.md`), manual smoke doc, fixtures and all application/backend source are untouched.
- **Git:** no branch switch, commit, push, deploy or config change. Branch `feature/phase-02d-frontend-integration`, HEAD `a854355`, unchanged.
