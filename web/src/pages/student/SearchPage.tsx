import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, SearchX, MapPin } from 'lucide-react';
import api from '../../services/api';
import { getTransformedUrl } from '../../services/imageService';
import './SearchPage.css';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  bannerUrl: string;
}

export default function SearchPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants');
        setRestaurants(response.data.data.content || []);
      } catch (error) {
        console.error('Error fetching restaurants for search:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredRestaurants = useMemo(() => {
    if (!debouncedQuery.trim()) return restaurants;
    
    const lowerQuery = debouncedQuery.toLowerCase();
    return restaurants.filter(
      r => 
        r.name.toLowerCase().includes(lowerQuery) || 
        r.description.toLowerCase().includes(lowerQuery) ||
        r.location.toLowerCase().includes(lowerQuery)
    );
  }, [restaurants, debouncedQuery]);

  return (
    <div className="search-page">
      <div className="search-page__header">
        <div className="search-page__input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-page__input"
            placeholder="Search restaurants, cuisines, or locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-page__clear-btn" onClick={() => setQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="search-page__results-info">
        {debouncedQuery ? (
          <span>Found {filteredRestaurants.length} restaurants for "{debouncedQuery}"</span>
        ) : (
          <span>All Restaurants ({restaurants.length})</span>
        )}
      </div>

      {loading ? (
        <div className="search-page__loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="search-page__empty">
          <SearchX size={48} className="icon-muted" />
          <h3>No Restaurants Found</h3>
          <p>We couldn't find anything matching your search.</p>
          <button className="btn-primary" onClick={() => setQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="search-page__grid">
          {filteredRestaurants.map(restaurant => (
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
    </div>
  );
};
