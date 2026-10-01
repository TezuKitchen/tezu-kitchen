import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getTransformedUrl } from '../../services/imageService';
import { MapPin, RefreshCw, Star, Clock, ChevronRight, Store } from 'lucide-react';
import './HomePage.css';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  bannerUrl: string;
}

interface Favorite {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation: string;
}

const DISH_CATEGORIES = [
  { id: 'biryani', name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80', query: 'Biryani' },
  { id: 'paneer', name: 'Paneer', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&auto=format&fit=crop&q=80', query: 'Paneer' },
  { id: 'momos', name: 'Momos', image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=200&auto=format&fit=crop&q=80', query: 'Momo' },
  { id: 'rolls', name: 'Rolls', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80', query: 'Roll' },
  { id: 'noodles', name: 'Noodles', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&auto=format&fit=crop&q=80', query: 'Noodles' },
  { id: 'dosa', name: 'Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&auto=format&fit=crop&q=80', query: 'Dosa' },
  { id: 'burger', name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80', query: 'Burger' },
  { id: 'friedrice', name: 'Fried Rice', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&auto=format&fit=crop&q=80', query: 'Fried Rice' },
  { id: 'coffee', name: 'Chai & Coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', query: 'Coffee' },
  { id: 'paratha', name: 'Paratha', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&auto=format&fit=crop&q=80', query: 'Paratha' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [restRes, favRes] = await Promise.all([
        api.get('/restaurants?size=100'),
        api.get('/favorites').catch(() => ({ data: { data: [] } }))
      ]);
      setRestaurants(restRes.data.data.content || restRes.data.data);
      setFavorites(favRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <div className="home-page__loading">
        <div className="home-page__skeleton-header" />
        <div className="home-page__skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="home-page__skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__header-info">
          <h1 className="home-page__greeting">
            {getGreeting()}, {user?.name || 'Student'}!
          </h1>
          <div className="home-page__location">
            <MapPin size={18} className="home-page__location-icon" />
            <span>Tezpur University Campus</span>
          </div>
        </div>
        <button 
          className={`home-page__refresh-btn ${refreshing ? 'rotating' : ''}`}
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RefreshCw size={24} />
        </button>
      </header>

      {error && (
        <div className="home-page__error">
          <p>{error}</p>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {!error && (
        <section className="home-page__categories-section">
          <h2 className="home-page__section-title">What's on your mind?</h2>
          <div className="home-page__categories-scroll">
            {DISH_CATEGORIES.map((dish) => (
              <div 
                key={dish.id} 
                className="category-item"
                onClick={() => navigate(`/student/search?q=${dish.query}`)}
              >
                <div className="category-item__image-wrap">
                  <img src={dish.image} alt={dish.name} loading="lazy" />
                </div>
                <span className="category-item__name">{dish.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!error && favorites.length > 0 && (
        <section className="home-page__favorites-section">
          <div className="home-page__section-header">
            <h2 className="home-page__section-title">Your Favorites</h2>
            <button 
              className="home-page__see-all-btn"
              onClick={() => navigate('/student/favorites')}
            >
              See All <ChevronRight size={16} />
            </button>
          </div>
          <div className="home-page__favorites-scroll">
            {favorites.map((fav) => (
              <div 
                key={fav.id} 
                className="home-page__favorite-card"
                onClick={() => navigate(`/student/restaurant/${fav.restaurantId}`)}
              >
                <div className="home-page__favorite-icon">
                  <Star size={24} />
                </div>
                <div className="home-page__favorite-info">
                  <h3>{fav.restaurantName}</h3>
                  <p>{fav.restaurantLocation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="home-page__restaurants-section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">All Restaurants</h2>
        </div>

        {restaurants.length === 0 ? (
          <div className="home-page__empty">
            <Store size={48} />
            <p>No restaurants available right now.</p>
          </div>
        ) : (
          <div className="home-page__restaurants-grid">
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant.id}
                className={`home-page__restaurant-card ${!restaurant.open ? 'home-page__restaurant-card--closed' : ''}`}
                onClick={() => navigate(`/student/restaurant/${restaurant.id}`)}
              >
                <div className="home-page__restaurant-image-wrapper">
                  <img 
                    src={restaurant.bannerUrl ? getTransformedUrl(restaurant.bannerUrl, 'restaurant-card') : 'https://placehold.co/600x400/png?text=Restaurant'} 
                    alt={restaurant.name}
                    className="home-page__restaurant-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=Restaurant';
                    }}
                  />
                  {!restaurant.open && (
                    <div className="home-page__restaurant-badge-closed">
                      Closed
                    </div>
                  )}
                  {restaurant.open && (
                    <div className="home-page__restaurant-badge-open">
                      Open
                    </div>
                  )}
                </div>
                <div className="home-page__restaurant-content">
                  <h3 className="home-page__restaurant-name">{restaurant.name}</h3>
                  <p className="home-page__restaurant-desc">{restaurant.description}</p>
                  <div className="home-page__restaurant-meta">
                    <span className="home-page__restaurant-location">
                      <MapPin size={14} /> {restaurant.location}
                    </span>
                    <span className="home-page__restaurant-time">
                      <Clock size={14} /> 30-40 min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
