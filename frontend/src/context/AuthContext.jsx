import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isChecking = useRef(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Evita múltiplas execuções
    if (hasChecked.current || isChecking.current) {
      return;
    }

    isChecking.current = true;
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (hasChecked.current) {
      return;
    }

    try {
      const data = await authService.me();
      setUser(data.user);
    } catch (error) {
      // Só seta null se não for erro de abort
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED') {
        setUser(null);
      }
    } finally {
      setLoading(false);
      hasChecked.current = true;
      isChecking.current = false;
    }
  };

  const login = async (email, senha) => {
    const data = await authService.login(email, senha);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    hasChecked.current = false; // Reset para permitir novo check
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};