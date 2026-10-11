import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { ListView } from '@/features/list-view/ListView';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { ToastProvider } from '@/components/toasts';
import { Task } from '@/domain/types';

describe('ListView & ViewSwitcher component tests (F9)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  describe('ViewSwitcher in MainArea', () => {
    it('renders ViewSwitcher with aria-pressed buttons and toggles between views', () => {
      render(<App />);

      const kanbanBtn = screen.getByRole('button', { name: /board/i });
      const listBtn = screen.getByRole('button', { name: /list/i });

      expect(kanbanBtn).toHaveAttribute('aria-pressed', 'true');
      expect(listBtn).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();

      // Click List view
      fireEvent.click(listBtn);
      expect(kanbanBtn).toHaveAttribute('aria-pressed', 'false');
      expect(listBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('task-list-table')).toBeInTheDocument();

      // Switch back to Board view
      fireEvent.click(kanbanBtn);
      expect(kanbanBtn).toHaveAttribute('aria-pressed', 'true');
      expect(listBtn).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    it('hides ViewSwitcher when no list is selected or list access is denied', () => {
      useFlowboardStore.setState({ selectedListId: null });
      render(<App />);

      expect(
        screen.queryByRole('button', { name: /board/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /list/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('ListView Table & Sorting', () => {
    it('renders semantic table with proper th headers and aria-sort', () => {
      render(
        <ToastProvider>
          <ListView listId="list-1" canEdit={true} />
        </ToastProvider>
      );

      expect(screen.getByTestId('task-list-table')).toBeInTheDocument();

      // Priority and Due Date headers are sortable
      const priorityTh = screen.getByTestId('th-priority');
      const dueTh = screen.getByTestId('th-dueDate');
      const titleTh = screen.getByTestId('th-title');

      expect(priorityTh).toHaveAttribute('aria-sort', 'none');
      expect(dueTh).toHaveAttribute('aria-sort', 'none');
      expect(titleTh).not.toHaveAttribute('aria-sort');

      // Click Priority header -> ascending (urgent first)
      fireEvent.click(priorityTh);
      expect(priorityTh).toHaveAttribute('aria-sort', 'ascending');

      // Click Priority header again -> descending (none first)
      fireEvent.click(priorityTh);
      expect(priorityTh).toHaveAttribute('aria-sort', 'descending');

      // Click Priority header again -> default (none)
      fireEvent.click(priorityTh);
      expect(priorityTh).toHaveAttribute('aria-sort', 'none');
    });

    it('renders task row details and invokes onOpenTask on title button click', () => {
      const handleOpen = vi.fn();
      render(
        <ToastProvider>
          <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
        </ToastProvider>
      );

      // task-1 title button
      const task1Btn = screen.getByRole('button', {
        name: /Implement token refresh rotation flow/i,
      });
      expect(task1Btn).toBeInTheDocument();

      fireEvent.click(task1Btn);
      expect(handleOpen).toHaveBeenCalledWith('task-1');
    });

    it('renders unknown status id gracefully with neutral badge without crashing', () => {
      const state = useFlowboardStore.getState();
      const corruptedTask: Task = {
        ...state.tasks['task-1']!,
        statusId: 'status-nonexistent',
      };

      useFlowboardStore.setState({
        tasks: {
          ...state.tasks,
          'task-1': corruptedTask,
        },
      });

      render(
        <ToastProvider>
          <ListView listId="list-1" canEdit={true} />
        </ToastProvider>
      );

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('resets sorting when list changes via key={listId}', () => {
      const { rerender } = render(
        <ToastProvider>
          <ListView key="list-1" listId="list-1" canEdit={true} />
        </ToastProvider>
      );

      const priorityTh = screen.getByTestId('th-priority');
      fireEvent.click(priorityTh);
      expect(priorityTh).toHaveAttribute('aria-sort', 'ascending');

      // Switch to list-2
      rerender(
        <ToastProvider>
          <ListView key="list-2" listId="list-2" canEdit={true} />
        </ToastProvider>
      );

      expect(screen.getByTestId('th-priority')).toHaveAttribute(
        'aria-sort',
        'none'
      );
    });

    it('hides "+ Add task" button when canEdit is false', () => {
      render(
        <ToastProvider>
          <ListView listId="list-1" canEdit={false} />
        </ToastProvider>
      );

      expect(screen.queryByTestId('list-add-task-btn')).not.toBeInTheDocument();
    });

    it('renders role-aware empty state when list has zero active tasks', () => {
      // Clear tasks for list-1
      useFlowboardStore.setState({ tasks: {} });

      const { rerender } = render(
        <ToastProvider>
          <ListView listId="list-1" canEdit={true} />
        </ToastProvider>
      );

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();

      // Read-only empty text
      rerender(
        <ToastProvider>
          <ListView listId="list-1" canEdit={false} />
        </ToastProvider>
      );

      expect(screen.getByText('No tasks in this list')).toBeInTheDocument();
    });
  });
});
