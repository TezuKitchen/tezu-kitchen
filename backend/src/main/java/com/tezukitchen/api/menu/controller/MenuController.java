package com.tezukitchen.api.menu.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Menu management REST controller.
 * <p>
 * Planned endpoints:
 * - POST   /api/v1/menu — Create menu item
 * - GET    /api/v1/menu — List menu items (with filters)
 * - GET    /api/v1/menu/{id} — Get menu item by ID
 * - PUT    /api/v1/menu/{id} — Update menu item
 * - DELETE /api/v1/menu/{id} — Delete menu item
 */
@RestController
@RequestMapping("/api/v1/menu")
public class MenuController {
    // TODO: Inject MenuService
    // TODO: Implement menu endpoints
}
