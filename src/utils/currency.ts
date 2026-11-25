/**
 * Currency utilities using integer paise internally to avoid floating-point drift.
 * 1 INR = 100 paise.
 */

export function rupeesToPaise(input: number | string): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return 0;
    return Math.round(input * 100);
  }

  const cleaned = input.replace(/[₹,\s]/g, '').trim();
  if (!cleaned) return 0;

  const isNegative = cleaned.startsWith('-');
  const unsigned = isNegative ? cleaned.slice(1) : cleaned;
  const parts = unsigned.split('.');

  if (parts.length > 2) return 0;

  const wholePart = parts[0] ? parseInt(parts[0], 10) : 0;
  if (Number.isNaN(wholePart)) return 0;

  let fracPart = 0;
  if (parts[1] !== undefined) {
    const padded = (parts[1] + '00').slice(0, 2);
    const parsedFrac = parseInt(padded, 10);
    if (Number.isNaN(parsedFrac)) return 0;
    fracPart = parsedFrac;
  }

  const total = wholePart * 100 + fracPart;
  return isNegative ? -total : total;
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export interface FormatINROptions {
  showSign?: boolean;
  hideValue?: boolean;
  compact?: boolean;
  forceDecimals?: boolean;
}

export function formatINR(paise: number, options: FormatINROptions = {}): string {
  const { showSign = false, hideValue = false, compact = false, forceDecimals = false } =
    options;

  if (hideValue) {
    return '₹•••••';
  }

  const safePaise = Number.isFinite(paise) ? Math.trunc(paise) : 0;
  const isNegative = safePaise < 0;
  const absPaise = Math.abs(safePaise);
  const absRupees = absPaise / 100;
  const hasFractional = absPaise % 100 !== 0;

  let formatted: string;

  if (compact && absRupees >= 100000) {
    const lakhs = absRupees / 100000;
    formatted = `₹${lakhs.toFixed(lakhs >= 10 ? 1 : 2).replace(/\.0+$/, '')}L`;
  } else if (compact && absRupees >= 1000) {
    const thousands = absRupees / 1000;
    formatted = `₹${thousands.toFixed(thousands >= 10 ? 1 : 2).replace(/\.0+$/, '')}K`;
  } else {
    const decimals = forceDecimals || hasFractional ? 2 : 0;
    formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(absRupees);
  }

  if (isNegative) {
    return `−${formatted}`;
  }

  if (showSign && safePaise > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

export function formatRupeeInputValue(paise: number): string {
  if (!paise) return '';
  const rupees = paise / 100;
  return paise % 100 === 0 ? String(rupees) : rupees.toFixed(2);
}
