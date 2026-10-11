import { apiRequest } from './client';
import type { ApiFailure, ApiResult } from './types';
import type {
  EstimateCalculation,
  ProjectEstimateRequest,
  ProjectEstimateResult,
} from '../estimation';

export function calculateEstimate(
  request: ProjectEstimateRequest,
): Promise<ApiResult<ProjectEstimateResult>> {
  return apiRequest<ProjectEstimateResult>('/estimates/calculate', {
    method: 'POST',
    body: request,
  });
}

export class ApiRequestFailure extends Error {
  readonly failure: ApiFailure;

  constructor(failure: ApiFailure) {
    super(failure.message);
    this.name = 'ApiRequestFailure';
    this.failure = failure;
  }
}

export async function calculateEstimateViaApi(
  request: ProjectEstimateRequest,
): Promise<EstimateCalculation> {
  const result = await calculateEstimate(request);
  if (result.ok) {
    return { ok: true, result: result.data };
  }
  if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
    return { ok: false, errors: result.error.details };
  }
  throw new ApiRequestFailure(result.error);
}
