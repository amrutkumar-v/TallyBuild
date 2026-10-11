import type {
  Estimate,
  Feature,
  ProjectInput,
  ScenarioInput,
  ScenarioResult,
} from '../types';

/**
 * Patch accepted by `updateEstimate`. Only the editable parts of an estimate
 * (scope, assumptions, gaps, inputs) can be changed from the UI.
 */
export interface EstimatePatch {
  input?: Partial<ProjectInput>;
  features?: Feature[];
  assumptions?: string[];
  missingRequirements?: string[];
}

/**
 * The single service contract the UI talks to. Two implementations exist:
 *
 * - `mockAdapter`  — local, clearly-labelled illustrative data (ACTIVE by default).
 * - `httpAdapter`  — real REST calls; requires `VITE_API_BASE_URL` and the
 *   backend team's confirmed contract (see `docs/frontend-api-contract.md`).
 *
 * Swapping adapters requires no UI changes.
 */
export interface EstimateService {
  listEstimates(): Promise<Estimate[]>;
  getEstimate(id: string): Promise<Estimate | null>;
  createEstimate(input: ProjectInput): Promise<Estimate>;
  updateEstimate(id: string, patch: EstimatePatch): Promise<Estimate>;
  deleteEstimate(id: string): Promise<void>;
  /** Run (or re-run) the estimate over the current scope. */
  runEstimate(id: string): Promise<Estimate>;
  /** Evaluate one what-if scenario against the stored baseline. */
  runScenario(estimateId: string, input: ScenarioInput): Promise<ScenarioResult>;
  removeScenario(estimateId: string, scenarioId: string): Promise<void>;
}

/** Thrown by the HTTP adapter when the API base URL is not configured. */
export class ApiNotConfiguredError extends Error {
  constructor() {
    super(
      'API base URL is not configured. Set VITE_API_BASE_URL once the backend contract is confirmed.',
    );
    this.name = 'ApiNotConfiguredError';
  }
}

/** Normalise any thrown value into a user-facing message. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while talking to the data source.';
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
