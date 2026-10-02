export function money(amount: number, currency: string, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount) + ' ' + currency;
  }
}
export function date(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime())
    ? 'Unknown date'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
export function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}
// Cart estimates use integer cents; authoritative order totals always come from Ordering.
export function cartTotals(items: { unitPrice: number; quantity: number; currency: string }[]) {
  const totals = new Map<string, number>();
  for (const item of items)
    totals.set(
      item.currency,
      (totals.get(item.currency) ?? 0) + Math.round(item.unitPrice * 100) * item.quantity,
    );
  return [...totals].map(([currency, cents]) => ({ currency, amount: cents / 100 }));
}
