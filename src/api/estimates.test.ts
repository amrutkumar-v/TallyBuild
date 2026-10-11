import { afterEach, expect, describe, it, vi } from 'vitest';

import type { ProjectEstimateResult } from '../estimation';
import { ApiRequestFailure, calculateEstimate, calculateEstimateViaApi } from './estimates';

const RESULT: ProjectEstimateResult = {
  projectName: 'Atlas Platform Rebuild',
  currency: 'INR',
  personnel: {
    lines: [{ role: 'Senior engineer', people: 2, hours: 100, hourlyRate: 1500, cost: 300000 }],
    subtotal: 300000,
  },
  tooling: { lines: [], subtotal: 0 },
  infrastructure: { lines: [], subtotal: 0 },
  other: { lines: [], subtotal: 0 },
  personnelCost: 300000,
  toolingCost: 0,
  infrastructureCost: 0,
  otherCost: 0,
  lineCount: 1,
  total: 300000,
  assumptions: ['All amounts are calculated in INR.'],
};

const REQUEST = {
  currency: 'INR' as const,
  personnel: [{ role: 'Senior engineer', people: 2, hours: 100, hourlyRate: 1500 }],
  tooling: [],
  infrastructure: [],
  other: [],
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

    const result = await calculateEstimate(REQUEST);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(300000);
      expect(result.data.personnel.lines).toHaveLength(1);
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
              details: [
                { code: 'INVALID_PERSONNEL', message: 'Negative hours.', section: 'personnel', lineIndex: 0 },
              ],
            },
          },
          422,
        ),
      ),
    );

    const result = await calculateEstimate(REQUEST);

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

    const calculation = await calculateEstimateViaApi(REQUEST);

    expect(calculation.ok).toBe(true);
    if (calculation.ok) {
      expect(calculation.result.total).toBe(300000);
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
              details: [
                { code: 'INVALID_TOOLING', message: 'Bad amount.', section: 'tooling', lineIndex: 0 },
              ],
            },
          },
          422,
        ),
      ),
    );

    const calculation = await calculateEstimateViaApi(REQUEST);

    expect(calculation.ok).toBe(false);
    if (!calculation.ok) {
      expect(calculation.errors[0].code).toBe('INVALID_TOOLING');
    }
  });

  it('throws ApiRequestFailure for transport-level errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'Boom.' } }, 500)),
    );

    await expect(calculateEstimateViaApi(REQUEST)).rejects.toBeInstanceOf(ApiRequestFailure);
  });
});
