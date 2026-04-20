import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';
import { server } from '../../setup/server';
import { http, HttpResponse } from 'msw';

function TestConsumer() {
  const { user, loading, login, signup, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <button onClick={() => login('a@x.com', 'pass')}>Login</button>
      <button onClick={() => signup('A', 'a@x.com', 'pass')}>Signup</button>
      <button onClick={logout}>Logout</button>
      <button data-testid="login-fn" onClick={() => login('a@x.com', 'pass')}>Login Fn</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('login stores token and populates user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('a@x.com', 'pass');
    });

    expect(result.current.user).toEqual({ id: 'u1', name: 'A', email: 'a@x.com' });
    expect(localStorage.getItem('token')).toBe('t-fake');
  });

  it('signup stores token and populates user', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    const signupBtn = screen.getByText('Signup');
    await userEvent.click(signupBtn);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('a@x.com');
      expect(localStorage.getItem('token')).toBe('t-fake');
    });
  });

  it('logout clears token and user', async () => {
    localStorage.setItem('token', 't-fake');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    const logoutBtn = screen.getByText('Logout');
    await userEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('checkAuth populates user from valid token on mount', async () => {
    localStorage.setItem('token', 't-fake');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('a@x.com');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('checkAuth clears token and user on invalid token', async () => {
    server.use(
      http.get('http://localhost:3000/api/auth/profile', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    localStorage.setItem('token', 't-invalid');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});