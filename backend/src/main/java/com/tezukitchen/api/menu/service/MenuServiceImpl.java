package com.tezukitchen.api.menu.service;

import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.menu.dto.request.AddMenuItemImageRequest;
import com.tezukitchen.api.menu.dto.request.CreateMenuItemRequest;
import com.tezukitchen.api.menu.dto.request.UpdateMenuItemRequest;
import com.tezukitchen.api.menu.dto.response.MenuItemImageResponse;
import com.tezukitchen.api.menu.dto.response.MenuItemResponse;
import com.tezukitchen.api.menu.entity.MenuItem;
import com.tezukitchen.api.menu.entity.MenuItemImage;
import com.tezukitchen.api.menu.repository.MenuItemImageRepository;
import com.tezukitchen.api.menu.repository.MenuItemRepository;
import com.tezukitchen.api.common.exception.BadRequestException;
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
    private final MenuItemImageRepository menuItemImageRepository;

    public MenuServiceImpl(MenuItemRepository menuItemRepository,
                           RestaurantRepository restaurantRepository,
                           MenuItemImageRepository menuItemImageRepository) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemImageRepository = menuItemImageRepository;
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

    @Override
    @Transactional
    public MenuItemImageResponse addImage(UUID authenticatedUserId, UUID menuItemId, AddMenuItemImageRequest request) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));

        verifyRestaurantOwnership(authenticatedUserId, menuItem.getRestaurant());

        if (menuItemImageRepository.countByMenuItemId(menuItemId) >= 4) {
            throw new BadRequestException("Maximum 4 images allowed per menu item");
        }

        MenuItemImage image = MenuItemImage.builder()
                .menuItem(menuItem)
                .imageUrl(request.getImageUrl())
                .cloudinaryPublicId(request.getCloudinaryPublicId())
                .isPrimary(request.isPrimary())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        image = menuItemImageRepository.save(image);

        return MenuItemImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .cloudinaryPublicId(image.getCloudinaryPublicId())
                .isPrimary(image.isPrimary())
                .displayOrder(image.getDisplayOrder())
                .build();
    }

    @Override
    @Transactional
    public void removeImage(UUID authenticatedUserId, UUID menuItemId, UUID imageId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));

        verifyRestaurantOwnership(authenticatedUserId, menuItem.getRestaurant());

        MenuItemImage image = menuItemImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItemImage", "id", imageId));

        if (!image.getMenuItem().getId().equals(menuItemId)) {
            throw new BadRequestException("Image does not belong to this menu item");
        }

        menuItemImageRepository.delete(image);
    }

    private void verifyRestaurantOwnership(UUID authenticatedUserId, Restaurant restaurant) {
        if (!restaurant.getOwner().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not the owner of this restaurant");
        }
    }

    private MenuItemResponse mapToResponse(MenuItem menuItem) {
        String primaryImageUrl = null;
        if (menuItem.getImages() != null && !menuItem.getImages().isEmpty()) {
            primaryImageUrl = menuItem.getImages().stream()
                    .filter(MenuItemImage::isPrimary)
                    .map(MenuItemImage::getImageUrl)
                    .findFirst()
                    .orElse(menuItem.getImages().get(0).getImageUrl());
        }

        List<MenuItemImageResponse> imageResponses = menuItem.getImages() != null ?
                menuItem.getImages().stream()
                        .map(img -> MenuItemImageResponse.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .cloudinaryPublicId(img.getCloudinaryPublicId())
                                .isPrimary(img.isPrimary())
                                .displayOrder(img.getDisplayOrder())
                                .build())
                        .toList() : List.of();

        return MenuItemResponse.builder()
                .id(menuItem.getId())
                .restaurantId(menuItem.getRestaurant().getId())
                .name(menuItem.getName())
                .description(menuItem.getDescription())
                .price(menuItem.getPrice())
                .isAvailable(menuItem.isAvailable())
                .category(menuItem.getCategory())
                .primaryImageUrl(primaryImageUrl)
                .images(imageResponses)
                .build();
    }
}
