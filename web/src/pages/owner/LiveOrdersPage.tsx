import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Check, X, ChefHat, Truck, Package } from 'lucide-react';
import './LiveOrdersPage.css';

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  placedAt: string;
  items: OrderItem[];
  customer?: {
    name: string;
    phone: string;
  };
}

const LiveOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'DONE'>('NEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRestaurantAndOrders = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/restaurants/owner/${user.id}`);
        const data = res.data.data;
        if (data && data.length > 0) {
          setRestaurantId(data[0].id);
        } else {
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError('Failed to fetch store details');
        setLoading(false);
      }
    };
    fetchRestaurantAndOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    try {
      const res = await api.get(`/orders/restaurant/${restaurantId}?size=50&sort=placedAt,desc`);
      setOrders(res.data.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  if (loading) return <div className="live-orders-page__loading">Loading orders...</div>;
  if (error) return <div className="live-orders-page__error">{error}</div>;
  if (!restaurantId) return <div className="live-orders-page__empty">Create your store first to receive orders.</div>;

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'NEW') return o.status === 'PLACED';
    if (activeTab === 'ACTIVE') return ['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status);
    return ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status);
  });

  return (
    <div className="live-orders-page">
      <header className="live-orders-page__header">
        <h1>Kitchen Display</h1>
        <div className="live-orders-page__tabs">
          <button className={`tab-btn ${activeTab === 'NEW' ? 'active' : ''}`} onClick={() => setActiveTab('NEW')}>
            New
          </button>
          <button className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('ACTIVE')}>
            Active
          </button>
          <button className={`tab-btn ${activeTab === 'DONE' ? 'active' : ''}`} onClick={() => setActiveTab('DONE')}>
            Done
          </button>
        </div>
      </header>

      <div className="live-orders-page__grid">
        {filteredOrders.length === 0 ? (
          <p className="no-orders">No {activeTab.toLowerCase()} orders</p>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
                <span className="order-time">{new Date(order.placedAt).toLocaleTimeString()}</span>
              </div>
              
              <div className="order-card__body">
                <div className="delivery-info">
                  <strong>Delivery To:</strong> {order.deliveryAddress}
                </div>
                <ul className="items-list">
                  {order.items.map(item => (
                    <li key={item.id}>
                      <span>{item.quantity}x {item.itemName}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="order-total">
                  Total: ₹{order.totalAmount}
                </div>
              </div>

              <div className="order-card__actions">
                {order.status === 'PLACED' && (
                  <>
                    <button className="btn-reject" onClick={() => updateStatus(order.id, 'REJECTED')}><X size={16}/> Reject</button>
                    <button className="btn-accept" onClick={() => updateStatus(order.id, 'ACCEPTED')}><Check size={16}/> Accept</button>
                  </>
                )}
                {order.status === 'ACCEPTED' && (
                  <button className="btn-prepare" onClick={() => updateStatus(order.id, 'PREPARING')}><ChefHat size={16}/> Start Preparing</button>
                )}
                {order.status === 'PREPARING' && (
                  <button className="btn-delivery" onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}><Truck size={16}/> Out for Delivery</button>
                )}
                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button className="btn-deliver" onClick={() => updateStatus(order.id, 'DELIVERED')}><Package size={16}/> Mark Delivered</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveOrdersPage;
