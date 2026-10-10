import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { EstimateResultCard } from './EstimateResultCard';
import type { ResultState } from './EstimateResultCard';
import type { Estimate } from '../../types';
import type { EstimateResult, PriceSource } from '../../estimation';
import { formatCurrency } from '../../utils/format';

const PRICE_SOURCE: PriceSource = {
  label: 'Illustrative demo data — not a verified market price',
  priceDate: '2026-09-01',
  currency: 'INR',
  isIllustrative: true,
};

const ESTIMATE: Estimate = {
  id: 'local-test-1',
  projectName: 'Riverside Villa Extension',
  location: 'Bengaluru, Karnataka',
  projectType: 'residential',
  createdAt: '2026-10-10T00:00:00.000Z',
  estimatedAmount: 131200,
  status: 'draft',
  origin: 'local',
};

const RESULT: EstimateResult = {
  projectName: 'Riverside Villa Extension',
  currency: 'INR',
  itemCount: 1,
  lineResults: [
    {
      productId: 'cement-opc-53-grade',
      productName: 'OPC 53 Grade Cement',
      category: 'Cement',
      unit: 'bag',
      quantity: 320,
      unitPrice: 410,
      lineSubtotal: 131200,
      priceSource: PRICE_SOURCE,
    },
  ],
  subtotal: 131200,
  total: 131200,
  priceSources: [PRICE_SOURCE],
};

function render(state: ResultState): string {
  return renderToString(
    createElement(
      MemoryRouter,
      null,
      createElement(EstimateResultCard, { state, onRetry: () => {} }),
    ),
  );
}

describe('EstimateResultCard', () => {
  it('renders nothing in the idle state', () => {
    expect(render({ kind: 'idle' })).toBe('');
  });

  it('shows a busy status while calculating', () => {
    expect(render({ kind: 'loading' })).toContain('Calculating your estimate');
  });

  it('renders line items, the total and the illustrative price notice on success', () => {
    const html = render({ kind: 'success', estimate: ESTIMATE, result: RESULT });

    expect(html).toContain('Estimated total');
    expect(html).toContain(formatCurrency(RESULT.total));
    expect(html).toContain('OPC 53 Grade Cement');
    expect(html).toContain('Cement');
    expect(html).toContain('illustrative demo prices');
  });

  it('renders a transport error with a retry action and no total', () => {
    const html = render({
      kind: 'error',
      error: {
        code: 'NETWORK_ERROR',
        message: 'Estimate service unavailable.',
        status: null,
      },
    });

    expect(html).toContain('Estimate not calculated');
    expect(html).toContain('Estimate service unavailable.');
    expect(html).toContain('Try again');
    expect(html).not.toContain('Estimated total');
  });

  it('renders a validation-error summary without a total', () => {
    const html = render({
      kind: 'validation-error',
      message: 'Some material lines were rejected.',
    });

    expect(html).toContain('Estimate not calculated');
    expect(html).toContain('Some material lines were rejected.');
    expect(html).not.toContain(formatCurrency(131200));
  });
});
