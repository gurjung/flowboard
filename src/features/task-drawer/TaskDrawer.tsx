import React, { useRef, useEffect } from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import {
  selectTaskById,
  selectStatusesForList,
  selectAssignableUsersForList,
} from '@/domain/selectors';
import { useToast } from '@/components/toasts';
import { useTaskDrawerForm } from './useTaskDrawerForm';
import { TaskDrawerHeader } from './TaskDrawerHeader';
import { TaskDrawerBody } from './TaskDrawerBody';
import { TaskDrawerFooter } from './TaskDrawerFooter';

import { useDrawerFocusRestore } from './useDrawerFocusRestore';

export interface TaskDrawerProps {
  taskId: string | null;
  initialListId?: string;
  initialStatusId?: string;
  isOpen: boolean;
  canEdit: boolean;
  onClose: () => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  taskId,
  initialListId,
  initialStatusId,
  isOpen,
  canEdit,
  onClose,
}) => {
  const toast = useToast();
  const store = useFlowboardStore();
  const mode = taskId ? 'edit' : 'create';

  const titleInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus restore on open/close
  useDrawerFocusRestore(isOpen);

  const taskResult = taskId ? selectTaskById(store, taskId) : null;
  const currentTask = taskResult?.success ? taskResult.data : null;
  const listId =
    currentTask?.primaryListId ?? initialListId ?? store.selectedListId ?? '';

  const statusesRes = selectStatusesForList(store, listId);
  const statuses = statusesRes.success ? statusesRes.data : [];
  const assignableUsers = selectAssignableUsersForList(store, listId);

  // Form draft state and save validation
  const {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    statusId,
    setStatusId,
    assigneeIds,
    setAssigneeIds,
    dueDate,
    setDueDate,
    titleError,
    dueDateError,
    isSaving,
    handleSave,
  } = useTaskDrawerForm({
    isOpen,
    mode,
    currentTask,
    listId,
    initialStatusId,
    statuses,
    onClose,
  });

  // Teardown if edit task disappears
  useEffect(() => {
    if (isOpen && mode === 'edit' && taskResult && !taskResult.success) {
      onClose();
    }
  }, [isOpen, mode, taskResult, onClose]);

  if (!isOpen) return null;

  const currentStatus = statuses.find((s) => s.id === statusId);
  const statusCategory = currentStatus?.category ?? 'todo';

  const handleDelete = async () => {
    if (!currentTask) return false;
    const res = await store.deleteTask(currentTask.id);
    if (res.success) {
      onClose();
      toast.success('Task deleted');
      return true;
    }
    return false;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      initialFocus={canEdit ? titleInputRef : closeBtnRef}
      className="relative z-50"
    >
      <DialogBackdrop
        data-testid="task-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
      />
      <div className="fixed inset-0 overflow-y-auto p-4 flex min-h-full items-center justify-center">
        <DialogPanel
          data-testid="task-drawer"
          className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all border border-slate-200 flex flex-col max-h-[90vh] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
        >
          <TaskDrawerHeader
            mode={mode}
            title={title}
            titleError={titleError}
            statusId={statusId}
            statuses={statuses}
            canEdit={canEdit}
            titleInputRef={titleInputRef}
            closeBtnRef={closeBtnRef}
            onTitleChange={setTitle}
            onStatusChange={setStatusId}
            onClose={onClose}
          />

          <TaskDrawerBody
            priority={priority}
            assigneeIds={assigneeIds}
            dueDate={dueDate}
            dueDateError={dueDateError}
            description={description}
            statusCategory={statusCategory}
            allUsers={store.users}
            assignableUsers={assignableUsers}
            canEdit={canEdit}
            onPriorityChange={setPriority}
            onAssigneesChange={setAssigneeIds}
            onDueDateChange={setDueDate}
            onDescriptionChange={setDescription}
          />

          <TaskDrawerFooter
            mode={mode}
            canEdit={canEdit}
            createdAt={currentTask?.createdAt}
            taskTitle={currentTask?.title}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={onClose}
            onDelete={mode === 'edit' ? handleDelete : undefined}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
};
