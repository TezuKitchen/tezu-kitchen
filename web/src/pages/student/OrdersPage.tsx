import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Package, XCircle, ShoppingBag, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
  totalAmount: number;
  deliveryAddress: string;
  placedAt: string;
  items: OrderItem[];
}

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showLoader = false) => {
    if (!user) return;
    const userId = user.userId || user.id;
    if (!userId) return;

    if (showLoader) setIsLoading(true);
    try {
      const response = await api.get(`/orders/user/${userId}?size=50&sort=placedAt,desc`);
      setOrders(response.data.data.content || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders(false);
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setCancellingOrderId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'CANCELLED' });
      fetchOrders(false);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel the order. It might have already been processed.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'];
  
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ACTIVE') {
      return activeStatuses.includes(order.status);
    } else {
      return !activeStatuses.includes(order.status);
    }
  });

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status.toLowerCase()}`;
  };

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h2>Your Orders</h2>
        <button 
          className="btn btn--outline orders-page__refresh"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'ACTIVE' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active Orders
        </button>
        <button 
          className={`tab ${activeTab === 'PAST' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('PAST')}
        >
          Past Orders
        </button>
      </div>

      <div className="orders-page__content">
        {isLoading ? (
          <div className="orders-page__loading">
            <Loader2 size={40} className="spin" />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-page__empty">
            <ShoppingBag size={48} className="orders-page__empty-icon" />
            <h3>No {activeTab.toLowerCase()} orders found</h3>
            <p>When you place orders, they will appear here.</p>
          </div>
        ) : (
          <div className="orders-page__list">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className="order-card" 
                onClick={() => navigate(`/student/orders/${order.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="order-card__header">
                  <div className="order-card__title">
                    <h3>{order.restaurantName || 'Restaurant'}</h3>
                    <span className={getStatusBadgeClass(order.status)}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="order-card__date">
                    {new Date(order.placedAt).toLocaleString()}
                  </div>
                </div>

                <div className="order-card__body">
                  <div className="order-card__items">
                    <div className="order-card__items-title">
                      <Package size={16} /> Items
                    </div>
                    <ul>
                      {order.items?.map(item => (
                        <li key={item.id}>
                          <span className="order-item-qty">{item.quantity}x</span> 
                          <span className="order-item-name">{item.menuItemName || 'Item'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-card__meta">
                    <div className="order-card__address">
                      <MapPin size={16} />
                      <span>{order.deliveryAddress}</span>
                    </div>
                    <div className="order-card__total">
                      Total: <strong>₹{order.totalAmount}</strong>
                    </div>
                  </div>
                </div>

                {(order.status === 'PLACED' || order.status === 'ACCEPTED') && (
                  <div className="order-card__actions">
                    <button 
                      className="btn btn--outline btn--danger order-card__cancel-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(order.id);
                      }}
                      disabled={cancellingOrderId === order.id}
                    >
                      {cancellingOrderId === order.id ? (
                        <><Loader2 size={16} className="spin" /> Cancelling...</>
                      ) : (
                        <><XCircle size={16} /> Cancel Order</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
