import { createContext } from 'react';
import { ToastStore } from './types';

export const ToastContext = createContext<ToastStore | null>(null);
