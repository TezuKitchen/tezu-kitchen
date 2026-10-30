import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setOnUnauthorized } from '../services/api';

type UserRole = 'STUDENT' | 'OWNER';

interface User {
  id?: string | number;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  restaurantId?: number | string;
  avatarUrl?: string;
  address?: string;
  savedAddresses?: string[];
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (token: string, userData: User, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userToken = localStorage.getItem('userToken');
        const userDataStr = localStorage.getItem('userData');

        if (userToken && userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          setRole(userData.role);
        }
      } catch (e) {
        console.error('Failed to restore authentication state', e);
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    setOnUnauthorized(() => {
      setUser(null);
      setRole(null);
      navigate('/login');
    });

    bootstrapAsync();
  }, [navigate]);

  const login = async (token: string, userData: User, refreshToken?: string) => {
    localStorage.setItem('userToken', token || '');
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
    navigate('/login');
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      const profile = res.data.data;
      if (profile) {
        const updatedUser = { ...user, ...profile };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    } catch {
      // silently fail
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout, refreshProfile }}>
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
