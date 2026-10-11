import { StatusCategory } from './types';

export interface FormattedDueDate {
  label: string;
  isOverdue: boolean;
}

/**
 * Formats an ISO-8601 UTC due date string into a local display label,
 * and determines if the task is overdue relative to a reference date.
 * Tasks in a 'done' category are never considered overdue.
 */
export function formatDueDate(
  dueDate: string | null | undefined,
  statusCategory: StatusCategory,
  referenceDate: Date = new Date()
): FormattedDueDate | null {
  if (!dueDate || typeof dueDate !== 'string' || dueDate.trim() === '') {
    return null;
  }

  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC', // Seed dates are strict ISO UTC timestamps
  });
  const label = formatter.format(date);

  if (statusCategory === 'done') {
    return { label, isOverdue: false };
  }

  // Compare calendar dates (midnight UTC vs midnight UTC)
  const dueMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  const refMidnight = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  const isOverdue = dueMidnight < refMidnight;

  return {
    label,
    isOverdue,
  };
}

/**
 * Converts a native <input type="date"> string ("YYYY-MM-DD") representing a
 * calendar day into a canonical UTC ISO-8601 string ("YYYY-MM-DDT00:00:00.000Z").
 * Returns null if empty/invalid.
 */
export function dateInputToIso(
  dateInput: string | null | undefined
): string | null {
  if (!dateInput || typeof dateInput !== 'string') {
    return null;
  }

  const trimmed = dateInput.trim();
  if (trimmed === '') {
    return null;
  }

  const parts = trimmed.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  // Construct UTC midnight date so that calendar date is invariant across all timezones
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (Number.isNaN(utcDate.getTime())) {
    return null;
  }

  return utcDate.toISOString();
}

/**
 * Converts a canonical UTC ISO-8601 string into a "YYYY-MM-DD" string
 * suitable for native <input type="date">. Uses UTC date components so calendar
 * dates are preserved regardless of client timezone. Returns empty string if empty/invalid.
 */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso || typeof iso !== 'string' || iso.trim() === '') {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local date as "YYYY-MM-DD" for min attribute on native date input.
 */
export function getLocalTodayDateInput(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
