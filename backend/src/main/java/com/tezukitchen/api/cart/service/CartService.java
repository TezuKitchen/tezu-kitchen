package com.tezukitchen.api.cart.service;

import com.tezukitchen.api.cart.dto.request.AddToCartRequest;
import com.tezukitchen.api.cart.dto.response.CartResponse;

import java.util.UUID;

public interface CartService {
    CartResponse getCart(UUID userId);
    CartResponse addItem(UUID userId, AddToCartRequest request);
    CartResponse updateItemQuantity(UUID userId, UUID menuItemId, int quantity);
    CartResponse removeItem(UUID userId, UUID menuItemId);
    void clearCart(UUID userId);
}
