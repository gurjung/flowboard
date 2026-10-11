import {
  FlowboardStoreState,
  UpdateStatusPatch,
  StoreDeps,
  SetStoreState,
} from '../types';
import { Status, StatusColorToken } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { getArchiveStatus } from '@/domain/validation';
import { validateStatusName, validateStatusColor } from '@/domain/statuses';
import { checkStatusAdminGuards, getListStatuses } from './statusHelpers';

const ALLOWED_STATUS_PATCH_KEYS = new Set(['name', 'color']);

export function executeUpdateStatus(
  state: FlowboardStoreState,
  set: SetStoreState,
  _deps: StoreDeps,
  id: string,
  patch: UpdateStatusPatch
): Result<Status> {
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

  // 5. Payload shape validation
  for (const key of Object.keys(patch)) {
    if (!ALLOWED_STATUS_PATCH_KEYS.has(key)) {
      return fail(
        'VALIDATION',
        `Field '${key}' is immutable or unknown and cannot be updated`
      );
    }
    if ((patch as Record<string, unknown>)[key] === undefined) {
      return fail('VALIDATION', `Field '${key}' cannot have value undefined`);
    }
  }

  let nextName = status.name;
  let nextColor = status.color;

  if (patch.name !== undefined) {
    if (typeof patch.name !== 'string') {
      return fail('VALIDATION', 'Status name must be a string');
    }
    const trimmed = patch.name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      return fail(
        'VALIDATION',
        'Status name must be between 1 and 50 characters'
      );
    }
    nextName = trimmed;
  }

  if (patch.color !== undefined) {
    const colorRes = validateStatusColor(patch.color);
    if (!colorRes.success) return colorRes;
    nextColor = colorRes.data;
  }

  // 6. Archived hierarchy conflict
  if (getArchiveStatus(status.listId, allNodes) !== 'active') {
    return fail('CONFLICT', 'Cannot update status in an archived list');
  }

  // 7. State-dependent business rules: name uniqueness (self-rename allowed)
  if (patch.name !== undefined) {
    const existingStatuses = getListStatuses(state.statuses, status.listId);
    const nameRes = validateStatusName(nextName, existingStatuses, id);
    if (!nameRes.success) return nameRes;
  }

  // 8. No-op check (unchanged state reference)
  if (nextName === status.name && nextColor === status.color) {
    return ok(status);
  }

  const updatedStatus: Status = {
    ...status,
    name: nextName,
    color: nextColor as StatusColorToken,
  };

  set((s) => ({
    statuses: { ...s.statuses, [id]: updatedStatus },
  }));

  return ok(updatedStatus);
}
