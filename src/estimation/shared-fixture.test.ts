import { describe, expect, it } from 'vitest';

import { calculateEstimate } from './calculate';
import { createCatalogue, SAMPLE_PRODUCT_CATALOGUE } from './catalogue';
import type { ProductCatalogue } from './catalogue';
import { roundCurrency } from './money';
import type { EstimateLineItem, EstimateRequest, MaterialProduct, PriceSource } from './types';
import type { MeasurementUnit } from './units';

import raw from '../../docs/fixtures/calculation-cases.json?raw';

interface FixtureProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number | string;
  priceSource: PriceSource | null;
}

interface FixtureLine {
  productId: string;
  quantity: number | string;
  unit?: string;
  label?: string;
}

interface FixtureExpectation {
  ok: boolean;
  currency?: 'INR';
  projectName?: string;
  itemCount?: number;
  lineSubtotals?: number[];
  subtotal?: number;
  total?: number;
  errorCodes?: string[];
  lineIndexes?: number[];
  productIds?: string[];
}

interface FixtureCase {
  id: string;
  description?: string;
  catalogue: 'sample' | 'custom';
  request: { projectName?: string; lines: FixtureLine[] };
  expect: FixtureExpectation;
}

interface CalculationFixture {
  rounding: { currencyDecimals: number; policy: string };
  roundingCases: { input: number; expected: number }[];
  customCatalogue: FixtureProduct[];
  cases: FixtureCase[];
}

const fixture = JSON.parse(raw) as CalculationFixture;

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function buildProduct(spec: FixtureProduct): MaterialProduct {
  return {
    id: spec.id,
    name: spec.name,
    category: spec.category,
    unit: spec.unit as MeasurementUnit,
    unitPrice: toNumber(spec.unitPrice),
    priceSource:
      spec.priceSource === null ? (undefined as unknown as PriceSource) : spec.priceSource,
  };
}

function catalogueFor(kind: FixtureCase['catalogue']): ProductCatalogue {
  if (kind === 'sample') {
    return SAMPLE_PRODUCT_CATALOGUE;
  }
  return createCatalogue(fixture.customCatalogue.map(buildProduct));
}

function buildLine(line: FixtureLine): EstimateLineItem {
  return {
    productId: line.productId,
    quantity: toNumber(line.quantity),
    ...(line.unit !== undefined ? { unit: line.unit as MeasurementUnit } : {}),
    ...(line.label !== undefined ? { label: line.label } : {}),
  };
}

function buildRequest(testCase: FixtureCase): EstimateRequest {
  return {
    lines: testCase.request.lines.map(buildLine),
    ...(testCase.request.projectName !== undefined
      ? { projectName: testCase.request.projectName }
      : {}),
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

describe('shared calculation fixture — estimate cases (source: docs/api-contract.md §9)', () => {
  it('defines at least one case for each outcome type', () => {
    expect(fixture.cases.some((testCase) => testCase.expect.ok)).toBe(true);
    expect(fixture.cases.some((testCase) => !testCase.expect.ok)).toBe(true);
  });

  for (const testCase of fixture.cases) {
    it(`${testCase.id}${testCase.description ? ` — ${testCase.description}` : ''}`, () => {
      const calculation = calculateEstimate(buildRequest(testCase), catalogueFor(testCase.catalogue));
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
        if (expected.itemCount !== undefined) {
          expect(result.itemCount).toBe(expected.itemCount);
        }
        if (expected.lineSubtotals !== undefined) {
          expect(result.lineResults.map((line) => line.lineSubtotal)).toEqual(
            expected.lineSubtotals,
          );
        }
        if (expected.subtotal !== undefined) {
          expect(result.subtotal).toBe(expected.subtotal);
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
        if (expected.lineIndexes !== undefined) {
          expect(calculation.errors.map((error) => error.lineIndex)).toEqual(expected.lineIndexes);
        }
        if (expected.productIds !== undefined) {
          expect(calculation.errors.map((error) => error.productId)).toEqual(expected.productIds);
        }
      }
    });
  }
});
