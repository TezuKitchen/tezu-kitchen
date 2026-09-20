package com.tezukitchen.api.review.repository;

import com.tezukitchen.api.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    Optional<Review> findByUserIdAndRestaurantId(UUID userId, UUID restaurantId);
    List<Review> findByRestaurantId(UUID restaurantId);
}
