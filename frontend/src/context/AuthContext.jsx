import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .get('/auth/me')
        .then((res) => setUser(res.data.data.user))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  };

  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user, token } = res.data.data;
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
