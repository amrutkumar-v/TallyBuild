# Manual smoke test — TallyBuild AI

**Purpose:** a reproducible, human-run check of the primary estimate-creation workflow. This is
a **manual** procedure, not automated end-to-end coverage. No browser-automation tool
(Playwright/Cypress/Puppeteer) is installed in this repository, and Phase 2F is not permitted to
install one.

**Area under test:** New Estimate flow — catalogue load → material lines → calculate → result,
plus validation, API-error and offline behaviour.

## Prerequisites

- Node.js (matching the project's toolchain) and dependencies installed: `npm install`.
- The backend virtual environment at `backend\.venv`.

## 1. Start the backend

From `backend/` with the venv activated (or use the venv's interpreter directly):

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Check the health endpoint:

```powershell
Invoke-RestMethod http://localhost:8000/api/v1/health
```

**Expected:** `status = ok`, `service = tallybuild-api`, `catalogue.products = 9`,
`catalogue.currency = INR`.

## 2. Start the frontend

From the repository root:

```powershell
npm run dev
```

Open `http://localhost:5173`.

**Expected:** the dashboard loads with no console errors.

## 3. Online happy path

1. Open **New Estimate**.
2. **Expected:** the product picker loads the 9 illustrative products (no "offline" banner);
   the in-page note reads that unit prices refresh from the estimation service.
3. Enter **Project name** (e.g. `Riverside Villa Extension`), **Location**
   (e.g. `Bengaluru, Karnataka`), choose a **Project type**, leave notes blank.
4. Add a material line: choose **OPC 53 Grade Cement**, quantity `320`.
5. Add a second line: choose **TMT Steel Bar Fe500**, quantity `4.5`.
6. Click **Calculate estimate**.
7. **Expected:** a **Cost estimate** card appears showing:
   - per-line subtotals (cement `₹1,31,200`; steel `₹3,06,000`),
   - an **Estimated total** of `₹4,37,200`,
   - an "illustrative demo prices" notice,
   - a "Draft saved to this browser with the calculated total" message.
8. Open the browser Network tab and confirm `POST /api/v1/estimates/calculate` returned `200`.
9. Open **Estimates**: the saved draft appears in the list.

## 4. Input validation

1. On **New Estimate**, click **Calculate estimate** with empty fields.
   **Expected:** inline required-field errors; focus moves to the first invalid field; no request
   is sent.
2. Enter a **negative quantity** (e.g. `-5`) on a line and calculate.
   **Expected:** "Quantity can't be negative." appears on that line.
3. Fill a valid project with one valid line and calculate.
   **Expected:** the estimate succeeds (validation must not block valid input).

## 5. Offline / demo fallback

1. Stop the backend (Ctrl+C in the uvicorn terminal).
2. Reload **New Estimate**.
   **Expected:**
   - an "offline — illustrative demo catalogue" notice is shown,
   - **Calculate estimate** is disabled with the reason "… live pricing is paused …",
   - **no** total is displayed anywhere (nothing is fabricated),
   - **Save draft estimate** still works (saves an **unpriced** draft, `estimatedAmount` null).
3. Restart the backend and press **Retry** in the notice.
   **Expected:** the catalogue reloads and the offline notice disappears.

## 6. API-error handling (server reachable but failing)

1. With the backend running, open DevTools → Network and block (or offline-throttle) the
   request to `/api/v1/estimates/calculate`, then click **Calculate estimate**.
2. **Expected:** an **"Estimate not calculated"** card with a **Try again** action; no total is
   shown.

## Sign-off

| Check | Result |
| ----- | ------ |
| Backend health OK | |
| Catalogue loads (9 products) | |
| Estimate calculates and displays labelled totals | |
| Required-field validation blocks submit | |
| Negative quantity is rejected | |
| Offline mode disables calculation and fabricates no total | |
| Transport error shows a retryable error card | |
| Saved draft appears in Estimates | |
