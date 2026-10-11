import type {
  EstimateValidationError,
  ProjectEstimateRequest,
  ProjectEstimateResult,
} from '../estimation';

export type ApiErrorCode =
  | 'REQUEST_MALFORMED'
  | 'VALIDATION_ERROR'
  | 'CALCULATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR';

export interface ApiFailure {
  code: ApiErrorCode;
  message: string;
  status: number | null;
  details?: EstimateValidationError[];
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiFailure };

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  capabilities: { currencies: string[]; categories: string[] };
}

export type CalculateEstimateRequest = ProjectEstimateRequest;
export type CalculateEstimateResponse = ProjectEstimateResult;
