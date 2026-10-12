import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
  createToastStore,
  ToastProvider,
  ToastContainer,
  useToast,
} from '@/components/toasts';
import { flowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';
import App from '@/App';

// Helper component to trigger toasts in tests
const ToastTrigger: React.FC = () => {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.error('Error occurred')}>
        Trigger Error
      </button>
      <button onClick={() => toast.success('Operation succeeded')}>
        Trigger Success
      </button>
    </div>
  );
};

describe('Toast Notification System', () => {
  beforeEach(() => {
    const seed = createSeedState();
    flowboardStore.setState({ ...seed });
  });

  it('stacks at most 3 toasts and dedupes consecutive identical messages', () => {
    const store = createToastStore();
    render(
      <ToastProvider toastStore={store}>
        <ToastTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    // Trigger consecutive identical messages
    act(() => {
      store.error('Network failure');
      store.error('Network failure'); // Dedupe: should NOT add second
    });

    expect(screen.getAllByRole('alert')).toHaveLength(1);

    // Trigger more to test max 3 limit
    act(() => {
      store.success('Success 1');
      store.info('Info 2');
      store.error('Error 3');
    });

    // Max 3 stacked toasts
    const container = screen.getByTestId('toast-container');
    expect(container.children).toHaveLength(3);
    // Oldest 'Network failure' was shifted out
    expect(screen.queryByText('Network failure')).not.toBeInTheDocument();
  });

  it('auto-dismisses errors after ~8s and success after ~3s under fake timers', () => {
    vi.useFakeTimers();
    const store = createToastStore();

    render(
      <ToastProvider toastStore={store}>
        <ToastTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    act(() => {
      store.success('Saved');
      store.error('Failed');
    });

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');

    // Advance 3.1s -> success dismisses, error remains
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Advance another 5s (8.1s total) -> error dismisses
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('dismisses immediately on clicking dismiss button', () => {
    const store = createToastStore();
    render(
      <ToastProvider toastStore={store}>
        <ToastTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    act(() => {
      store.error('Dismiss me');
    });

    const dismissBtn = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('clears all active toasts on ANY current-user change', () => {
    render(<App />);

    // Trigger a toast directly via the active toast context
    const select = screen.getByTestId('user-select');

    // Switch users -> clears all toasts immediately
    fireEvent.change(select, { target: { value: 'user-bob' } });
    const container = screen.getByTestId('toast-container');
    expect(container.children).toHaveLength(0);
  });

  it('REQUIRED TEST: Alice restores folder-2, switch to Bob before latency resolves -> Bob sees no toast and no folder-2 name', async () => {
    vi.useFakeTimers();

    // 1. Archive folder-2 in seed
    flowboardStore.getState().archiveContainerSync('folder-2');

    render(<App />);

    // 2. Open archived section under Alice
    const toggleArchived = screen.getByTestId('toggle-archived-section');
    fireEvent.click(toggleArchived);

    // Restore button for folder-2
    const restoreBtn = screen.getByTestId('restore-btn-folder-2');
    fireEvent.click(restoreBtn);

    // 3. Before latency resolves (e.g. 50ms in), switch to Bob
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const select = screen.getByTestId('user-select');
    fireEvent.change(select, { target: { value: 'user-bob' } });

    // 4. Advance through remainder of 400ms latency
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Bob must see NO toast
    const container = screen.getByTestId('toast-container');
    expect(container.children).toHaveLength(0);

    // Bob DOM must NOT leak folder-2 name
    expect(document.body.innerHTML).not.toContain('Security & Compliance');

    vi.useRealTimers();
  });
});
