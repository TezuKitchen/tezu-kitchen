package com.tezukitchen.api.restaurant.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Restaurant management REST controller.
 * <p>
 * Planned endpoints:
 * - POST   /api/v1/restaurants — Create restaurant
 * - GET    /api/v1/restaurants — List restaurants
 * - GET    /api/v1/restaurants/{id} — Get restaurant by ID
 * - PUT    /api/v1/restaurants/{id} — Update restaurant
 * - DELETE /api/v1/restaurants/{id} — Delete restaurant
 */
@RestController
@RequestMapping("/api/v1/restaurants")
public class RestaurantController {
    // TODO: Inject RestaurantService
    // TODO: Implement restaurant endpoints
}
