import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, RefreshCw, Star, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getTransformedUrl } from '../../services/imageService';
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
  createdAt: string;
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setError(null);
      const [resRes, favRes] = await Promise.all([
        api.get('/restaurants'),
        api.get('/favorites').catch(() => ({ data: { data: [] } }))
      ]);
      setRestaurants(resRes.data.data.content || []);
      setFavorites(favRes.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="home-page__loading">
        <RefreshCw className="spinner" />
        <p>Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__header-location">
          <MapPin size={20} className="icon-primary" />
          <span>Delivering to Tezpur University Campus</span>
        </div>
        <button 
          className={`home-page__refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      {error && (
        <div className="home-page__error">
          <p>{error}</p>
          <button onClick={handleRefresh}>Try Again</button>
        </div>
      )}

      {!error && favorites.length > 0 && (
        <section className="home-page__section">
          <h2 className="home-page__section-title">
            <Star size={20} className="icon-warning" />
            Your Favorites
          </h2>
          <div className="home-page__favorites-scroll">
            {favorites.map(fav => (
              <div 
                key={fav.id} 
                className="home-page__favorite-card"
                onClick={() => navigate(`/student/restaurant/${fav.restaurantId}`)}
              >
                <div className="favorite-card__content">
                  <h3>{fav.restaurantName}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!error && (
        <section className="home-page__section">
          <h2 className="home-page__section-title">
            <Store size={20} className="icon-primary" />
            All Restaurants
          </h2>
          {restaurants.length === 0 ? (
            <div className="home-page__empty">
              <Store size={48} className="icon-muted" />
              <p>No restaurants available right now.</p>
            </div>
          ) : (
            <div className="home-page__restaurant-grid">
              {restaurants.map(restaurant => (
                <div 
                  key={restaurant.id}
                  className="restaurant-card"
                  onClick={() => navigate(`/student/restaurant/${restaurant.id}`)}
                >
                  <div className="restaurant-card__image-container">
                    <img 
                      src={getTransformedUrl(restaurant.bannerUrl, 'restaurant-card') || '/placeholder-restaurant.jpg'} 
                      alt={restaurant.name}
                      className="restaurant-card__image"
                    />
                    <div className={`restaurant-card__badge ${restaurant.open ? 'badge--open' : 'badge--closed'}`}>
                      {restaurant.open ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  <div className="restaurant-card__info">
                    <h3 className="restaurant-card__name">{restaurant.name}</h3>
                    <p className="restaurant-card__description">{restaurant.description}</p>
                    <div className="restaurant-card__footer">
                      <div className="restaurant-card__location">
                        <MapPin size={16} />
                        <span>{restaurant.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
