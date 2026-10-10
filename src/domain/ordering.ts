export interface Positionable {
  id: string;
  position: number;
}

/**
 * Sorts items by position ascending, with id as deterministic tie-breaker.
 */
export function sortPositionables<T extends Positionable>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Reindexes a list of items to dense 0-indexed positions (0, 1, ... N-1).
 */
export function reindexPositions<T extends Positionable>(items: T[]): T[] {
  const sorted = sortPositionables(items);
  return sorted.map((item, index) => {
    if (item.position === index) {
      return item;
    }
    return { ...item, position: index };
  });
}

/**
 * Reorders an item within an active sibling list to a new target index.
 * - newIndex represents the item's FINAL 0-indexed position in the list.
 * - If targetId is not found or newIndex is out of range, returns null.
 * - If newIndex equals current index, returns the original items array reference unchanged (no-op).
 */
export function reorderItems<T extends Positionable>(
  items: T[],
  targetId: string,
  newIndex: number
): T[] | null {
  const sorted = sortPositionables(items);
  const currentIndex = sorted.findIndex((item) => item.id === targetId);

  if (currentIndex === -1) {
    return null;
  }

  if (newIndex < 0 || newIndex >= sorted.length) {
    return null;
  }

  // Same-index reorder is a no-op: preserve exact reference
  if (currentIndex === newIndex) {
    return items;
  }

  const result = [...sorted];
  const [removed] = result.splice(currentIndex, 1);
  if (!removed) {
    return null;
  }

  result.splice(newIndex, 0, removed);

  return result.map((item, index) => {
    if (item.position === index) {
      return item;
    }
    return { ...item, position: index };
  });
}
