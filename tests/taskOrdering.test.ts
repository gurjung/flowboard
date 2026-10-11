import { describe, it, expect } from 'vitest';
import {
  getActiveTasksInColumn,
  reindexTaskPositions,
  reorderTaskInColumn,
  mapStatusAcrossLists,
  areStringArraysEqual,
} from '@/domain/taskOrdering';
import { Task, Status } from '@/domain/types';

describe('Domain: Task Ordering Engine', () => {
  const baseTask: Task = {
    id: 't-1',
    primaryListId: 'list-1',
    title: 'Task 1',
    statusId: 's-todo',
    priority: 'normal',
    assigneeIds: [],
    dueDate: null,
    position: 0,
    archivedAt: null,
    createdAt: '2026-10-10T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  };

  it('filters active tasks and sorts by position, then id', () => {
    const t1 = { ...baseTask, id: 't-1', position: 1 };
    const t2 = { ...baseTask, id: 't-2', position: 0 };
    const t3Archived = {
      ...baseTask,
      id: 't-3',
      position: 0,
      archivedAt: '2026-10-11T00:00:00.000Z',
    };
    const tOtherStatus = {
      ...baseTask,
      id: 't-4',
      statusId: 's-done',
      position: 0,
    };

    const active = getActiveTasksInColumn(
      [t1, t2, t3Archived, tOtherStatus],
      'list-1',
      's-todo'
    );
    expect(active.map((t) => t.id)).toEqual(['t-2', 't-1']);
  });

  it('reindexTaskPositions: updates only tasks whose position changed and preserves updatedAt', () => {
    const t1 = { ...baseTask, id: 't-1', position: 0 }; // already at 0
    const t2 = { ...baseTask, id: 't-2', position: 5 }; // needs reindex to 1

    const { updatedTasks, changedCount } = reindexTaskPositions([t1, t2]);
    expect(changedCount).toBe(1);
    expect(updatedTasks['t-1']).toBeUndefined();
    expect(updatedTasks['t-2']).toBeDefined();
    expect(updatedTasks['t-2']?.position).toBe(1);
    expect(updatedTasks['t-2']?.updatedAt).toBe(t2.updatedAt); // updatedAt strictly untouched!
  });

  it('reorderTaskInColumn: moves task within bounds and validates boundaries', () => {
    const t1 = { ...baseTask, id: 't-1', position: 0 };
    const t2 = { ...baseTask, id: 't-2', position: 1 };
    const t3 = { ...baseTask, id: 't-3', position: 2 };

    const active = [t1, t2, t3];

    // Out of bounds and non-integers
    expect(reorderTaskInColumn(active, 't-1', -1).success).toBe(false);
    expect(reorderTaskInColumn(active, 't-1', 3).success).toBe(false);
    expect(reorderTaskInColumn(active, 't-1', NaN).success).toBe(false);
    expect(reorderTaskInColumn(active, 't-1', 1.5).success).toBe(false);
    expect(reorderTaskInColumn(active, 't-1', Infinity).success).toBe(false);

    // Same index returns original array reference
    const noop = reorderTaskInColumn(active, 't-1', 0);
    expect(noop.success).toBe(true);
    expect(noop.data).toBe(active);

    // Reorder t-1 to index 2
    const moved = reorderTaskInColumn(active, 't-1', 2);
    expect(moved.success).toBe(true);
    expect(moved.data?.map((t) => t.id)).toEqual(['t-2', 't-3', 't-1']);
  });

  it('mapStatusAcrossLists: matches category, or falls back to first status in list', () => {
    const srcStatus: Status = {
      id: 'src-done',
      listId: 'list-1',
      name: 'Completed',
      category: 'done',
      color: '#00ff00',
      position: 2,
    };

    const targetStatuses: Status[] = [
      {
        id: 'tgt-todo',
        listId: 'list-2',
        name: 'Open',
        category: 'todo',
        color: '#888',
        position: 0,
      },
      {
        id: 'tgt-done',
        listId: 'list-2',
        name: 'Closed',
        category: 'done',
        color: '#0f0',
        position: 1,
      },
    ];

    const mapped = mapStatusAcrossLists(srcStatus, targetStatuses);
    expect(mapped?.id).toBe('tgt-done');

    // Fallback when category does not exist in target list
    const inProgStatus: Status = { ...srcStatus, category: 'in_progress' };
    const fallback = mapStatusAcrossLists(inProgStatus, targetStatuses);
    expect(fallback?.id).toBe('tgt-todo'); // first status in position order
  });

  it('areStringArraysEqual performs order-sensitive value equality', () => {
    expect(areStringArraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(areStringArraysEqual(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(areStringArraysEqual(['a'], ['a', 'b'])).toBe(false);
  });
});
