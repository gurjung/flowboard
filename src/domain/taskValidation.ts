import { Result, ok, fail } from './result';
import { TaskPriority, User } from './types';
import { canViewNode, PermissionState } from './permissions';

export { validateTaskDueDate } from './dateValidation';

export const PATCHABLE_TASK_KEYS = [
  'title',
  'description',
  'priority',
  'assigneeIds',
  'dueDate',
] as const;

export type PatchableTaskKey = (typeof PATCHABLE_TASK_KEYS)[number];

const VALID_PRIORITIES = new Set<TaskPriority>([
  'urgent',
  'high',
  'normal',
  'low',
  'none',
]);

export function validateTaskTitle(title: unknown): Result<string> {
  if (typeof title !== 'string') {
    return fail('VALIDATION', 'Task title must be a string');
  }
  const trimmed = title.trim();
  if (trimmed.length < 1) {
    return fail('VALIDATION', 'Task title cannot be empty');
  }
  if (trimmed.length > 500) {
    return fail(
      'VALIDATION',
      'Task title exceeds maximum length of 500 characters'
    );
  }
  return ok(trimmed);
}

export function validateTaskDescription(
  description: unknown
): Result<string | undefined> {
  if (description === undefined || description === null) {
    return ok(undefined);
  }
  if (typeof description !== 'string') {
    return fail('VALIDATION', 'Task description must be a string');
  }
  if (description.length > 5000) {
    return fail(
      'VALIDATION',
      'Task description exceeds maximum length of 5000 characters'
    );
  }
  return ok(description);
}

export function validateTaskPriority(priority: unknown): Result<TaskPriority> {
  if (
    typeof priority !== 'string' ||
    !VALID_PRIORITIES.has(priority as TaskPriority)
  ) {
    return fail(
      'VALIDATION',
      `Invalid priority '${String(priority)}'. Must be urgent, high, normal, low, or none`
    );
  }
  return ok(priority as TaskPriority);
}

export function deduplicateAssignees(assigneeIds: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of assigneeIds) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

export function validateTaskAssignees(
  assigneeIds: unknown,
  users: Record<string, User>,
  targetListId: string,
  permState: PermissionState
): Result<string[]> {
  if (!Array.isArray(assigneeIds)) {
    return fail('VALIDATION', 'Assignee IDs must be an array of strings');
  }
  for (const id of assigneeIds) {
    if (typeof id !== 'string') {
      return fail('VALIDATION', 'Each assignee ID must be a string');
    }
  }

  const deduped = deduplicateAssignees(assigneeIds as string[]);

  for (const id of deduped) {
    const user = users[id];
    if (!user) {
      return fail('VALIDATION', `Assignee '${id}' not found`);
    }
    if (!canViewNode(user, targetListId, permState)) {
      return fail(
        'VALIDATION',
        `Cannot assign task: user '${user.name}' does not have view access to list '${targetListId}'`
      );
    }
  }

  return ok(deduped);
}

export function validatePatchKeys(
  patch: Record<string, unknown>
): Result<void> {
  const allowed = new Set<string>(PATCHABLE_TASK_KEYS);
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) {
      return fail(
        'VALIDATION',
        `Field '${key}' is immutable or unknown and cannot be updated`
      );
    }
    if (patch[key] === undefined) {
      return fail('VALIDATION', `Field '${key}' cannot have value undefined`);
    }
  }
  return ok(undefined);
}
