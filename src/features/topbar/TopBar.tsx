import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { UserSwitcher } from './UserSwitcher';

export const TopBar: React.FC = () => {
  return (
    <header
      className="flex h-12 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 select-none"
      data-testid="top-bar"
    >
      <div className="flex items-center overflow-hidden">
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-3">
        <UserSwitcher />
      </div>
    </header>
  );
};
