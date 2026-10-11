import type { EstimateValidationError } from '../estimation';
import type { ApiErrorCode, ApiFailure, ApiResult } from './types';

const DEFAULT_TIMEOUT_MS = 15_000;

const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  'REQUEST_MALFORMED',
  'VALIDATION_ERROR',
  'ESTIMATE_NOT_FOUND',
  'CALCULATION_ERROR',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
]);

function resolveBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.replace(/\/+$/, '');
  }
  return '/api/v1';
}

export const API_BASE_URL = resolveBaseUrl();

export interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
}

interface ParsedBody {
  parsed: unknown;
  malformed: boolean;
}

async function readBody(response: Response): Promise<ParsedBody> {
  const text = await response.text();
  if (text === '') {
    return { parsed: null, malformed: false };
  }
  try {
    return { parsed: JSON.parse(text) as unknown, malformed: false };
  } catch {
    return { parsed: null, malformed: true };
  }
}

interface Envelope {
  code: unknown;
  message: unknown;
  details: unknown;
}

function parseEnvelope(payload: unknown): Envelope | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const outer = payload as { error?: unknown };
  if (typeof outer.error !== 'object' || outer.error === null) {
    return null;
  }
  const source = outer.error as Envelope;
  return {
    code: source.code,
    message: source.message,
    details: source.details,
  };
}

function isNonFiniteResultDetail(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  return (item as { code?: unknown }).code === 'NON_FINITE_RESULT';
}

function toApiFailure(
  status: number,
  envelope: Envelope | null,
  unreadable: boolean,
): ApiFailure {
  if (unreadable) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'The estimation service returned an unreadable response.',
      status,
    };
  }

  const rawDetails = Array.isArray(envelope?.details) ? envelope?.details : undefined;
  const details = rawDetails as EstimateValidationError[] | undefined;
  const hasNonFiniteResult =
    Array.isArray(rawDetails) && rawDetails.some(isNonFiniteResultDetail);

  let code: ApiErrorCode = 'INTERNAL_ERROR';
  if (typeof envelope?.code === 'string' && KNOWN_ERROR_CODES.has(envelope.code)) {
    code = envelope.code as ApiErrorCode;
  }
  if (status === 500 && (code === 'CALCULATION_ERROR' || hasNonFiniteResult)) {
    code = 'CALCULATION_ERROR';
  }

  const message =
    typeof envelope?.message === 'string'
      ? envelope.message
      : 'The estimation service could not complete the request.';

  return { code, message, status, details };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const init: RequestInit = { method, headers, signal: controller.signal };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, init);
    const { parsed, malformed } = await readBody(response);

    if (!response.ok) {
      return {
        ok: false,
        error: toApiFailure(response.status, parseEnvelope(parsed), malformed),
      };
    }

    if (malformed) {
      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'The estimation service returned an unreadable response.',
          status: response.status,
        },
      };
    }

    return { ok: true, data: parsed as T };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: timedOut
          ? 'The estimation service took too long to respond.'
          : "Can't reach the estimation service. Check that the backend is running.",
        status: null,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}