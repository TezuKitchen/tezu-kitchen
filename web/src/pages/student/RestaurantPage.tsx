import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Heart,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { getTransformedUrl } from '../../services/imageService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import type { Restaurant, MenuItem, Review, FavoriteRestaurant } from '../../types';
import './RestaurantPage.css';

const RestaurantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, updateQuantity, items: cartItems, restaurantId: cartResId, totalItems, totalAmount } = useCart();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [resRes, menuRes, revRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/menu/restaurant/${id}/available`),
          api.get(`/reviews/restaurant/${id}`).catch(() => ({ data: { data: [] } })),
        ]);

        setRestaurant(resRes.data.data);
        setMenuItems(menuRes.data.data);
        setReviews(revRes.data.data || []);

        if (isAuthenticated) {
          const favRes = await api.get('/favorites').catch(() => ({ data: { data: [] } }));
          const favorites: FavoriteRestaurant[] = favRes.data.data || [];
          setIsFavorite(favorites.some((fav) => fav.restaurantId === id));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load restaurant details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;
    try {
      await api.post(`/favorites/restaurant/${id}/toggle`);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleLeaveReview = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/student/review?restaurantId=${id}`);
  };

  if (loading) return <div className="restaurant-page__loading">Loading...</div>;
  if (error) return <div className="restaurant-page__error">{error}</div>;
  if (!restaurant) return <div className="restaurant-page__not-found">Restaurant not found.</div>;

  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Others';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const getCartItem = (itemId: string) => cartItems.find((i) => i.id === itemId);

  const showCartBar = cartItems.length > 0 && cartResId === id;

  return (
    <div className="restaurant-page">
      <div className="restaurant-page__container">
        {/* Left Column */}
        <div className="restaurant-page__left">
          <div className="restaurant-page__hero">
            {restaurant.bannerUrl ? (
              <img
                src={getTransformedUrl(restaurant.bannerUrl, 'restaurant-hero')}
                alt={restaurant.name}
                className="restaurant-page__hero-img"
              />
            ) : (
              <div className="restaurant-page__hero-placeholder" />
            )}
            <button
              className={`restaurant-page__fav-btn ${isFavorite ? 'restaurant-page__fav-btn--active' : ''}`}
              onClick={toggleFavorite}
              aria-label="Toggle Favorite"
            >
              <Heart fill={isFavorite ? 'currentColor' : 'none'} size={24} />
            </button>
          </div>

          <div className="restaurant-page__info">
            <h1 className="restaurant-page__name">{restaurant.name}</h1>
            <p className="restaurant-page__desc">{restaurant.description}</p>
            <div className="restaurant-page__meta">
              <div className="restaurant-page__meta-item">
                <MapPin size={18} />
                <span>{restaurant.location}</span>
              </div>
              <div className="restaurant-page__meta-item">
                <Star size={18} className="restaurant-page__star-icon" />
                <span>{restaurant.averageRating?.toFixed(1) || '0.0'} ({restaurant.reviewCount || 0} reviews)</span>
              </div>
              <div className="restaurant-page__meta-item">
                <Clock size={18} />
                <span className={restaurant.open ? 'restaurant-page__status--open' : 'restaurant-page__status--closed'}>
                  {restaurant.open ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>
          </div>

          <div className="restaurant-page__reviews">
            <div className="restaurant-page__reviews-header">
              <h2>Reviews</h2>
              <button className="restaurant-page__review-btn" onClick={handleLeaveReview}>
                Leave a Review
              </button>
            </div>
            
            {reviews.length === 0 ? (
              <p className="restaurant-page__no-reviews">No reviews yet. Be the first!</p>
            ) : (
              <div className="restaurant-page__review-list">
                {reviews.map((review) => (
                  <div key={review.id} className="restaurant-page__review-card">
                    <div className="restaurant-page__review-top">
                      <span className="restaurant-page__review-author">{review.userName || 'Anonymous'}</span>
                      <div className="restaurant-page__review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? 'var(--color-warning)' : 'none'}
                            stroke={i < review.rating ? 'var(--color-warning)' : 'var(--color-text-light)'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="restaurant-page__review-comment">{review.comment}</p>
                    <span className="restaurant-page__review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="restaurant-page__right">
          <div className="restaurant-page__menu-header">
            <h2>Menu</h2>
          </div>
          
          {menuItems.length === 0 ? (
            <p className="restaurant-page__empty-menu">No menu items available.</p>
          ) : (
            <div className="restaurant-page__menu-list">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className="restaurant-page__menu-category">
                  <h3 className="restaurant-page__category-title">{category}</h3>
                  <div className="restaurant-page__category-items">
                    {items.map((item) => {
                      const cartItem = getCartItem(item.id);
                      return (
                        <div key={item.id} className="restaurant-page__menu-item">
                          <div className="restaurant-page__item-details">
                            <div className="restaurant-page__item-header">
                              <h4 className="restaurant-page__item-name">{item.name}</h4>
                              <div className="restaurant-page__veg-indicator" aria-label="Veg/Non-veg">
                                <div className="restaurant-page__veg-circle" />
                              </div>
                            </div>
                            <p className="restaurant-page__item-price">₹{item.price.toFixed(2)}</p>
                            <p className="restaurant-page__item-desc">{item.description}</p>
                          </div>
                          
                          <div className="restaurant-page__item-actions">
                            {item.imageUrl ? (
                              <img
                                src={getTransformedUrl(item.imageUrl, 'menu-item')}
                                alt={item.name}
                                className="restaurant-page__item-img"
                              />
                            ) : (
                              <div className="restaurant-page__item-emoji">🍲</div>
                            )}
                            
                            <div className="restaurant-page__add-container">
                              {cartItem ? (
                                <div className="restaurant-page__stepper">
                                  <button onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}>
                                    <Minus size={16} />
                                  </button>
                                  <span>{cartItem.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}>
                                    <Plus size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="restaurant-page__add-btn"
                                  onClick={() => addItem(item, id!, restaurant.name)}
                                  disabled={!restaurant.open}
                                >
                                  ADD
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCartBar && (
        <div className="restaurant-page__cart-bar">
          <div className="restaurant-page__cart-bar-content">
            <div className="restaurant-page__cart-info">
              <ShoppingCart size={20} />
              <span>
                {totalItems} item{totalItems !== 1 ? 's' : ''} | ₹{totalAmount.toFixed(2)}
              </span>
            </div>
            <button
              className="restaurant-page__cart-link"
              onClick={() => navigate('/student/cart')}
            >
              View Cart <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
