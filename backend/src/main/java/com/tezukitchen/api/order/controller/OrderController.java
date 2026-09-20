package com.tezukitchen.api.order.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.order.dto.request.CreateOrderRequest;
import com.tezukitchen.api.order.dto.request.UpdateOrderStatusRequest;
import com.tezukitchen.api.order.dto.response.OrderResponse;
import com.tezukitchen.api.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        UUID userId = getAuthenticatedUserId();
        OrderResponse response = orderService.createOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable UUID id) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        OrderResponse response = orderService.getOrderById(authenticatedUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", response));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByUser(
            @PathVariable UUID userId, Pageable pageable) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        Page<OrderResponse> response = orderService.getOrdersByUser(authenticatedUserId, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByRestaurant(
            @PathVariable UUID restaurantId, Pageable pageable) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        Page<OrderResponse> response = orderService.getOrdersByRestaurant(authenticatedUserId, restaurantId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        OrderResponse response = orderService.updateOrderStatus(authenticatedUserId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
