import { afterEach, expect, describe, it, vi } from 'vitest';

import type { EstimateResult } from '../estimation';
import { ApiRequestFailure, calculateEstimate, calculateEstimateViaApi } from './estimates';
import { getProducts } from './products';

const RESULT: EstimateResult = {
  currency: 'INR',
  itemCount: 1,
  lineResults: [],
  subtotal: 4100,
  total: 4100,
  priceSources: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('calculateEstimate', () => {
  it('returns the estimate result on success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(RESULT)));

    const result = await calculateEstimate({ lines: [{ productId: 'cement', quantity: 10 }] });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(4100);
    }
  });

  it('exposes validation details on a 422 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Could not calculate.',
              details: [{ code: 'INVALID_QUANTITY', message: 'Negative.', lineIndex: 0 }],
            },
          },
          422,
        ),
      ),
    );

    const result = await calculateEstimate({ lines: [{ productId: 'cement', quantity: -1 }] });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toHaveLength(1);
    }
  });
});

describe('calculateEstimateViaApi', () => {
  it('wraps a successful response as an EstimateCalculation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(RESULT)));

    const calculation = await calculateEstimateViaApi({
      lines: [{ productId: 'cement', quantity: 10 }],
    });

    expect(calculation.ok).toBe(true);
    if (calculation.ok) {
      expect(calculation.result.total).toBe(4100);
    }
  });

  it('surfaces validation errors as a failed EstimateCalculation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Could not calculate.',
              details: [{ code: 'MISSING_PRODUCT', message: 'Unknown product.', lineIndex: 0 }],
            },
          },
          422,
        ),
      ),
    );

    const calculation = await calculateEstimateViaApi({
      lines: [{ productId: 'nope', quantity: 1 }],
    });

    expect(calculation.ok).toBe(false);
    if (!calculation.ok) {
      expect(calculation.errors[0].code).toBe('MISSING_PRODUCT');
    }
  });

  it('throws ApiRequestFailure for transport-level errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'Boom.' } }, 500)),
    );

    await expect(
      calculateEstimateViaApi({ lines: [{ productId: 'cement', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(ApiRequestFailure);
  });
});

describe('getProducts', () => {
  it('returns the catalogue payload', async () => {
    const payload = { count: 1, products: [{ id: 'cement', name: 'Cement', unit: 'bag' }] };
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(payload)));

    const result = await getProducts();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.count).toBe(1);
      expect(result.data.products[0].id).toBe('cement');
    }
  });
});
