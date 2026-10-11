import { describe, it, expect } from 'vitest';
import { formatDueDate } from '@/domain/dueDate';

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
