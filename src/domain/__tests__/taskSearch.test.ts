import { describe, it, expect } from 'vitest';
import { filterTasksByQuery } from '@/domain/taskSearch';
import { Task } from '@/domain/types';

const mockTasks: Task[] = [
  {
    id: 'task-1',
    primaryListId: 'list-1',
    title: 'Configure CSP security headers',
    description: 'Protect against XSS attacks using Content-Security-Policy',
    statusId: 'status-todo',
    priority: 'high',
    assigneeIds: ['user-alice'],
    dueDate: '2026-10-15T00:00:00.000Z',
    position: 1000,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    archivedAt: null,
  },
  {
    id: 'task-2',
    primaryListId: 'list-1',
    title: 'Database index migration',
    description: 'Add index on user_id for faster lookups',
    statusId: 'status-in-progress',
    priority: 'urgent',
    assigneeIds: ['user-bob'],
    dueDate: null,
    position: 2000,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    archivedAt: null,
  },
  {
    id: 'task-3',
    primaryListId: 'list-1',
    title: 'Weekly team retrospective',
    description: undefined,
    statusId: 'status-done',
    priority: 'low',
    assigneeIds: [],
    dueDate: null,
    position: 3000,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    archivedAt: null,
  },
];

describe('filterTasksByQuery', () => {
  it('returns all tasks if query is empty or whitespace', () => {
    expect(filterTasksByQuery(mockTasks, '')).toEqual(mockTasks);
    expect(filterTasksByQuery(mockTasks, '   ')).toEqual(mockTasks);
    expect(filterTasksByQuery(mockTasks, null)).toEqual(mockTasks);
    expect(filterTasksByQuery(mockTasks, undefined)).toEqual(mockTasks);
  });

  it('filters tasks by matching title case-insensitively', () => {
    const result = filterTasksByQuery(mockTasks, 'database');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('task-2');

    const resultUpper = filterTasksByQuery(mockTasks, 'SECURITY');
    expect(resultUpper).toHaveLength(1);
    expect(resultUpper[0]!.id).toBe('task-1');
  });

  it('filters tasks by matching description case-insensitively', () => {
    const result = filterTasksByQuery(mockTasks, 'XSS');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('task-1');

    const result2 = filterTasksByQuery(mockTasks, 'lookups');
    expect(result2).toHaveLength(1);
    expect(result2[0]!.id).toBe('task-2');
  });

  it('handles null/missing description without throwing', () => {
    const result = filterTasksByQuery(mockTasks, 'retrospective');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('task-3');
  });

  it('returns empty array when no task matches query', () => {
    const result = filterTasksByQuery(mockTasks, 'nonexistent query 12345');
    expect(result).toEqual([]);
  });

  it('matches partial words across title and description', () => {
    const result = filterTasksByQuery(mockTasks, 'migrat');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('task-2');
  });
});
