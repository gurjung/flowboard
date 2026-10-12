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

import { STORAGE_KEYS } from '@/constants/storage-keys';

export const SIDEBAR_STORAGE_KEY = STORAGE_KEYS.SIDEBAR_COLLAPSED;

export const SidebarContext = createContext<SidebarContextValue | null>(null);
