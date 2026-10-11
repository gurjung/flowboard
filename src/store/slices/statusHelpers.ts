import { FlowboardStoreState } from '../types';
import { BaseContainer, User, Status } from '@/domain/types';
import { Result, ok, fail } from '@/domain/result';
import { canManageContainers, PermissionState } from '@/domain/permissions';
import { getAllNodes } from './containerSlice';

export function getStatusPermState(state: FlowboardStoreState): {
  allNodes: Record<string, BaseContainer>;
  currentUser: User | undefined;
  permState: PermissionState;
} {
  const allNodes = getAllNodes(state);
  const currentUser = state.users[state.currentUserId];
  const permState: PermissionState = {
    nodes: allNodes,
    grants: Array.isArray(state.grants)
      ? state.grants
      : Object.values(state.grants),
  };
  return { allNodes, currentUser, permState };
}

export function checkStatusAdminGuards(state: FlowboardStoreState): Result<{
  currentUser: User;
  allNodes: Record<string, BaseContainer>;
  permState: PermissionState;
}> {
  const { allNodes, currentUser, permState } = getStatusPermState(state);

  // 1. Session check
  if (!currentUser) {
    return fail('FORBIDDEN', 'User session is invalid');
  }

  // 2. Admin check
  if (!canManageContainers(currentUser)) {
    return fail('FORBIDDEN', 'Only administrators can manage statuses');
  }

  return ok({ currentUser, allNodes, permState });
}

export function getListStatuses(
  statuses: Record<string, Status>,
  listId: string
): Status[] {
  return Object.values(statuses)
    .filter((s) => s.listId === listId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}
