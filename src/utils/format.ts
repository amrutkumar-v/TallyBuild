const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyShort(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  if (magnitude >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }
  return currencyFormatter.format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateFormatter.format(date);
}
