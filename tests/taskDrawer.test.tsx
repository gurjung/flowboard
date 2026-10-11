import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { getLocalTodayDateInput } from '@/domain/dueDate';

describe('TaskDetailDrawer Unified Modal & Save/Cancel (Feedback Amendments)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  it('opens centered modal on Kanban card click', async () => {
    render(<App />);

    // In Kanban view, click task-1 card
    fireEvent.click(screen.getByTestId('task-card-task-1'));

    const modal = await screen.findByTestId('task-drawer');
    expect(modal).toBeInTheDocument();
    // Modal should be centered (has flex items-center justify-center container)
    expect(modal.parentElement).toHaveClass('items-center', 'justify-center');
    expect(screen.getByTestId('drawer-title-input')).toHaveValue(
      'Implement token refresh rotation flow'
    );

    // Cancel / Close closes modal
    fireEvent.click(screen.getByTestId('drawer-cancel-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('task-drawer')).not.toBeInTheDocument();
    });
  });

  it('does NOT save edits on blur or selection; saves all changes only on clicking "Save changes"', async () => {
    const updateSpy = vi.spyOn(useFlowboardStore.getState(), 'updateTask');
    const statusSpy = vi.spyOn(
      useFlowboardStore.getState(),
      'changeTaskStatus'
    );
    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-1'));
    await screen.findByTestId('task-drawer');

    const titleInput = screen.getByTestId('drawer-title-input');
    const descInput = screen.getByTestId('drawer-description-input');
    const prioritySelect = screen.getByTestId('drawer-priority-select');
    const statusSelect = screen.getByTestId('drawer-status-select');

    // Change multiple fields
    fireEvent.change(titleInput, { target: { value: 'New Saved Title' } });
    fireEvent.blur(titleInput);
    fireEvent.change(descInput, { target: { value: 'New Saved Description' } });
    fireEvent.blur(descInput);
    fireEvent.change(prioritySelect, { target: { value: 'urgent' } });
    fireEvent.change(statusSelect, { target: { value: 'status-1-prog' } });

    // Store mutations should NOT have been called yet!
    expect(updateSpy).not.toHaveBeenCalled();
    expect(statusSpy).not.toHaveBeenCalled();

    // Click "Save changes" button
    fireEvent.click(screen.getByTestId('drawer-save-btn'));

    // Now updates are dispatched
    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('task-1', {
        title: 'New Saved Title',
        description: 'New Saved Description',
        priority: 'urgent',
        assigneeIds: ['user-alice'],
        dueDate: '2026-10-15T18:00:00.000Z',
      });
      expect(statusSpy).toHaveBeenCalledWith('task-1', 'status-1-prog');
    });

    updateSpy.mockRestore();
    statusSpy.mockRestore();
  });

  it('rolls back to previous state without mutations if user clicks Cancel', async () => {
    const updateSpy = vi.spyOn(useFlowboardStore.getState(), 'updateTask');
    const statusSpy = vi.spyOn(
      useFlowboardStore.getState(),
      'changeTaskStatus'
    );
    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-1'));
    await screen.findByTestId('task-drawer');

    // Edit fields
    fireEvent.change(screen.getByTestId('drawer-title-input'), {
      target: { value: 'Discarded Title' },
    });
    fireEvent.change(screen.getByTestId('drawer-priority-select'), {
      target: { value: 'low' },
    });

    // Click Cancel
    fireEvent.click(screen.getByTestId('drawer-cancel-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('task-drawer')).not.toBeInTheDocument();
    });

    expect(updateSpy).not.toHaveBeenCalled();
    expect(statusSpy).not.toHaveBeenCalled();

    // Reopen task-1 card -> original title is preserved
    fireEvent.click(screen.getByTestId('task-card-task-1'));
    expect(await screen.findByTestId('drawer-title-input')).toHaveValue(
      'Implement token refresh rotation flow'
    );

    updateSpy.mockRestore();
    statusSpy.mockRestore();
  });

  it('restricts due date from previous to current date with min attribute and validation', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('task-card-task-1'));
    await screen.findByTestId('task-drawer');

    const dateInput = screen.getByTestId('drawer-due-date-input');
    const todayStr = getLocalTodayDateInput();
    // Input must have min attribute set to today
    expect(dateInput).toHaveAttribute('min', todayStr);

    // Pick past date (e.g. 2020-01-01)
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
    fireEvent.click(screen.getByTestId('drawer-save-btn'));

    // Inline validation error appears and prevents saving
    expect(
      await screen.findByText(/Due date cannot be in the past/i)
    ).toBeInTheDocument();
  });

  it('opens same modal for creating task from Kanban column with pre-selected status', async () => {
    const createSpy = vi.spyOn(useFlowboardStore.getState(), 'createTask');
    render(<App />);

    // Click "+ Add task" button on In Progress column
    const addProgBtn = screen.getByTestId('add-task-btn-status-1-prog');
    fireEvent.click(addProgBtn);

    // Modal opens in Create Task mode
    const modal = await screen.findByTestId('task-drawer');
    expect(modal).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Create Task' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('drawer-status-select')).toHaveValue(
      'status-1-prog'
    );

    // Fill title
    fireEvent.change(screen.getByTestId('drawer-title-input'), {
      target: { value: 'New Task Created Via Modal' },
    });
    // Click Create Task button
    fireEvent.click(screen.getByTestId('drawer-save-btn'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task Created Via Modal',
          statusId: 'status-1-prog',
          listId: 'list-1',
        })
      );
    });

    createSpy.mockRestore();
  });
});
