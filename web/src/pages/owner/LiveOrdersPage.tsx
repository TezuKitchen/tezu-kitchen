import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './LiveOrdersPage.css';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string | number;
  studentId: string | number;
  restaurantId: string | number;
  deliveryAddress: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  placedAt: string;
}

const LiveOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'DONE'>('NEW');

  const fetchStoreAndOrders = async () => {
    try {
      if (!user?.id && !user?.userId) return;
      const uId = user.id || user.userId;
      
      const restRes = await api.get(`/restaurants/owner/${uId}`);
      const restaurants = restRes.data.data;
      
      if (!restaurants || restaurants.length === 0) {
        setRestaurantId(null);
        setLoading(false);
        return;
      }
      
      const rId = restaurants[0].id;
      setRestaurantId(rId);
      
      const ordRes = await api.get(`/orders/restaurant/${rId}?size=50&sort=placedAt,desc`);
      setOrders(ordRes.data.data.content || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreAndOrders();
    const intervalId = setInterval(fetchStoreAndOrders, 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleStatusChange = async (orderId: string | number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchStoreAndOrders();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update order status');
    }
  };

  if (loading) return <div className="live-orders__loading">Loading...</div>;
  if (error) return <div className="live-orders__error">{error}</div>;

  if (!restaurantId) {
    return (
      <div className="live-orders__empty-store">
        <h2>Create your store first</h2>
        <p>You need to set up your restaurant before receiving orders.</p>
        <Link to="/owner/store" className="live-orders__link-btn">Go to Store Setup</Link>
      </div>
    );
  }

  const newOrders = orders.filter(o => o.status === 'PLACED');
  const activeOrders = orders.filter(o => ['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status));
  const doneOrders = orders.filter(o => ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status));

  const getVisibleOrders = () => {
    if (activeTab === 'NEW') return newOrders;
    if (activeTab === 'ACTIVE') return activeOrders;
    return doneOrders;
  };

  const getTimeAgo = (dateStr: string) => {
    const time = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - time) / 60000); // in minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="live-orders__container">
      <h1 className="live-orders__title">Kitchen Order Dispatch</h1>
      
      <div className="live-orders__tabs">
        <button 
          className={`live-orders__tab ${activeTab === 'NEW' ? 'live-orders__tab--active' : ''}`}
          onClick={() => setActiveTab('NEW')}
        >
          New <span className="live-orders__badge">{newOrders.length}</span>
        </button>
        <button 
          className={`live-orders__tab ${activeTab === 'ACTIVE' ? 'live-orders__tab--active' : ''}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active <span className="live-orders__badge">{activeOrders.length}</span>
        </button>
        <button 
          className={`live-orders__tab ${activeTab === 'DONE' ? 'live-orders__tab--active' : ''}`}
          onClick={() => setActiveTab('DONE')}
        >
          Done <span className="live-orders__badge">{doneOrders.length}</span>
        </button>
      </div>

      <div className="live-orders__grid">
        {getVisibleOrders().length === 0 ? (
          <div className="live-orders__empty">No orders in this category</div>
        ) : (
          getVisibleOrders().map(order => (
            <div key={order.id} className="live-orders__card">
              <div className="live-orders__card-header">
                <span className={`live-orders__status live-orders__status--${order.status.toLowerCase()}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className="live-orders__time">{getTimeAgo(order.placedAt)}</span>
              </div>
              
              <div className="live-orders__address">
                <strong>Address:</strong> {order.deliveryAddress}
              </div>
              
              <div className="live-orders__items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="live-orders__item">
                    <span>{item.quantity} × {item.itemName}</span>
                  </div>
                ))}
              </div>
              
              <div className="live-orders__total">
                Total: ₹{order.totalAmount}
              </div>
              
              <div className="live-orders__actions">
                {order.status === 'PLACED' && (
                  <>
                    <button className="live-orders__btn live-orders__btn--reject" onClick={() => handleStatusChange(order.id, 'REJECTED')}>Reject</button>
                    <button className="live-orders__btn live-orders__btn--accept" onClick={() => handleStatusChange(order.id, 'ACCEPTED')}>Accept</button>
                  </>
                )}
                {order.status === 'ACCEPTED' && (
                  <button className="live-orders__btn live-orders__btn--warning" onClick={() => handleStatusChange(order.id, 'PREPARING')}>Start Preparing</button>
                )}
                {order.status === 'PREPARING' && (
                  <button className="live-orders__btn live-orders__btn--primary" onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')}>Out for Delivery</button>
                )}
                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button className="live-orders__btn live-orders__btn--success" onClick={() => handleStatusChange(order.id, 'DELIVERED')}>Mark Delivered</button>
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
