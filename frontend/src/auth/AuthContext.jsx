import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client, { tokenStore, setOnUnauthorized } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStore.get());
  const [hydrating, setHydrating] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => logout());
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    client
      .get('/auth/profile')
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password, name }) => {
    await client.post('/auth/register', { email, password, name });
    return login(email, password);
  }, [login]);

  const value = { user, token, hydrating, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
