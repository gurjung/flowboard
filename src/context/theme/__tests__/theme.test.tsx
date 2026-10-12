import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '@/components/theme';
import { ThemeSelector } from '@/features/topbar/ThemeSelector';

const TestComponent = () => {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <ThemeSelector />
    </div>
  );
};

describe('Theme management and persistence (F11 UI Refresh)', () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];
  let matchesMock = false;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    listeners = [];
    matchesMock = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: matchesMock,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(
        (_event: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners.push(cb);
        }
      ),
      removeEventListener: vi.fn(
        (_event: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== cb);
        }
      ),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('Light/Dark/System sets and removes the dark class on html root and persists choice', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state with system (matchesMock is false)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click Dark button
    fireEvent.click(screen.getByTestId('theme-btn-dark'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Click Light button
    fireEvent.click(screen.getByTestId('theme-btn-light'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    // Click System button
    fireEvent.click(screen.getByTestId('theme-btn-system'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('falls back gracefully to system theme when localStorage throws an error', () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('Access denied (SecurityError)');
      });
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Access denied (SecurityError)');
      });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should not crash and default to system
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');

    // Selecting dark should update in-memory state without crashing
    expect(() => {
      fireEvent.click(screen.getByTestId('theme-btn-dark'));
    }).not.toThrow();

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('updates resolved theme dynamically when system matchMedia changes under system mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Simulate OS switching to dark mode
    act(() => {
      listeners.forEach((cb) =>
        cb({ matches: true } as unknown as MediaQueryListEvent)
      );
    });

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Simulate OS switching back to light mode
    act(() => {
      listeners.forEach((cb) =>
        cb({ matches: false } as unknown as MediaQueryListEvent)
      );
    });

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
