import { createContext, useContext, useState, useCallback } from 'react';
import { authApi, extractErrorMessage } from '../services';
import api from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('sp_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('sp_token'));

  const persist = (nextUser, nextToken) => {
    localStorage.setItem('sp_user', JSON.stringify(nextUser));
    localStorage.setItem('sp_token', nextToken);
    setUser(nextUser);
    setToken(nextToken);
  };

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      persist(data.data.user, data.data.token);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: extractErrorMessage(err) };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await authApi.register({ name, email, password });
      persist(data.data.user, data.data.token);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: extractErrorMessage(err) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sp_user');
    localStorage.removeItem('sp_token');
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common.Authorization;
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
