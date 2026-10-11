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
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    countBg: string;
    countText: string;
  }
> = {
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500 dark:bg-slate-400',
    countBg: 'bg-slate-200/80 dark:bg-slate-800',
    countText: 'text-slate-600 dark:text-slate-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500 dark:bg-blue-400',
    countBg: 'bg-blue-100 dark:bg-blue-900/50',
    countText: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500 dark:bg-amber-400',
    countBg: 'bg-amber-100 dark:bg-amber-900/50',
    countText: 'text-amber-700 dark:text-amber-300',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    countBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    countText: 'text-emerald-700 dark:text-emerald-300',
  },
  red: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500 dark:bg-rose-400',
    countBg: 'bg-rose-100 dark:bg-rose-900/50',
    countText: 'text-rose-700 dark:text-rose-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-500 dark:bg-violet-400',
    countBg: 'bg-violet-100 dark:bg-violet-900/50',
    countText: 'text-violet-700 dark:text-violet-300',
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

export function resolveStatusColorToken(
  color?: string | null,
  category?: StatusCategory
): StatusColorToken {
  if (color) {
    if (STATUS_PALETTE_TOKENS.includes(color as StatusColorToken)) {
      return color as StatusColorToken;
    }
    const normalized = color.toLowerCase();
    if (
      normalized === '#64748b' ||
      normalized === '#94a3b8' ||
      normalized === '#475569'
    ) {
      return 'slate';
    }
    if (
      normalized === '#2563eb' ||
      normalized === '#3b82f6' ||
      normalized === '#1d4ed8'
    ) {
      return 'blue';
    }
    if (
      normalized === '#16a34a' ||
      normalized === '#22c55e' ||
      normalized === '#15803d'
    ) {
      return 'green';
    }
    if (
      normalized === '#f59e0b' ||
      normalized === '#d97706' ||
      normalized === '#eab308' ||
      normalized === 'amber'
    ) {
      return 'amber';
    }
    if (
      normalized === '#ef4444' ||
      normalized === '#dc2626' ||
      normalized === '#f87171'
    ) {
      return 'red';
    }
    if (
      normalized === '#8b5cf6' ||
      normalized === '#7c3aed' ||
      normalized === '#a855f7'
    ) {
      return 'violet';
    }
  }
  if (category) {
    return getDefaultColorForCategory(category);
  }
  return 'slate';
}

export function getStatusStyles(
  color?: string | null,
  category?: StatusCategory
) {
  const token = resolveStatusColorToken(color, category);
  return STATUS_COLOR_MAP[token] || STATUS_COLOR_MAP.slate;
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
