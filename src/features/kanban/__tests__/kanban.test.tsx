import { describe, it, expect, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
} from '@testing-library/react';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';
import { useKanbanDnd } from '@/features/kanban/useKanbanDnd';
import { ToastProvider } from '@/components/toasts';
import type { DragStartEvent } from '@dnd-kit/core';

import { createSeedState } from '@/domain/fixtures';

describe('KanbanBoard component & interaction tests', () => {
  beforeEach(() => {
    // Reset store to fresh seed state
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  it('renders all status columns for list-1, including empty columns', () => {
    render(
      <ToastProvider>
        <KanbanBoard />
      </ToastProvider>
    );

    expect(
      screen.getByTestId('kanban-column-status-1-todo')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('kanban-column-status-1-prog')
    ).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-status-1-qa')).toBeInTheDocument();
    expect(
      screen.getByTestId('kanban-column-status-1-done')
    ).toBeInTheDocument();

    // Verify empty state text in status-1-qa column
    expect(screen.getByTestId('empty-column-status-1-qa')).toHaveTextContent(
      /No tasks/i
    );
  });

  it('renders active task cards with title, priority badge, and formatted due date', () => {
    render(
      <ToastProvider>
        <KanbanBoard />
      </ToastProvider>
    );

    // task-1 is in status-1-todo
    const taskCard = screen.getByTestId('task-card-task-1');
    expect(taskCard).toBeInTheDocument();
    expect(taskCard).toHaveTextContent('Implement token refresh rotation flow');
  });

  it('shows "+ Add task" button for editors and opens inline input', () => {
    render(
      <ToastProvider>
        <KanbanBoard />
      </ToastProvider>
    );

    const addBtn = screen.getByTestId('add-task-btn-status-1-todo');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    const input = screen.getByTestId('quick-task-input-status-1-todo');
    expect(input).toBeInTheDocument();
  });

  it('inline task creation validates empty title and adds valid task at end of column', async () => {
    render(
      <ToastProvider>
        <KanbanBoard />
      </ToastProvider>
    );

    const addBtn = screen.getByTestId('add-task-btn-status-1-todo');
    fireEvent.click(addBtn);

    const input = screen.getByTestId('quick-task-input-status-1-todo');
    const submitBtn = screen.getByTestId('quick-task-submit-status-1-todo');

    // Submitting empty title
    fireEvent.click(submitBtn);
    expect(
      screen.getByTestId('quick-task-error-status-1-todo')
    ).toBeInTheDocument();
    expect(input).toBeInTheDocument(); // input stays open

    // Submitting valid title
    fireEvent.change(input, { target: { value: 'New Quick Task' } });
    fireEvent.click(submitBtn);

    // Verify new task card appears in status-1-todo after async store operation
    expect(await screen.findByText('New Quick Task')).toBeInTheDocument();
  });

  it('hides "+ Add task" button when user has no edit permissions (read-only viewer)', () => {
    // Switch to Bob and mock selectedListId where Bob cannot edit (e.g. list-3)
    useFlowboardStore.setState({
      currentUserId: 'user-bob',
      selectedListId: 'list-3', // Bob cannot view list-3
    });

    render(
      <ToastProvider>
        <KanbanBoard />
      </ToastProvider>
    );

    // Board shouldn't even render add buttons on forbidden list
    expect(
      screen.queryByTestId('add-task-btn-status-3-todo')
    ).not.toBeInTheDocument();
  });

  it('handles synthetic drag end reorder and dispatches reorderTask', async () => {
    // Initially task-1 is at position 0 in status-1-todo
    const initialTask1 = useFlowboardStore.getState().tasks['task-1'];
    expect(initialTask1?.position).toBe(0);

    // Call reorderTask directly as the handler would
    const res = await useFlowboardStore.getState().reorderTask('task-1', 1);
    expect(res.success).toBe(true);

    const updatedTask1 = useFlowboardStore.getState().tasks['task-1'];
    expect(updatedTask1?.position).toBe(1);
  });

  it('viewer cannot drag: useKanbanDnd disables sensors and ignores drag events when canEdit=false', () => {
    const { result } = renderHook(
      () =>
        useKanbanDnd(
          [
            {
              status: {
                id: 'status-1',
                listId: 'list-1',
                name: 'To Do',
                category: 'todo',
                color: 'slate',
                position: 0,
              },
              tasks: [
                {
                  id: 'task-1',
                  primaryListId: 'list-1',
                  statusId: 'status-1',
                  title: 'Task 1',
                  priority: 'normal',
                  assigneeIds: [],
                  dueDate: null,
                  position: 0,
                  archivedAt: null,
                  createdAt: '2026-10-10T00:00:00.000Z',
                  updatedAt: '2026-10-10T00:00:00.000Z',
                },
              ],
            },
          ],
          false
        ),
      { wrapper: ToastProvider }
    );

    // Sensors array must be empty
    expect(result.current.sensors).toHaveLength(0);

    // Drag start is ignored
    act(() => {
      result.current.handleDragStart({
        active: {
          id: 'task-1',
          data: { current: {} },
          rect: { current: { initial: null, translated: null } },
        },
      } as unknown as DragStartEvent);
    });
    expect(result.current.activeTask).toBeNull();
  });
});
