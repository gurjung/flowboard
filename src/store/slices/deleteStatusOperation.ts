import { FlowboardStoreState, StoreDeps, SetStoreState } from '../types';
import { List } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { getArchiveStatus } from '@/domain/validation';
import { planStatusDelete } from '@/domain/statuses';
import { checkStatusAdminGuards, getListStatuses } from './statusHelpers';

export function executeDeleteStatus(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  id: string,
  fallbackStatusId?: string
): Result<void> {
  // 1 & 2. Session and Admin checks
  const adminRes = checkStatusAdminGuards(state);
  if (!adminRes.success) return adminRes;

  const { allNodes } = adminRes.data;

  // 3. Target status exists
  const status = state.statuses[id];
  if (!status) {
    return fail('NOT_FOUND', `Status '${id}' not found`);
  }

  // Resolve status.listId: parent list must exist
  const listNode = allNodes[status.listId];
  if (!listNode) {
    return fail('CONFLICT', 'Corrupt hierarchy: status parent list not found');
  }

  // 5. Payload shape validation: fallbackStatusId type check per D-044 amendment
  if (fallbackStatusId !== undefined) {
    if (
      typeof fallbackStatusId !== 'string' ||
      fallbackStatusId.trim().length === 0
    ) {
      return fail('VALIDATION', 'fallbackStatusId must be a non-empty string');
    }
  }

  // 6. Archived hierarchy conflict
  if (getArchiveStatus(status.listId, allNodes) !== 'active') {
    return fail('CONFLICT', 'Cannot delete status from an archived list');
  }

  // 7. State-dependent business rules via domain migration planner
  const listStatuses = getListStatuses(state.statuses, status.listId);
  const listTasks = Object.values(state.tasks).filter(
    (t) => t.primaryListId === status.listId
  );

  const planRes = planStatusDelete(
    listStatuses,
    status,
    listTasks,
    fallbackStatusId,
    deps.now()
  );
  if (!planRes.success) return planRes;

  const { updatedTasks, updatedStatuses } = planRes.data;

  // Apply atomic mutations:
  // 1. Permanently remove status from state.statuses
  // 2. Filter status from list.statusIds
  // 3. Update only statuses whose position changed
  // 4. Update migrated tasks
  const nextStatuses = { ...state.statuses, ...updatedStatuses };
  delete nextStatuses[id];

  const currentList = state.lists[status.listId] as List;
  const nextStatusIds = (currentList?.statusIds ?? []).filter(
    (sid) => sid !== id
  );

  set((s) => ({
    statuses: nextStatuses,
    tasks: { ...s.tasks, ...updatedTasks },
    lists: {
      ...s.lists,
      [status.listId]: {
        ...currentList,
        statusIds: nextStatusIds,
      },
    },
  }));

  return ok(undefined);
}
