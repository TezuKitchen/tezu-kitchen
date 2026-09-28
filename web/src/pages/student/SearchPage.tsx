import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { getTransformedUrl } from '../../services/imageService';
import { Search, X, MapPin, Clock, SearchX } from 'lucide-react';
import './SearchPage.css';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  bannerUrl: string;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const res = await api.get('/restaurants?size=100');
        setRestaurants(res.data.data.content || res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  const filteredRestaurants = useMemo(() => {
    if (!debouncedQuery.trim()) return restaurants;
    const lowerQuery = debouncedQuery.toLowerCase();
    
    return restaurants.filter((r) => 
      r.name.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.location.toLowerCase().includes(lowerQuery)
    );
  }, [restaurants, debouncedQuery]);

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setSearchParams({});
  };

  return (
    <div className="search-page">
      <div className="search-page__header">
        <div className="search-page__input-container">
          <Search className="search-page__input-icon" size={20} />
          <input
            type="text"
            className="search-page__input"
            placeholder="Search for restaurants, cuisines, or locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="search-page__clear-btn" onClick={handleClear}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="search-page__results-info">
        {loading ? (
          <p>Loading restaurants...</p>
        ) : error ? (
          <p className="search-page__error-text">{error}</p>
        ) : debouncedQuery ? (
          <h2>Found {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} for "{debouncedQuery}"</h2>
        ) : (
          <h2>All Restaurants ({restaurants.length})</h2>
        )}
      </div>

      {!loading && !error && filteredRestaurants.length === 0 ? (
        <div className="search-page__empty">
          <SearchX size={64} className="search-page__empty-icon" />
          <h3>No restaurants found</h3>
          <p>We couldn't find any restaurants matching your search.</p>
          <button className="search-page__clear-search-btn" onClick={handleClear}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="search-page__grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="search-page__skeleton-card" />
            ))
          ) : (
            filteredRestaurants.map((restaurant) => (
              <div 
                key={restaurant.id}
                className={`search-page__card ${!restaurant.open ? 'search-page__card--closed' : ''}`}
                onClick={() => navigate(`/student/restaurant/${restaurant.id}`)}
              >
                <div className="search-page__card-image-wrapper">
                  <img 
                    src={restaurant.bannerUrl ? getTransformedUrl(restaurant.bannerUrl, 'restaurant-card') : 'https://placehold.co/600x400/png?text=Restaurant'} 
                    alt={restaurant.name}
                    className="search-page__card-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=Restaurant';
                    }}
                  />
                  {!restaurant.open && (
                    <div className="search-page__badge-closed">Closed</div>
                  )}
                  {restaurant.open && (
                    <div className="search-page__badge-open">Open</div>
                  )}
                </div>
                <div className="search-page__card-content">
                  <h3 className="search-page__card-name">{restaurant.name}</h3>
                  <p className="search-page__card-desc">{restaurant.description}</p>
                  <div className="search-page__card-meta">
                    <span className="search-page__card-location">
                      <MapPin size={14} /> {restaurant.location}
                    </span>
                    <span className="search-page__card-time">
                      <Clock size={14} /> 30-40 min
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
