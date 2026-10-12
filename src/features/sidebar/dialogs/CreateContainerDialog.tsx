import React, { useState, useEffect, useRef } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { BaseContainer, Visibility } from '@/domain/types';
import { getChildType } from '@/domain/selectors';
import { Modal } from '@/components/common';
import { Lock, Globe } from 'lucide-react';

interface CreateModalProps {
  parentNode: BaseContainer;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (parentId: string) => void;
}

export const CreateContainerDialog: React.FC<CreateModalProps> = ({
  parentNode,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentUserId = useFlowboardStore((s) => s.currentUserId);
  const createContainer = useFlowboardStore((s) => s.createContainer);

  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!isOpen) return null;

  const childType = getChildType(parentNode.type);
  if (!childType) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const callUserId = currentUserId;
    const result = await createContainer({
      type: childType,
      parentId: parentNode.id,
      name,
      visibility,
    });

    if (
      !isMountedRef.current ||
      callUserId !== useFlowboardStore.getState().currentUserId
    ) {
      return;
    }

    setIsSubmitting(false);

    if (result.success) {
      onSuccess(parentNode.id);
      setName('');
      onClose();
    } else {
      setErrorMsg(result.error.message);
    }
  };

  const title = `Create ${childType.charAt(0).toUpperCase() + childType.slice(1)} under ${parentNode.name}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      testId="create-container-dialog"
      errorMsg={errorMsg}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="container-name"
            className="block text-xs font-medium text-slate-700"
          >
            Name
          </label>
          <input
            id="container-name"
            data-testid="create-name-input"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${childType === 'list' ? 'Sprint Backlog' : 'Engineering'}`}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="container-visibility"
            className="block text-xs font-medium text-slate-700"
          >
            Visibility
          </label>
          <div className="relative mt-1">
            <select
              id="container-visibility"
              data-testid="create-visibility-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="w-full appearance-none rounded border border-slate-300 bg-white px-3 py-1.5 pr-8 text-xs text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="public">Public (Inherited team access)</option>
              <option value="private">
                Private (Restricted access barrier)
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              {visibility === 'private' ? (
                <Lock className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-slate-500" />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="create-submit-btn"
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : `Create ${childType}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
