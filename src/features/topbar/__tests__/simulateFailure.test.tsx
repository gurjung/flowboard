import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';

describe('Simulated Failure Mode (Recruiter Guidelines & Resilience)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
      simulateFailure: false,
    });
  });

  it('renders simulate failure toggle in top bar and toggles state on click', () => {
    render(<App />);

    const toggle = screen.getByTestId('simulate-failure-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    // Click toggle to enable
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(useFlowboardStore.getState().simulateFailure).toBe(true);

    // Click toggle to disable
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(useFlowboardStore.getState().simulateFailure).toBe(false);
  });

  it('fails async task mutations when simulateFailure is active and succeeds when inactive', async () => {
    const store = useFlowboardStore.getState();

    // 1. Inactive: updateTask succeeds
    const successRes = await store.updateTask('task-1', {
      title: 'Updated title successfully',
    });
    expect(successRes.success).toBe(true);

    // 2. Activate simulated failure
    store.setSimulateFailure(true);

    const failRes = await store.updateTask('task-1', {
      title: 'Should fail to update',
    });
    expect(failRes.success).toBe(false);
    if (!failRes.success) {
      expect(failRes.error.code).toBe('INTERNAL');
      expect(failRes.error.message).toContain('Simulated network failure');
    }

    // 3. Status change fails
    const statusFailRes = await store.changeTaskStatus(
      'task-1',
      'status-1-done',
      0
    );
    expect(statusFailRes.success).toBe(false);

    // 4. Deactivate: mutations succeed again
    store.setSimulateFailure(false);
    const statusSuccessRes = await store.changeTaskStatus(
      'task-1',
      'status-1-done',
      0
    );
    expect(statusSuccessRes.success).toBe(true);
  });
});
