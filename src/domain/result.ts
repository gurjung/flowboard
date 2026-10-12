import { ErrorCode, DomainError, Result } from '@/types/common.types';

export type { ErrorCode, DomainError, Result };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function fail<T = never>(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Result<T> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
