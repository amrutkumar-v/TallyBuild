export const CURRENCY_DECIMALS = 2;

export function roundCurrency(value: number): number {
  const factor = 10 ** CURRENCY_DECIMALS;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
