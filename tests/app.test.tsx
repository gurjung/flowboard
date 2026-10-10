import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('App Scaffold & Token Verification', () => {
  it('renders application title and category cards', () => {
    render(<App />);

    expect(screen.getByText('Flowboard Scaffold Test')).toBeInTheDocument();
    expect(screen.getByTestId('status-todo-card')).toBeInTheDocument();
    expect(screen.getByTestId('status-in-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('status-done-card')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
