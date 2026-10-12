import { useContext } from 'react';
import { SidebarContext, SidebarContextValue } from './SidebarContext';

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
