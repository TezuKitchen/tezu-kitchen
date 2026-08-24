package com.tezukitchen.api.restaurant.repository;

import com.tezukitchen.api.restaurant.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Restaurant JPA repository.
 * <p>
 * TODO: Add custom query methods
 */
@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    // TODO: Add custom query methods
}
