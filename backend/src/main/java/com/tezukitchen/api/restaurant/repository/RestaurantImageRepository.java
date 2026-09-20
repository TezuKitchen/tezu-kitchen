package com.tezukitchen.api.restaurant.repository;

import com.tezukitchen.api.restaurant.entity.RestaurantImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantImageRepository extends JpaRepository<RestaurantImage, UUID> {
    List<RestaurantImage> findByRestaurantIdOrderByDisplayOrderAsc(UUID restaurantId);
    Optional<RestaurantImage> findByRestaurantIdAndImageType(UUID restaurantId, String imageType);
    long countByRestaurantId(UUID restaurantId);
}
