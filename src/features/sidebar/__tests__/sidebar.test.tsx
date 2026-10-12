import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '@/App';
import { flowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';

describe('Sidebar Component & Permission Switching', () => {
  beforeEach(() => {
    // Reset singleton store to fresh seed state before each test
    const seed = createSeedState();
    flowboardStore.setState({
      ...seed,
    });
  });

  it('switching from Alice (Admin) to Bob (Member) shrinks the tree and hides the private Security folder', () => {
    render(<App />);

    // Initially Alice (Admin) is active
    expect(screen.getByText('Security & Compliance')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();

    // Switch to Bob (Member) via UserSwitcher dropdown
    const select = screen.getByTestId('user-select');
    fireEvent.change(select, { target: { value: 'user-bob' } });

    // Security & Compliance (private folder without grant) must disappear immediately
    expect(screen.queryByText('Security & Compliance')).not.toBeInTheDocument();
    expect(screen.queryByText('Vulnerabilities')).not.toBeInTheDocument();

    // Public Core Platform and Sprint Backlog must remain visible
    expect(screen.getByTestId('tree-row-folder-1')).toBeInTheDocument();
    expect(screen.getAllByText('Core Platform').length).toBeGreaterThan(0);
    expect(screen.getByTestId('tree-row-list-1')).toBeInTheDocument();
  });

  it('switching to Carol (Member) reveals Security folder but hides Bug Triage (deny grant)', () => {
    render(<App />);

    const select = screen.getByTestId('user-select');
    fireEvent.change(select, { target: { value: 'user-carol' } });

    // Security & Compliance (unlocked via allow grant) is visible
    expect(screen.getByText('Security & Compliance')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();

    // Bug Triage (denied via explicit deny grant) must disappear
    expect(screen.queryByText('Bug Triage')).not.toBeInTheDocument();
  });

  it('request counter prevents race conditions during rapid list selection under fake timers', () => {
    vi.useFakeTimers();

    render(<App />);

    // Fast click list-2 then list-1 within the 150ms delay
    const list2Row = screen.getByTestId('tree-row-list-2');
    fireEvent.click(list2Row);

    // Main area skeleton is triggered
    expect(screen.getByTestId('main-area-skeleton')).toBeInTheDocument();

    // Advance 50ms (before timer finishes) and click list-1
    act(() => {
      vi.advanceTimersByTime(50);
    });

    const list1Row = screen.getByTestId('tree-row-list-1');
    fireEvent.click(list1Row);

    // Advance 100ms (150ms total from first click, but only 100ms from second click)
    // First timer fires here, but requestCounterRef matches second click, so skeleton remains!
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId('main-area-skeleton')).toBeInTheDocument();

    // Advance remaining 50ms (150ms from second click)
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Loading cleared and latest list-1 title rendered!
    expect(screen.queryByTestId('main-area-skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('list-title')).toHaveTextContent(
      'Sprint Backlog'
    );

    vi.useRealTimers();
  });
});
