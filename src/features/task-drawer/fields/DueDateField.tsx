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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label
          htmlFor="drawer-due-date-input"
          className="text-xs font-medium text-slate-500 w-24 flex items-center gap-1 dark:text-slate-400"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Due date
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id="drawer-due-date-input"
            data-testid="drawer-due-date-input"
            type="date"
            min={todayStr}
            value={inputValue}
            onChange={handleInputChange}
            className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          {dueDate && (
            <button
              type="button"
              data-testid="drawer-due-date-clear-btn"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Clear due date"
              aria-label="Clear due date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {formatted?.isOverdue && (
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-sm dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              Overdue
            </span>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-600 font-medium pl-24 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};
