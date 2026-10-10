import { apiRequest } from './client';
import type { ApiResult, ProductListResponse } from './types';

export function getProducts(): Promise<ApiResult<ProductListResponse>> {
  return apiRequest<ProductListResponse>('/products');
}