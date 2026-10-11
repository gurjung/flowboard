import { describe, it, expect } from 'vitest';
import { resolveDrop, KanbanColumnData } from '@/domain/resolveDrop';
import { Status, Task } from '@/domain/types';

function createMockStatus(id: string, name: string, position: number): Status {
  return {
    id,
    listId: 'list-1',
    name,
    category: 'todo',
    color: 'slate',
    position,
  };
}

function createMockTask(id: string, statusId: string, position: number): Task {
  return {
    id,
    primaryListId: 'list-1',
    statusId,
    title: `Task ${id}`,
    priority: 'normal',
    assigneeIds: [],
    dueDate: null,
    position,
    archivedAt: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  };
}

describe('resolveDrop domain logic', () => {
  const statusTodo = createMockStatus('status-todo', 'To Do', 0);
  const statusProg = createMockStatus('status-prog', 'In Progress', 1);
  const statusDone = createMockStatus('status-done', 'Done', 2);

  const task1 = createMockTask('task-1', 'status-todo', 0);
  const task2 = createMockTask('task-2', 'status-todo', 1);
  const task3 = createMockTask('task-3', 'status-todo', 2);
  const task4 = createMockTask('task-4', 'status-prog', 0);

  const columns: KanbanColumnData[] = [
    {
      status: statusTodo,
      tasks: [task1, task2, task3],
    },
    {
      status: statusProg,
      tasks: [task4],
    },
    {
      status: statusDone,
      tasks: [],
    },
  ];

  it('returns null when activeId is empty or overId is null (pointer released in a gap)', () => {
    expect(resolveDrop(columns, '', 'status-todo')).toBeNull();
    expect(resolveDrop(columns, 'task-1', null)).toBeNull();
    expect(resolveDrop(columns, 'task-nonexistent', 'task-2')).toBeNull();
  });

  it('handles drop on an empty column (over = column id / status id)', () => {
    const result = resolveDrop(columns, 'task-1', 'status-done');
    expect(result).toEqual({ statusId: 'status-done', index: 0 });

    const prefixedResult = resolveDrop(columns, 'task-1', 'column-status-done');
    expect(prefixedResult).toEqual({ statusId: 'status-done', index: 0 });
  });

  it('handles drop on own position as a no-op returning null (no toast)', () => {
    // Dropping on own card directly
    expect(resolveDrop(columns, 'task-1', 'task-1', false)).toBeNull();
    expect(resolveDrop(columns, 'task-2', 'task-2', false)).toBeNull();
  });

  it('handles same-column move down with index shift', () => {
    // Moving task-1 (idx 0) below task-2 (idx 1): final index in [task-2, task-3] after task-2 is 1
    const moveBelowTask2 = resolveDrop(columns, 'task-1', 'task-2', true);
    expect(moveBelowTask2).toEqual({ statusId: 'status-todo', index: 1 });

    // Moving task-1 (idx 0) below task-3 (idx 2): final index in [task-2, task-3] after task-3 is 2
    const moveBelowTask3 = resolveDrop(columns, 'task-1', 'task-3', true);
    expect(moveBelowTask3).toEqual({ statusId: 'status-todo', index: 2 });

    // Dropping task-1 (idx 0) above task-2 (idx 1): final index would still be 0 (no-op)
    expect(resolveDrop(columns, 'task-1', 'task-2', false)).toBeNull();
  });

  it('handles same-column move up with index shift', () => {
    // Moving task-3 (idx 2) above task-2 (idx 1): final index is 1
    const moveAboveTask2 = resolveDrop(columns, 'task-3', 'task-2', false);
    expect(moveAboveTask2).toEqual({ statusId: 'status-todo', index: 1 });

    // Moving task-3 (idx 2) above task-1 (idx 0): final index is 0
    const moveAboveTask1 = resolveDrop(columns, 'task-3', 'task-1', false);
    expect(moveAboveTask1).toEqual({ statusId: 'status-todo', index: 0 });

    // Dropping task-3 (idx 2) below task-2 (idx 1): in [task-1, task-2], after task-2 is index 2 (own position -> null)
    expect(resolveDrop(columns, 'task-3', 'task-2', true)).toBeNull();
  });

  it('handles cross-column drop above and below cards', () => {
    // Moving task-1 from status-todo to status-prog above task-4
    const aboveTask4 = resolveDrop(columns, 'task-1', 'task-4', false);
    expect(aboveTask4).toEqual({ statusId: 'status-prog', index: 0 });

    // Moving task-1 from status-todo to status-prog below task-4
    const belowTask4 = resolveDrop(columns, 'task-1', 'task-4', true);
    expect(belowTask4).toEqual({ statusId: 'status-prog', index: 1 });
  });

  it('handles drop onto column container with existing items', () => {
    // Dropping task-1 onto status-prog container below all items
    const ontoProgCol = resolveDrop(columns, 'task-1', 'status-prog', true);
    expect(ontoProgCol).toEqual({ statusId: 'status-prog', index: 1 });
  });
});
