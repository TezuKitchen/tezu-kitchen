import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api, { setOnUnauthorized } from '../services/api';

const isWeb = Platform.OS === 'web';

const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};

const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.error(`Error deleting ${key} from storage:`, e);
  }
};

type UserRole = 'STUDENT' | 'OWNER';

interface User {
  id?: string | number;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  restaurantId?: number | string; // Only for OWNER role
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
  updateUser: (partialUser: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data?.data) {
        const p = res.data.data;
        setUser(prev => {
          if (!prev) return null;
          const updated: User = {
            ...prev,
            name: p.name || prev.name,
            email: p.email || prev.email,
            phone: p.phone ?? prev.phone,
            avatarUrl: p.avatarUrl ?? prev.avatarUrl,
            savedAddresses: p.savedAddresses ?? prev.savedAddresses,
            address: (p.savedAddresses && p.savedAddresses.length > 0) ? p.savedAddresses[0] : (prev.address || undefined),
          };
          setStorageItem('userData', JSON.stringify(updated)).catch(e => console.error('Failed to sync refreshed profile', e));
          return updated;
        });
      }
    } catch (e) {
      // Silent error if network down
    }
  };

  const updateUser = async (partialUser: Partial<User>) => {
    try {
      setUser(prev => {
        if (!prev) return null;
        const updated: User = { ...prev, ...partialUser };
        setStorageItem('userData', JSON.stringify(updated)).catch(e => console.error('Failed to sync updated userData', e));
        return updated;
      });
    } catch (e) {
      console.error('Failed to update user', e);
    }
  };

  useEffect(() => {
    // Check if user is already logged in on app startup
    const bootstrapAsync = async () => {
      try {
        const userToken = await getStorageItem('userToken');
        const userDataStr = await getStorageItem('userData');
        
        if (userToken && userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          setRole(userData.role);
          // Refresh in background to get latest avatar / updates
          refreshProfile().catch(() => {});
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

  const login = async (token: string, userData: User, refreshToken?: string) => {
    try {
      console.log("LOGIN CALLED WITH TOKEN:", token ? "Exists" : "MISSING", "USERDATA:", userData);
      const safeToken = token || '';
      await setStorageItem('userToken', safeToken);
      if (refreshToken) {
        await setStorageItem('refreshToken', refreshToken);
      }
      await setStorageItem('userData', JSON.stringify(userData));
      setUser(userData);
      setRole(userData.role);
    } catch (e) {
      console.error('Failed to store authentication data', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await deleteStorageItem('userToken');
      await deleteStorageItem('refreshToken');
      await deleteStorageItem('userData');
      setUser(null);
      setRole(null);
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Failed to clear authentication data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout, updateUser, refreshProfile }}>
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
