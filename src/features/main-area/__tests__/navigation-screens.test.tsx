import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '@/App';
import { flowboardStore } from '@/store/useFlowboardStore';
import { createSeedState } from '@/domain/fixtures';

describe('TopBar, Breadcrumbs & Access Control Screens', () => {
  beforeEach(() => {
    const seed = createSeedState();
    flowboardStore.setState({ ...seed });
    document.title = 'Flowboard';
  });

  it('LEAK TEST: Carol selects list-3, switch to Bob -> 403 screen with zero leaked names, switch to Alice restores', () => {
    render(<App />);

    // 1. Switch to Carol (who has access to private folder-2 and list-3)
    const userSelect = screen.getByTestId('user-select');
    fireEvent.change(userSelect, { target: { value: 'user-carol' } });

    // Select list-3 ("Vulnerabilities")
    const list3Row = screen.getByTestId('tree-row-list-3');
    fireEvent.click(list3Row);

    // Carol sees breadcrumbs and list title
    expect(screen.getByTestId('list-title')).toHaveTextContent(
      'Vulnerabilities'
    );
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getAllByText('Security & Compliance').length).toBeGreaterThan(
      0
    );

    // 2. Switch to Bob (forbidden on folder-2 and list-3)
    fireEvent.change(userSelect, { target: { value: 'user-bob' } });

    // Assert 403 Access Denied screen is displayed
    expect(screen.getByTestId('access-denied-screen')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have permission to view this list.')
    ).toBeInTheDocument();

    // ZERO LEAKAGE ASSERTIONS across entire DOM
    const bodyHtml = document.body.innerHTML;
    expect(bodyHtml).not.toContain('Security & Compliance');
    expect(bodyHtml).not.toContain('Vulnerabilities');
    expect(document.title).not.toContain('Security');
    expect(document.title).not.toContain('Vulnerabilities');

    // Breadcrumbs must render nothing
    expect(screen.queryByTestId('breadcrumbs')).not.toBeInTheDocument();

    // Toast region and sidebar must have zero references or selected attributes for list-3
    const toastContainer = screen.getByTestId('toast-container');
    expect(toastContainer.innerHTML).not.toContain('Vulnerabilities');
    const selectedRows = document.querySelectorAll('[aria-selected="true"]');
    for (const row of selectedRows) {
      expect(row.textContent).not.toContain('Vulnerabilities');
    }

    // 3. Switch to Alice (Admin) -> view restores instantly!
    fireEvent.change(userSelect, { target: { value: 'user-alice' } });

    expect(
      screen.queryByTestId('access-denied-screen')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('list-title')).toHaveTextContent(
      'Vulnerabilities'
    );
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getAllByText('Security & Compliance').length).toBeGreaterThan(
      0
    );
  });

  it('ARCHIVED SELECTION SCREEN: shows role-differentiated copy and clearSelection button', () => {
    render(<App />);

    // Archive folder-1 under Alice (Admin)
    act(() => {
      flowboardStore.getState().archiveContainerSync('folder-1');
    });

    // list-1 is still selected, but archived -> displays archived-list-screen
    expect(screen.getByTestId('archived-list-screen')).toBeInTheDocument();
    expect(screen.getByText('List is Archived')).toBeInTheDocument();

    // Admin copy includes hint to restore from sidebar Archived section
    expect(
      screen.getByText(/Restore it from the Archived section in the sidebar/)
    ).toBeInTheDocument();

    // Switch to Bob (Member)
    const userSelect = screen.getByTestId('user-select');
    fireEvent.change(userSelect, { target: { value: 'user-bob' } });

    // Member copy is plain without admin instructions
    expect(
      screen.getByText('This list or its parent is archived and unavailable.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Restore it from the Archived section/)
    ).not.toBeInTheDocument();

    // Exactly one Clear selection button
    const clearBtn = screen.getByTestId('clear-selection-btn');
    expect(clearBtn).toBeInTheDocument();

    // Clicking Clear selection calls clearSelection() and resets to neutral state
    fireEvent.click(clearBtn);
    expect(flowboardStore.getState().selectedListId).toBeNull();
    expect(screen.getByTestId('no-list-selected')).toBeInTheDocument();
    expect(screen.getByText('Select a list')).toBeInTheDocument();
  });
});
