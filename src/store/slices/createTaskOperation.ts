import {
  FlowboardStoreState,
  CreateTaskInput,
  StoreDeps,
  SetStoreState,
} from '../types';
import { Task, Status } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { canEditTasksInList, canViewNode } from '@/domain/permissions';
import { getArchiveStatus } from '@/domain/validation';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateTaskPriority,
  validateTaskDueDate,
  validateTaskAssignees,
} from '@/domain/taskValidation';
import { getActiveTasksInColumn } from '@/domain/taskOrdering';
import { getTaskPermState, getDefaultStatusForList } from './taskHelpers';

export function executeCreateTask(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  input: CreateTaskInput
): Result<Task> {
  const { allNodes, currentUser, permState } = getTaskPermState(state);

  // 1. Session check
  if (!currentUser) return fail('FORBIDDEN', 'User session is invalid');

  // 2. Target list exists
  const list = allNodes[input.listId];
  if (!list) return fail('NOT_FOUND', `List '${input.listId}' not found`);

  // 3. Permission check: canViewNode first (fails closed on denied/corrupt container)
  if (!canViewNode(currentUser, input.listId, permState)) {
    return fail('FORBIDDEN', `Cannot view container '${input.listId}'`);
  }

  // 4. Container must be a list
  if (list.type !== 'list') {
    return fail(
      'INVALID_PARENT',
      `Target container '${input.listId}' is not a list`
    );
  }

  // 5. Must have edit permission on list
  if (!canEditTasksInList(currentUser, input.listId, permState)) {
    return fail('FORBIDDEN', `Cannot edit tasks in list '${input.listId}'`);
  }

  // Title validation
  const titleRes = validateTaskTitle(input.title);
  if (!titleRes.success) return titleRes;

  // Description validation
  const descRes = validateTaskDescription(input.description);
  if (!descRes.success) return descRes;

  // Status validation
  let targetStatus: Status | null = null;
  if (input.statusId) {
    const s = state.statuses[input.statusId];
    if (!s || s.listId !== input.listId) {
      return fail(
        'INVALID_STATUS',
        `Status '${input.statusId}' does not belong to list '${input.listId}'`
      );
    }
    targetStatus = s;
  } else {
    targetStatus = getDefaultStatusForList(state.statuses, input.listId);
    if (!targetStatus)
      return fail('INVALID_STATUS', 'No statuses available for list');
  }

  // Priority validation
  const priority = input.priority ?? 'none';
  const prioRes = validateTaskPriority(priority);
  if (!prioRes.success) return prioRes;

  // Assignees validation
  const assigneesRes = validateTaskAssignees(
    input.assigneeIds ?? [],
    state.users,
    input.listId,
    permState
  );
  if (!assigneesRes.success) return assigneesRes;

  // Due date validation
  const dueRes = validateTaskDueDate(input.dueDate ?? null);
  if (!dueRes.success) return dueRes;

  // 5. Conflict (archived)
  if (getArchiveStatus(input.listId, allNodes) !== 'active') {
    return fail(
      'CONFLICT',
      `Cannot create task in archived list '${input.listId}'`
    );
  }

  const activeColumn = getActiveTasksInColumn(
    state.tasks,
    input.listId,
    targetStatus.id
  );
  const position = activeColumn.length;
  const now = deps.now();
  const id = deps.newId();

  const newTask: Task = {
    id,
    primaryListId: input.listId,
    title: titleRes.data,
    description: descRes.data,
    statusId: targetStatus.id,
    priority: prioRes.data,
    assigneeIds: assigneesRes.data,
    dueDate: dueRes.data,
    position,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  set((s) => ({ tasks: { ...s.tasks, [id]: newTask } }));
  return ok(newTask);
}
