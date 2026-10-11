import React, { useState, useEffect, useRef } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { Plus, X } from 'lucide-react';

export interface QuickTaskInputProps {
  listId: string;
  statusId: string;
  onClose: () => void;
}

export const QuickTaskInput: React.FC<QuickTaskInputProps> = ({
  listId,
  statusId,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createTask = useFlowboardStore((s) => s.createTask);
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const initialUserRef = useRef(currentUserId);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close and clear on any user session change (F8 Gate 5)
  useEffect(() => {
    if (initialUserRef.current !== currentUserId) {
      onClose();
    }
  }, [currentUserId, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();

    if (!trimmed) {
      setError('Task title cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createTask({
      listId,
      statusId,
      title: trimmed,
    });

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      // Keep input open with inline error on failure
      setError(result.error.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-brand-300 bg-white p-3 shadow-card dark:border-brand-500/50 dark:bg-slate-800"
      data-testid={`quick-task-form-${statusId}`}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={500}
        value={title}
        disabled={isSubmitting}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        data-testid={`quick-task-input-${statusId}`}
        className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
      />

      {error && (
        <p
          data-testid={`quick-task-error-${statusId}`}
          className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          data-testid={`quick-task-submit-${statusId}`}
          className="inline-flex items-center gap-1 rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </form>
  );
};
