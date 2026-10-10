import type {
  EstimateResult,
  EstimateValidationError,
  MaterialProduct,
} from '../estimation';

export type ApiErrorCode =
  | 'REQUEST_MALFORMED'
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'ESTIMATE_NOT_FOUND'
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
  catalogue: { products: number; currency: 'INR' };
}

export interface ProductListResponse {
  count: number;
  products: MaterialProduct[];
}

export type CalculateEstimateRequest = import('../estimation').EstimateRequest;
export type CalculateEstimateResponse = EstimateResult;