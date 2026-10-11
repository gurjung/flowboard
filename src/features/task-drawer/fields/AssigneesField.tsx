import React from 'react';
import { User } from '@/domain/types';
import { X, UserX } from 'lucide-react';

interface AssigneesFieldProps {
  assigneeIds: string[];
  allUsers: Record<string, User>;
  assignableUsers: User[];
  canEdit: boolean;
  onChange: (assigneeIds: string[]) => void;
}

export const AssigneesField: React.FC<AssigneesFieldProps> = ({
  assigneeIds,
  allUsers,
  assignableUsers,
  canEdit,
  onChange,
}) => {
  const assignableIdSet = new Set(assignableUsers.map((u) => u.id));
  const unassignedViewableUsers = assignableUsers.filter(
    (u) => !assigneeIds.includes(u.id)
  );

  const handleAdd = (userId: string) => {
    if (!userId) return;
    onChange([...assigneeIds, userId]);
  };

  const handleRemove = (userId: string) => {
    onChange(assigneeIds.filter((id) => id !== userId));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-24 dark:text-slate-400">
          Assignees
        </span>
        {canEdit && unassignedViewableUsers.length > 0 && (
          <select
            data-testid="drawer-assignee-picker"
            value=""
            onChange={(e) => handleAdd(e.target.value)}
            className="text-xs rounded-md border border-slate-200 bg-white px-2 py-0.5 text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="" disabled>
              + Add assignee...
            </option>
            {unassignedViewableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pl-24">
        {assigneeIds.length === 0 && (
          <span className="text-xs text-slate-400 italic dark:text-slate-500">
            Unassigned
          </span>
        )}
        {assigneeIds.map((userId) => {
          const user = allUsers[userId];
          const hasAccess = assignableIdSet.has(userId);
          const displayName = user ? user.name : userId;

          if (!hasAccess) {
            return (
              <span
                key={userId}
                data-testid={`assignee-chip-${userId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              >
                <UserX className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>{displayName}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  (no access to list)
                </span>
              </span>
            );
          }

          return (
            <span
              key={userId}
              data-testid={`assignee-chip-${userId}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-semibold dark:bg-slate-700 dark:text-slate-200">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span>{displayName}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRemove(userId)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full dark:hover:text-slate-200"
                  aria-label={`Remove ${displayName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};
