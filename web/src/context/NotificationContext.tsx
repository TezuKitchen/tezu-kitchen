import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface NotificationData {
  title: string;
  body: string;
  orderId?: string;
  type?: 'NEW_ORDER' | 'STATUS_UPDATE';
}

interface NotificationContextType {
  showInAppNotification: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<any>(undefined);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setNotification(null), 300);
  }, []);

  const showInAppNotification = useCallback(
    (data: NotificationData) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setNotification(data);
      setVisible(true);
      timeoutRef.current = setTimeout(dismiss, 5000);
    },
    [dismiss]
  );

  const handleClick = () => {
    dismiss();
    if (notification?.type === 'NEW_ORDER') {
      window.location.href = '/owner';
    } else {
      window.location.href = '/student/orders';
    }
  };

  return (
    <NotificationContext.Provider value={{ showInAppNotification }}>
      {children}
      {notification && (
        <div
          className={`toast-notification ${visible ? 'toast-notification--visible' : ''}`}
          onClick={handleClick}
          role="alert"
        >
          <div className="toast-notification__icon">🔔</div>
          <div className="toast-notification__content">
            <strong className="toast-notification__title">{notification.title}</strong>
            <p className="toast-notification__body">{notification.body}</p>
          </div>
          <button
            className="toast-notification__close"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
