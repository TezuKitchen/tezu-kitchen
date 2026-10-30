import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, X, ArrowRight } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { typography, spacing, layout } from '../theme';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../services/api';

import * as Device from 'expo-device';
import Constants from 'expo-constants';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('Failed to load expo-notifications:', e);
}

const isWeb = Platform.OS === 'web';

const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (e) {}
};

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  type?: 'ORDER' | 'PROMO' | 'SYSTEM' | 'NEW_ORDER' | 'STATUS_UPDATE';
  status?: string;
}

export type NotificationData = Partial<NotificationItem> & {
  title: string;
  body: string;
};

export interface NotificationContextType {
  pushToken: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  showInAppNotification: (notification: NotificationData) => void;
  addNotification: (notification: NotificationData) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'welcome-tezu',
    title: 'Welcome to TezuKitchen! 🎓',
    body: 'Order fresh meals directly to your hostel or department with free campus delivery.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    type: 'SYSTEM',
  },
  {
    id: 'late-night-canteen',
    title: 'Late Night Delivery Active 🌙',
    body: 'Craving midnight snacks? Campus canteens and dhabas are open till 2:00 AM.',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    read: false,
    type: 'PROMO',
  },
  {
    id: 'special-discount',
    title: 'Special Campus Discount 🍔',
    body: 'Use code CAMPUS10 to get ₹10 off on orders above ₹100!',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: true,
    type: 'PROMO',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;

  // Track previous order statuses to fire notifications on status changes
  const prevStatusesRef = useRef<{ [orderId: string]: string }>({});

  const storageKey = user?.id || (user as any)?.userId ? `notifs_${user?.id || (user as any)?.userId}` : 'notifs_guest';

  // Load notifications from storage or defaults on startup
  useEffect(() => {
    const loadStored = async () => {
      try {
        const stored = await getStorageItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed);
            return;
          }
        }
        setNotifications(DEFAULT_NOTIFICATIONS);
        await setStorageItem(storageKey, JSON.stringify(DEFAULT_NOTIFICATIONS));
      } catch (e) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    };
    loadStored();
  }, [storageKey]);

  // Register push token with backend when user logs in
  useEffect(() => {
    const registerToken = async () => {
      if (!user) return;
      try {
        let token = '';
        const isExpoGo = Constants.appOwnership === 'expo';

        if (Platform.OS !== 'web' && Device.isDevice && !isExpoGo && Notifications) {
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus === 'granted') {
              token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
            }
          } catch (pushErr) {
            const userId = user?.id || (user as any)?.userId || 'dev';
            token = `ExponentPushToken[mock-${userId}]`;
          }
        } else {
          const userId = user?.id || (user as any)?.userId || 'dev';
          token = `ExponentPushToken[mock-${userId}]`;
        }

        if (token) {
          setPushToken(token);
          await api.put('/users/push-token', {
            expoPushToken: token,
          });
        }
      } catch (error) {
        console.log('Push token registration skipped or failed:', error);
      }
    };

    registerToken();
  }, [user]);

  const showInAppNotification = useCallback(
    (notification: NotificationData) => {
      setCurrentNotification(notification);

      Animated.spring(slideAnim, {
        toValue: 24,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        dismissNotification();
      }, 5000);
    },
    [slideAnim]
  );

  const dismissNotification = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotification(null);
    });
  }, [slideAnim]);

  const addNotification = useCallback(
    (notificationData: NotificationData) => {
      const newItem: NotificationItem = {
        id: notificationData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: notificationData.title,
        body: notificationData.body,
        timestamp: notificationData.timestamp || new Date().toISOString(),
        read: false,
        orderId: notificationData.orderId,
        type: notificationData.type || 'SYSTEM',
        status: notificationData.status,
      };

      setNotifications((prev) => {
        // Prevent duplicate notifications with identical id
        const filtered = prev.filter((n) => n.id !== newItem.id);
        const updated = [newItem, ...filtered];
        setStorageItem(storageKey, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      showInAppNotification(notificationData);
    },
    [storageKey, showInAppNotification]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
        setStorageItem(storageKey, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [storageKey]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      setStorageItem(storageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, [storageKey]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setStorageItem(storageKey, JSON.stringify([])).catch(() => {});
  }, [storageKey]);

  // Sync notifications from user orders & notify on status changes
  const refreshNotifications = useCallback(async () => {
    const userId = user?.id || (user as any)?.userId;
    if (!userId) return;

    try {
      const res = await api.get(`/orders/user/${userId}?size=10&sort=placedAt,desc`);
      const orders = res.data?.data?.content || [];

      for (const order of orders) {
        const prevStatus = prevStatusesRef.current[order.id];
        const currentStatus = order.status;

        // If status changed and we've tracked this order before
        if (prevStatus && prevStatus !== currentStatus) {
          let title = 'Order Update 🔔';
          let body = `Your order #${order.id.slice(-6).toUpperCase()} is now ${currentStatus.replace(/_/g, ' ').toLowerCase()}.`;

          if (currentStatus === 'ACCEPTED') {
            title = 'Order Accepted! 👨‍🍳';
            body = `${order.restaurantName} accepted your order. Kitchen is getting ready!`;
          } else if (currentStatus === 'PREPARING') {
            title = 'Cooking in Progress! 🍳';
            body = `Your meal from ${order.restaurantName} is freshly cooking in the kitchen.`;
          } else if (currentStatus === 'OUT_FOR_DELIVERY') {
            title = 'Out for Delivery! 🛵';
            body = `Delivery partner is on the way to ${order.deliveryAddress}.`;
          } else if (currentStatus === 'DELIVERED') {
            title = 'Order Delivered! 🎉';
            body = `Enjoy your meal from ${order.restaurantName}!`;
          } else if (currentStatus === 'CANCELLED') {
            title = 'Order Cancelled ❌';
            body = `Order #${order.id.slice(-6).toUpperCase()} was cancelled.`;
          } else if (currentStatus === 'REJECTED') {
            title = 'Order Not Accepted ⚠️';
            body = `${order.restaurantName} was unable to fulfill your order.`;
          }

          addNotification({
            id: `status-${order.id}-${currentStatus}`,
            title,
            body,
            orderId: order.id,
            type: 'ORDER',
            status: currentStatus,
          });
        }

        prevStatusesRef.current[order.id] = currentStatus;
      }
    } catch (e) {
      // Silent error
    }
  }, [user, addNotification]);

  // Poll for status updates every 10 seconds in the background
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const handleBannerPress = () => {
    if (!currentNotification) return;

    if (currentNotification.orderId) {
      router.push(`/order/${currentNotification.orderId}`);
    } else if (currentNotification.type === 'NEW_ORDER') {
      router.push('/(owner)');
    } else {
      router.push('/notifications');
    }
    dismissNotification();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        notifications,
        unreadCount,
        showInAppNotification,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        refreshNotifications,
      }}
    >
      {children}
      {currentNotification && (
        <Animated.View
          style={[
            styles.bannerContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            activeOpacity={0.9}
            onPress={handleBannerPress}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Bell size={18} color="#FFF" />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {currentNotification.title}
              </Text>
              <Text style={[styles.body, { color: colors.textMuted }]} numberOfLines={2}>
                {currentNotification.body}
              </Text>
            </View>
            <View style={styles.actions}>
              <ArrowRight size={18} color={colors.primary} />
              <TouchableOpacity
                onPress={dismissNotification}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 30,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  banner: {
    borderRadius: layout.radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...layout.shadows.lg,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  body: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeBtn: {
    padding: 2,
  },
});
