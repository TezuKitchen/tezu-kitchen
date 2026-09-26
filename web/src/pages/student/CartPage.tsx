import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, MapPin, Ticket, Banknote, CreditCard, ShoppingBag } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, restaurantId, restaurantName, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  
  const [address, setAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUICK_ADDRESSES = ['Patkai Hostel', 'Nilachal Hostel', 'Saraighat Hostel', 'Subansiri Hostel', 'Central Library'];


  const applyPromo = async () => {
    if (!promoCode) return;
    try {
      const res = await api.get(`/promotions/validate?code=${promoCode}&orderAmount=${totalAmount}`);
      // Assuming response gives discount amount
      setDiscount(res.data.data.discountAmount || 0);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid promo code');
      setDiscount(0);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!address) {
      setError('Please provide a delivery address');
      return;
    }
    
    setIsPlacingOrder(true);
    setError(null);
    
    try {
      // 1. Create Order
      const orderPayload = {
        restaurantId,
        deliveryAddress: address,
        items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity }))
      };
      const orderRes = await api.post('/orders', orderPayload);
      const orderId = orderRes.data.data.id;
      
      // 2. Payment
      if (paymentMethod === 'COD') {
        await api.post('/payments', { orderId, method: 'COD' });
        clearCart();
        navigate('/student/orders', { replace: true });
      } else {
        const resLoaded = await loadRazorpay();
        if (!resLoaded) throw new Error('Razorpay SDK failed to load');
        
        const rzpRes = await api.post('/payments/razorpay/create-order', { orderId });
        const { razorpayOrderId, keyId, amount, currency } = rzpRes.data.data;
        
        const options = {
          key: keyId,
          amount,
          currency,
          order_id: razorpayOrderId,
          name: 'TezuKitchen',
          description: `Order from ${restaurantName}`,
          handler: async (response: any) => {
            try {
              await api.post('/payments/razorpay/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId
              });
              clearCart();
              navigate('/student/orders', { replace: true });
            } catch (err) {
              setError('Payment verification failed');
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: '#FF5722' }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function () {
          setError('Payment failed. Please try again.');
          setIsPlacingOrder(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order');
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page__empty">
        <ShoppingBag size={64} className="cart-page__empty-icon" />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <button className="cart-page__browse-btn" onClick={() => navigate('/student')}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  const grandTotal = totalAmount - discount;

  return (
    <div className="cart-page">
      <div className="cart-page__container">
        
        <div className="cart-page__main">
          <h1 className="cart-page__title">Checkout</h1>
          <p className="cart-page__restaurant">Ordering from: <strong>{restaurantName}</strong></p>
          
          <div className="cart-page__section">
            <h2 className="cart-page__section-title">Order Items</h2>
            <div className="cart-page__items">
              {items.map(item => (
                <div key={item.id} className="cart-page__item-card">
                  <div className="cart-page__item-info">
                    <h3 className="cart-page__item-name">{item.name}</h3>
                    <p className="cart-page__item-price">₹{item.price}</p>
                  </div>
                  
                  <div className="cart-page__item-actions">
                    <div className="cart-page__stepper">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16}/></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16}/></button>
                    </div>
                    <p className="cart-page__item-subtotal">₹{item.price * item.quantity}</p>
                    <button className="cart-page__remove-btn" onClick={() => removeItem(item.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-page__section">
            <h2 className="cart-page__section-title"><MapPin size={20} /> Delivery Address</h2>
            
            <div className="cart-page__quick-addresses">
              {QUICK_ADDRESSES.map(loc => (
                <button 
                  key={loc}
                  className={`cart-page__chip ${address === loc ? 'active' : ''}`}
                  onClick={() => setAddress(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
            
            <input 
              type="text" 
              className="cart-page__input" 
              placeholder="Or type full address details..." 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="cart-page__section">
            <h2 className="cart-page__section-title"><Ticket size={20} /> Promo Code</h2>
            <div className="cart-page__promo-input">
              <input 
                type="text" 
                placeholder="Enter code" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button onClick={applyPromo}>Apply</button>
            </div>
          </div>
          
          <div className="cart-page__section">
            <h2 className="cart-page__section-title">Payment Method</h2>
            <div className="cart-page__payment-methods">
              <label className={`cart-page__payment-card ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <Banknote size={24} />
                <span>Cash on Delivery</span>
              </label>
              
              <label className={`cart-page__payment-card ${paymentMethod === 'ONLINE' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="ONLINE" 
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                />
                <CreditCard size={24} />
                <span>Pay Online</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="cart-page__sidebar">
          <div className="cart-page__summary-card">
            <h2>Order Summary</h2>
            
            <div className="cart-page__summary-row">
              <span>Item Total</span>
              <span>₹{totalAmount}</span>
            </div>
            
            {discount > 0 && (
              <div className="cart-page__summary-row discount">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            
            <div className="cart-page__summary-row">
              <span>Delivery Fee</span>
              <span>Free</span>
            </div>
            
            <div className="cart-page__summary-total">
              <span>Grand Total</span>
              <span>₹{Math.max(0, grandTotal)}</span>
            </div>
            
            {error && <div className="cart-page__error-alert">{error}</div>}
            
            <button 
              className="cart-page__place-btn" 
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
