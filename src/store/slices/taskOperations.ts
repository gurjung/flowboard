import {
  FlowboardStoreState,
  UpdateTaskPatch,
  StoreDeps,
  SetStoreState,
} from '../types';
import { Task } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { getArchiveStatus } from '@/domain/validation';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateTaskPriority,
  validateTaskDueDate,
  validateTaskAssignees,
  validatePatchKeys,
} from '@/domain/taskValidation';
import { areStringArraysEqual } from '@/domain/taskOrdering';
import { checkTaskMutationCommonGuards } from './taskHelpers';

export { executeCreateTask } from './createTaskOperation';

export function executeUpdateTask(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  id: string,
  patch: UpdateTaskPatch
): Result<Task> {
  const guardRes = checkTaskMutationCommonGuards(state, id);
  if (!guardRes.success) return guardRes;

  const { task, permState, allNodes } = guardRes.data;

  // Validate patch keys
  const keyRes = validatePatchKeys(patch as Record<string, unknown>);
  if (!keyRes.success) return keyRes;

  const patchKeys = Object.keys(patch);
  if (patchKeys.length === 0) return ok(task);

  // Validate fields
  let nextTitle = task.title;
  let nextDesc = task.description;
  let nextPrio = task.priority;
  let nextAssignees = task.assigneeIds;
  let nextDue = task.dueDate;

  if (patch.title !== undefined) {
    const res = validateTaskTitle(patch.title);
    if (!res.success) return res;
    nextTitle = res.data;
  }
  if (patch.description !== undefined) {
    const res = validateTaskDescription(patch.description);
    if (!res.success) return res;
    nextDesc = res.data;
  }
  if (patch.priority !== undefined) {
    const res = validateTaskPriority(patch.priority);
    if (!res.success) return res;
    nextPrio = res.data;
  }
  if (patch.assigneeIds !== undefined) {
    const res = validateTaskAssignees(
      patch.assigneeIds,
      state.users,
      task.primaryListId,
      permState
    );
    if (!res.success) return res;
    nextAssignees = res.data;
  }
  if (patch.dueDate !== undefined) {
    const res = validateTaskDueDate(patch.dueDate);
    if (!res.success) return res;
    nextDue = res.data;
  }

  // Check container archived status (CONFLICT) after all validations
  if (getArchiveStatus(task.primaryListId, allNodes) !== 'active') {
    return fail('CONFLICT', 'Task belongs to an archived or unavailable list');
  }

  // No-op check (unchanged state reference)
  const isNoop =
    nextTitle === task.title &&
    nextDesc === task.description &&
    nextPrio === task.priority &&
    nextDue === task.dueDate &&
    areStringArraysEqual(nextAssignees, task.assigneeIds);

  if (isNoop) return ok(task);

  const updatedTask: Task = {
    ...task,
    title: nextTitle,
    description: nextDesc,
    priority: nextPrio,
    assigneeIds: nextAssignees,
    dueDate: nextDue,
    updatedAt: deps.now(),
  };

  set((s) => ({ tasks: { ...s.tasks, [id]: updatedTask } }));
  return ok(updatedTask);
}
