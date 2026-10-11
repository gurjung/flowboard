import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { User, Shield, ChevronDown, Check } from 'lucide-react';

export const UserSwitcher: React.FC = () => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const users = useFlowboardStore((s) => s.users);
  const setCurrentUser = useFlowboardStore((s) => s.setCurrentUser);

  const currentUser = users[currentUserId];
  const userList = Object.values(users);

  return (
    <div className="flex items-center gap-2" data-testid="user-switcher">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {currentUser?.role === 'admin' ? (
          <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
        )}
      </div>

      <div className="relative">
        <label htmlFor="user-select" className="sr-only">
          Active User
        </label>
        {/* Hidden select to preserve test-id and fireEvent.change compatibility */}
        <select
          id="user-select"
          data-testid="user-select"
          value={currentUserId}
          onChange={(e) => setCurrentUser(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {userList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>

        <Listbox value={currentUserId} onChange={setCurrentUser}>
          <ListboxButton
            data-testid="user-listbox-btn"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-xs hover:bg-slate-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span>
              {currentUser?.name} ({currentUser?.role})
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </ListboxButton>

          <ListboxOptions className="absolute right-0 z-50 mt-1 min-w-[12rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-700">
            {userList.map((u) => (
              <ListboxOption
                key={u.id}
                value={u.id}
                data-testid={`user-option-${u.id}`}
                className="group flex cursor-pointer items-center justify-between rounded px-2.5 py-1.5 text-xs text-slate-700 data-focus:bg-slate-100 data-focus:text-slate-900 dark:text-slate-300 dark:data-focus:bg-slate-700 dark:data-focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold dark:bg-slate-700">
                    {u.name.charAt(0)}
                  </span>
                  <span>{u.name}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    {u.role}
                  </span>
                </div>
                {u.id === currentUserId && (
                  <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </div>
    </div>
  );
};
