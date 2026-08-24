package com.tezukitchen.api.menu.repository;

import com.tezukitchen.api.menu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * MenuItem JPA repository.
 * <p>
 * TODO: Add custom query methods (e.g., findByRestaurantId)
 */
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    // TODO: Add custom query methods
}
