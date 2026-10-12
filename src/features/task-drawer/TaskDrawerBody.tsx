import React from 'react';
import { Task, User, StatusCategory, Status } from '@/domain/types';
import { StatusField } from './fields/StatusField';
import { PriorityField } from './fields/PriorityField';
import { AssigneesField } from './fields/AssigneesField';
import { DueDateField } from './fields/DueDateField';
import { DescriptionField } from './fields/DescriptionField';

interface TaskDrawerBodyProps {
  title: string;
  titleError?: string | null;
  titleInputRef: React.RefObject<HTMLInputElement>;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  statusId: string;
  statuses: Status[];
  onStatusChange: (statusId: string) => void;
  priority: Task['priority'];
  onPriorityChange: (priority: Task['priority']) => void;
  assigneeIds: string[];
  onAssigneesChange: (assigneeIds: string[]) => void;
  dueDate: string | null;
  dueDateError?: string | null;
  statusCategory: StatusCategory;
  onDueDateChange: (dueDate: string | null) => void;
  allUsers: Record<string, User>;
  assignableUsers: User[];
  canEdit: boolean;
}

export const TaskDrawerBody: React.FC<TaskDrawerBodyProps> = ({
  title,
  titleError,
  titleInputRef,
  onTitleChange,
  description,
  onDescriptionChange,
  statusId,
  statuses,
  onStatusChange,
  priority,
  onPriorityChange,
  assigneeIds,
  onAssigneesChange,
  dueDate,
  dueDateError,
  statusCategory,
  onDueDateChange,
  allUsers,
  assignableUsers,
  canEdit,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 pb-6 space-y-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="drawer-title-input"
          className="text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Title
        </label>
        {canEdit ? (
          <div>
            <input
              ref={titleInputRef}
              id="drawer-title-input"
              data-testid="drawer-title-input"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Configure CSP security headers in Next.js middleware"
              className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs hover:border-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
            />
            {titleError && (
              <p className="mt-1 text-xs text-rose-600 font-medium dark:text-rose-400">
                {titleError}
              </p>
            )}
          </div>
        ) : (
          <h3 className="text-base font-semibold text-slate-900 py-1 dark:text-slate-100">
            {title}
          </h3>
        )}
      </div>

      <DescriptionField
        description={description}
        canEdit={canEdit}
        onChange={onDescriptionChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <StatusField
          statusId={statusId}
          statuses={statuses}
          canEdit={canEdit}
          onChange={onStatusChange}
        />

        <PriorityField
          priority={priority}
          canEdit={canEdit}
          onChange={onPriorityChange}
        />

        <AssigneesField
          assigneeIds={assigneeIds}
          allUsers={allUsers}
          assignableUsers={assignableUsers}
          canEdit={canEdit}
          onChange={onAssigneesChange}
        />

        <DueDateField
          dueDate={dueDate}
          statusCategory={statusCategory}
          canEdit={canEdit}
          error={dueDateError}
          onChange={onDueDateChange}
        />
      </div>
    </div>
  );
};
