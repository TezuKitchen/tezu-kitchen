import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import './ReviewPage.css';

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setError('Restaurant ID is missing.');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.post(`/reviews/restaurant/${restaurantId}`, {
        rating,
        comment
      });
      alert('Review submitted successfully!');
      navigate(`/student/restaurant/${restaurantId}`, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
      setIsSubmitting(false);
    }
  };

  if (!restaurantId) {
    return (
      <div className="review-page">
        <div className="review-page__container">
          <p className="review-page__error-msg">Invalid restaurant. Please go back.</p>
          <button className="review-page__back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-page__container">
        
        <button className="review-page__back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back to Restaurant
        </button>

        <div className="review-page__card">
          <h1 className="review-page__title">Leave a Review</h1>
          <p className="review-page__subtitle">Share your experience with others</p>

          <form onSubmit={handleSubmit} className="review-page__form">
            
            <div className="review-page__rating-section">
              <label>Rating</label>
              <div className="review-page__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="review-page__star-btn"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star 
                      size={40} 
                      fill={(hoverRating || rating) >= star ? '#F59E0B' : 'none'} 
                      color={(hoverRating || rating) >= star ? '#F59E0B' : '#D1D5DB'} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="review-page__input-group">
              <label htmlFor="comment">Comment (Optional)</label>
              <textarea
                id="comment"
                rows={5}
                placeholder="What did you like or dislike?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {error && <div className="review-page__error-alert">{error}</div>}

            <button 
              type="submit" 
              className="review-page__submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
