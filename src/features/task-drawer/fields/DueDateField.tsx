import React from 'react';
import {
  formatDueDate,
  isoToDateInput,
  dateInputToIso,
  getLocalTodayDateInput,
} from '@/domain/dueDate';
import { StatusCategory } from '@/domain/types';
import { X, Calendar } from 'lucide-react';

interface DueDateFieldProps {
  dueDate: string | null;
  statusCategory: StatusCategory;
  canEdit: boolean;
  error?: string | null;
  onChange: (dueDate: string | null) => void;
}

export const DueDateField: React.FC<DueDateFieldProps> = ({
  dueDate,
  statusCategory,
  canEdit,
  error,
  onChange,
}) => {
  const formatted = formatDueDate(dueDate, statusCategory);
  const inputValue = isoToDateInput(dueDate);
  const todayStr = getLocalTodayDateInput();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const iso = dateInputToIso(raw);
    onChange(iso);
  };

  const handleClear = () => {
    onChange(null);
  };

  if (!canEdit) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-24 dark:text-slate-400">
          Due date
        </span>
        {formatted ? (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
              formatted.isOverdue
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {formatted.label}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic dark:text-slate-500">
            No due date
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="drawer-due-date-input"
          className="text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Due Date
        </label>
        {formatted?.isOverdue && (
          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-sm dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            Overdue
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
          <Calendar className="h-4 w-4" />
        </div>
        <input
          id="drawer-due-date-input"
          data-testid="drawer-due-date-input"
          type="date"
          min={todayStr}
          value={inputValue}
          onChange={handleInputChange}
          className="w-full text-xs rounded-lg border border-slate-300 bg-white pl-9 pr-9 py-2 text-slate-800 shadow-xs hover:border-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
        />
        {dueDate && (
          <button
            type="button"
            data-testid="drawer-due-date-clear-btn"
            onClick={handleClear}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            title="Clear due date"
            aria-label="Clear due date"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-medium dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};
