import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { EstimateResultCard } from './EstimateResultCard';
import type { ResultState } from './EstimateResultCard';
import type { Estimate } from '../../types';
import type { ProjectEstimateResult } from '../../estimation';
import { formatCurrency } from '../../utils/format';

const ESTIMATE: Estimate = {
  id: 'local-test-1',
  projectName: 'Atlas Platform Rebuild',
  scope: 'Re-platform the billing core.',
  category: 'platform',
  complexity: 'high',
  currency: 'INR',
  createdAt: '2026-10-10T00:00:00.000Z',
  plannedStartDate: '2026-11-01',
  durationWeeks: 12,
  estimatedAmount: 385000,
  actualAmount: null,
  status: 'draft',
  origin: 'local',
};

const RESULT: ProjectEstimateResult = {
  projectName: 'Atlas Platform Rebuild',
  currency: 'INR',
  personnel: {
    lines: [{ role: 'Senior engineer', people: 2, hours: 100, hourlyRate: 1500, cost: 300000 }],
    subtotal: 300000,
  },
  tooling: { lines: [{ name: 'Design suite', amount: 20000, cost: 20000 }], subtotal: 20000 },
  infrastructure: {
    lines: [{ name: 'Cloud hosting', monthlyCost: 5000, months: 6, cost: 30000 }],
    subtotal: 30000,
  },
  other: { lines: [{ description: 'Contingency', amount: 35000, cost: 35000 }], subtotal: 35000 },
  personnelCost: 300000,
  toolingCost: 20000,
  infrastructureCost: 30000,
  otherCost: 35000,
  lineCount: 4,
  total: 385000,
  assumptions: ['All amounts are calculated in INR.'],
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
  it('shows an explainer in the idle state', () => {
    const html = render({ kind: 'idle' });
    expect(html).toContain('Cost estimate');
    expect(html).not.toContain('Estimated total');
  });

  it('shows a busy status while calculating', () => {
    expect(render({ kind: 'loading' })).toContain('Calculating this estimate');
  });

  it('renders every cost section, the total and assumptions on success', () => {
    const html = render({ kind: 'success', estimate: ESTIMATE, result: RESULT });

    expect(html).toContain('Estimated total');
    expect(html).toContain(formatCurrency(RESULT.total, 'INR'));
    expect(html).toContain('Senior engineer');
    expect(html).toContain('Personnel');
    expect(html).toContain('Design suite');
    expect(html).toContain('Cloud hosting');
    expect(html).toContain('Contingency');
    expect(html).toContain('Assumptions');
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
      message: 'Some cost lines were rejected.',
    });

    expect(html).toContain('Estimate not calculated');
    expect(html).toContain('Some cost lines were rejected.');
    expect(html).not.toContain(formatCurrency(385000, 'INR'));
  });
});
