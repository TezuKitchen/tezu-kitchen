package com.tezukitchen.api.menu.service;

import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.menu.dto.request.CreateMenuItemRequest;
import com.tezukitchen.api.menu.dto.request.UpdateMenuItemRequest;
import com.tezukitchen.api.menu.dto.response.MenuItemResponse;
import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.menu.repository.MenuItemRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MenuServiceImpl implements MenuService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;

    public MenuServiceImpl(MenuItemRepository menuItemRepository,
                           RestaurantRepository restaurantRepository) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    @Transactional
    public MenuItemResponse createMenuItem(UUID authenticatedUserId, CreateMenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));

        verifyRestaurantOwnership(authenticatedUserId, restaurant);

        MenuItem menuItem = MenuItem.builder()
                .restaurant(restaurant)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .isAvailable(true)
                .category(request.getCategory())
                .build();

        menuItem = menuItemRepository.save(menuItem);
        return mapToResponse(menuItem);
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItemById(UUID id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));
        return mapToResponse(menuItem);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMenuItemsByRestaurant(UUID restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAvailableMenuItems(UUID restaurantId) {
        return menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public MenuItemResponse updateMenuItem(UUID authenticatedUserId, UUID menuItemId, UpdateMenuItemRequest request) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));

        verifyRestaurantOwnership(authenticatedUserId, menuItem.getRestaurant());

        menuItem.setName(request.getName());
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice());
        if (request.getIsAvailable() != null) {
            menuItem.setAvailable(request.getIsAvailable());
        }
        menuItem.setCategory(request.getCategory());

        menuItem = menuItemRepository.save(menuItem);
        return mapToResponse(menuItem);
    }

    @Override
    @Transactional
    public void deleteMenuItem(UUID authenticatedUserId, UUID menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));

        verifyRestaurantOwnership(authenticatedUserId, menuItem.getRestaurant());
        menuItemRepository.delete(menuItem);
    }

    private void verifyRestaurantOwnership(UUID authenticatedUserId, Restaurant restaurant) {
        if (!restaurant.getOwner().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not the owner of this restaurant");
        }
    }

    private MenuItemResponse mapToResponse(MenuItem menuItem) {
        return MenuItemResponse.builder()
                .id(menuItem.getId())
                .restaurantId(menuItem.getRestaurant().getId())
                .name(menuItem.getName())
                .description(menuItem.getDescription())
                .price(menuItem.getPrice())
                .isAvailable(menuItem.isAvailable())
                .category(menuItem.getCategory())
                .build();
    }
}
