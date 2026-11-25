import type { MonthYear } from '@/types/finance';

export const FINANCIAL_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's YYYY-MM-DD date string in Asia/Kolkata.
 */
export function getTodayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FINANCIAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Returns current { year, month (1-12) } in Asia/Kolkata.
 */
export function getCurrentMonthYearIST(now: Date = new Date()): MonthYear {
  const today = getTodayIST(now);
  return parseMonthKey(today.slice(0, 7));
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(monthKey: string): MonthYear {
  const [y, m] = monthKey.split('-').map((n) => parseInt(n, 10));
  return {
    year: Number.isFinite(y) ? y : 2026,
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : 1,
  };
}

export function getMonthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Computes remaining days in target (year, month) including today, using IST date boundaries.
 * - Target month === reference month -> (daysInMonth - refDay + 1)
 * - Target month > reference month -> full daysInMonth
 * - Target month < reference month -> 0
 */
export function getRemainingDaysInMonth(
  year: number,
  month: number,
  referenceDateIST: string = getTodayIST(),
): number {
  const targetKey = toMonthKey(year, month);
  const refKey = referenceDateIST.slice(0, 7);
  const daysInMonth = getDaysInMonth(year, month);

  if (targetKey < refKey) return 0;
  if (targetKey > refKey) return daysInMonth;

  const refDay = parseInt(referenceDateIST.slice(8, 10), 10);
  return Math.max(0, daysInMonth - refDay + 1);
}

export function addMonthsToMonthYear(
  { year, month }: MonthYear,
  delta: number,
): MonthYear {
  const totalMonths = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (((totalMonths % 12) + 12) % 12) + 1;
  return { year: nextYear, month: nextMonth };
}

export function formatMonthYear(year: number, month: number, short = false): string {
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateDisplay(
  dateStr: string,
  style: 'short' | 'medium' | 'long' | 'dayHeader' = 'medium',
): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  if (style === 'short') {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
    }).format(date);
  }

  if (style === 'dayHeader') {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  if (style === 'long') {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getMonthDateBounds(
  year: number,
  month: number,
): { start: string; end: string } {
  const prefix = toMonthKey(year, month);
  const days = getDaysInMonth(year, month);
  return {
    start: `${prefix}-01`,
    end: `${prefix}-${String(days).padStart(2, '0')}`,
  };
}

export function getWeekBoundsIST(referenceDateIST: string): {
  start: string;
  end: string;
} {
  const [y, m, d] = referenceDateIST.split('-').map((n) => parseInt(n, 10));
  const ref = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = ref.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}
