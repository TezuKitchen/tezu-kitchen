package com.tezukitchen.api.cart.repository;

import com.tezukitchen.api.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByCartId(UUID cartId);
    Optional<CartItem> findByCartIdAndMenuItemId(UUID cartId, UUID menuItemId);
    void deleteByCartIdAndMenuItemId(UUID cartId, UUID menuItemId);
    void deleteByCartId(UUID cartId);
}
