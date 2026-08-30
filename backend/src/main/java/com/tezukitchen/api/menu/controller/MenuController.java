package com.tezukitchen.api.menu.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.menu.dto.request.CreateMenuItemRequest;
import com.tezukitchen.api.menu.dto.request.UpdateMenuItemRequest;
import com.tezukitchen.api.menu.dto.response.MenuItemResponse;
import com.tezukitchen.api.menu.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MenuItemResponse>> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        MenuItemResponse response = menuService.createMenuItem(authenticatedUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Menu item created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItemById(@PathVariable UUID id) {
        MenuItemResponse response = menuService.getMenuItemById(id);
        return ResponseEntity.ok(ApiResponse.success("Menu item retrieved successfully", response));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getMenuItemsByRestaurant(
            @PathVariable UUID restaurantId) {
        List<MenuItemResponse> response = menuService.getMenuItemsByRestaurant(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Menu items retrieved successfully", response));
    }

    @GetMapping("/restaurant/{restaurantId}/available")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAvailableMenuItems(
            @PathVariable UUID restaurantId) {
        List<MenuItemResponse> response = menuService.getAvailableMenuItems(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Available menu items retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateMenuItem(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMenuItemRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        MenuItemResponse response = menuService.updateMenuItem(authenticatedUserId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Menu item updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable UUID id) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        menuService.deleteMenuItem(authenticatedUserId, id);
        return ResponseEntity.noContent().build();
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
