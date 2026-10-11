import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '@/App';
import { SIDEBAR_STORAGE_KEY } from '@/components/layout/SidebarContext';

describe('Sidebar Collapse and Mobile Overlay', () => {
  beforeEach(() => {
    localStorage.clear();
    // Default desktop matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(min-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('toggles desktop sidebar collapse with aria-expanded and inert attribute', async () => {
    render(<App />);

    const toggleBtn = screen.getByTestId('sidebar-toggle-btn');
    const sidebar = screen.getByTestId('sidebar');

    // Initially expanded on desktop
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(toggleBtn).toHaveAttribute('aria-controls', 'sidebar');
    expect(sidebar).not.toHaveAttribute('inert');
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Click toggle to collapse
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('inert');
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('true');
    expect(document.activeElement).toBe(toggleBtn);

    // Click toggle again to expand
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).not.toHaveAttribute('inert');
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false');
  });

  it('restores collapsed state from localStorage on initial render', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
    render(<App />);

    const toggleBtn = screen.getByTestId('sidebar-toggle-btn');
    const sidebar = screen.getByTestId('sidebar');

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('inert');
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  it('mobile overlay below 768px opens with toggle, closes on Escape and backdrop click', async () => {
    // Set matchMedia to mobile (< 768px)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, // not desktop min-width 768px
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<App />);

    const toggleBtn = screen.getByTestId('sidebar-toggle-btn');
    const sidebar = screen.getByTestId('sidebar');

    // On mobile, initial state is closed
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('inert');
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();

    // Click toggle button to open mobile overlay
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).not.toHaveAttribute('inert');
    const backdrop = screen.getByTestId('sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Press Escape key to close mobile overlay
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });

    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('inert');
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();

    // Reopen and test backdrop click
    await act(async () => {
      fireEvent.click(toggleBtn);
    });
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sidebar-backdrop'));
    });
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
