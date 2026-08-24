package com.tezukitchen.api.order.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Order management REST controller.
 * <p>
 * Planned endpoints:
 * - POST   /api/v1/orders — Create order
 * - GET    /api/v1/orders — List orders (filtered by user/restaurant)
 * - GET    /api/v1/orders/{id} — Get order by ID
 * - PUT    /api/v1/orders/{id}/status — Update order status
 * - DELETE /api/v1/orders/{id} — Cancel order
 */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    // TODO: Inject OrderService
    // TODO: Implement order endpoints
}
