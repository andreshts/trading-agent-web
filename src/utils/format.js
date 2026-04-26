export function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMoney(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value, digits = 4) {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function formatUpdatedAt(value) {
  if (!value) return 'Sin actualizar';
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
