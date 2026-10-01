import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ChefHat, Bike, PackageCheck, AlertCircle, Tag, Clock, ChevronRight } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import type { NotificationItem } from '../../context/NotificationContext';
import './NotificationsPage.css';

type FilterType = 'ALL' | 'ORDERS' | 'OFFERS';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotification();

  const [filter, setFilter] = useState<FilterType>('ALL');

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    if (window.confirm('Are you sure you want to remove all notifications?')) {
      clearAll();
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'ORDERS') return item.type === 'ORDER' || !!item.orderId;
    if (filter === 'OFFERS') return item.type === 'PROMO';
    return true;
  });

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return new Date(timestamp).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (item: NotificationItem) => {
    if (item.status === 'ACCEPTED' || item.status === 'PREPARING') {
      return { icon: <ChefHat size={20} color="#EA580C" />, bg: '#FFEDD5' };
    }
    if (item.status === 'OUT_FOR_DELIVERY') {
      return { icon: <Bike size={20} color="#16A34A" />, bg: '#DCFCE7' };
    }
    if (item.status === 'DELIVERED') {
      return { icon: <PackageCheck size={20} color="#16A34A" />, bg: '#DCFCE7' };
    }
    if (item.status === 'CANCELLED' || item.status === 'REJECTED') {
      return { icon: <AlertCircle size={20} color="#DC2626" />, bg: '#FEE2E2' };
    }
    if (item.type === 'PROMO') {
      return { icon: <Tag size={20} color="#D97706" />, bg: '#FEF3C7' };
    }
    if (item.orderId) {
      return { icon: <Clock size={20} color="#6B7280" />, bg: '#F3F4F6' };
    }
    return { icon: <Bell size={20} color="#4F46E5" />, bg: '#E0E7FF' };
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.orderId) {
      navigate(`/student/orders/${item.orderId}`);
    } else if (item.type === 'PROMO') {
      navigate('/student');
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <div className="notifications-page__title-wrap">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="notifications-page__badge">{unreadCount}</span>
          )}
        </div>
        <div className="notifications-page__actions">
          {unreadCount > 0 && (
            <button className="btn btn--icon" onClick={markAllAsRead} title="Mark all as read">
              <CheckCheck size={20} className="text-primary" />
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn--icon" onClick={handleClearAll} title="Clear all">
              <Trash2 size={20} className="text-muted" />
            </button>
          )}
        </div>
      </div>

      <div className="notifications-page__filters">
        <button 
          className={`filter-chip ${filter === 'ALL' ? 'filter-chip--active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All
        </button>
        <button 
          className={`filter-chip ${filter === 'ORDERS' ? 'filter-chip--active' : ''}`}
          onClick={() => setFilter('ORDERS')}
        >
          Orders
        </button>
        <button 
          className={`filter-chip ${filter === 'OFFERS' ? 'filter-chip--active' : ''}`}
          onClick={() => setFilter('OFFERS')}
        >
          Campus Offers
        </button>
      </div>

      <div className="notifications-page__content">
        {filteredNotifications.length === 0 ? (
          <div className="notifications-page__empty">
            <div className="empty-icon">
              <Bell size={48} />
            </div>
            <h3>No Notifications</h3>
            <p>
              {filter === 'ALL'
                ? "You're all caught up! Updates on your food orders and campus announcements will show up here."
                : `No ${filter.toLowerCase()} notifications found right now.`}
            </p>
            <button className="btn btn--primary mt-4" onClick={() => navigate('/student')}>
              Browse Campus Kitchens
            </button>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((item) => {
              const { icon, bg } = getNotificationIcon(item);
              return (
                <div 
                  key={item.id} 
                  className={`notification-card ${!item.read ? 'notification-card--unread' : ''}`}
                  onClick={() => handleNotificationPress(item)}
                >
                  <div className="notification-card__icon" style={{ backgroundColor: bg }}>
                    {icon}
                  </div>
                  <div className="notification-card__content">
                    <div className="notification-card__header">
                      <h4 className={!item.read ? 'bold' : ''}>{item.title}</h4>
                      <span className="time">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <p>{item.body}</p>
                    {item.orderId && (
                      <div className="notification-card__action-text">
                        View Order Details <ChevronRight size={14} />
                      </div>
                    )}
                  </div>
                  {!item.read && <div className="notification-card__unread-dot"></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
