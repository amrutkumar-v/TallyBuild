import { apiRequest } from './client';
import type { ApiResult, HealthResponse } from './types';

export function getHealth(): Promise<ApiResult<HealthResponse>> {
  return apiRequest<HealthResponse>('/health');
}