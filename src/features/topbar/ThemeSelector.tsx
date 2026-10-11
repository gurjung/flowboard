import React from 'react';
import { useTheme } from '@/components/theme';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-900"
      data-testid="theme-selector"
    >
      <button
        type="button"
        data-testid="theme-btn-light"
        aria-pressed={theme === 'light'}
        aria-label="Light theme"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          theme === 'light'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        data-testid="theme-btn-dark"
        aria-pressed={theme === 'dark'}
        aria-label="Dark theme"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          theme === 'dark'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        data-testid="theme-btn-system"
        aria-pressed={theme === 'system'}
        aria-label="System theme"
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          theme === 'system'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
      >
        <Monitor className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">System</span>
      </button>
    </div>
  );
};
