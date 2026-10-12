export type ErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'INVALID_PARENT'
  | 'INVALID_STATUS'
  | 'CONFLICT'
  | 'INTERNAL';

export interface DomainError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: DomainError };
