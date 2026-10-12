/**
 * Centralized application limits, timings, and configuration constants.
 */
export const LIMITS = {
  MAX_TASK_TITLE_LENGTH: 500,
  MAX_CONTAINER_NAME_LENGTH: 100,
  MAX_STACKED_TOASTS: 3,
} as const;

export const TIMINGS = {
  TOAST_ERROR_MS: 8000,
  TOAST_DEFAULT_MS: 3000,
  LOADING_DELAY_MS: 150,
} as const;

export const BREAKPOINTS = {
  MOBILE_MAX_WIDTH_PX: 768,
} as const;
