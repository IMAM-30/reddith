/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const MIN_FONT_LEVEL = -4;
const MAX_FONT_LEVEL = 4;

function normalizeFontSizeLevel(value) {
  const level = Number.parseInt(value ?? 0, 10);
  if (!Number.isInteger(level)) return 0;
  return Math.max(MIN_FONT_LEVEL, Math.min(MAX_FONT_LEVEL, level));
}

function fontSizePercent(level) {
  return `${100 + normalizeFontSizeLevel(level) * 4}%`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSizePercent(user?.font_size_level);
  }, [user?.font_size_level]);

  const login = async (identifier, password) => {
    const res = await api.post('/login', { identifier, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/register', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await api.post('/logout');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
