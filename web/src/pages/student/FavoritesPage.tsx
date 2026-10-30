import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Heart, HeartOff, MapPin, Store } from 'lucide-react';
import './FavoritesPage.css';

interface Favorite {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation: string;
}

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/favorites');
      setFavorites(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleUnfavorite = async (e: React.MouseEvent, restaurantId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/favorites/restaurant/${restaurantId}/toggle`);
      setFavorites(prev => prev.filter(f => f.restaurantId !== restaurantId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <h1 className="favorites-page__title">Your Favorites</h1>
        <div className="favorites-page__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="favorites-page__skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-page">
        <h1 className="favorites-page__title">Your Favorites</h1>
        <div className="favorites-page__error">
          <p>{error}</p>
          <button onClick={fetchFavorites} className="favorites-page__btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h1 className="favorites-page__title">Your Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="favorites-page__empty">
          <Heart size={64} className="favorites-page__empty-icon" />
          <h2>No favorites yet</h2>
          <p>Save your favorite restaurants here for quick access later.</p>
          <button 
            className="favorites-page__btn-primary"
            onClick={() => navigate('/student/home')}
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="favorites-page__grid">
          {favorites.map((fav) => (
            <div 
              key={fav.id}
              className="favorites-page__card"
              onClick={() => navigate(`/student/restaurant/${fav.restaurantId}`)}
            >
              <div className="favorites-page__card-icon-wrapper">
                <Store size={32} className="favorites-page__card-store-icon" />
              </div>
              <div className="favorites-page__card-content">
                <h3 className="favorites-page__card-name">{fav.restaurantName}</h3>
                <p className="favorites-page__card-location">
                  <MapPin size={14} /> {fav.restaurantLocation}
                </p>
              </div>
              <div className="favorites-page__card-actions">
                <button 
                  className="favorites-page__btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/restaurant/${fav.restaurantId}`);
                  }}
                >
                  View Menu
                </button>
                <button 
                  className="favorites-page__btn-unfavorite"
                  onClick={(e) => handleUnfavorite(e, fav.restaurantId)}
                  title="Remove from favorites"
                >
                  <HeartOff size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
