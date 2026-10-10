import { describe, it, expect } from 'vitest';
import {
  sortPositionables,
  reindexPositions,
  reorderItems,
  Positionable,
} from '@/domain/ordering';

describe('Ordering Domain Utilities', () => {
  const items: Positionable[] = [
    { id: 'node-a', position: 0 },
    { id: 'node-b', position: 1 },
    { id: 'node-c', position: 2 },
  ];

  it('moves item to final target index and reindexes contiguously', () => {
    // Move A from index 0 to final index 2 -> [B, C, A]
    const result1 = reorderItems(items, 'node-a', 2);
    expect(result1).not.toBeNull();
    expect(result1?.map((i) => i.id)).toEqual(['node-b', 'node-c', 'node-a']);
    expect(result1?.map((i) => i.position)).toEqual([0, 1, 2]);

    // Move C from index 2 to final index 0 -> [C, A, B]
    const result2 = reorderItems(items, 'node-c', 0);
    expect(result2).not.toBeNull();
    expect(result2?.map((i) => i.id)).toEqual(['node-c', 'node-a', 'node-b']);
    expect(result2?.map((i) => i.position)).toEqual([0, 1, 2]);
  });

  it('same-index reorder is a no-op that preserves exact array reference', () => {
    const result = reorderItems(items, 'node-b', 1);
    expect(result).toBe(items); // Strict reference equality
  });

  it('returns null if target ID is not found', () => {
    const result = reorderItems(items, 'unknown-id', 1);
    expect(result).toBeNull();
  });

  it('returns null if target index is out of bounds', () => {
    expect(reorderItems(items, 'node-a', -1)).toBeNull();
    expect(reorderItems(items, 'node-a', 3)).toBeNull();
    expect(reorderItems(items, 'node-a', 100)).toBeNull();
  });

  it('sortPositionables sorts by position, breaking ties with id', () => {
    const tied: Positionable[] = [
      { id: 'z-item', position: 1 },
      { id: 'a-item', position: 1 },
      { id: 'first', position: 0 },
    ];

    const sorted = sortPositionables(tied);
    expect(sorted.map((i) => i.id)).toEqual(['first', 'a-item', 'z-item']);
  });

  it('reindexPositions closes gaps and returns contiguous 0-indexed positions', () => {
    const gapped: Positionable[] = [
      { id: 'first', position: 0 },
      { id: 'second', position: 5 },
      { id: 'third', position: 42 },
    ];

    const reindexed = reindexPositions(gapped);
    expect(reindexed.map((i) => i.position)).toEqual([0, 1, 2]);
  });
});
