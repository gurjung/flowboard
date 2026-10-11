import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Result, ok, fail } from './result';

dayjs.extend(customParseFormat);

const ISO_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function validateTaskDueDate(dueDate: unknown): Result<string | null> {
  if (dueDate === null) {
    return ok(null);
  }
  if (typeof dueDate !== 'string' || !ISO_UTC_REGEX.test(dueDate)) {
    return fail(
      'VALIDATION',
      'Due date must be in strict ISO-8601 UTC format with milliseconds (YYYY-MM-DDTHH:mm:ss.sssZ) or null'
    );
  }

  // Strict calendar date parse via dayjs with customParseFormat
  const parsed = dayjs(dueDate, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]', true);
  if (!parsed.isValid()) {
    return fail('VALIDATION', 'Invalid due date calendar date');
  }

  return ok(dueDate);
}
