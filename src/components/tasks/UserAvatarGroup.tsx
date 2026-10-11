import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';

export interface UserAvatarGroupProps {
  assigneeIds: string[];
}

export const UserAvatarGroup: React.FC<UserAvatarGroupProps> = ({
  assigneeIds,
}) => {
  const users = useFlowboardStore((s) => s.users);

  if (!assigneeIds || assigneeIds.length === 0) {
    return null;
  }

  return (
    <div className="flex -space-x-1 overflow-hidden">
      {assigneeIds.map((userId) => {
        const user = users[userId];
        if (!user) return null; // Unknown IDs render nothing per requirement

        const initials = user.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return (
          <div
            key={userId}
            title={user.name}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 ring-1 ring-white dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-800"
          >
            {initials}
          </div>
        );
      })}
    </div>
  );
};
