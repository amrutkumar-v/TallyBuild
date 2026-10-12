# Problem Validation & Project Audit — TallyBuild AI

- **Repository:** https://github.com/amrutkumar-v/TallyBuild.git
- **Project:** TallyBuild AI
- **Team name in this brief:** SmartCoders (the repository itself names no team)
- **Audit date:** 2026-10-10
- **Auditor role:** senior architect / product analyst / code auditor (read-only)
- **Branch at audit time:** `feature/phase-02d-frontend-integration` (HEAD `a854355`), working tree clean
- **Deliverable:** this document only. No application source, schema, migrations, env files, deployment settings, branches, or commits were changed.

> This report distinguishes **verified facts**, **inferences**, and **unknowns**. It does **not** assume the supplied PDF is the official hackathon problem statement.

---

## 1. Executive summary

TallyBuild AI is a well-built, well-tested **construction-tech building-materials cost estimator**: a React SPA plus a deterministically mirrored FastAPI service that price material line items (quantity × unit price) into an INR total. Phases 00–02D are complete and every local verification command passes (typecheck, lint, 42 frontend tests, production build, 44 backend tests, ruff check/format).

**The central risk this audit surfaces is a domain mismatch.** The supplied reference PDF, `Product_Development_Cost_calculations.pdf`, is **not** a construction-materials cost model. Its recoverable text describes a **product-development cost model**: engineering effort in **hours**, hourly rates for **European vs India** engineering (currency **€ / EUR**), a **SW vendor** line, **tools & licences**, a **10 % engineering contingency**, a **tools contingency**, and **SW stacks (ASW+BSW)** marked for procurement — a software/hardware product-development cost breakdown, not cement/steel/bricks.

However, the **official Domain 4C problem statement and judging rubric are not present in the repository**, and were not supplied for this audit. The repository contains only the domain *title* — "KLE TECH HACKFEST 2026, Domain 4C — AI for Cost Estimation of Building Products" — which the team interpreted as construction materials.

**Provisional recommendation: PIVOT** (confidence: medium-low, because the official statement is missing). Preserve the working architecture, UI, engine pattern, API and tests; change the domain model and data only. If the official statement confirms "building products" = construction materials, the recommendation becomes **CONTINUE**. The single most important next action is to obtain the official problem statement and rubric.

---

## 2. Current project audit

### 2.1 What the application does

A construction-tech workspace for building-material cost estimation.

- **Data flow:** React SPA → REST/JSON → FastAPI (`/api/v1`). No database, auth, AI, paid services or deployment config.
- **Screens (routes):** Dashboard (`/`), Estimates (`/estimates`), New Estimate (`/estimates/new`), Comparison (`/comparison`, placeholder), What-If (`/what-if`, placeholder), Not Found.
- **New Estimate workflow (functional):** enter project details (name, location, type, optional notes) → add material line items (catalogue product + quantity) → **Calculate estimate** posts lines to `POST /api/v1/estimates/calculate` → a result card renders per-line subtotals, the total, and the illustrative price-source label → the draft (with `estimatedAmount`) is saved to browser `localStorage`. When the API is offline the UI shows a clearly labelled **offline demo catalogue** and disables calculation rather than fabricating a total.
- Every displayed figure and API price is **illustrative demo data**, labelled as such.

### 2.2 Cost-estimation features and formulas (verified)

- Domain: **building/construction materials** (cement, steel, bricks, AAC blocks, sand, aggregate, tiles, binding wire, teak door frame).
- Formula: per line `lineSubtotal = roundCurrency(quantity × unitPrice)`; `total = subtotal` (no tax, discount, contingency, labour or GST). Currency precision 2 decimals (paise), **half-up**, applied per line then to the sum.
- Units: `bag`, `piece`, `each`, `kg`, `tonne`, `m`, `m2`, `m3` — **no unit conversion** (same-family conversion rejected as `UNIT_CONVERSION_UNSUPPORTED`).
- Currency: single currency, **INR**.
- Catalogue: **9 illustrative products** (`src/estimation/data/sampleProducts.ts`), all flagged `isIllustrative: true`, demo price date `2026-09-01`.
- The model is mirrored in Python (`backend/app/estimation/`) and must match the TS core bit-for-bit.

**The application does NOT estimate software or product-development costs.**

### 2.3 Data sources and datasets (verified)

- Only the hard-coded illustrative catalogue (9 products) and hard-coded sample estimates.
- No live pricing, supplier, market or organiser-provided dataset; no external ingestion.
- Offline fallback uses the same in-repo sample catalogue (clearly labelled).

### 2.4 Backend, database, APIs, integrations (verified)

- **Backend:** FastAPI service `backend/` (Python 3.14 venv), three implemented endpoints: `GET /api/v1/health`, `GET /api/v1/products`, `POST /api/v1/estimates/calculate`.
- **Frontend client:** typed client in `src/api/`, used only by the New Estimate flow; Vite dev proxy `/api → http://localhost:8000`.
- **Database:** none. **Auth:** none. **AI:** none. **Deployment:** none.
- **Secrets:** none required. `.env.example` documents optional `VITE_API_BASE_URL`; no `.env` file was read or printed.

### 2.5 Functional / partial / mocked / missing (verified)

| Area | State |
| ---- | ----- |
| App shell, routing, design tokens, UI primitives | Functional |
| Dashboard, Estimates list + filters | Functional (sample + local drafts) |
| New Estimate (details → line items → calculate → result) | Functional; wired to the API |
| Deterministic estimation core (`src/estimation/`) | Functional |
| FastAPI service (`backend/`), TS↔Python parity | Functional; pytest-tested |
| Typed frontend API client (`src/api/`) | Functional; unit-tested |
| Product comparison (`/comparison`) | Placeholder ("coming soon") |
| What-if analysis (`/what-if`) | Placeholder ("coming soon") |
| Persistence server, authentication | Missing |
| Live pricing / product datasets / AI recommendations | Missing |
| Deployment configuration | Missing |

### 2.6 Reuse potential (verified, domain-independent)

App shell, routing, design tokens, UI primitives; the deterministic-core **pattern** (typed request → validation → calculation → result), rounding policy, TS↔Python mirror and golden-fixture approach; FastAPI scaffolding; typed frontend client; test harness and verification scripts. All are reusable under a pivot; a full rebuild is not warranted.

### 2.7 Test, lint, type-check and build status (verified, run at audit time)

| Command | Result |
| ------- | ------ |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | 5 files, **42 tests passed** |
| `npm run build` | built OK (`dist/`, gitignored) |
| `python -m pytest` (backend venv, Python 3.14.0) | **44 passed**, 1 pre-existing deprecation warning |
| `python -m ruff check .` (backend) | passed |
| `python -m ruff format --check .` (backend) | 23 files already formatted |

### 2.7 Git state (verified)

- **Branch:** `feature/phase-02d-frontend-integration`; `git status` → clean working tree (no uncommitted changes).
- **History:** `a854355` wire frontend→API, `eba0878` estimation API, `d0365c1` API contract, `e61e13c` estimation core, `9defe33` phase-01 UI, `b773df4` phase-00 foundation.
- **Remote:** `origin` = https://github.com/amrutkumar-v/TallyBuild.git; `origin/HEAD → origin/main`.
- Branches present locally and on origin: `main`, `feature/phase-01-ui-foundation`, `feature/phase-02-estimation-core`, `feature/phase-02c-backend-api`, `feature/phase-02d-frontend-integration`.

---

## 3. Reference PDF findings

**File:** `D:\Temp\Product_Development_Cost_calculations.pdf` (~727 KB), **outside the repository**. The repository contains **no PDF** and no large data files.

### 3.1 Extractable content (verified)

The PDF is an HTML→PDF export. Its machine-readable text (recovered from the page content streams) is **only** the following table labels. Verbatim extracted strings:

**Summary table** — column headers: `Cost element`, `Hours`, `€/h`, `Cost €`.

**Row labels:** `Eur engineering`, `India engineering`, `SW Vendor`,
`Tools, licences (see breakdown)`, `Contingency, engineering 10 %`, `Contingency, tools`,
`Total, Phase 1 Scope`.

**"Tools and licenses" table** — `Tool | Note | Cost €`; rows: `Peak CAN` (Note: `Procure`),
`Altium, J-Link probes, CI server`.

**"SW Stacks" table** — `SW Stacks | Note | Cost €`; row: `ASW+BSW stacks` (Note: `Procure`).

The `€` glyph is present (mapped from a subset CID font), confirming **Euro** currency.

### 3.2 What the PDF is (inference — high confidence)

A **software / embedded-product development cost model** at "Phase 1 Scope" level:

- Engineering effort in **hours** with **hourly rates** for two regions (**Europe**, **India**), in **€**.
- **SW vendor** cost.
- **Tools and licences** (Peak CAN, Altium, J-Link probes, CI server — embedded/electronics tooling).
- **Software stacks** including **ASW + BSW** (Application/Basic Software — AUTOSAR/automotive-embedded terminology).
- **Contingency**: 10 % engineering contingency plus a tools contingency.
- **Total, Phase 1 Scope**.

### 3.3 Extraction limitations (verified)

- No PDF/OCR tooling was available (`pypdf`, `pdfplumber`, `fitz`, `pdftotext`, Ghostscript, LibreOffice all absent), and installing packages was out of scope.
- The model cannot read PDF input.
- A safe, dependency-free extraction (Node `zlib` stream inflation + content-stream text parsing) recovered all text labels but **no numeric values**. **No values were fabricated.**

### 3.4 Not extractable (unknown)

All **numeric values** (hours, hourly rates, vendor/tool/stack costs, contingency amounts, totals), the exact **formulas** (e.g. whether India hours derive from Europe hours), and whether/how each contingency is applied. The figures appear to be rendered as vector/graphic content (the file also embeds 8 images and a ~6 MB graphics/font stream).

### 3.5 Does the PDF match the intended problem?

**Cannot be confirmed** without the official statement. The PDF describes product/software-development cost estimation, which is **not** the construction-materials estimation implemented in the repository — but the PDF is not established to be the official Domain 4C brief.

---

## 4. Official problem-statement verification

**Result: the official problem statement and judging rubric are NOT in the repository.**

Evidence (verified):

- `docs/` contains only three authored files: `api-contract.md`, `estimation-engine.md`, `phase-02-integration-plan.md` — all internal engineering docs authored by the team.
- No PDF/DOCX/PPTX/XLSX/image files exist anywhere in the tracked project (outside `node_modules`/`.venv`/`dist`/`.git`).
- A repository-wide keyword scan for `problem statement | rubric | judging | Domain 4C | SmartCoders | hackathon | KLE TECH | HACKFEST | organizers | acceptance criteria` matched only:
  - the **domain title** in `README.md` and `AGENTS.md` ("KLE TECH HACKFEST 2026, Domain 4C — AI for Cost Estimation of Building Products"),
  - the same title echoed in UI copy (`HowItHelps.tsx`, `TopBar.tsx`),
  - the word "hackathon" in demo-data disclaimers, and
  - the phrase "acceptance criteria" inside the team's **own** `phase-02-integration-plan.md`.

**Note on the domain title.** "AI for Cost Estimation of Building Products" is ambiguous: it can mean (a) construction/building **materials**, or (b) the cost of **building** a product (product development). The repository chose (a); the reference PDF is consistent with (b).

**Therefore:** the current project's match to the assigned problem **cannot be claimed** on present evidence.

---

## 5. Requirements comparison table

> **Provisional.** No official requirement source exists in the repository; the "Requirement / Evidence" columns are drawn from the domain title, the team's own docs, and the reference PDF. Statuses must be re-evaluated once the official statement is obtained.

Allowed statuses: VERIFIED · PARTIALLY IMPLEMENTED · MISSING · CONFLICTING · UNKNOWN.

| Requirement | Evidence/source | Current implementation | Status | Recommended action |
| ----------- | --------------- | ---------------------- | ------ | ------------------ |
| Target user & problem to solve | Official: none found. Repo assumes a construction estimator; PDF implies a product-development cost engineer | Construction estimator workflow | UNKNOWN | Obtain official statement; confirm user & problem |
| Cost domain ("building products" meaning) | Domain title only; PDF = product/software development cost | Construction building **materials** | CONFLICTING | Resolve with organizers; likely re-scope domain |
| Required inputs | Official: none found | Material line items (product + quantity) + project meta | UNKNOWN | Confirm inputs vs PDF (hours, rates, vendor, tools, stacks) |
| Expected outputs | Official: none found | Per-line subtotals + INR total | UNKNOWN | Confirm outputs (PDF: "Total, Phase 1 Scope") |
| Cost methodology / formula | Official: none found | quantity × unit price; 2-dp half-up; `total = subtotal` | UNKNOWN | Confirm; PDF implies hours×rate + vendor + tools + contingencies |
| Contingency handling | PDF: 10 % engineering contingency + tools contingency | None implemented | MISSING | If pivot confirmed, add contingency logic |
| Multi-region / multi-currency | PDF: Europe vs India rates; € (EUR) | Single region; INR only | CONFLICTING | Confirm currency & regions; adapt engine |
| Required data sources / datasets | Official: none found | 9 illustrative demo products only | UNKNOWN | Confirm required datasets; none supplied |
| AI/ML requirement | Official: none found; PDF is deterministic | None (deterministic calculator) | UNKNOWN | Confirm whether AI is mandated |
| Accuracy / explainability / validation | Official: none found | Deterministic rounding, validation codes, tests | UNKNOWN | Keep; align to any official accuracy bar |
| UI & workflow requirements | Official: none found | App shell + New Estimate flow; comparison/what-if placeholders | PARTIALLY IMPLEMENTED | Adapt workflow if domain changes |
| Technical constraints & judging deliverables | Official: none found | React+FastAPI; local-only; no deployment | UNKNOWN | Obtain rubric & submission rules |
| Persistence / auth | Official: none found | Browser `localStorage` only | UNKNOWN | Not in scope unless rubric requires |
| TS↔Python parity | Team docs (self-imposed) | Implemented and tested | VERIFIED (internal) | Preserve under any pivot |

---

## 6. Confirmed facts, inferences, and unknowns

### Confirmed facts (verified)
- The repository implements **construction building-material** cost estimation (quantity × unit price → INR total), not software/product-development cost estimation.
- Phases 00–02D are complete; all local verification passes: typecheck, lint, 42 frontend tests, build, 44 backend tests, ruff check/format.
- The current branch is `feature/phase-02d-frontend-integration`; the working tree is clean.
- The **official problem statement and judging rubric are absent** from the repository; only the domain title appears.
- The reference PDF (outside the repo) contains the labels in §3.1 and is a **product/software-development cost model** in **EUR** with contingencies and ASW/BSW stacks.
- No numeric values or formulas from the PDF could be recovered with available tools; none were fabricated.

### Inferences (not confirmed)
- The PDF describes an embedded/automotive-style product-development cost model (ASW/BSW, Peak CAN, Altium, J-Link). — high confidence
- Domain 4C likely concerns product-development cost estimation, not construction materials. — medium confidence (no official statement)
- A PIVOT can reuse the existing UI/architecture/engine pattern; a full rebuild is unnecessary.
- The team's construction interpretation may have been a reasonable but possibly incorrect reading of "building products".

### Unknowns
- Official problem statement, judging rubric, required inputs/outputs, methodology, AI requirement, accuracy bar, deliverables, submission rules.
- All numeric values and exact formulas in the PDF.
- Whether the PDF is an official input and how authoritative it is.
- The actual team name (brief says "SmartCoders"; the repository names none).

---

## 7. Provisional recommendation

**PIVOT — confidence: medium-low (provisional).** Preserve useful work; change the domain model and data only.

**Evidence for pivot**
- The reference PDF is a product/software-development cost model (hours, hourly rates, EUR, SW vendor, tools & licences, ASW+BSW stacks, 10 % contingency), which conflicts with the current construction-material model.
- The domain title "building products" can equally mean "products being built", which the current build does not address.

**Evidence for continue (why this is not certain)**
- The official statement is missing, so the PDF is not proven to be the assignment.
- "Building products" plausibly means construction building materials, which the repo already does well.

**Why not REBUILD**
- The app shell, UI primitives, deterministic-core architecture, TS↔Python parity pattern, API contract and tests are domain-agnostic and reusable. Discarding them would discard working, verified value.

**What would change the decision**
- Official statement = product/software-development cost → **PIVOT** (as above).
- Official statement = construction building-material cost with quantity×rate → **CONTINUE** (keep roadmap; optionally keep AI/comparison/what-if as additions).
- Official statement requires AI/ML or supplied datasets → adjust scope accordingly regardless of direction.

---

## 8. Proposed development phases (provisional — DO NOT implement yet)

Assumes PIVOT. If the official statement confirms construction materials, keep the existing roadmap and skip P0/P1.

### P0 — Obtain & record official requirements (blocking)
- **Goal:** source the official Domain 4C statement + rubric; record verbatim.
- **Features:** none (documentation).
- **Reuse:** n/a.
- **Files:** new `docs/` requirements note.
- **Dependencies:** organizers.
- **Acceptance:** statement + rubric captured; §5 statuses updated from UNKNOWN.
- **Risks:** statement unavailable/ambiguous.

### P1 — Domain model redesign (product-development cost)
- **Goal:** model the reference structure (inference, not verified spec).
- **Features:** cost elements; engineering **hours**; **Europe vs India hourly rates (€)**; **SW vendor** cost; **tools & licences**; **SW stacks (ASW+BSW)**; **10 % engineering contingency**; **tools contingency**; **Total, Phase 1 Scope**.
- **Reuse:** deterministic-core pattern, `money`/rounding, validation pattern, TS↔Python mirror, golden fixtures.
- **Files:** `src/estimation/**`, `backend/app/estimation/**`, `src/types/index.ts`, `docs/*`.
- **Acceptance:** unit tests per cost element + contingency + total; TS↔Python parity.
- **Risks:** exact formulas unknown; EUR vs INR; region basis unverified.

### P2 — UI/workflow adaptation
- **Goal:** replace material line items with cost-element inputs and a contingency-aware total.
- **Reuse:** `NewEstimatePage` shell, `LineItemsEditor` (adapted), `EstimateResultCard`, `Fields`, design tokens, store.
- **Files:** `src/pages/NewEstimatePage.tsx`, `src/components/estimates/**`, `src/store/**`, `src/constants/labels.ts`.
- **Acceptance:** typecheck/lint/test/build; manual smoke of the new flow; demo-data labels intact.
- **Risks:** scope creep; keep figures honestly labelled.

### P3 — API parity & docs
- **Goal:** update FastAPI schemas/endpoints and `docs/api-contract.md` to the new domain; keep parity tests.
- **Reuse:** `backend/app/**`, `src/api/**`, contract doc.
- **Acceptance:** pytest + ruff clean; frontend typecheck/test/build clean.

### P4 — Optional (only if officially required)
- AI/ML estimation, persistence, comparison/what-if — only if the rubric demands them.

---

## 9. Questions requiring organizer clarification

1. Verbatim Domain 4C problem statement, including exact wording of "building products".
2. Meaning of "building products": construction materials **or** products being built (product development)?
3. Is `Product_Development_Cost_calculations.pdf` an official input? If so, what role?
4. Required inputs (materials, engineering hours, BOM, drawings, datasets).
5. Expected outputs (material total, Phase 1 scope cost, contingency-inclusive total).
6. Required cost methodology (quantity × rate; hours × hourly rate; contingency rules; multi-region; currency).
7. Required data sources/datasets; are any supplied?
8. Is AI/ML explicitly required, or is a deterministic calculator acceptable?
9. Accuracy / explainability / validation expectations.
10. UI/workflow and deliverables (web app, API, report, demo).
11. Judging rubric and weightings.
12. Deployment/submission constraints and deadline.

---

## 10. Verification commands and results

Run at audit time from the repository root unless noted. No source files were modified.

| # | Command | Result |
| - | ------- | ------ |
| 1 | `git status` | clean working tree |
| 2 | `git branch -a` / `git log --oneline -15` / `git remote -v` | recorded in §2.7 |
| 3 | `npm run typecheck` | exit 0 |
| 4 | `npm run lint` | exit 0 |
| 5 | `npm test` | 5 files, 42 tests passed |
| 6 | `npm run build` | built OK (`dist/`, gitignored) |
| 7 | `python -m pytest` (backend venv, Python 3.14.0) | 44 passed, 1 deprecation warning |
| 8 | `python -m ruff check .` (backend) | passed |
| 9 | `python -m ruff format --check .` (backend) | 23 files already formatted |
| 10 | PDF text extraction (Node `zlib`, dependency-free) | labels recovered; no numeric values; none fabricated |

**Git-diff check:** only `docs/PROBLEM_VALIDATION.md` was created. No application source or unrelated files were changed; no commits, pushes, deploys, or branch changes were made.

---

## Appendix A — Files inspected this audit

| Area | Files |
| ---- | ----- |
| Git | `git status`, `branch -a`, `log --oneline -15`, `remote -v`, `rev-parse HEAD` |
| Repo structure | root listing, `src/**`, `backend/**`, `docs/**` |
| Docs | `README.md`, `AGENTS.md`, `docs/estimation-engine.md`, `docs/api-contract.md`, `docs/phase-02-integration-plan.md` |
| Frontend | `package.json`, `.gitignore`, `src/types/index.ts`, `src/constants/labels.ts`, `src/estimation/data/sampleProducts.ts`, `src/pages/NewEstimatePage.tsx` |
| Backend | venv/version probe, `backend/app/**`, `backend/tests/**` |
| Reference | `D:\Temp\Product_Development_Cost_calculations.pdf` (structure + text) |

## Appendix B — Changes made by this audit

- **Created:** `docs/PROBLEM_VALIDATION.md` (this file).
- **Changed / deleted / committed:** none.
