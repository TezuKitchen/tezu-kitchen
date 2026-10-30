import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Package, Receipt, ChefHat, Bike, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './OrderDetailsPage.css';

interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  priceAtOrder: number;
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

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.data);
      } catch (err) {
        setError('Failed to fetch order details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (isLoading) {
    return <div className="order-details-loading">Loading order details...</div>;
  }

  if (error || !order) {
    return <div className="order-details-error">{error || 'Order not found'}</div>;
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const deliveryFee = 30; // standard fee
  const taxes = Math.round(order.totalAmount * 0.05); // 5% tax

  // Calculate the item total based on items since order.totalAmount is the final total in the backend
  const itemTotal = order.items.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
  // Backend totalAmount = itemTotal + deliveryFee + taxes - discount. So we can infer discount
  const discountAmount = Math.max(0, (itemTotal + deliveryFee + taxes) - order.totalAmount);

  const steps = [
    { key: 'PLACED', label: 'Order Placed', icon: <Receipt size={20} /> },
    { key: 'ACCEPTED', label: 'Confirmed', icon: <CheckCircle size={20} /> },
    { key: 'PREPARING', label: 'Preparing', icon: <ChefHat size={20} /> },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: <Bike size={20} /> },
    { key: 'DELIVERED', label: 'Delivered', icon: <Package size={20} /> }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  
  return (
    <div className="order-details-page">
      <button className="btn btn--icon order-details__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={24} />
        <span>Back to Orders</span>
      </button>

      <div className="order-details__header-card">
        <div className="order-details__title-row">
          <div>
            <h2 className="order-id">Order #{order.id.slice(-6).toUpperCase()}</h2>
            <p className="order-restaurant">from {order.restaurantName}</p>
          </div>
          <div className={`status-pill status-pill--${order.status.toLowerCase()}`}>
            {order.status.replace(/_/g, ' ')}
          </div>
        </div>
        <div className="order-meta">
          <span className="order-time"><Clock size={16} /> {new Date(order.placedAt).toLocaleString()}</span>
          <span className="order-items-count"><Package size={16} /> {order.items.length} items</span>
        </div>
      </div>

      {!isCancelled && (
        <div className="order-details__tracker-card">
          <h3>Order Status</h3>
          <div className="tracker-steps">
            {steps.map((step, index) => {
              const isCompleted = currentStepIndex >= index;
              const isActive = currentStepIndex === index;
              return (
                <div key={step.key} className={`tracker-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="tracker-icon">{step.icon}</div>
                  <span className="tracker-label">{step.label}</span>
                  {index < steps.length - 1 && <div className="tracker-line"></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="order-details__cancelled-card">
          <AlertCircle size={24} className="text-danger" />
          <div>
            <h3>Order {order.status}</h3>
            <p>This order was not fulfilled and no charges were made.</p>
          </div>
        </div>
      )}

      <div className="order-details__grid">
        <div className="order-details__items-card">
          <h3>Items Summary</h3>
          <div className="order-items-list">
            {order.items.map(item => (
              <div key={item.id} className="order-item-row">
                <div className="order-item-info">
                  <span className="qty">{item.quantity}x</span>
                  <span className="name">{item.itemName}</span>
                </div>
                <span className="price">₹{item.priceAtOrder * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="order-notes">
            <MapPin size={16} className="text-primary" />
            <div className="delivery-info">
              <strong>Delivery Location</strong>
              <p>{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="order-details__bill-card">
          <h3>Bill Breakdown</h3>
          <div className="bill-row">
            <span>Item Total</span>
            <span>₹{itemTotal}</span>
          </div>
          <div className="bill-row">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee}</span>
          </div>
          <div className="bill-row">
            <span>Taxes & Charges (5%)</span>
            <span>₹{taxes}</span>
          </div>
          {discountAmount > 0 && (
            <div className="bill-row text-success">
              <span>Promo Discount</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}
          <div className="bill-divider"></div>
          <div className="bill-row bill-total">
            <span>Grand Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
