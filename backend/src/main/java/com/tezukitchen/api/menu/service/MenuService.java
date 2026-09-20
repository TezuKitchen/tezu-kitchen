package com.tezukitchen.api.menu.service;

import com.tezukitchen.api.menu.dto.request.CreateMenuItemRequest;
import com.tezukitchen.api.menu.dto.request.UpdateMenuItemRequest;
import com.tezukitchen.api.menu.dto.response.MenuItemResponse;

import java.util.List;
import java.util.UUID;

public interface MenuService {
    MenuItemResponse createMenuItem(UUID authenticatedUserId, CreateMenuItemRequest request);
    MenuItemResponse getMenuItemById(UUID id);
    List<MenuItemResponse> getMenuItemsByRestaurant(UUID restaurantId);
    List<MenuItemResponse> getAvailableMenuItems(UUID restaurantId);
    MenuItemResponse updateMenuItem(UUID authenticatedUserId, UUID menuItemId, UpdateMenuItemRequest request);
    void deleteMenuItem(UUID authenticatedUserId, UUID menuItemId);
}
