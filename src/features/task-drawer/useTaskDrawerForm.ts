import { useState, useEffect } from 'react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { useToast } from '@/components/toasts';
import { Task, Status } from '@/domain/types';
import { isoToDateInput, getLocalTodayDateInput } from '@/domain/dueDate';
import { TOAST_MESSAGES } from '@/constants';

interface UseTaskDrawerFormParams {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentTask: Task | null;
  listId: string;
  initialStatusId?: string;
  statuses: Status[];
  onClose: () => void;
}

export function useTaskDrawerForm({
  isOpen,
  mode,
  currentTask,
  listId,
  initialStatusId,
  statuses,
  onClose,
}: UseTaskDrawerFormParams) {
  const toast = useToast();
  const store = useFlowboardStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('none');
  const [statusId, setStatusId] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && currentTask) {
      setTitle(currentTask.title);
      setDescription(currentTask.description ?? '');
      setPriority(currentTask.priority);
      setStatusId(currentTask.statusId);
      setAssigneeIds([...currentTask.assigneeIds]);
      setDueDate(currentTask.dueDate);
    } else {
      setTitle('');
      setDescription('');
      setPriority('none');
      setStatusId(initialStatusId ?? statuses[0]?.id ?? '');
      setAssigneeIds([]);
      setDueDate(null);
    }
    setTitleError(null);
    setDueDateError(null);
    setIsSaving(false);
  }, [isOpen, currentTask, mode, initialStatusId, statuses]);

  const validate = () => {
    let valid = true;
    if (title.trim() === '') {
      setTitleError('Title cannot be empty');
      valid = false;
    } else {
      setTitleError(null);
    }

    if (dueDate) {
      const isUnchangedInEdit =
        mode === 'edit' && currentTask?.dueDate === dueDate;
      if (!isUnchangedInEdit) {
        const dueDay = isoToDateInput(dueDate);
        const todayDay = getLocalTodayDateInput();
        if (dueDay < todayDay) {
          setDueDateError('Due date cannot be in the past');
          valid = false;
        } else {
          setDueDateError(null);
        }
      } else {
        setDueDateError(null);
      }
    } else {
      setDueDateError(null);
    }
    return valid;
  };

  const handleSave = async () => {
    if (isSaving || !validate()) return;
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const res = await store.createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          assigneeIds,
          dueDate,
          listId,
          statusId: statusId || statuses[0]?.id || '',
        });
        if (res.success) {
          toast.success(TOAST_MESSAGES.TASK_CREATED);
          onClose();
        } else {
          toast.error(res.error.message);
        }
      } else if (currentTask) {
        const updateRes = await store.updateTask(currentTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          assigneeIds,
          dueDate,
        });
        if (statusId !== currentTask.statusId) {
          await store.changeTaskStatus(currentTask.id, statusId);
        }
        if (updateRes.success) {
          onClose();
        } else {
          toast.error(updateRes.error.message);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
}
