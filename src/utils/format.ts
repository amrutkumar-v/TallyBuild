import type { CurrencyCode, Range } from '../types';

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function getCurrencyFormatter(currency: CurrencyCode, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact ? 'compact' : 'standard'}`;
  const existing = currencyFormatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
    minimumFractionDigits: 0,
  });
  currencyFormatters.set(key, formatter);
  return formatter;
}

function getNumberFormatter(compact: boolean): Intl.NumberFormat {
  const key = compact ? 'compact' : 'standard';
  const existing = numberFormatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  });
  numberFormatters.set(key, formatter);
  return formatter;
}

/** Full currency formatting, e.g. ₹42,00,000. */
export function formatCurrency(value: number, currency: CurrencyCode = 'INR'): string {
  return getCurrencyFormatter(currency, false).format(Math.round(value));
}

/** Short currency formatting for cards and charts, e.g. ₹42L. */
export function formatCurrencyShort(value: number, currency: CurrencyCode = 'INR'): string {
  return getCurrencyFormatter(currency, true).format(value);
}

export function formatNumber(value: number, compact = false): string {
  return getNumberFormatter(compact).format(value);
}

/** Signed percentage, e.g. +12% / −8%. */
export function formatSignedPercent(value: number, digits = 0): string {
  const rounded = value.toFixed(digits);
  const withSign = value > 0 ? `+${rounded}` : rounded;
  return `${withSign.replace('-', '−')}%`;
}

function getDateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  const existing = dateFormatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  dateFormatters.set(key, formatter);
  return formatter;
}

function parseIsoDate(iso: string): Date | null {
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** e.g. 14 Mar 2027 */
export function formatDate(iso: string): string {
  const date = parseIsoDate(iso) ?? new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return getDateFormatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** e.g. 14 March 2027 */
export function formatDateLong(iso: string): string {
  const date = parseIsoDate(iso) ?? new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return getDateFormatter({ day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** e.g. 5 days ago */
export function formatRelativeDays(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((now.getTime() - date.getTime()) / dayMs);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 0) return `in ${Math.abs(diffDays)} days`;
  if (diffDays < 30) return `${diffDays} days ago`;
  const months = Math.round(diffDays / 30);
  return months <= 1 ? 'a month ago' : `${months} months ago`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** e.g. "120–150 person-days" */
export function formatDays(range: Range, unit = 'person-days'): string {
  return `${formatNumber(Math.round(range.low))}–${formatNumber(Math.round(range.high))} ${unit}`;
}

/** Person-hours derived from person-days (a display conversion, not estimation). */
export function formatHours(range: Range, hoursPerDay = 8): string {
  const low = formatNumber(Math.round(range.low * hoursPerDay));
  const high = formatNumber(Math.round(range.high * hoursPerDay));
  return `${low}–${high} person-hours`;
}

/** e.g. "14–18 weeks" */
export function formatWeeks(range: Range): string {  return `${Math.round(range.low)}–${Math.round(range.high)} ${pluralize(Math.round(range.likely), 'week')}`;
}

/** e.g. "₹12L – ₹18L (likely ₹15L)" */
export function formatCostRange(
  range: Range,
  currency: CurrencyCode,
  withLikely = true,
): string {
  const bounds = `${formatCurrencyShort(range.low, currency)} – ${formatCurrencyShort(range.high, currency)}`;
  if (!withLikely) return bounds;
  return `${bounds} (likely ${formatCurrencyShort(range.likely, currency)})`;
}

/** Whole weeks between two ISO dates (rounded up, minimum 0). */
export function weeksBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = parseIsoDate(toIso) ?? new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((to.getTime() - from.getTime()) / dayMs);
  return Math.max(0, Math.ceil(days / 7));
}
