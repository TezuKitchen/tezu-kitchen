package com.tezukitchen.api.favorite.repository;

import com.tezukitchen.api.favorite.entity.FavoriteRestaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRestaurantRepository extends JpaRepository<FavoriteRestaurant, UUID> {
    Optional<FavoriteRestaurant> findByUserIdAndRestaurantId(UUID userId, UUID restaurantId);
    List<FavoriteRestaurant> findByUserId(UUID userId);
    void deleteByUserIdAndRestaurantId(UUID userId, UUID restaurantId);
}
