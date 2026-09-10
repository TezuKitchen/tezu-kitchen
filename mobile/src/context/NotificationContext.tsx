import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, X, ArrowRight } from 'lucide-react-native';
import { colors, typography, spacing, layout } from '../theme';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface NotificationData {
  title: string;
  body: string;
  orderId?: string;
  type?: 'NEW_ORDER' | 'STATUS_UPDATE';
}

interface NotificationContextType {
  pushToken: string | null;
  showInAppNotification: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const slideAnim = useState(new Animated.Value(-100))[0];

  // Register push token with backend when user logs in
  useEffect(() => {
    const registerToken = async () => {
      if (!user) return;
      try {
        // Generate a standard device identifier / Expo push token representation
        const userId = user?.id || (user as any)?.userId || 'dev';
        const mockOrRealToken = Platform.OS === 'web'
          ? `web-push-token-${userId}`
          : `ExponentPushToken[local-${userId}]`;

        setPushToken(mockOrRealToken);

        // Send to backend endpoint
        await api.put('/users/push-token', {
          pushToken: mockOrRealToken,
        });
      } catch (error) {
        console.log('Push token registration skipped or not supported:', error);
      }
    };

    registerToken();
  }, [user]);

  const showInAppNotification = (notification: NotificationData) => {
    setCurrentNotification(notification);

    // Slide down animation
    Animated.spring(slideAnim, {
      toValue: 20,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification();
    }, 5000);
  };

  const dismissNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotification(null);
    });
  };

  const handleBannerPress = () => {
    if (!currentNotification) return;

    if (currentNotification.type === 'NEW_ORDER') {
      router.push('/(owner)');
    } else {
      router.push('/(student)/orders');
    }
    dismissNotification();
  };

  return (
    <NotificationContext.Provider value={{ pushToken, showInAppNotification }}>
      {children}
      {currentNotification && (
        <Animated.View
          style={[
            styles.bannerContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.banner}
            activeOpacity={0.9}
            onPress={handleBannerPress}
          >
            <View style={styles.iconCircle}>
              <Bell size={18} color={colors.surface} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {currentNotification.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
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
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    ...layout.shadows.lg,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
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
    color: colors.text,
  },
  body: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
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
