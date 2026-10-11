import { describe, expect, it } from 'vitest';
import { calculateEstimate, validateEstimateRequest } from './calculate';

describe('calculateEstimate — cost categories', () => {
  it('computes personnel cost as people x hours × rate', () => {
    const calculation = calculateEstimate({
      currency: 'USD',
      personnel: [{ role: 'Engineer', people: 2, hours: 100, hourlyRate: 50 }],
      tooling: [],
      infrastructure: [],
      other: [],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.personnelCost).toBe(10000);
    expect(calculation.result.personnel.lines[0].cost).toBe(10000);
    expect(calculation.result.total).toBe(10000);
  });

  it('computes tooling, infrastructure and other costs and sums the total', () => {
    const calculation = calculateEstimate({
      projectName: 'Platform build',
      currency: 'EUR',
      personnel: [{ role: 'Lead', people: 1, hours: 200, hourlyRate: 80 }],
      tooling: [{ name: 'Design suite', amount: 1200 }],
      infrastructure: [{ name: 'Cloud', monthlyCost: 900, months: 6 }],
      other: [{ description: 'Licence transfer', amount: 500 }],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    const { result } = calculation;
    expect(result.personnelCost).toBe(16000);
    expect(result.toolingCost).toBe(1200);
    expect(result.infrastructureCost).toBe(5400);
    expect(result.otherCost).toBe(500);
    expect(result.total).toBe(23100);
    expect(result.lineCount).toBe(4);
    expect(result.currency).toBe('EUR');
    expect(result.projectName).toBe('Platform build');
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it('accepts zero values as valid lines', () => {
    const calculation = calculateEstimate({
      currency: 'INR',
      personnel: [{ role: 'Intern', people: 0, hours: 0, hourlyRate: 0 }],
      tooling: [],
      infrastructure: [],
      other: [],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.total).toBe(0);
  });
});

describe('calculateEstimate — validation', () => {
  it('rejects an unsupported currency', () => {
    const calculation = calculateEstimate({
      currency: 'GBP' as never,
      personnel: [{ role: 'Engineer', people: 1, hours: 1, hourlyRate: 1 }],
      tooling: [],
      infrastructure: [],
      other: [],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('UNSUPPORTED_CURRENCY');
  });

  it('rejects an empty request', () => {
    const errors = validateEstimateRequest({
      currency: 'INR',
      personnel: [],
      tooling: [],
      infrastructure: [],
      other: [],
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('EMPTY_REQUEST');
  });

  it('reports missing roles and negative numbers per line', () => {
    const calculation = calculateEstimate({
      currency: 'INR',
      personnel: [{ role: '   ', people: -1, hours: 10, hourlyRate: 20 }],
      tooling: [{ name: 'Suite', amount: -5 }],
      infrastructure: [],
      other: [],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors.some((error) => error.code === 'INVALID_PERSONNEL')).toBe(true);
    expect(calculation.errors.some((error) => error.code === 'INVALID_TOOLING')).toBe(true);
    const personnelError = calculation.errors.find((error) => error.code === 'INVALID_PERSONNEL');
    expect(personnelError?.section).toBe('personnel');
    expect(personnelError?.lineIndex).toBe(0);
  });

  it('rejects non-finite numbers as invalid, not as non-finite results', () => {
    const calculation = calculateEstimate({
      currency: 'USD',
      personnel: [{ role: 'Engineer', people: Number.NaN, hours: 10, hourlyRate: 20 }],
      tooling: [],
      infrastructure: [],
      other: [],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors.every((error) => error.code === 'INVALID_PERSONNEL')).toBe(true);
  });

  it('flags invalid infrastructure and other lines', () => {
    const calculation = calculateEstimate({
      currency: 'AED',
      personnel: [],
      tooling: [],
      infrastructure: [{ name: '', monthlyCost: -1, months: -2 }],
      other: [{ description: '', amount: -1 }],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors.some((error) => error.code === 'INVALID_INFRASTRUCTURE')).toBe(true);
    expect(calculation.errors.some((error) => error.code === 'INVALID_OTHER')).toBe(true);
  });
});

describe('calculateEstimate — rounding policy', () => {
  it('rounds each line before summing section totals', () => {
    const calculation = calculateEstimate({
      currency: 'USD',
      personnel: [],
      tooling: [
        { name: 'Half', amount: 0.005 },
        { name: 'Half again', amount: 0.005 },
      ],
      infrastructure: [],
      other: [],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.tooling.lines.map((line) => line.cost)).toEqual([0.01, 0.01]);
    expect(calculation.result.toolingCost).toBe(0.02);
    expect(calculation.result.total).toBe(0.02);
  });

  it('rounds fractional personnel and infrastructure costs to 2 decimals', () => {
    const calculation = calculateEstimate({
      currency: 'USD',
      personnel: [{ role: 'Engineer', people: 1, hours: 3, hourlyRate: 33.333 }],
      tooling: [],
      infrastructure: [{ name: 'Cloud', monthlyCost: 0.004, months: 1 }],
      other: [],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.personnelCost).toBe(100);
    expect(calculation.result.infrastructureCost).toBe(0);
    expect(calculation.result.total).toBe(100);
  });
});
