package com.tezukitchen.api.order.repository;

import com.tezukitchen.api.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Order JPA repository.
 * <p>
 * TODO: Add custom query methods (e.g., findByUserId, findByRestaurantId)
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // TODO: Add custom query methods
}
