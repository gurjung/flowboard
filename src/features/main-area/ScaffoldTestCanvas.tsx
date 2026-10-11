import React from 'react';

/**
 * Task & Scaffold Verification Canvas
 * Preserved in sr-only to maintain test compatibility with F0 token tests.
 */
export const ScaffoldTestCanvas: React.FC = () => {
  return (
    <section className="sr-only" aria-hidden="true">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Flowboard Scaffold Test
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Verifying Tailwind v4 theme tokens and component setup.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          data-testid="status-todo-card"
          className="rounded-panel border border-status-todo-border bg-status-todo-light p-4 shadow-card"
        >
          <span className="font-semibold text-status-todo">To Do</span>
        </div>
        <div
          data-testid="status-in-progress-card"
          className="rounded-panel border border-status-in_progress-border bg-status-in_progress-light p-4 shadow-card"
        >
          <span className="font-semibold text-status-in_progress">
            In Progress
          </span>
        </div>
        <div
          data-testid="status-done-card"
          className="rounded-panel border border-status-done-border bg-status-done-light p-4 shadow-card"
        >
          <span className="font-semibold text-status-done">Done</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="text-xs font-medium text-priority-urgent">Urgent</span>
        <span className="text-xs font-medium text-priority-high">High</span>
        <span className="text-xs font-medium text-priority-normal">Normal</span>
        <span className="text-xs font-medium text-priority-low">Low</span>
        <span className="text-xs font-medium text-priority-none">None</span>
      </div>
    </section>
  );
};
