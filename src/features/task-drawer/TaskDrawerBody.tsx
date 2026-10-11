import React from 'react';
import { Task, User, StatusCategory } from '@/domain/types';
import { PriorityField } from './fields/PriorityField';
import { AssigneesField } from './fields/AssigneesField';
import { DueDateField } from './fields/DueDateField';
import { DescriptionField } from './fields/DescriptionField';

interface TaskDrawerBodyProps {
  priority: Task['priority'];
  assigneeIds: string[];
  dueDate: string | null;
  dueDateError?: string | null;
  description: string;
  statusCategory: StatusCategory;
  allUsers: Record<string, User>;
  assignableUsers: User[];
  canEdit: boolean;
  onPriorityChange: (priority: Task['priority']) => void;
  onAssigneesChange: (assigneeIds: string[]) => void;
  onDueDateChange: (dueDate: string | null) => void;
  onDescriptionChange: (description: string) => void;
}

export const TaskDrawerBody: React.FC<TaskDrawerBodyProps> = ({
  priority,
  assigneeIds,
  dueDate,
  dueDateError,
  description,
  statusCategory,
  allUsers,
  assignableUsers,
  canEdit,
  onPriorityChange,
  onAssigneesChange,
  onDueDateChange,
  onDescriptionChange,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      {/* Properties Section */}
      <div className="space-y-4">
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

      <div className="border-t border-slate-100 pt-5">
        <DescriptionField
          description={description}
          canEdit={canEdit}
          onChange={onDescriptionChange}
        />
      </div>
    </div>
  );
};
