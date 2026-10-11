import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

import { EstimatesContext } from '../store/estimates-context';
import type { EstimatesContextValue } from '../store/estimates-context';
import type { Estimate, EstimateResult, ProjectInput } from '../types';

export function makeInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    projectName: 'Test project',
    requirements: 'A sufficiently detailed brief used only for testing the assistant.',
    projectType: 'web-app',
    complexity: 'medium',
    targetDeadline: '2027-01-01',
    teamSize: 4,
    teamLocation: 'india',
    blendedRatePerDay: 9000,
    currency: 'INR',
    constraints: [],
    ...overrides,
  };
}

export function makeResult(overrides: Partial<EstimateResult> = {}): EstimateResult {
  return {
    effortDays: { low: 40, likely: 50, high: 68 },
    durationWeeks: { low: 3, likely: 4, high: 5 },
    cost: { low: 360000, likely: 450000, high: 612000 },
    currency: 'INR',
    blendedRatePerDay: 9000,
    teamAssumptions: [{ role: 'Engineer', count: 4, allocationPercent: 60 }],
    featureCosts: [
      {
        featureId: 'feat-1',
        name: 'Core build',
        effortDays: { low: 20, likely: 25, high: 34 },
        cost: { low: 180000, likely: 225000, high: 306000 },
      },
    ],
    milestones: [],
    assumptions: ['Illustrative assumption for tests.'],
    confidence: 'medium',
    generatedAt: new Date().toISOString(),
    source: 'mock-adapter',
    ...overrides,
  };
}

export function makeEstimate(overrides: Partial<Estimate> = {}): Estimate {
  const now = new Date().toISOString();
  return {
    id: 'est-test-1',
    origin: 'user',
    stage: 'estimated',
    createdAt: now,
    updatedAt: now,
    input: makeInput(),
    features: [],
    assumptions: [],
    missingRequirements: [],
    result: makeResult(),
    scenarios: [],
    ...overrides,
  };
}

export function makeContext(overrides: Partial<EstimatesContextValue> = {}): EstimatesContextValue {
  return {
    status: 'ready',
    error: null,
    estimates: [],
    getEstimate: () => undefined,
    reload: async () => {},
    createEstimate: async () => makeEstimate(),
    updateEstimate: async () => makeEstimate(),
    removeEstimate: async () => {},
    runEstimate: async () => makeEstimate(),
    runScenario: async () => {
      throw new Error('runScenario is not used by the assistant');
    },
    removeScenario: async () => {},
    ...overrides,
  };
}

export function renderWithEstimates(
  ui: ReactElement,
  value: EstimatesContextValue = makeContext(),
): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <EstimatesContext.Provider value={value}>{ui}</EstimatesContext.Provider>
    </MemoryRouter>,
  );
}
