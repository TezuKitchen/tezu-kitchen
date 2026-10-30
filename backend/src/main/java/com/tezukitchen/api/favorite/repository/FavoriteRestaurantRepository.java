package com.tezukitchen.api.favorite.repository;

import com.tezukitchen.api.favorite.entity.FavoriteRestaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRestaurantRepository extends JpaRepository<FavoriteRestaurant, UUID> {
    Optional<FavoriteRestaurant> findByUserIdAndRestaurantId(UUID userId, UUID restaurantId);

    @Query("SELECT f FROM FavoriteRestaurant f JOIN FETCH f.restaurant r LEFT JOIN FETCH r.images WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    List<FavoriteRestaurant> findByUserId(@Param("userId") UUID userId);

    void deleteByUserIdAndRestaurantId(UUID userId, UUID restaurantId);
}
