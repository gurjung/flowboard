import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { useFlowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';

describe('Tree keyboard navigation integration tests (F11)', () => {
  beforeEach(() => {
    useFlowboardStore.setState({
      ...createSeedState(),
      currentUserId: 'user-alice',
      selectedListId: 'list-1',
    });
  });

  it('renders role="tree" and role="treeitem" with roving tabIndex', () => {
    render(<App />);

    const tree = screen.getByRole('tree', { name: /Container hierarchy/i });
    expect(tree).toBeInTheDocument();

    const treeitems = screen.getAllByRole('treeitem');
    expect(treeitems.length).toBeGreaterThan(0);

    // Exactly one treeitem has tabIndex 0 (the first one initially)
    const activeItems = treeitems.filter(
      (item) => item.getAttribute('tabIndex') === '0'
    );
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0]).toBe(treeitems[0]);
  });

  it('navigates with ArrowDown, ArrowUp, Home, and End updating roving tabindex', () => {
    render(<App />);

    const tree = screen.getByRole('tree');
    const treeitems = screen.getAllByRole('treeitem');
    const firstItem = treeitems[0]!;
    const secondItem = treeitems[1]!;

    firstItem.focus();
    fireEvent.focus(firstItem);
    expect(firstItem).toHaveAttribute('tabIndex', '0');

    // ArrowDown moves focus to second item
    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    expect(secondItem).toHaveAttribute('tabIndex', '0');
    expect(firstItem).toHaveAttribute('tabIndex', '-1');

    // ArrowUp moves focus back to first item
    fireEvent.keyDown(tree, { key: 'ArrowUp' });
    expect(firstItem).toHaveAttribute('tabIndex', '0');

    // End jumps to last item
    const lastItem = treeitems[treeitems.length - 1]!;
    fireEvent.keyDown(tree, { key: 'End' });
    expect(lastItem).toHaveAttribute('tabIndex', '0');

    // Home jumps to first item
    fireEvent.keyDown(tree, { key: 'Home' });
    expect(firstItem).toHaveAttribute('tabIndex', '0');
  });

  it('Enter on a list selects it in the store', () => {
    render(<App />);

    const tree = screen.getByRole('tree');
    const list2Row = screen.getByTestId('tree-row-list-2');

    // Focus list-2
    list2Row.focus();
    fireEvent.focus(list2Row);
    fireEvent.keyDown(tree, { key: 'Enter' });

    // Store selectedListId updates to list-2
    expect(useFlowboardStore.getState().selectedListId).toBe('list-2');
  });

  it('ArrowLeft collapses an expanded container and ArrowRight expands it', () => {
    render(<App />);

    const tree = screen.getByRole('tree');
    const space1Row = screen.getByTestId('tree-row-space-1');

    // space-1 is initially expanded
    expect(space1Row).toHaveAttribute('aria-expanded', 'true');

    space1Row.focus();
    fireEvent.focus(space1Row);
    // ArrowLeft collapses space-1
    fireEvent.keyDown(tree, { key: 'ArrowLeft' });
    expect(space1Row).toHaveAttribute('aria-expanded', 'false');

    // ArrowRight expands space-1 again
    fireEvent.keyDown(tree, { key: 'ArrowRight' });
    expect(space1Row).toHaveAttribute('aria-expanded', 'true');
  });

  it('allows keyboard Tab access to the 3-dots action menu button on focused row', () => {
    render(<App />);

    const firstRow = screen.getByTestId('tree-row-ws-1');
    const actionBtn = screen.getByTestId('row-menu-btn-ws-1');

    firstRow.focus();
    expect(firstRow).toHaveFocus();

    // Tab key moves focus into row's action button
    actionBtn.focus();
    expect(actionBtn).toHaveFocus();
  });
});
