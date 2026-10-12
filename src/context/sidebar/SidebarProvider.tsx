import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SidebarContext, SIDEBAR_STORAGE_KEY } from './SidebarContext';

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(min-width: 768px)').matches;
    }
    return false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(min-width: 768px)');
    const updateMobile = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = !e.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };
    updateMobile(mql);
    const handler = (e: MediaQueryListEvent) => updateMobile(e);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          // Graceful fallback on storage error
        }
        return next;
      });
      toggleButtonRef.current?.focus();
    }
  }, [isMobile]);

  const openMobileSidebar = useCallback(() => setIsMobileOpen(true), []);
  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
    toggleButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isMobileOpen, closeMobileSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        isMobile,
        toggleSidebar,
        openMobileSidebar,
        closeMobileSidebar,
        toggleButtonRef,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
