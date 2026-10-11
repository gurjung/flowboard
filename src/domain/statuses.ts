import { Status, StatusCategory, Task } from './types';
import { Result, ok, fail } from './result';

export {
  STATUS_PALETTE_TOKENS,
  STATUS_COLOR_MAP,
  getDefaultColorForCategory,
  validateStatusColor,
} from './statusColors';

export function validateStatusCategory(
  category: unknown
): Result<StatusCategory> {
  if (
    category !== 'todo' &&
    category !== 'in_progress' &&
    category !== 'done'
  ) {
    return fail('VALIDATION', `Invalid status category '${String(category)}'`);
  }
  return ok(category);
}

export function validateStatusName(
  name: unknown,
  existingStatusesInList: Status[],
  currentStatusId?: string
): Result<string> {
  if (typeof name !== 'string') {
    return fail('VALIDATION', 'Status name must be a string');
  }
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    return fail(
      'VALIDATION',
      'Status name must be between 1 and 50 characters'
    );
  }

  const duplicate = existingStatusesInList.find(
    (s) =>
      s.id !== currentStatusId &&
      s.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return fail(
      'VALIDATION',
      `Status name '${trimmed}' already exists in list`
    );
  }

  return ok(trimmed);
}

export interface StatusDeletePlan {
  updatedTasks: Record<string, Task>;
  updatedStatuses: Record<string, Status>;
  fallbackStatus: Status;
}

export function planStatusDelete(
  listStatuses: Status[],
  statusToDelete: Status,
  listTasks: Task[],
  fallbackStatusId: string | undefined,
  now: string
): Result<StatusDeletePlan> {
  // Step 7 order: 1. fallback checks
  let fallbackStatus: Status | undefined;
  if (fallbackStatusId !== undefined) {
    fallbackStatus = listStatuses.find((s) => s.id === fallbackStatusId);
    if (!fallbackStatus) {
      return fail(
        'INVALID_STATUS',
        `Fallback status '${fallbackStatusId}' does not belong to list '${statusToDelete.listId}'`
      );
    }
    if (fallbackStatus.category !== statusToDelete.category) {
      return fail(
        'VALIDATION',
        `Fallback status must belong to category '${statusToDelete.category}'`
      );
    }
    if (fallbackStatus.id === statusToDelete.id) {
      return fail(
        'VALIDATION',
        'Fallback status cannot be the status being deleted'
      );
    }
  }

  // 2. Per-category minimum
  const sameCategoryStatuses = listStatuses.filter(
    (s) => s.category === statusToDelete.category
  );
  if (sameCategoryStatuses.length <= 1) {
    return fail(
      'VALIDATION',
      'Cannot delete status: list must retain at least one status in each category (todo, in_progress, done)'
    );
  }

  // 3. Active tasks with omitted fallback check
  const activeTasksInDeleted = listTasks
    .filter((t) => t.statusId === statusToDelete.id && t.archivedAt === null)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  if (fallbackStatusId === undefined && activeTasksInDeleted.length > 0) {
    return fail(
      'VALIDATION',
      'Cannot delete status: active tasks exist and no fallback status was provided'
    );
  }

  // Resolve target fallback for soft-deleted tasks if omitted
  if (!fallbackStatus) {
    const remainingSameCat = sameCategoryStatuses
      .filter((s) => s.id !== statusToDelete.id)
      .sort((a, b) => a.position - b.position);
    fallbackStatus = remainingSameCat[0]!;
  }

  const updatedTasks: Record<string, Task> = {};

  // Remap active tasks
  if (activeTasksInDeleted.length > 0) {
    const destActive = listTasks
      .filter((t) => t.statusId === fallbackStatus!.id && t.archivedAt === null)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    const startPos = destActive.length;

    for (let i = 0; i < activeTasksInDeleted.length; i++) {
      const task = activeTasksInDeleted[i]!;
      updatedTasks[task.id] = {
        ...task,
        statusId: fallbackStatus.id,
        position: startPos + i,
        updatedAt: now,
      };
    }
  }

  // Remap soft-deleted tasks (position and updatedAt untouched)
  const softDeletedInStatus = listTasks.filter(
    (t) => t.statusId === statusToDelete.id && t.archivedAt !== null
  );
  for (const task of softDeletedInStatus) {
    updatedTasks[task.id] = {
      ...task,
      statusId: fallbackStatus.id,
    };
  }

  // Reindex remaining statuses (only rewrite if position changed)
  const remainingStatuses = listStatuses
    .filter((s) => s.id !== statusToDelete.id)
    .sort((a, b) => a.position - b.position);

  const updatedStatuses: Record<string, Status> = {};
  for (let i = 0; i < remainingStatuses.length; i++) {
    const s = remainingStatuses[i]!;
    if (s.position !== i) {
      updatedStatuses[s.id] = { ...s, position: i };
    }
  }

  return ok({ updatedTasks, updatedStatuses, fallbackStatus });
}
