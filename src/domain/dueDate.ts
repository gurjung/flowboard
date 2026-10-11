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
