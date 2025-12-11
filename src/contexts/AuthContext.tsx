import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/api';

interface User {
  id: number;
  email: string;
  username: string;
  role?: string;
  theme?: 'light' | 'dark';
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('arc_auth_token');
      if (token) {
        try {
          const response = await auth.verify();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('arc_auth_token');
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await auth.login(email, password);
    localStorage.setItem('arc_auth_token', response.data.token);
    setUser(response.data.user);
  };

  const register = async (email: string, username: string, password: string) => {
    // Just register without auto-login
    await auth.register(email, username, password);
  };

  const logout = () => {
    localStorage.removeItem('arc_auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
