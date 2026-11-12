// Indian Financial Formatting Utilities

/**
 * Format standard currency in Indian numbering system (en-IN)
 * e.g. 1245000 -> ₹12,45,000
 */
export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Compact Indian currency representation in Lakhs (L) and Crores (Cr)
 * e.g. 15400000 -> ₹1.54 Cr, 450000 -> ₹4.50 L
 */
export function formatLakhCrore(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (abs >= 10000000) {
    const cr = (abs / 10000000).toFixed(2);
    return `${isNegative ? '-' : ''}₹${cr} Cr`;
  }
  if (abs >= 100000) {
    const l = (abs / 100000).toFixed(2);
    return `${isNegative ? '-' : ''}₹${l} L`;
  }
  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(1);
    return `${isNegative ? '-' : ''}₹${k} K`;
  }
  return formatINR(amount, false);
}

/**
 * Format percentage with positive/negative symbol
 * e.g. 14.85 -> +14.85%
 */
export function formatPercent(value: number, includeSign = true): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0.00%';
  }
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format Indian date string (e.g. "12 Nov 2026")
 */
export function formatDate(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateStr);
  }
}
