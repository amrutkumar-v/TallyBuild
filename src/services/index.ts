import { mockEstimateService } from './mockAdapter';
import { apiBaseUrl, httpEstimateService } from './httpAdapter';
import type { EstimateService } from './api';

export type AdapterMode = 'mock' | 'api';

/**
 * Active data source for the whole UI.
 *
 * - `mock` — local, clearly-labelled illustrative data (default until the
 *   backend contract is confirmed and `VITE_API_BASE_URL` is provided).
 * - `api`  — real backend via the HTTP adapter.
 */
export const adapterMode: AdapterMode = apiBaseUrl ? 'api' : 'mock';

export const estimateService: EstimateService =
  adapterMode === 'api' ? httpEstimateService : mockEstimateService;

export { errorMessage } from './api';
export type { EstimatePatch, EstimateService } from './api';
