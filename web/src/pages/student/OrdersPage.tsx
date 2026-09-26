import { useState, useEffect } from 'react';
import { RefreshCw, Package, MapPin, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './OrdersPage.css';

interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  placedAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user?.userId) return;
    
    try {
      const response = await api.get(`/orders/user/${user.userId}?size=50&sort=placedAt,desc`);
      setOrders(response.data.data.content || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'CANCELLED' });
      // Update local state instead of full refetch for snappiness
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'];
  const pastStatuses = ['DELIVERED', 'REJECTED', 'CANCELLED'];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ACTIVE') {
      return activeStatuses.includes(order.status);
    } else {
      return pastStatuses.includes(order.status);
    }
  });

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="orders-page__loading">
        <RefreshCw className="spinner" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <header className="orders-page__header">
        <div className="orders-page__title">
          <FileText size={24} className="icon-primary" />
          <h1>My Orders</h1>
        </div>
        <button 
          className={`btn-icon ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          aria-label="Refresh orders"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      <div className="orders-page__tabs">
        <button 
          className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'PAST' ? 'active' : ''}`}
          onClick={() => setActiveTab('PAST')}
        >
          Past Orders
        </button>
      </div>

      <div className="orders-page__list">
        {filteredOrders.length === 0 ? (
          <div className="orders-page__empty">
            <Package size={48} className="icon-muted" />
            <p>No {activeTab.toLowerCase()} orders found.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <div className="order-card__restaurant">
                  <h3>{order.restaurantName}</h3>
                  <span className="order-card__time">
                    <Clock size={14} />
                    {new Date(order.placedAt).toLocaleString()}
                  </span>
                </div>
                <div className={`status-badge status-badge--${order.status.toLowerCase()}`}>
                  {getStatusDisplay(order.status)}
                </div>
              </div>

              <div className="order-card__items">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <span className="order-item__qty">{item.quantity}x</span>
                    <span className="order-item__name">{item.menuItemName}</span>
                    <span className="order-item__price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-card__footer">
                <div className="order-card__address">
                  <MapPin size={16} className="icon-muted" />
                  <span>{order.deliveryAddress}</span>
                </div>
                <div className="order-card__total">
                  <span>Total:</span>
                  <strong>₹{order.totalAmount}</strong>
                </div>
              </div>

              {(order.status === 'PLACED' || order.status === 'ACCEPTED') && (
                <div className="order-card__actions">
                  <button 
                    className="btn-danger-outline"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                  >
                    {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
