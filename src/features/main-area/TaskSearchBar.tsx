import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { UI_LABELS } from '@/constants';

export interface TaskSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskSearchBar: React.FC<TaskSearchBarProps> = ({
  value,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global '/' hotkey to focus search bar when not typing in another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute('contenteditable') === 'true';

        if (!isInput) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (value) {
        e.stopPropagation();
        onChange('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        data-testid="task-search-input"
        placeholder={UI_LABELS.SEARCH_TASKS_PLACEHOLDER}
        aria-label="Search tasks"
        className="w-40 sm:w-56 focus:w-64 transition-all duration-200 text-xs rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-7 py-1.5 text-slate-800 placeholder-slate-400 shadow-xs hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:border-slate-700 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          data-testid="task-search-clear-btn"
          aria-label="Clear search"
          className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
