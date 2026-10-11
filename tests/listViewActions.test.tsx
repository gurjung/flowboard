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

    // Clicking on row title does NOT open edit modal
    const titleSpan = screen.getByTestId('task-row-title-task-1');
    fireEvent.click(titleSpan);
    expect(handleOpen).toHaveBeenCalledTimes(1);

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
});
