import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

import { STORAGE_KEYS } from '@/constants/storage-keys';

export const THEME_STORAGE_KEY = STORAGE_KEYS.THEME;

export const ThemeContext = createContext<ThemeContextValue | null>(null);
