import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStore, setOnUnauthorized } from '../api/client';
import * as authApi from '../api/auth';

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

  const syncFromStorage = useCallback(() => {
    const stored = tokenStore.get();
    setToken((current) => {
      if (stored === current) return current;
      if (!stored) setUser(null);
      return stored;
    });
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key && e.key !== 'dsa.token') return;
      syncFromStorage();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncFromStorage]);

  useEffect(() => {
    if (!token) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    authApi
      .getProfile()
      .then((data) => {
        if (!cancelled) setUser(data);
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
    const { token: nextToken, user: nextUser } = await authApi.login({ email, password });
    tokenStore.set(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(
    async ({ email, password, name }) => {
      await authApi.register({ email, password, name });
      return login(email, password);
    },
    [login]
  );

  const updateProfile = useCallback(async (patch) => {
    const next = await authApi.updateProfile(patch);
    setUser(next);
    return next;
  }, []);

  const value = { user, token, hydrating, login, register, logout, updateProfile, syncFromStorage };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
