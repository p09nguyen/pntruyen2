import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, full_name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  loginWithGoogle: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('No current user session');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ username, password });
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (code: string): Promise<boolean> => {
    try {
      const response = await authApi.googleLogin(code);
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string, full_name: string): Promise<boolean> => {
    try {
      const response = await authApi.register({ username, email, password, full_name });
      return response.data.success;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };


  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
