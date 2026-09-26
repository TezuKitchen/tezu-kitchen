import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, Heart, ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getTransformedUrl } from '../../services/imageService';
import type { Restaurant, MenuItem, Review, FavoriteRestaurant } from '../../types';
import './RestaurantPage.css';

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, addItem, updateQuantity, totalItems, totalAmount, restaurantId: cartRestaurantId } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resData, menuData, reviewsData, favData] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/menu/restaurant/${id}/available`),
        api.get(`/reviews/restaurant/${id}`),
        user ? api.get('/favorites') : Promise.resolve({ data: { data: [] } })
      ]);

      setRestaurant(resData.data.data);
      setMenuItems(menuData.data.data);
      setReviews(reviewsData.data.data);
      
      if (user) {
        const favorites = favData.data.data as FavoriteRestaurant[];
        setIsFavorite(favorites.some(f => String(f.restaurantId) === String(id)));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load restaurant details');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/favorites/restaurant/${id}/toggle`);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  if (isLoading) return <div className="restaurant-page__loading">Loading...</div>;
  if (error) return <div className="restaurant-page__error">{error}</div>;
  if (!restaurant) return <div className="restaurant-page__not-found">Restaurant not found.</div>;

  // Group menu items by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const heroUrl = getTransformedUrl(restaurant.bannerUrl || restaurant.imageUrl, 'restaurant-hero');

  return (
    <div className="restaurant-page">
      <div className="restaurant-page__container">
        
        <div className="restaurant-page__left">
          <button className="restaurant-page__back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
          </button>
          
          <div className="restaurant-page__hero">
            {heroUrl ? (
              <img src={heroUrl} alt={restaurant.name} className="restaurant-page__hero-img" />
            ) : (
              <div className="restaurant-page__hero-placeholder" />
            )}
            <button className={`restaurant-page__fav-btn ${isFavorite ? 'active' : ''}`} onClick={toggleFavorite}>
              <Heart fill={isFavorite ? 'currentColor' : 'none'} size={24} />
            </button>
          </div>

          <div className="restaurant-page__info">
            <h1 className="restaurant-page__title">{restaurant.name}</h1>
            <p className="restaurant-page__desc">{restaurant.description}</p>
            <p className="restaurant-page__loc">{restaurant.location}</p>
            
            <div className="restaurant-page__meta">
              <span className="restaurant-page__meta-item">
                <Star size={18} className="icon-star" />
                {restaurant.averageRating?.toFixed(1) || '0.0'} ({restaurant.reviewCount || 0} reviews)
              </span>
              <span className="restaurant-page__meta-item">
                <Clock size={18} className="icon-clock" />
                30-40 mins
              </span>
            </div>
          </div>

          <div className="restaurant-page__reviews-section">
            <div className="restaurant-page__reviews-header">
              <h2>Reviews</h2>
              <Link to={`/student/review?restaurantId=${id}`} className="restaurant-page__review-link">
                Leave a Review
              </Link>
            </div>
            
            {reviews.length === 0 ? (
              <p className="restaurant-page__no-reviews">No reviews yet.</p>
            ) : (
              <div className="restaurant-page__reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="restaurant-page__review-card">
                    <div className="restaurant-page__review-head">
                      <span className="restaurant-page__review-user">{review.userName || 'Anonymous User'}</span>
                      <span className="restaurant-page__review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="restaurant-page__review-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? '#F59E0B' : 'none'} color={i < review.rating ? '#F59E0B' : '#D1D5DB'} />
                      ))}
                    </div>
                    <p className="restaurant-page__review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="restaurant-page__right">
          <div className="restaurant-page__menu">
            <h2>Menu</h2>
            {Object.keys(groupedMenu).length === 0 ? (
              <p>No items available.</p>
            ) : (
              Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className="restaurant-page__category">
                  <h3 className="restaurant-page__category-title">{category}</h3>
                  <div className="restaurant-page__menu-grid">
                    {items.map(item => {
                      const cartItem = cartItems.find(i => i.id === item.id);
                      const quantity = cartItem?.quantity || 0;
                      const itemImg = getTransformedUrl(item.primaryImageUrl || item.imageUrl, 'menu-item');
                      
                      return (
                        <div key={item.id} className="restaurant-page__menu-card">
                          <div className="restaurant-page__menu-card-content">
                            <div className="restaurant-page__veg-indicator">
                              <span className="dot"></span>
                            </div>
                            <h4 className="restaurant-page__menu-item-name">{item.name}</h4>
                            <p className="restaurant-page__menu-item-price">₹{item.price}</p>
                            <p className="restaurant-page__menu-item-desc">{item.description}</p>
                          </div>
                          
                          <div className="restaurant-page__menu-card-actions">
                            {itemImg && (
                              <img src={itemImg} alt={item.name} className="restaurant-page__menu-img" />
                            )}
                            <div className="restaurant-page__add-container">
                              {quantity > 0 ? (
                                <div className="restaurant-page__stepper">
                                  <button onClick={() => updateQuantity(item.id, quantity - 1)}><Minus size={16}/></button>
                                  <span>{quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, quantity + 1)}><Plus size={16}/></button>
                                </div>
                              ) : (
                                <button 
                                  className="restaurant-page__add-btn"
                                  onClick={() => addItem(item, restaurant.id, restaurant.name)}
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
              ))
            )}
          </div>
        </div>
      </div>

      {totalItems > 0 && cartRestaurantId === id && (
        <div className="restaurant-page__floating-cart">
          <div className="restaurant-page__floating-cart-info">
            <span className="items-count">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="divider">|</span>
            <span className="total-price">₹{totalAmount}</span>
          </div>
          <Link to="/student/cart" className="restaurant-page__floating-cart-btn">
            View Cart <ShoppingCart size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}
