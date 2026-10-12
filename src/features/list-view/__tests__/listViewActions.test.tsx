import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ListView } from '@/features/list-view/ListView';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import { ToastProvider } from '@/components/toasts';

describe('ListView Actions Column & 3-Dots Popup Menu (Feedback Item 3)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  it('renders actions column with three dots menu supporting Edit and Delete', async () => {
    const handleOpen = vi.fn();
    const deleteSpy = vi.spyOn(useFlowboardStore.getState(), 'deleteTask');
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    // Th actions header
    expect(screen.getByTestId('th-actions')).toBeInTheDocument();

    // Three dots button for task-1
    const actionBtn = screen.getByTestId('task-actions-task-1');
    expect(actionBtn).toBeInTheDocument();

    fireEvent.click(actionBtn);

    // Pop-up menu shows Edit and Delete options
    const editBtn = screen.getByRole('menuitem', { name: /edit/i });
    const deleteBtn = screen.getByRole('menuitem', { name: /delete/i });
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    // Click Edit -> calls onOpenTask('task-1')
    fireEvent.click(editBtn);
    expect(handleOpen).toHaveBeenCalledWith('task-1');

    // Clicking on row title button opens task modal
    const titleBtn = screen.getByTestId('task-row-title-task-1');
    fireEvent.click(titleBtn);
    expect(handleOpen).toHaveBeenCalledTimes(2);

    // Click action button again to open menu for delete
    fireEvent.click(actionBtn);
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));

    // Warning / confirmation modal appears
    const dialog = await screen.findByTestId('delete-task-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      /Are you sure you want to delete this task/i
    );
    expect(dialog).toHaveTextContent('Implement token refresh rotation flow');

    // Click Cancel first -> modal closes without calling deleteTask
    fireEvent.click(screen.getByTestId('delete-task-cancel-btn'));
    await waitFor(() => {
      expect(
        screen.queryByTestId('delete-task-dialog')
      ).not.toBeInTheDocument();
    });
    expect(deleteSpy).not.toHaveBeenCalled();

    // Open delete menu again and confirm
    fireEvent.click(actionBtn);
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await screen.findByTestId('delete-task-dialog');
    fireEvent.click(screen.getByTestId('delete-task-confirm-btn'));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('task-1');
    });

    deleteSpy.mockRestore();
  });

  it('hides actions menu button when canEdit is false', () => {
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={false} />
      </ToastProvider>
    );

    expect(screen.queryByTestId('task-actions-task-1')).not.toBeInTheDocument();
  });

  it('clicking task row opens task modal with task details exactly once', () => {
    const handleOpen = vi.fn();
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    const row = screen.getByTestId('task-row-task-1');
    fireEvent.click(row);

    expect(handleOpen).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledWith('task-1');
  });

  it('clicking 3-dots actions menu button does not trigger row click modal open', () => {
    const handleOpen = vi.fn();
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    const actionBtn = screen.getByTestId('task-actions-task-1');
    fireEvent.click(actionBtn);

    // Clicking the action button opens menu, does not open task modal
    expect(handleOpen).not.toHaveBeenCalled();
  });

  it('menu Edit opens modal exactly once without double-opening from row click', () => {
    const handleOpen = vi.fn();
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    const actionBtn = screen.getByTestId('task-actions-task-1');
    fireEvent.click(actionBtn);

    const editBtn = screen.getByRole('menuitem', { name: /edit/i });
    fireEvent.click(editBtn);

    expect(handleOpen).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledWith('task-1');
  });

  it('ignores row click when user has active text selection', () => {
    const handleOpen = vi.fn();
    const originalGetSelection = window.getSelection;
    window.getSelection = vi.fn().mockReturnValue({
      toString: () => 'some selected text',
    });

    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    const row = screen.getByTestId('task-row-task-1');
    fireEvent.click(row);

    expect(handleOpen).not.toHaveBeenCalled();

    window.getSelection = originalGetSelection;
  });

  it('row click sets focus to task title button', () => {
    const handleOpen = vi.fn();
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={true} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    const row = screen.getByTestId('task-row-task-1');
    const titleBtn = screen.getByTestId('task-row-title-task-1');

    fireEvent.click(row);
    expect(titleBtn).toHaveFocus();
    expect(handleOpen).toHaveBeenCalledWith('task-1');
  });

  it('read-only user can open modal on row click (prop-level)', () => {
    const handleOpen = vi.fn();
    render(
      <ToastProvider>
        <ListView listId="list-1" canEdit={false} onOpenTask={handleOpen} />
      </ToastProvider>
    );

    const row = screen.getByTestId('task-row-task-1');
    fireEvent.click(row);

    expect(handleOpen).toHaveBeenCalledWith('task-1');
  });
});
