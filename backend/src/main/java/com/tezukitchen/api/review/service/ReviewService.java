package com.tezukitchen.api.review.service;

import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.review.dto.ReviewRequest;
import com.tezukitchen.api.review.dto.ReviewResponse;
import com.tezukitchen.api.review.entity.Review;
import com.tezukitchen.api.review.repository.ReviewRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse addReview(UUID userId, UUID restaurantId, ReviewRequest request) {
        if (reviewRepository.findByUserIdAndRestaurantId(userId, restaurantId).isPresent()) {
            throw new RuntimeException("User has already reviewed this restaurant");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        Review review = Review.builder()
                .user(user)
                .restaurant(restaurant)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        updateRestaurantRating(restaurant);

        return mapToResponse(savedReview);
    }

    public List<ReviewResponse> getReviewsForRestaurant(UUID restaurantId) {
        return reviewRepository.findByRestaurantId(restaurantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void updateRestaurantRating(Restaurant restaurant) {
        List<Review> reviews = reviewRepository.findByRestaurantId(restaurant.getId());
        if (reviews.isEmpty()) {
            restaurant.setAverageRating(BigDecimal.ZERO);
            restaurant.setReviewCount(0);
        } else {
            double average = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            restaurant.setAverageRating(BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
            restaurant.setReviewCount(reviews.size());
        }
        restaurantRepository.save(restaurant);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .restaurantId(review.getRestaurant().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
