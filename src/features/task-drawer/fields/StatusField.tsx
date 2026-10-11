import React from 'react';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { Status } from '@/domain/types';
import { StatusBadge } from '@/components/tasks';
import { getStatusStyles } from '@/domain/statusColors';
import { ChevronDown, Check } from 'lucide-react';

interface StatusFieldProps {
  statusId: string;
  statuses: Status[];
  canEdit: boolean;
  onChange: (statusId: string) => void;
}

export const StatusField: React.FC<StatusFieldProps> = ({
  statusId,
  statuses,
  canEdit,
  onChange,
}) => {
  const currentStatus = statuses.find((s) => s.id === statusId);
  const currentStatusStyles = getStatusStyles(
    currentStatus?.color,
    currentStatus?.category
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="drawer-status-select"
        className="text-xs font-medium text-slate-700 dark:text-slate-300"
      >
        Status
      </label>

      {canEdit ? (
        <div className="relative">
          {/* Hidden select to preserve test-id and fireEvent.change compatibility */}
          <select
            id="drawer-status-select"
            data-testid="drawer-status-select"
            value={statusId}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <Listbox value={statusId} onChange={onChange}>
            <ListboxButton
              data-testid="drawer-status-listbox-btn"
              className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs hover:border-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentStatusStyles.dot}`}
                />
                <span className="truncate">
                  {currentStatus?.name ?? 'Select status'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            </ListboxButton>

            <ListboxOptions
              anchor="bottom start"
              className="z-50 w-[var(--button-width)] min-w-[12rem] rounded-lg border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-700"
            >
              {statuses.map((s) => {
                const styles = getStatusStyles(s.color, s.category);
                return (
                  <ListboxOption
                    key={s.id}
                    value={s.id}
                    data-testid={`drawer-status-option-${s.id}`}
                    className="group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-xs text-slate-700 data-focus:bg-slate-100 data-focus:text-slate-900 dark:text-slate-300 dark:data-focus:bg-slate-700 dark:data-focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${styles.dot}`}
                      />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    {s.id === statusId && (
                      <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </ListboxOption>
                );
              })}
            </ListboxOptions>
          </Listbox>
        </div>
      ) : (
        <div className="py-1">
          <StatusBadge status={currentStatus} />
        </div>
      )}
    </div>
  );
};
