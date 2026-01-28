import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Guarda o user no localStorage para persistência entre refreshes
  const saveUserToStorage = (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (err) {
      console.error('❌ Erro ao guardar no localStorage:', err);
      return false;
    }
  };

  // Logout function (definido antes do useEffect para ser usado nele)
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Carregamento inicial (Check Auth)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    const initAuth = async () => {
      if (token) {
        try {
          // Tentamos sempre ir buscar os dados mais frescos ao servidor
          const res = await api.get('/auth/me');
          const freshUser = res.data?.user;
          if (freshUser) {
            console.log('✅ User carregado do servidor:', freshUser);
            setUser(freshUser);
            saveUserToStorage(freshUser);
          }
        } catch (err) {
          console.error('Token inválido ou expirado');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log('✅ User carregado do localStorage:', parsedUser);
              setUser(parsedUser);
            } catch (parseErr) {
              console.error('Erro ao fazer parse do user do localStorage:', parseErr);
              logout();
            }
          } else {
            logout();
          }
        }
      } else {
        // Se não há token, tentar carregar do localStorage de forma segura
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('✅ User carregado do localStorage (sem token):', parsedUser);
            setUser(parsedUser);
          } catch (parseErr) {
            console.error('Erro ao fazer parse do user do localStorage:', parseErr);
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const userData = response.data.user;
    
    // Guardar token
    localStorage.setItem('token', response.data.token);
    
    // Guardar user
    saveUserToStorage(userData);
    
    // Atualizar state SINCRONAMENTE (sem await, mas sem delay)
    setUser(userData);
    
    console.log('✅ Login concluído - User:', userData);
    
    return { user: userData, token: response.data.token };
  };

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    const userData = response.data.user;
    
    // Guardar token
    localStorage.setItem('token', response.data.token);
    
    // Guardar user
    saveUserToStorage(userData);
    
    // Atualizar state SINCRONAMENTE
    setUser(userData);
    
    console.log('✅ Registro concluído - User:', userData);
    
    return { user: userData, token: response.data.token };
  };

  // 🔥 Atualiza o user localmente (sem fazer POST ao servidor)
  const updateUser = useCallback((userData) => {
    console.log('📝 Atualizando user localmente...', userData);
    setUser(userData);
    saveUserToStorage(userData);
    return userData;
  }, []);

  // 🔥 Sincroniza com o servidor para trazer dados frescos
  const refreshUserFromServer = useCallback(async () => {
    try {
      console.log('🔄 Recarregando dados do utilizador do servidor...');
      const res = await api.get('/auth/me');
      
      if (res.data?.user) {
        const freshUser = res.data.user;
        setUser(freshUser);
        saveUserToStorage(freshUser);
        console.log('✅ Dados do utilizador sincronizados com sucesso!');
        return freshUser;
      }
    } catch (err) {
      console.error('❌ Erro ao recarregar dados do utilizador:', err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout, 
      updateUser,
      refreshUserFromServer
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('❌ useAuth deve ser usado dentro de AuthProvider!');
    return {
      user: null,
      loading: true,
      register: () => Promise.reject('AuthProvider não encontrado'),
      login: () => Promise.reject('AuthProvider não encontrado'),
      logout: () => {},
      updateUser: () => {},
      refreshUserFromServer: () => Promise.reject('AuthProvider não encontrado')
    };
  }
  return context;
};