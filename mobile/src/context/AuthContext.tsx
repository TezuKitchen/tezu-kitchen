import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import api, { setOnUnauthorized } from '../services/api';

type UserRole = 'STUDENT' | 'OWNER';

interface User {
  id?: string | number;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  restaurantId?: number | string; // Only for OWNER role
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in on app startup
    const bootstrapAsync = async () => {
      try {
        const userToken = await SecureStore.getItemAsync('userToken');
        const userDataStr = await SecureStore.getItemAsync('userData');
        
        if (userToken && userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          setRole(userData.role);
        }
      } catch (e) {
        console.error('Failed to restore authentication state', e);
      } finally {
        setIsLoading(false);
      }
    };

    // Register the 401 handler so expired tokens auto-logout
    setOnUnauthorized(() => {
      console.log('401 detected, auto-logging out');
      setUser(null);
      setRole(null);
      router.replace('/(auth)/login');
    });

    bootstrapAsync();
  }, []);

  const login = async (token: string, userData: User) => {
    try {
      console.log("LOGIN CALLED WITH TOKEN:", token ? "Exists" : "MISSING", "USERDATA:", userData);
      const safeToken = token || '';
      await SecureStore.setItemAsync('userToken', safeToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      setRole(userData.role);
    } catch (e) {
      console.error('Failed to store authentication data', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
      setRole(null);
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Failed to clear authentication data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
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
