import { describe, expect, it } from 'vitest';
import { CURRENCY_DECIMALS, roundCurrency } from './money';

describe('roundCurrency', () => {
  it('rounds half-up to two decimal places', () => {
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(2.675)).toBe(2.68);
    expect(roundCurrency(0.005)).toBe(0.01);
  });

  it('rounds down values below the half-paise threshold', () => {
    expect(roundCurrency(10.124)).toBe(10.12);
    expect(roundCurrency(1.111)).toBe(1.11);
  });

  it('leaves already-rounded and integer values unchanged', () => {
    expect(roundCurrency(100)).toBe(100);
    expect(roundCurrency(4100)).toBe(4100);
    expect(roundCurrency(0)).toBe(0);
  });

  it('exposes the currency precision constant', () => {
    expect(CURRENCY_DECIMALS).toBe(2);
  });
});
