import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TaskDrawer } from '@/features/task-drawer/TaskDrawer';
import { ToastProvider } from '@/components/toasts';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';

describe('TaskDrawer Read-Only & Focus Fallback (Gates 7 & 8)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-bob',
      selectedListId: 'list-1',
    });
  });

  it('renders read-only mode when canEdit is false (text values, no delete button)', () => {
    render(
      <ToastProvider>
        <TaskDrawer
          taskId="task-1"
          isOpen={true}
          canEdit={false}
          onClose={() => {}}
        />
      </ToastProvider>
    );

    // Title is rendered as text heading, not an editable input
    expect(screen.queryByTestId('drawer-title-input')).not.toBeInTheDocument();
    expect(
      screen.getByText('Implement token refresh rotation flow')
    ).toBeInTheDocument();

    // No delete button
    expect(screen.queryByTestId('drawer-delete-btn')).not.toBeInTheDocument();

    // Inputs for status, priority, due date are disabled or text
    expect(
      screen.queryByTestId('drawer-due-date-clear-btn')
    ).not.toBeInTheDocument();
  });

  it('falls back to focusing main heading when trigger is removed/unmounted', async () => {
    let unmountTrigger = false;
    let isOpen = false;

    const renderTest = (hasTrigger: boolean, open: boolean) => (
      <div>
        <main>
          <h1 tabIndex={-1}>Sprint Backlog</h1>
        </main>
        {hasTrigger && <button data-testid="temp-trigger">Open Task</button>}
        <ToastProvider>
          <TaskDrawer
            taskId="task-1"
            isOpen={open}
            canEdit={true}
            onClose={() => {}}
          />
        </ToastProvider>
      </div>
    );

    const { rerender } = render(renderTest(true, false));

    // Focus trigger before opening drawer
    const trigger = screen.getByTestId('temp-trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Open drawer
    isOpen = true;
    rerender(renderTest(true, isOpen));

    // Wait for drawer to open
    await screen.findByTestId('task-drawer');

    // Unmount trigger and close drawer
    unmountTrigger = true;
    isOpen = false;
    rerender(renderTest(!unmountTrigger, isOpen));

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(document.activeElement).toBe(heading);
    });
  });
});
