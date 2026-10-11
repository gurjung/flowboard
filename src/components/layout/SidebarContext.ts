import { createContext, RefObject } from 'react';

export interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleButtonRef: RefObject<HTMLButtonElement>;
}

export const SIDEBAR_STORAGE_KEY = 'flowboard-sidebar-collapsed';

export const SidebarContext = createContext<SidebarContextValue | null>(null);
