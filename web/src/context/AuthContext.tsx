import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setOnUnauthorized } from '../services/api';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (token: string, userData: User, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Bootstrap: restore session from localStorage
    try {
      const token = localStorage.getItem('userToken');
      const storedUser = localStorage.getItem('userData');
      if (token && storedUser) {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        setRole(parsed.role);
      }
    } catch {
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }

    // Register unauthorized callback
    setOnUnauthorized(() => {
      setUser(null);
      setRole(null);
      window.location.href = '/login';
    });
  }, []);

  const login = async (token: string, userData: User, refreshToken?: string) => {
    localStorage.setItem('userToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setRole(userData.role);
  };

  const logout = async () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
