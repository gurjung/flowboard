import { describe, it, expect } from 'vitest';
import {
  formatDueDate,
  dateInputToIso,
  isoToDateInput,
} from '@/domain/dueDate';

describe('formatDueDate domain helper', () => {
  const referenceDate = new Date('2026-10-15T10:00:00.000Z');

  it('returns null when dueDate is null or empty', () => {
    expect(formatDueDate(null, 'todo', referenceDate)).toBeNull();
    expect(formatDueDate('', 'todo', referenceDate)).toBeNull();
  });

  it('formats upcoming due dates with isOverdue = false', () => {
    const result = formatDueDate(
      '2026-10-20T12:00:00.000Z',
      'todo',
      referenceDate
    );
    expect(result).not.toBeNull();
    expect(result?.isOverdue).toBe(false);
    expect(result?.label).toBe('Oct 20');
  });

  it('formats due dates for today with isOverdue = false', () => {
    const result = formatDueDate(
      '2026-10-15T18:00:00.000Z',
      'in_progress',
      referenceDate
    );
    expect(result).not.toBeNull();
    expect(result?.isOverdue).toBe(false);
    expect(result?.label).toBe('Oct 15');
  });

  it('flags overdue dates when dueDate is before today in non-done categories', () => {
    const result = formatDueDate(
      '2026-10-10T00:00:00.000Z',
      'in_progress',
      referenceDate
    );
    expect(result).not.toBeNull();
    expect(result?.isOverdue).toBe(true);
    expect(result?.label).toBe('Oct 10');
  });

  it('does NOT flag overdue when status category is done, even if dueDate is in the past', () => {
    const result = formatDueDate(
      '2026-10-10T00:00:00.000Z',
      'done',
      referenceDate
    );
    expect(result).not.toBeNull();
    expect(result?.isOverdue).toBe(false);
    expect(result?.label).toBe('Oct 10');
  });
});

describe('dateInputToIso & isoToDateInput (D-056 / Gate 6)', () => {
  it('handles empty and null values gracefully', () => {
    expect(dateInputToIso('')).toBeNull();
    expect(dateInputToIso(null)).toBeNull();
    expect(dateInputToIso(undefined)).toBeNull();
    expect(dateInputToIso('   ')).toBeNull();

    expect(isoToDateInput(null)).toBe('');
    expect(isoToDateInput(undefined)).toBe('');
    expect(isoToDateInput('')).toBe('');
    expect(isoToDateInput('invalid-date')).toBe('');
  });

  it('performs full round trip for standard date input', () => {
    const inputDate = '2026-10-15';
    const iso = dateInputToIso(inputDate);
    expect(iso).not.toBeNull();
    expect(typeof iso).toBe('string');
    // Ensure it is a valid ISO string
    expect(new Date(iso!).toISOString()).toBe(iso);

    const backToInput = isoToDateInput(iso);
    expect(backToInput).toBe(inputDate);
  });

  it('handles near-UTC-boundary dates and preserves local calendar date round trip', () => {
    // New Year Eve date
    const nyDate = '2026-12-31';
    const isoNy = dateInputToIso(nyDate);
    expect(isoToDateInput(isoNy)).toBe(nyDate);

    // Leap year date
    const leapDate = '2028-02-29';
    const isoLeap = dateInputToIso(leapDate);
    expect(isoToDateInput(isoLeap)).toBe(leapDate);
  });

  it('converts date input "2026-10-21" to canonical UTC ISO preserving "Oct 21" display', () => {
    const inputDate = '2026-10-21';
    const iso = dateInputToIso(inputDate);
    expect(iso).toBe('2026-10-21T00:00:00.000Z');

    // formatDueDate must format as "Oct 21", never shifting to "Oct 20"
    const formatted = formatDueDate(iso, 'todo');
    expect(formatted?.label).toBe('Oct 21');

    // isoToDateInput must round trip back to "2026-10-21"
    expect(isoToDateInput(iso)).toBe('2026-10-21');
  });
});
