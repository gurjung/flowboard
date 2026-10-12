import React from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { useToast } from '@/components/toasts';
import { Zap, ZapOff } from 'lucide-react';

export const SimulateFailureToggle: React.FC = () => {
  const simulateFailure = useFlowboardStore((s) => s.simulateFailure);
  const setSimulateFailure = useFlowboardStore((s) => s.setSimulateFailure);
  const toast = useToast();

  const handleToggle = () => {
    const nextState = !simulateFailure;
    setSimulateFailure(nextState);
    if (nextState) {
      toast.error(
        'Simulated API errors enabled (HTTP 500). Mutations will fail & rollback.'
      );
    } else {
      toast.info(
        'Simulated API errors disabled. Mutations will succeed normally.'
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      data-testid="simulate-failure-toggle"
      title={
        simulateFailure
          ? 'Simulated Failure Mode is ON (mutations fail with HTTP 500)'
          : 'Toggle to simulate server 500 network failures'
      }
      aria-label="Toggle simulate failures"
      aria-pressed={simulateFailure}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
        simulateFailure
          ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-xs dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {simulateFailure ? (
        <ZapOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      ) : (
        <Zap className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      )}
      <span className="hidden sm:inline">
        {simulateFailure ? 'Failure Mode: ON' : 'Simulate Failures'}
      </span>
    </button>
  );
};
