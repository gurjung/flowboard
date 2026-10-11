import React, { useState, useEffect, useRef } from 'react';
import { ToastMessage } from './types';
import { useToast } from './useToast';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ToastItemProps {
  toast: ToastMessage;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { dismiss } = useToast();
  const [isPaused, setIsPaused] = useState(false);
  const remainingMsRef = useRef(toast.durationMs);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Calculate remaining time
      const elapsed = Date.now() - startTimeRef.current;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
      return;
    }

    if (remainingMsRef.current <= 0) {
      dismiss(toast.id);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      dismiss(toast.id);
    }, remainingMsRef.current);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, toast.id, dismiss]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = () => setIsPaused(false);

  const isError = toast.type === 'error';
  const role = isError ? 'alert' : 'status';

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-indigo-600 shrink-0" />;
    }
  };

  const borderClass =
    toast.type === 'error'
      ? 'border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/90 dark:text-rose-200'
      : toast.type === 'success'
        ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-200'
        : 'border-slate-200 bg-white/95 text-slate-900 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100';

  return (
    <div
      role={role}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-testid={`toast-${toast.id}`}
      className={`pointer-events-auto flex items-start gap-2.5 rounded-panel border p-3 text-xs shadow-modal backdrop-blur-xs transition-all ${borderClass}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 font-medium leading-relaxed">{toast.message}</div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded p-0.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
