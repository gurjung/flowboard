import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';

describe('Client-Side Search Flows (Stretch Goal)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  it('renders search bar with input in list header', () => {
    render(<App />);
    const searchInput = screen.getByTestId('task-search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'search tasks');
  });

  it('filters Kanban cards when searching by title', () => {
    render(<App />);

    // Initially task-1 and other tasks are visible
    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();

    const searchInput = screen.getByTestId('task-search-input');
    fireEvent.change(searchInput, { target: { value: 'token refresh' } });

    // task-1 title: "Implement token refresh rotation flow"
    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
    // other tasks are filtered out
    expect(screen.queryByTestId('task-card-task-2')).not.toBeInTheDocument();
  });

  it('filters Kanban cards when searching by description', () => {
    render(<App />);

    const searchInput = screen.getByTestId('task-search-input');
    // task-1 description: "Secure silent authentication token refresh using short-lived JWTs."
    fireEvent.change(searchInput, { target: { value: 'JWTs' } });

    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-card-task-2')).not.toBeInTheDocument();
  });

  it('clears search when clear button is clicked and restores all tasks', () => {
    render(<App />);

    const searchInput = screen.getByTestId('task-search-input');
    fireEvent.change(searchInput, { target: { value: 'token refresh' } });

    expect(screen.queryByTestId('task-card-task-2')).not.toBeInTheDocument();

    const clearBtn = screen.getByTestId('task-search-clear-btn');
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue('');
    expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument();
  });

  it('filters rows in List view and displays search-aware empty state', () => {
    render(<App />);

    // Switch to List view
    fireEvent.click(screen.getByTestId('view-toggle-list'));
    expect(screen.getByTestId('task-list-view')).toBeInTheDocument();

    const searchInput = screen.getByTestId('task-search-input');
    fireEvent.change(searchInput, {
      target: { value: 'totally-non-existent-query-xyz' },
    });

    expect(screen.getByTestId('empty-list-view')).toHaveTextContent(
      'No tasks matching "totally-non-existent-query-xyz"'
    );
  });
});
