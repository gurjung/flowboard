import React from 'react';
import { Task } from '@/domain/types';
import { PriorityBadge } from '@/components/tasks';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

interface PriorityFieldProps {
  priority: Task['priority'];
  canEdit: boolean;
  onChange: (priority: Task['priority']) => void;
}

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
];

export const PriorityField: React.FC<PriorityFieldProps> = ({
  priority,
  canEdit,
  onChange,
}) => {
  if (!canEdit) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-24 dark:text-slate-400">
          Priority
        </span>
        <PriorityBadge priority={priority} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="drawer-priority-select"
        className="text-xs font-medium text-slate-700 dark:text-slate-300"
      >
        Priority
      </label>
      <div className="relative">
        {/* Hidden select to preserve test-id and fireEvent.change compatibility */}
        <select
          id="drawer-priority-select"
          data-testid="drawer-priority-select"
          value={priority}
          onChange={(e) => onChange(e.target.value as Task['priority'])}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <Listbox
          value={priority}
          onChange={(val) => onChange(val as Task['priority'])}
        >
          <ListboxButton
            data-testid="drawer-priority-listbox-btn"
            className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs hover:border-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
          >
            <div className="flex items-center gap-2">
              <PriorityBadge priority={priority} />
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </ListboxButton>

          <ListboxOptions
            anchor="bottom start"
            className="z-50 w-[var(--button-width)] min-w-[12rem] rounded-lg border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-700"
          >
            {PRIORITIES.map((p) => (
              <ListboxOption
                key={p.value}
                value={p.value}
                data-testid={`drawer-priority-option-${p.value}`}
                className="group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-xs text-slate-700 data-focus:bg-slate-100 data-focus:text-slate-900 dark:text-slate-300 dark:data-focus:bg-slate-700 dark:data-focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={p.value} />
                </div>
                {p.value === priority && (
                  <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </div>
    </div>
  );
};
