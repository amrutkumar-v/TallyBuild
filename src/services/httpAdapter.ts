/**
 * HTTP adapter — the real backend integration path.
 *
 * ⚠️ NOT ACTIVE YET. The backend contract is still being agreed with the
 * backend owners (Amrut / Manju / Harshith). This adapter implements the
 * endpoints and payloads documented in `docs/frontend-api-contract.md`; it
 * activates automatically as soon as `VITE_API_BASE_URL` is set, and it is the
 * ONLY place that should know about URLs, verbs and wire formats.
 */
import type { Estimate, ScenarioInput, ScenarioResult } from '../types';
import { ApiNotConfiguredError } from './api';
import type { EstimatePatch, EstimateService } from './api';

function readBaseUrl(): string | undefined {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  const raw = meta.env?.VITE_API_BASE_URL;
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim().replace(/\/+$/, '') : undefined;
}

export const apiBaseUrl: string | undefined = readBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = readBaseUrl();
  if (!baseUrl) throw new ApiNotConfiguredError();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Could not reach the estimation API. Check the connection and try again.');
  }

  if (!response.ok) {
    let detail = `The API responded with ${response.status}.`;
    try {
      const body = (await response.json()) as { detail?: unknown; message?: unknown };
      const message = body.detail ?? body.message;
      if (typeof message === 'string') detail = message;
    } catch {
      // Non-JSON error body; keep the status message.
    }
    throw new Error(detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Expected endpoints (pending backend confirmation):
 *
 *   GET    /estimates                 -> { estimates: Estimate[] }
 *   POST   /estimates                 <- CreateEstimateRequest -> Estimate
 *   GET    /estimates/{id}            -> Estimate
 *   PATCH  /estimates/{id}            <- EstimatePatch -> Estimate
 *   DELETE /estimates/{id}            -> 204
 *   POST   /estimates/{id}/run        -> Estimate (with result)
 *   POST   /estimates/{id}/scenarios  <- ScenarioInput -> ScenarioResult
 *   DELETE /estimates/{id}/scenarios/{scenarioId} -> 204
 */
export const httpEstimateService: EstimateService = {
  listEstimates: () => request<{ estimates: Estimate[] }>('/estimates').then((r) => r.estimates),
  getEstimate: (id) =>
    request<Estimate>(`/estimates/${encodeURIComponent(id)}`).catch((error: unknown) => {
      if (error instanceof Error && /404/.test(error.message)) return null;
      throw error;
    }),
  createEstimate: (input) =>
    request<Estimate>('/estimates', { method: 'POST', body: JSON.stringify(input) }),
  updateEstimate: (id: string, patch: EstimatePatch) =>
    request<Estimate>(`/estimates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteEstimate: (id) =>
    request<void>(`/estimates/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  runEstimate: (id) =>
    request<Estimate>(`/estimates/${encodeURIComponent(id)}/run`, { method: 'POST' }),
  runScenario: (estimateId: string, input: ScenarioInput) =>
    request<ScenarioResult>(`/estimates/${encodeURIComponent(estimateId)}/scenarios`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  removeScenario: (estimateId, scenarioId) =>
    request<void>(
      `/estimates/${encodeURIComponent(estimateId)}/scenarios/${encodeURIComponent(scenarioId)}`,
      { method: 'DELETE' },
    ),
};

