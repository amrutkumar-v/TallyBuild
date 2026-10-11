export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'AED'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  INR: 'Indian Rupee (INR)',
  USD: 'US Dollar (USD)',
  EUR: 'Euro (EUR)',
  AED: 'UAE Dirham (AED)',
};

export const CURRENCY_OPTIONS: ReadonlyArray<{ value: CurrencyCode; label: string }> =
  SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: CURRENCY_LABELS[code] }));

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
