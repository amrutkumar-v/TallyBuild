import type { CurrencyCode } from '../estimation/currencies';

const LOCALES: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  AED: 'en-AE',
};

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: CurrencyCode, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact ? 'short' : 'long'}`;
  const cached = currencyFormatterCache.get(key);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  });
  currencyFormatterCache.set(key, formatter);
  return formatter;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(value: number, currency: CurrencyCode = 'INR'): string {
  return getCurrencyFormatter(currency, false).format(value);
}

export function formatCurrencyShort(value: number, currency: CurrencyCode = 'INR'): string {
  return getCurrencyFormatter(currency, true).format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateFormatter.format(date);
}
