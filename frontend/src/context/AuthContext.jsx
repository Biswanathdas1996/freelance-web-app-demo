import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    authApi.setAuthToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    authApi.setAuthToken(token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      authApi.setAuthToken(null);
      setReady(true);
      return;
    }
    authApi.setAuthToken(token);
    authApi
      .getMe()
      .then((me) => {
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      })
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [logout]);

  const login = useCallback(
    async (email, password) => {
      const { token, user: next } = await authApi.login({ email, password });
      applySession(token, next);
      return next;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const { token, user: next } = await authApi.register(payload);
      applySession(token, next);
      return next;
    },
    [applySession]
  );

  const value = useMemo(
    () => ({ user, ready, login, register, logout, isOwner: user?.role === 'owner', isBidder: user?.role === 'bidder' }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
