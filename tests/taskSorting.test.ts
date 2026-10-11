import { describe, it, expect } from 'vitest';
import {
  sortTasksForListView,
  nextSort,
  SortConfig,
  PRIORITY_RANK,
} from '@/domain/taskSorting';
import { Status, Task } from '@/domain/types';
import { createSeedState } from '@/domain/fixtures';
import { selectKanbanColumns } from '@/domain/kanbanSelectors';
import { FlowboardStoreState } from '@/store/types';

function createMockStatus(id: string, position: number): Status {
  return {
    id,
    listId: 'list-1',
    name: `Status ${id}`,
    category: id.includes('done') ? 'done' : 'todo',
    color: 'slate',
    position,
  };
}

function createMockTask(
  id: string,
  statusId: string,
  position: number,
  priority: Task['priority'] = 'normal',
  dueDate: string | null = null
): Task {
  return {
    id,
    primaryListId: 'list-1',
    statusId,
    title: `Task ${id}`,
    priority,
    assigneeIds: [],
    dueDate,
    position,
    archivedAt: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  };
}

describe('taskSorting domain logic (D-053)', () => {
  const statusTodo = createMockStatus('status-todo', 0);
  const statusProg = createMockStatus('status-prog', 1);
  const statusDone = createMockStatus('status-done', 2);

  const statuses: Record<string, Status> = {
    'status-todo': statusTodo,
    'status-prog': statusProg,
    'status-done': statusDone,
  };

  const task1 = createMockTask(
    'task-1',
    'status-todo',
    0,
    'normal',
    '2026-10-15T00:00:00.000Z'
  );
  const task2 = createMockTask(
    'task-2',
    'status-todo',
    1,
    'urgent',
    '2026-10-10T00:00:00.000Z'
  );
  const task3 = createMockTask('task-3', 'status-prog', 0, 'high', null);
  const task4 = createMockTask(
    'task-4',
    'status-done',
    0,
    'none',
    '2026-10-20T00:00:00.000Z'
  );

  const tasks: Task[] = [task1, task2, task3, task4];

  it('verifies PRIORITY_RANK constants', () => {
    expect(PRIORITY_RANK.urgent).toBe(4);
    expect(PRIORITY_RANK.high).toBe(3);
    expect(PRIORITY_RANK.normal).toBe(2);
    expect(PRIORITY_RANK.low).toBe(1);
    expect(PRIORITY_RANK.none).toBe(0);
  });

  it('nextSort cycles asc -> desc -> null for a given key, and resets on key switch', () => {
    // Current is null -> click dueDate
    const s1 = nextSort(null, 'dueDate');
    expect(s1).toEqual({ key: 'dueDate', direction: 'asc' });

    // Current is dueDate asc -> click dueDate again
    const s2 = nextSort(s1, 'dueDate');
    expect(s2).toEqual({ key: 'dueDate', direction: 'desc' });

    // Current is dueDate desc -> click dueDate again
    const s3 = nextSort(s2, 'dueDate');
    expect(s3).toBeNull();

    // Current is dueDate asc -> click priority (switches key)
    const s4 = nextSort(s1, 'priority');
    expect(s4).toEqual({ key: 'priority', direction: 'asc' });
  });

  it('does NOT mutate the input array (tested with Object.freeze)', () => {
    const frozenTasks = Object.freeze([
      Object.freeze({ ...task1 }),
      Object.freeze({ ...task2 }),
      Object.freeze({ ...task3 }),
      Object.freeze({ ...task4 }),
    ]);

    const sortConfig: SortConfig = { key: 'priority', direction: 'asc' };
    const sorted = sortTasksForListView(
      frozenTasks as Task[],
      sortConfig,
      statuses
    );

    // Should return a new array
    expect(sorted).not.toBe(frozenTasks);
    // Original frozen array length & items remain untouched
    expect(frozenTasks[0]?.id).toBe('task-1');
    expect(frozenTasks[1]?.id).toBe('task-2');
  });

  it('Kanban order unchanged after List sort', () => {
    const state = createSeedState() as unknown as FlowboardStoreState;
    const initialColumns = selectKanbanColumns(state, 'list-1');
    const tasksInList = Object.values(state.tasks).filter(
      (t) => t.primaryListId === 'list-1' && !t.archivedAt
    );

    // Sort list view by priority
    const sorted = sortTasksForListView(
      tasksInList,
      { key: 'priority', direction: 'asc' },
      state.statuses
    );
    expect(sorted.length).toBeGreaterThan(0);

    // Kanban order remains identical to initial order
    const postColumns = selectKanbanColumns(state, 'list-1');
    expect(postColumns).toEqual(initialColumns);
  });

  describe('Priority sorting', () => {
    it('sorts priority asc (urgent first) with default tie-breakers', () => {
      const config: SortConfig = { key: 'priority', direction: 'asc' };
      const sorted = sortTasksForListView(tasks, config, statuses);

      // Urgent (task-2) -> High (task-3) -> Normal (task-1) -> None (task-4)
      expect(sorted.map((t) => t.id)).toEqual([
        'task-2',
        'task-3',
        'task-1',
        'task-4',
      ]);
    });

    it('sorts priority desc (none first)', () => {
      const config: SortConfig = { key: 'priority', direction: 'desc' };
      const sorted = sortTasksForListView(tasks, config, statuses);

      // None (task-4) -> Normal (task-1) -> High (task-3) -> Urgent (task-2)
      expect(sorted.map((t) => t.id)).toEqual([
        'task-4',
        'task-1',
        'task-3',
        'task-2',
      ]);
    });
  });

  describe('Due Date sorting', () => {
    it('sorts dueDate asc (soonest first) with nulls always at the end', () => {
      const config: SortConfig = { key: 'dueDate', direction: 'asc' };
      const sorted = sortTasksForListView(tasks, config, statuses);

      // 2026-10-10 (task-2) -> 2026-10-15 (task-1) -> 2026-10-20 (task-4) -> null (task-3)
      expect(sorted.map((t) => t.id)).toEqual([
        'task-2',
        'task-1',
        'task-4',
        'task-3',
      ]);
    });

    it('sorts dueDate desc (latest first) with nulls always at the end', () => {
      const config: SortConfig = { key: 'dueDate', direction: 'desc' };
      const sorted = sortTasksForListView(tasks, config, statuses);

      // 2026-10-20 (task-4) -> 2026-10-15 (task-1) -> 2026-10-10 (task-2) -> null (task-3)
      expect(sorted.map((t) => t.id)).toEqual([
        'task-4',
        'task-1',
        'task-2',
        'task-3',
      ]);
    });
  });

  describe('Default sorting & tie-breaking', () => {
    it('default sorting respects status.position -> task.position -> task.id', () => {
      const sorted = sortTasksForListView(tasks, null, statuses);

      // status-todo (pos 0: task-1 pos 0, task-2 pos 1)
      // status-prog (pos 1: task-3 pos 0)
      // status-done (pos 2: task-4 pos 0)
      expect(sorted.map((t) => t.id)).toEqual([
        'task-1',
        'task-2',
        'task-3',
        'task-4',
      ]);
    });

    it('tie-breaks equal priority tasks using default order', () => {
      const taskA = createMockTask('task-a', 'status-todo', 0, 'high');
      const taskB = createMockTask('task-b', 'status-prog', 0, 'high');

      const config: SortConfig = { key: 'priority', direction: 'asc' };
      const sorted = sortTasksForListView([taskB, taskA], config, statuses);

      // Both are high: status-todo (task-a) comes before status-prog (task-b)
      expect(sorted.map((t) => t.id)).toEqual(['task-a', 'task-b']);
    });
  });
});
