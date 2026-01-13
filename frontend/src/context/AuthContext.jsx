import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    (async () => {
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      } else if (token && !savedUser) {
        // If we have a token but no saved user, try to fetch the current user
        try {
          const res = await api.get('/auth/me');
          const u = res.data?.user;
          if (u) {
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
          }
        } catch (err) {
          console.error('Failed to fetch user with existing token', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data;
  };

  // Use this for OAuth callback token handling
  const oauthLogin = async (token) => {
    localStorage.setItem('token', token);
    // Attempt to fetch /auth/me
    const res = await api.get('/auth/me');
    const u = res.data?.user;
    if (!u) throw new Error('Failed to fetch user after oauth');
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, oauthLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
