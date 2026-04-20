import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../src/App';

describe('Login Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fills form and redirects to dashboard on success', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Welcome Back')).toBeInTheDocument());

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'a@x.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Dashboard coming soon...')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBe('t-fake');
    });
  });

  it('shows error banner on bad credentials', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Welcome Back')).toBeInTheDocument());

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'bad@x.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});