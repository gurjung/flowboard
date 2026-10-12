export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export const PATCHABLE_TASK_KEYS = [
  'title',
  'description',
  'priority',
  'assigneeIds',
  'dueDate',
] as const;

export type PatchableTaskKey = (typeof PATCHABLE_TASK_KEYS)[number];

export interface Task {
  id: string;
  primaryListId: string;
  title: string;
  description?: string;
  statusId: string;
  priority: TaskPriority;
  assigneeIds: string[];
  dueDate: string | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
