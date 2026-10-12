/**
 * Centralized local and session storage keys.
 */
export const STORAGE_KEYS = {
  THEME: 'flowboard-theme',
  SIDEBAR_COLLAPSED: 'flowboard-sidebar-collapsed',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
