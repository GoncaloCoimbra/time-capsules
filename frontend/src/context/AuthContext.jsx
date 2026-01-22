import { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  const oauthLogin = async (token) => {
    localStorage.setItem('token', token);
    const res = await api.get('/auth/me');
    const u = res.data?.user;
    if (!u) throw new Error('Failed to fetch user after oauth');
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const updateUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const updatedUser = res.data?.user;
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return updatedUser;
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      throw err;
    }
  }, []);

  const updateUserAvatar = useCallback((newAvatar) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, avatar: newAvatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout, 
      oauthLogin,
      updateUser,
      updateUserAvatar
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);