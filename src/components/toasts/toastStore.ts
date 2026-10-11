import { ToastMessage, ToastStore, ToastType } from './types';

let nextId = 1;

export function createToastStore(): ToastStore {
  let toasts: ToastMessage[] = [];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const show = (message: string, type: ToastType, durationMs?: number) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // Dedupe identical consecutive messages
    const lastToast = toasts[toasts.length - 1];
    if (lastToast && lastToast.message === trimmed && lastToast.type === type) {
      return;
    }

    const defaultDuration = type === 'error' ? 8000 : 3000;
    const finalDuration = durationMs ?? defaultDuration;

    const newToast: ToastMessage = {
      id: `toast-${nextId++}`,
      message: trimmed,
      type,
      durationMs: finalDuration,
    };

    // Max 3 stacked toasts: keep last 2 then add new
    toasts = [...toasts.slice(-2), newToast];
    notify();
  };

  const dismiss = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  };

  const clearAll = () => {
    if (toasts.length === 0) return;
    toasts = [];
    notify();
  };

  return {
    get toasts() {
      return toasts;
    },
    show,
    error: (msg: string, duration?: number) => show(msg, 'error', duration),
    success: (msg: string, duration?: number) => show(msg, 'success', duration),
    info: (msg: string, duration?: number) => show(msg, 'info', duration),
    dismiss,
    clearAll,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getState: () => ({ toasts }),
  };
}
