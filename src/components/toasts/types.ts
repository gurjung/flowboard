export type ToastType = 'error' | 'success' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

export interface ToastStore {
  toasts: ToastMessage[];
  show: (message: string, type: ToastType, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  subscribe: (listener: () => void) => () => void;
  getState: () => { toasts: ToastMessage[] };
}
