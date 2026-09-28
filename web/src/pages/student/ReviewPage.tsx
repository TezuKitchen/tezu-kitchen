import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import api from '../../services/api';
import './ReviewPage.css';

const ReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setError('Missing restaurant ID.');
      return;
    }
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post(`/reviews/restaurant/${restaurantId}`, {
        rating,
        comment: comment.trim(),
      });
      alert('Review submitted!');
      navigate(-1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!restaurantId) {
    return <div className="review-page__error">Invalid URL. Missing restaurant ID.</div>;
  }

  return (
    <div className="review-page">
      <div className="review-page__card">
        <h1 className="review-page__title">Leave a Review</h1>
        <p className="review-page__subtitle">Share your experience with others</p>

        {error && <div className="review-page__error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="review-page__form">
          <div className="review-page__stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="review-page__star-btn"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  size={40}
                  fill={(hoverRating || rating) >= star ? 'var(--color-warning)' : 'none'}
                  stroke={(hoverRating || rating) >= star ? 'var(--color-warning)' : 'var(--color-text-light)'}
                  className="review-page__star-icon"
                />
              </button>
            ))}
          </div>

          <div className="review-page__input-group">
            <label htmlFor="comment" className="review-page__label">
              Your Review
            </label>
            <textarea
              id="comment"
              className="review-page__textarea"
              placeholder="What did you like or dislike?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
            />
          </div>

          <div className="review-page__actions">
            <button
              type="button"
              className="review-page__cancel-btn"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="review-page__submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewPage;
