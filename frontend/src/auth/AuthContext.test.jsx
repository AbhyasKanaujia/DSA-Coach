import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { tokenStore } from '../api/client';
import * as authApi from '../api/auth';

function Probe() {
  const { user, token, hydrating, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="hydrating">{String(hydrating)}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="email">{user?.email ?? 'anon'}</span>
      <button onClick={() => login('a@b.com', 'pw').catch(() => {})}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts unauthenticated when no token stored', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('hydrating').textContent).toBe('false'));
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(screen.getByTestId('email').textContent).toBe('anon');
  });

  it('logs in, persists token, hydrates user, then logs out', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'tok-123',
      user: { email: 'a@b.com', role: 'user' }
    });
    vi.spyOn(authApi, 'getProfile').mockResolvedValue({ email: 'a@b.com', role: 'user' });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('a@b.com'));
    expect(screen.getByTestId('token').textContent).toBe('tok-123');
    expect(tokenStore.get()).toBe('tok-123');

    act(() => {
      screen.getByText('logout').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(tokenStore.get()).toBeNull();
  });

  it('hydrates user from stored token on mount', async () => {
    tokenStore.set('stored-tok');
    vi.spyOn(authApi, 'getProfile').mockResolvedValue({ email: 'me@x.com', role: 'user' });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('me@x.com'));
    expect(screen.getByTestId('hydrating').textContent).toBe('false');
  });

  it('clears token if stored token rejected (401-like failure)', async () => {
    tokenStore.set('bad-tok');
    vi.spyOn(authApi, 'getProfile').mockRejectedValue(new Error('unauthorized'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('none'));
    expect(tokenStore.get()).toBeNull();
  });
});
