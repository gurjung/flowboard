import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { User, Shield } from 'lucide-react';

export const UserSwitcher: React.FC = () => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const users = useFlowboardStore((s) => s.users);
  const setCurrentUser = useFlowboardStore((s) => s.setCurrentUser);

  const currentUser = users[currentUserId];
  const userList = Object.values(users);

  return (
    <div className="flex items-center gap-2" data-testid="user-switcher">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700">
        {currentUser?.role === 'admin' ? (
          <Shield className="h-3.5 w-3.5 text-indigo-600" />
        ) : (
          <User className="h-3.5 w-3.5 text-slate-600" />
        )}
      </div>
      <div className="flex flex-col">
        <label htmlFor="user-select" className="sr-only">
          Active User
        </label>
        <select
          id="user-select"
          data-testid="user-select"
          value={currentUserId}
          onChange={(e) => setCurrentUser(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {userList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
