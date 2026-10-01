import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import api from '../services/api';

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
    id: 'special-discount',
    title: 'Special Campus Discount 🍔',
    body: 'Use code CAMPUS10 to get ₹10 off on orders above ₹100!',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: true,
    type: 'PROMO',
  }
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  
  const prevStatusesRef = useRef<{ [orderId: string]: string }>({});
  
  const storageKey = user?.id || (user as any)?.userId ? `notifs_${user?.id || (user as any)?.userId}` : 'notifs_guest';

  // Load from local storage
  useEffect(() => {
    const loadStored = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed);
            return;
          }
        }
        setNotifications(DEFAULT_NOTIFICATIONS);
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_NOTIFICATIONS));
      } catch (e) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    };
    loadStored();
  }, [storageKey]);

  const showInAppNotification = useCallback((notification: NotificationData) => {
    setCurrentNotification(notification);
    setShowBanner(true);
    setTimeout(() => {
      setShowBanner(false);
      setTimeout(() => setCurrentNotification(null), 300); // Wait for transition
    }, 5000);
  }, []);

  const addNotification = useCallback((notificationData: NotificationData) => {
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
      const filtered = prev.filter((n) => n.id !== newItem.id);
      const updated = [newItem, ...filtered];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });

    showInAppNotification(notificationData);
  }, [storageKey, showInAppNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.setItem(storageKey, JSON.stringify([]));
  }, [storageKey]);

  const refreshNotifications = useCallback(async () => {
    const userId = user?.id || (user as any)?.userId;
    if (!userId) return;

    try {
      const res = await api.get(`/orders/user/${userId}?size=10&sort=placedAt,desc`);
      const orders = res.data?.data?.content || [];

      for (const order of orders) {
        const prevStatus = prevStatusesRef.current[order.id];
        const currentStatus = order.status;

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

  // Poll for status updates
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const handleBannerPress = () => {
    if (!currentNotification) return;

    if (currentNotification.orderId) {
      navigate(`/student/orders/${currentNotification.orderId}`);
    } else if (currentNotification.type === 'NEW_ORDER') {
      navigate('/owner');
    } else {
      navigate('/student/notifications');
    }
    setShowBanner(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
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
      
      {/* Toast Banner */}
      <div className={`notification-toast ${showBanner ? 'notification-toast--visible' : ''}`}>
        {currentNotification && (
          <div className="notification-toast__card" onClick={handleBannerPress}>
            <div className="notification-toast__icon">
              <Bell size={18} />
            </div>
            <div className="notification-toast__content">
              <h4>{currentNotification.title}</h4>
              <p>{currentNotification.body}</p>
            </div>
            <div className="notification-toast__actions">
              <ArrowRight size={16} className="notification-toast__arrow" />
              <button 
                className="notification-toast__close"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBanner(false);
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
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
