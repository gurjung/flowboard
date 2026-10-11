import { StatusCategory, StatusColorToken } from './types';
import { Result, ok, fail } from './result';

export const STATUS_PALETTE_TOKENS = [
  'slate',
  'blue',
  'amber',
  'green',
  'red',
  'violet',
] as const;

export const STATUS_COLOR_MAP: Record<
  StatusColorToken,
  { bg: string; text: string; border: string; dot: string }
> = {
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    dot: 'bg-red-500',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-300 dark:border-violet-700',
    dot: 'bg-violet-500',
  },
};

export function getDefaultColorForCategory(
  category: StatusCategory
): StatusColorToken {
  switch (category) {
    case 'todo':
      return 'slate';
    case 'in_progress':
      return 'blue';
    case 'done':
      return 'green';
  }
}

export function validateStatusColor(color: unknown): Result<StatusColorToken> {
  if (
    typeof color !== 'string' ||
    !STATUS_PALETTE_TOKENS.includes(color as StatusColorToken)
  ) {
    return fail(
      'VALIDATION',
      `Invalid color token '${String(color)}'. Must be one of: ${STATUS_PALETTE_TOKENS.join(', ')}`
    );
  }
  return ok(color as StatusColorToken);
}
