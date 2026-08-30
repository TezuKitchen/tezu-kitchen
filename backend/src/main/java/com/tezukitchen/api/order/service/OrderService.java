package com.tezukitchen.api.order.service;

import com.tezukitchen.api.order.dto.request.CreateOrderRequest;
import com.tezukitchen.api.order.dto.request.UpdateOrderStatusRequest;
import com.tezukitchen.api.order.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OrderService {
    OrderResponse createOrder(UUID userId, CreateOrderRequest request);
    OrderResponse getOrderById(UUID authenticatedUserId, UUID orderId);
    Page<OrderResponse> getOrdersByUser(UUID authenticatedUserId, UUID userId, Pageable pageable);
    Page<OrderResponse> getOrdersByRestaurant(UUID authenticatedUserId, UUID restaurantId, Pageable pageable);
    OrderResponse updateOrderStatus(UUID authenticatedUserId, UUID orderId, UpdateOrderStatusRequest request);
}
