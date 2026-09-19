/**
 * Helper utility for Nigerian Naira formatting and mathematical BOQ calculations
 */

export function formatNaira(value: number | string | undefined | null): string {
  const num = Number(value || 0);
  if (isNaN(num)) return '₦0';
  return '₦' + num.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(value: number | string | undefined | null, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function parseFormattedNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/,/g, '').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export function calculateBoqTotals(
  items?: Array<{ qty: number; rate: number }> | null,
  poPercent: number = 15.0,
  vatPercent: number = 7.5,
  swampPremiumPercent: number = 0.0
) {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((acc, it) => acc + (Number(it?.qty || 0) * Number(it?.rate || 0)), 0);
  const swampAmount = subtotal * ((Number(swampPremiumPercent) || 0) / 100);
  const adjustedSubtotal = subtotal + swampAmount;
  const poAmount = adjustedSubtotal * ((Number(poPercent) || 0) / 100);
  const vatAmount = (adjustedSubtotal + poAmount) * ((Number(vatPercent) || 0) / 100);
  const grandTotal = adjustedSubtotal + poAmount + vatAmount;

  return {
    subtotal,
    swampAmount,
    adjustedSubtotal,
    poAmount,
    vatAmount,
    grandTotal,
  };
}
