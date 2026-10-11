import { describe, expect, it } from 'vitest';

import { calculateEstimate } from './calculate';
import { roundCurrency } from './money';
import type { CostSectionKey, ProjectEstimateRequest } from './types';

import raw from '../../docs/fixtures/calculation-cases.json?raw';

interface FixturePersonnel {
  role: string;
  people: number | string;
  hours: number | string;
  hourlyRate: number | string;
}

interface FixtureTooling {
  name: string;
  amount: number | string;
}

interface FixtureInfrastructure {
  name: string;
  monthlyCost: number | string;
  months: number | string;
}

interface FixtureOther {
  description: string;
  amount: number | string;
}

interface FixtureRequest {
  projectName?: string;
  currency: string;
  personnel: FixturePersonnel[];
  tooling: FixtureTooling[];
  infrastructure: FixtureInfrastructure[];
  other: FixtureOther[];
}

interface FixtureExpectation {
  ok: boolean;
  currency?: string;
  projectName?: string;
  lineCount?: number;
  personnelCost?: number;
  toolingCost?: number;
  infrastructureCost?: number;
  otherCost?: number;
  total?: number;
  errorCodes?: string[];
  sections?: string[];
  lineIndexes?: number[];
}

interface FixtureCase {
  id: string;
  description?: string;
  request: FixtureRequest;
  expect: FixtureExpectation;
}

interface CalculationFixture {
  rounding: { currencyDecimals: number; policy: string };
  roundingCases: { input: number; expected: number }[];
  cases: FixtureCase[];
}

const fixture = JSON.parse(raw) as CalculationFixture;

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function buildRequest(request: FixtureRequest): ProjectEstimateRequest {
  return {
    currency: request.currency as ProjectEstimateRequest['currency'],
    personnel: request.personnel.map((line) => ({
      role: line.role,
      people: toNumber(line.people),
      hours: toNumber(line.hours),
      hourlyRate: toNumber(line.hourlyRate),
    })),
    tooling: request.tooling.map((line) => ({
      name: line.name,
      amount: toNumber(line.amount),
    })),
    infrastructure: request.infrastructure.map((line) => ({
      name: line.name,
      monthlyCost: toNumber(line.monthlyCost),
      months: toNumber(line.months),
    })),
    other: request.other.map((line) => ({
      description: line.description,
      amount: toNumber(line.amount),
    })),
    ...(request.projectName !== undefined ? { projectName: request.projectName } : {}),
  };
}

describe('shared calculation fixture — rounding primitive', () => {
  it('uses the documented currency precision', () => {
    expect(fixture.rounding.currencyDecimals).toBe(2);
  });

  for (const roundingCase of fixture.roundingCases) {
    it(`roundCurrency(${roundingCase.input}) === ${roundingCase.expected}`, () => {
      expect(roundCurrency(roundingCase.input)).toBe(roundingCase.expected);
    });
  }
});

describe('shared calculation fixture — project estimate cases', () => {
  it('defines at least one case for each outcome type', () => {
    expect(fixture.cases.some((testCase) => testCase.expect.ok)).toBe(true);
    expect(fixture.cases.some((testCase) => !testCase.expect.ok)).toBe(true);
  });

  for (const testCase of fixture.cases) {
    it(`${testCase.id}${testCase.description ? ` — ${testCase.description}` : ''}`, () => {
      const calculation = calculateEstimate(buildRequest(testCase.request));
      const expected = testCase.expect;

      expect(calculation.ok).toBe(expected.ok);

      if (expected.ok) {
        expect(calculation.ok).toBe(true);
        if (!calculation.ok) return;
        const { result } = calculation;
        if (expected.currency !== undefined) {
          expect(result.currency).toBe(expected.currency);
        }
        if (expected.projectName !== undefined) {
          expect(result.projectName).toBe(expected.projectName);
        }
        if (expected.lineCount !== undefined) {
          expect(result.lineCount).toBe(expected.lineCount);
        }
        if (expected.personnelCost !== undefined) {
          expect(result.personnelCost).toBe(expected.personnelCost);
        }
        if (expected.toolingCost !== undefined) {
          expect(result.toolingCost).toBe(expected.toolingCost);
        }
        if (expected.infrastructureCost !== undefined) {
          expect(result.infrastructureCost).toBe(expected.infrastructureCost);
        }
        if (expected.otherCost !== undefined) {
          expect(result.otherCost).toBe(expected.otherCost);
        }
        if (expected.total !== undefined) {
          expect(result.total).toBe(expected.total);
        }
      } else {
        expect(calculation.ok).toBe(false);
        if (calculation.ok) return;
        if (expected.errorCodes !== undefined) {
          expect(calculation.errors.map((error) => error.code)).toEqual(expected.errorCodes);
        }
        if (expected.sections !== undefined) {
          expect(calculation.errors.map((error) => error.section as CostSectionKey)).toEqual(
            expected.sections,
          );
        }
        if (expected.lineIndexes !== undefined) {
          expect(calculation.errors.map((error) => error.lineIndex)).toEqual(
            expected.lineIndexes,
          );
        }
      }
    });
  }
});
