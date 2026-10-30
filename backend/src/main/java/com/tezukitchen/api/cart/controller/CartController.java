package com.tezukitchen.api.cart.controller;

import com.tezukitchen.api.cart.dto.request.AddToCartRequest;
import com.tezukitchen.api.cart.dto.request.UpdateCartItemRequest;
import com.tezukitchen.api.cart.dto.response.CartResponse;
import com.tezukitchen.api.cart.service.CartService;
import com.tezukitchen.api.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        UUID authenticatedUserId = getAuthenticatedUserId();
        CartResponse response = cartService.getCart(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success("Cart retrieved successfully", response));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(@Valid @RequestBody AddToCartRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        CartResponse response = cartService.addItem(authenticatedUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", response));
    }

    @PutMapping("/items/{menuItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            @PathVariable UUID menuItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        CartResponse response = cartService.updateItemQuantity(authenticatedUserId, menuItemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Cart updated", response));
    }

    @DeleteMapping("/items/{menuItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(@PathVariable UUID menuItemId) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        CartResponse response = cartService.removeItem(authenticatedUserId, menuItemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", response));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        UUID authenticatedUserId = getAuthenticatedUserId();
        cartService.clearCart(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
