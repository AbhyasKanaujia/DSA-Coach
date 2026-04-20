import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../src/App';

describe('Signup Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows client error on password mismatch', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Create Account')).toBeInTheDocument());

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitBtn = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(nameInput, 'A');
    await userEvent.type(emailInput, 'a@x.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.type(confirmInput, 'different');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('shows client error on short password', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Create Account')).toBeInTheDocument());

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitBtn = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(nameInput, 'A');
    await userEvent.type(emailInput, 'a@x.com');
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(confirmInput, 'short');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('redirects to dashboard on success', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Create Account')).toBeInTheDocument());

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitBtn = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(nameInput, 'A');
    await userEvent.type(emailInput, 'a@x.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.type(confirmInput, 'password');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Dashboard coming soon...')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBe('t-fake');
    });
  });

  it('shows error banner on duplicate email', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Create Account')).toBeInTheDocument());

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitBtn = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(nameInput, 'A');
    await userEvent.type(emailInput, 'dupe@x.com');
    await userEvent.type(passwordInput, 'password');
    await userEvent.type(confirmInput, 'password');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});