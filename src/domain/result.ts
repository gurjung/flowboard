export type ErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'INVALID_PARENT'
  | 'INVALID_STATUS'
  | 'CONFLICT';

export interface DomainError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: DomainError };

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
