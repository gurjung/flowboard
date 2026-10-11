import { FlowboardStoreState, StoreDeps, SetStoreState } from '../types';
import { Status } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { getArchiveStatus } from '@/domain/validation';
import { checkStatusAdminGuards, getListStatuses } from './statusHelpers';

export function executeReorderStatus(
  state: FlowboardStoreState,
  set: SetStoreState,
  _deps: StoreDeps,
  id: string,
  newIndex: number
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

  // 5. Payload shape validation: integer check moves to step 5 per D-044 amendment
  if (!Number.isInteger(newIndex)) {
    return fail('VALIDATION', `Index ${newIndex} must be an integer`);
  }

  // 6. Archived hierarchy conflict
  if (getArchiveStatus(status.listId, allNodes) !== 'active') {
    return fail('CONFLICT', 'Cannot reorder statuses in an archived list');
  }

  // 7. State-dependent business rules: range check
  const listStatuses = getListStatuses(state.statuses, status.listId);
  if (newIndex < 0 || newIndex >= listStatuses.length) {
    return fail(
      'VALIDATION',
      `Target index ${newIndex} is out of bounds [0..${listStatuses.length - 1}]`
    );
  }

  // 8. Same index no-op check
  if (newIndex === status.position) {
    return ok(status);
  }

  // Move within array and reindex
  const currentIdx = listStatuses.findIndex((s) => s.id === id);
  const reordered = [...listStatuses];
  const [removed] = reordered.splice(currentIdx, 1);
  if (removed) {
    reordered.splice(newIndex, 0, removed);
  }

  const updatedStatuses: Record<string, Status> = {};
  let updatedTargetStatus = status;

  for (let i = 0; i < reordered.length; i++) {
    const s = reordered[i]!;
    if (s.position !== i) {
      const updated = { ...s, position: i };
      updatedStatuses[s.id] = updated;
      if (s.id === id) {
        updatedTargetStatus = updated;
      }
    }
  }

  set((s) => ({
    statuses: { ...s.statuses, ...updatedStatuses },
  }));

  return ok(updatedTargetStatus);
}
