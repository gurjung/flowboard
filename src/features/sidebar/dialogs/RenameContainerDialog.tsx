import React, { useState, useEffect, useRef } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { BaseContainer } from '@/domain/types';
import { Modal } from '@/components/common';

interface RenameModalProps {
  node: BaseContainer;
  isOpen: boolean;
  onClose: () => void;
}

export const RenameContainerDialog: React.FC<RenameModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const renameContainer = useFlowboardStore((s) => s.renameContainer);

  const [name, setName] = useState(node.name);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setName(node.name);
    return () => {
      isMountedRef.current = false;
    };
  }, [node]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const callUserId = currentUserId;
    const result = await renameContainer(node.id, name);

    if (
      !isMountedRef.current ||
      callUserId !== useFlowboardStore.getState().currentUserId
    ) {
      return;
    }

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Container"
      testId="rename-container-dialog"
      errorMsg={errorMsg}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="rename-name"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            New Name
          </label>
          <input
            id="rename-name"
            data-testid="rename-name-input"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="rename-submit-btn"
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {isSubmitting ? 'Saving...' : 'Save Name'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
