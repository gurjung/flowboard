import {
  FlowboardStoreState,
  CreateStatusInput,
  StoreDeps,
  SetStoreState,
} from '../types';
import { Status, List } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { getArchiveStatus } from '@/domain/validation';
import {
  validateStatusName,
  validateStatusCategory,
  validateStatusColor,
  getDefaultColorForCategory,
} from '@/domain/statuses';
import { checkStatusAdminGuards, getListStatuses } from './statusHelpers';

export function executeCreateStatus(
  state: FlowboardStoreState,
  set: SetStoreState,
  deps: StoreDeps,
  input: CreateStatusInput
): Result<Status> {
  // 1 & 2. Session and Admin checks
  const adminRes = checkStatusAdminGuards(state);
  if (!adminRes.success) return adminRes;

  const { allNodes } = adminRes.data;

  // 3. Target container exists
  const targetNode = allNodes[input.listId];
  if (!targetNode) {
    return fail('NOT_FOUND', `Container '${input.listId}' not found`);
  }

  // 4. Target must be a list
  if (targetNode.type !== 'list') {
    return fail(
      'INVALID_PARENT',
      `Target container '${input.listId}' is not a list`
    );
  }

  // 5. Payload shape validation
  if (typeof input.name !== 'string') {
    return fail('VALIDATION', 'Status name must be a string');
  }
  const trimmedName = input.name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    return fail(
      'VALIDATION',
      'Status name must be between 1 and 50 characters'
    );
  }

  const catRes = validateStatusCategory(input.category);
  if (!catRes.success) return catRes;

  let color = input.color;
  if (color !== undefined) {
    const colorRes = validateStatusColor(color);
    if (!colorRes.success) return colorRes;
  } else {
    color = getDefaultColorForCategory(catRes.data);
  }

  // 6. Archived hierarchy conflict
  if (getArchiveStatus(input.listId, allNodes) !== 'active') {
    return fail(
      'CONFLICT',
      `Cannot create status in archived list '${input.listId}'`
    );
  }

  // 7. State-dependent business rules: name uniqueness in list
  const existingStatuses = getListStatuses(state.statuses, input.listId);
  const nameRes = validateStatusName(trimmedName, existingStatuses);
  if (!nameRes.success) return nameRes;

  // Append at end of list
  const position = existingStatuses.length;
  const id = deps.newId();

  const newStatus: Status = {
    id,
    listId: input.listId,
    name: trimmedName,
    category: catRes.data,
    color,
    position,
  };

  const currentList = state.lists[input.listId] as List;

  set((s) => ({
    statuses: { ...s.statuses, [id]: newStatus },
    lists: {
      ...s.lists,
      [input.listId]: {
        ...currentList,
        statusIds: [...(currentList?.statusIds ?? []), id],
      },
    },
  }));

  return ok(newStatus);
}
