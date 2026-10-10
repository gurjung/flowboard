import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Flowboard Scaffold Test
        </h1>
        <p className="text-sm text-slate-500">
          Verifying Tailwind v4 theme tokens and component setup.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Status Category Badges */}
        <div
          data-testid="status-todo-card"
          className="rounded-panel border border-status-todo-border bg-status-todo-light p-4 shadow-card"
        >
          <div className="flex items-center gap-2 text-status-todo font-semibold">
            <Circle className="h-4 w-4" />
            <span>To Do</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Category: todo</p>
        </div>

        <div
          data-testid="status-in-progress-card"
          className="rounded-panel border border-status-in_progress-border bg-status-in_progress-light p-4 shadow-card"
        >
          <div className="flex items-center gap-2 text-status-in_progress font-semibold">
            <Clock className="h-4 w-4" />
            <span>In Progress</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Category: in_progress</p>
        </div>

        <div
          data-testid="status-done-card"
          className="rounded-panel border border-status-done-border bg-status-done-light p-4 shadow-card"
        >
          <div className="flex items-center gap-2 text-status-done font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Done</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Category: done</p>
        </div>
      </section>

      {/* Priority Colors */}
      <section className="rounded-panel border border-slate-200 bg-white p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Priority Colors Verification
        </h2>
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-xs font-medium text-priority-urgent">
            <AlertCircle className="h-3.5 w-3.5" /> Urgent
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-priority-high">
            <AlertCircle className="h-3.5 w-3.5" /> High
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-priority-normal">
            Normal
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-priority-low">
            Low
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-priority-none">
            None
          </span>
        </div>
      </section>
    </div>
  );
}
