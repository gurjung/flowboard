import { BaseContainer, ContainerType } from './types';
import { Result, ok, fail } from './result';
import { getAncestorChain } from './permissions';

export type ArchiveStatus = 'active' | 'archived' | 'corrupt';

/**
 * Validates container name length and formatting.
 * Must be 1 to 100 characters after trimming.
 */
export function validateContainerName(name: string): Result<string> {
  if (typeof name !== 'string') {
    return fail('VALIDATION', 'Container name must be a string');
  }

  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return fail('VALIDATION', 'Container name cannot be empty');
  }

  if (trimmed.length > 100) {
    return fail('VALIDATION', 'Container name cannot exceed 100 characters');
  }

  return ok(trimmed);
}

/**
 * Validates valid parent-child container hierarchy according to strict spec:
 * workspace -> space -> folder -> list
 */
export function isValidParentType(
  childType: ContainerType,
  parentType: ContainerType | null
): boolean {
  if (childType === 'workspace') {
    return false; // Workspaces cannot be created via createContainer
  }

  if (!parentType) {
    return false;
  }

  switch (childType) {
    case 'space':
      return parentType === 'workspace';
    case 'folder':
      return parentType === 'space';
    case 'list':
      return parentType === 'folder';
    default:
      return false;
  }
}

/**
 * Tri-state helper evaluating effective archive status:
 * - 'corrupt': node does not exist, has broken parent pointers, or contains a cycle.
 * - 'archived': the node itself or any ancestor has archivedAt !== null.
 * - 'active': the node and all ancestors have archivedAt === null.
 */
export function getArchiveStatus(
  nodeId: string,
  nodes: Record<string, BaseContainer>
): ArchiveStatus {
  const chain = getAncestorChain(nodeId, { nodes, grants: [] });
  if (!chain) {
    return 'corrupt';
  }

  const hasArchivedNode = chain.some((node) => node.archivedAt !== null);
  if (hasArchivedNode) {
    return 'archived';
  }

  return 'active';
}

/**
 * Helper returning true if a node is either archived or corrupt.
 */
export function isEffectivelyArchived(
  nodeId: string,
  nodes: Record<string, BaseContainer>
): boolean {
  return getArchiveStatus(nodeId, nodes) !== 'active';
}
