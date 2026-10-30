import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Minus, Plus, Trash2, ShoppingBag, Banknote, CreditCard, Tag, Loader2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import './CartPage.css';

const QUICK_ADDRESSES = [
  'Patkai Hostel',
  'Nilachal Hostel',
  'Saraighat Hostel',
  'Subansiri Hostel',
  'Central Library',
  'Academic Block'
];

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, totalAmount, updateQuantity, removeItem, clearCart, 
    restaurantId, restaurantName 
  } = useCart();

  const [address, setAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const response = await api.get(`/promotions/validate?code=${promoCode}&orderAmount=${totalAmount}`);
      const data = response.data.data;
      if (data.discountAmount) {
        setDiscountAmount(data.discountAmount);
      } else {
        setPromoError('Invalid promotion code');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Failed to apply promo code');
      setDiscountAmount(0);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setPromoCode('');
    setDiscountAmount(0);
    setPromoError('');
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setOrderError('Please enter a delivery address');
      return;
    }
    if (items.length === 0) {
      setOrderError('Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError('');

    try {
      const orderPayload = {
        restaurantId,
        deliveryAddress: address,
        items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity }))
        // include promoCode if required by backend, but prompt didn't specify
      };

      const orderResponse = await api.post('/orders', orderPayload);
      const orderId = orderResponse.data.data.id;

      if (paymentMethod === 'COD') {
        await api.post('/payments', { orderId, method: 'COD' });
        clearCart();
        navigate('/student/orders');
      } else {
        const paymentResponse = await api.post('/payments/razorpay/create-order', { orderId });
        const { razorpayOrderId, amount, currency, keyId } = paymentResponse.data.data;

        const options = {
          key: keyId,
          amount,
          currency,
          name: 'TezuKitchen',
          description: 'Food Order Payment',
          order_id: razorpayOrderId,
          handler: async (response: any) => {
            try {
              await api.post('/payments/razorpay/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });
              clearCart();
              navigate('/student/orders');
            } catch (err) {
              setOrderError('Payment verification failed');
            }
          },
          theme: {
            color: '#FF5722'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', () => {
          setOrderError('Payment failed or cancelled');
          setIsPlacingOrder(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      setOrderError(err.response?.data?.message || 'Failed to place order');
      setIsPlacingOrder(false);
    }
  };

  const finalTotal = totalAmount - discountAmount;

  if (items.length === 0) {
    return (
      <div className="cart-page cart-page--empty">
        <ShoppingBag size={64} className="cart-page__empty-icon" />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <button 
          className="btn btn--primary cart-page__browse-btn"
          onClick={() => navigate('/student')}
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page__left">
        <div className="cart-page__header">
          <div className="cart-page__header-title">
            <h2>Your Cart</h2>
            {restaurantName && <span className="cart-page__restaurant-name">from {restaurantName}</span>}
          </div>
          <button className="btn btn--outline cart-page__clear-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className="cart-page__items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item__info">
                <h4>{item.name}</h4>
                <p className="cart-item__price">₹{item.price}</p>
              </div>
              
              <div className="cart-item__controls">
                <div className="cart-item__stepper">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="cart-item__subtotal">
                  ₹{item.price * item.quantity}
                </div>
                
                <button className="cart-item__remove" onClick={() => removeItem(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-page__section">
          <h3>Delivery Address</h3>
          <input 
            type="text" 
            className="input-field cart-page__address-input" 
            placeholder="Enter full delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="cart-page__quick-addresses">
            {QUICK_ADDRESSES.map(addr => (
              <button 
                key={addr}
                className={`chip ${address === addr ? 'chip--active' : ''}`}
                onClick={() => setAddress(addr)}
              >
                {addr}
              </button>
            ))}
          </div>
        </div>

        <div className="cart-page__section">
          <h3>Promo Code</h3>
          <div className="promo-section">
            <div className="promo-section__input-group">
              <Tag size={20} className="promo-section__icon" />
              <input 
                type="text" 
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={discountAmount > 0 || isApplyingPromo}
              />
              {discountAmount === 0 ? (
                <button 
                  className="btn btn--secondary" 
                  onClick={handleApplyPromo}
                  disabled={!promoCode || isApplyingPromo}
                >
                  {isApplyingPromo ? <Loader2 size={18} className="spin" /> : 'Apply'}
                </button>
              ) : (
                <button className="btn btn--outline" onClick={removePromo}>
                  Remove
                </button>
              )}
            </div>
            {promoError && <p className="promo-section__error">{promoError}</p>}
            {discountAmount > 0 && <p className="promo-section__success">Promo applied! You save ₹{discountAmount}</p>}
          </div>
        </div>
      </div>

      <div className="cart-page__right">
        <div className="cart-page__summary-card">
          <h3>Payment Method</h3>
          <div className="payment-methods">
            <label className={`payment-method ${paymentMethod === 'COD' ? 'payment-method--active' : ''}`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="COD" 
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              <Banknote size={24} />
              <span>Cash on Delivery</span>
            </label>
            
            <label className={`payment-method ${paymentMethod === 'ONLINE' ? 'payment-method--active' : ''}`}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="ONLINE" 
                checked={paymentMethod === 'ONLINE'}
                onChange={() => setPaymentMethod('ONLINE')}
              />
              <CreditCard size={24} />
              <span>Pay Online (Razorpay)</span>
            </label>
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-summary__row">
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>
            {discountAmount > 0 && (
              <div className="order-summary__row order-summary__row--discount">
                <span>Discount</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="order-summary__row">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="order-summary__divider"></div>
            <div className="order-summary__row order-summary__row--total">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>

          {orderError && <div className="cart-page__error-msg">{orderError}</div>}

          <button 
            className="btn btn--primary cart-page__place-btn" 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <><Loader2 size={20} className="spin" /> Processing...</>
            ) : (
              `Place Order • ₹${finalTotal}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
