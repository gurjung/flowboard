import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { Task } from '@/domain/types';

describe('TaskDetailDrawer Flow & Lifecycle Tests (Feedback Amendments)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  it('shows inline error on empty title when attempting to save', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-1'));
    await screen.findByTestId('task-drawer');

    const titleInput = screen.getByTestId('drawer-title-input');
    fireEvent.change(titleInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('drawer-save-btn'));

    expect(
      await screen.findByText(/Title cannot be empty/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('task-drawer')).toBeInTheDocument();
  });

  it('lists only users who can view the list, and renders inaccessible assigned users as read-only chips', async () => {
    const state = useFlowboardStore.getState();
    const taskInList2: Task = {
      ...state.tasks['task-7']!,
      primaryListId: 'list-2',
      assigneeIds: ['user-alice', 'user-carol'],
    };
    useFlowboardStore.setState({
      selectedListId: 'list-2',
      tasks: {
        ...state.tasks,
        'task-7': taskInList2,
      },
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-7'));
    await screen.findByTestId('task-drawer');

    expect(screen.getByTestId('drawer-assignee-picker')).toBeInTheDocument();
    expect(screen.getByTestId('assignee-chip-user-carol')).toBeInTheDocument();
    expect(screen.getByText(/no access to list/i)).toBeInTheDocument();
  });

  it('closes modal on user change with zero-leak of task content', async () => {
    useFlowboardStore.setState({
      currentUserId: 'user-carol',
      selectedListId: 'list-3',
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-12'));
    expect(await screen.findByTestId('task-drawer')).toBeInTheDocument();
    expect(
      screen.getByText('Rotate expired staging JWT certificate pair')
    ).toBeInTheDocument();

    const userSwitcher = screen.getByTestId('user-select');
    fireEvent.change(userSwitcher, { target: { value: 'user-bob' } });

    expect(screen.queryByTestId('task-drawer')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Rotate expired staging JWT certificate pair')
    ).not.toBeInTheDocument();
  });

  it('updates live when external task status change occurs', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-1'));
    await screen.findByTestId('task-drawer');

    expect(screen.getByTestId('drawer-status-select')).toHaveValue(
      'status-1-todo'
    );

    useFlowboardStore
      .getState()
      .changeTaskStatusSync('task-1', 'status-1-done');

    await waitFor(() => {
      expect(screen.getByTestId('drawer-status-select')).toHaveValue(
        'status-1-done'
      );
    });
  });

  it('shows inline confirm panel with title, calls deleteTask on confirm, and closes modal', async () => {
    const deleteSpy = vi.spyOn(useFlowboardStore.getState(), 'deleteTask');
    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-1'));
    await screen.findByTestId('task-drawer');

    fireEvent.click(screen.getByTestId('drawer-delete-btn'));

    const confirmPanel = screen.getByTestId('drawer-delete-confirm-panel');
    expect(confirmPanel).toBeInTheDocument();
    expect(confirmPanel).toHaveTextContent(
      'Implement token refresh rotation flow'
    );

    fireEvent.click(screen.getByTestId('drawer-confirm-delete-btn'));
    expect(deleteSpy).toHaveBeenCalledWith('task-1');

    await waitFor(() => {
      expect(screen.queryByTestId('task-drawer')).not.toBeInTheDocument();
    });

    expect(await screen.findByText('Task deleted')).toBeInTheDocument();
    deleteSpy.mockRestore();
  });

  it('returns focus to trigger element when modal closes', async () => {
    render(<App />);

    const card = screen.getByTestId('task-card-task-1');
    card.focus();
    fireEvent.click(card);

    await screen.findByTestId('task-drawer');

    fireEvent.click(screen.getByTestId('drawer-close-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('task-drawer')).not.toBeInTheDocument();
    });

    expect(document.activeElement).toBe(card);
  });
});
