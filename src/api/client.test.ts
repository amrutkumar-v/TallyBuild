import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_BASE_URL, apiRequest } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function stubFetch(implementation: FetchLike): ReturnType<typeof vi.fn> {
  const mock = vi.fn(implementation);
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('apiRequest', () => {
  it('returns data for a successful response', async () => {
    const mock = stubFetch(async () => jsonResponse({ hello: 'world' }));

    const result = await apiRequest<{ hello: string }>('/ping');

    expect(result).toEqual({ ok: true, data: { hello: 'world' } });
    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/ping`);
    expect(init.method).toBe('GET');
  });

  it('serializes a POST body and sets the content type', async () => {
    const mock = stubFetch(async () => jsonResponse({ ok: true }));

    await apiRequest('/estimates/calculate', {
      method: 'POST',
      body: { lines: [{ productId: 'x', quantity: 2 }] },
    });

    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/estimates/calculate`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ lines: [{ productId: 'x', quantity: 2 }] }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('maps a 422 validation envelope with details', async () => {
    stubFetch(async () =>
      jsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The estimate could not be calculated.',
            details: [
              { code: 'INVALID_QUANTITY', message: 'Line 1: bad quantity.', lineIndex: 0 },
            ],
          },
        },
        422,
      ),
    );

    const result = await apiRequest('/estimates/calculate', { method: 'POST', body: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.status).toBe(422);
      expect(result.error.details).toHaveLength(1);
    }
  });

  it('maps a 400 response to REQUEST_MALFORMED', async () => {
    stubFetch(async () =>
      jsonResponse({ error: { code: 'REQUEST_MALFORMED', message: 'Bad request.' } }, 400),
    );

    const result = await apiRequest('/estimates/calculate', { method: 'POST', body: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('REQUEST_MALFORMED');
    }
  });

  it('maps a 500 with a non-finite result detail to CALCULATION_ERROR', async () => {
    stubFetch(async () =>
      jsonResponse(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Calculation failed.',
            details: [{ code: 'NON_FINITE_RESULT', message: 'Total overflowed.' }],
          },
        },
        500,
      ),
    );

    const result = await apiRequest('/estimates/calculate', { method: 'POST', body: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CALCULATION_ERROR');
      expect(result.error.status).toBe(500);
    }
  });

  it('maps a generic 500 response to INTERNAL_ERROR', async () => {
    stubFetch(async () => jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'Oops.' } }, 500));

    const result = await apiRequest('/ping');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
    }
  });

  it('maps a 503 response to SERVICE_UNAVAILABLE', async () => {
    stubFetch(async () =>
      jsonResponse({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Down for maintenance.' } }, 503),
    );

    const result = await apiRequest('/ping');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
    }
  });

  it('returns NETWORK_ERROR when fetch rejects', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await apiRequest('/ping');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.status).toBeNull();
    }
  });

  it('returns NETWORK_ERROR when the request times out', async () => {
    stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );

    const result = await apiRequest('/slow', { timeoutMs: 5 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.message).toContain('too long');
    }
  });

  it('returns INTERNAL_ERROR when a success body is unreadable', async () => {
    stubFetch(async () => new Response('not json', { status: 200 }));

    const result = await apiRequest('/ping');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
    }
  });
});
