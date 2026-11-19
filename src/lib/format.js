const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
});

export function formatNaira(amountMinor) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) return '—';
  return nairaFormatter.format(amountMinor / 100);
}
