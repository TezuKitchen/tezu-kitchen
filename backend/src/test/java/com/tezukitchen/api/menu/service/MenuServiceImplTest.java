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
import com.tezukitchen.api.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuServiceImplTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @InjectMocks
    private MenuServiceImpl menuService;

    private UUID ownerId;
    private UUID otherUserId;
    private UUID restaurantId;
    private UUID menuItemId;
    private User owner;
    private Restaurant restaurant;
    private MenuItem menuItem;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        restaurantId = UUID.randomUUID();
        menuItemId = UUID.randomUUID();

        owner = User.builder().id(ownerId).name("Owner").email("owner@test.com").build();

        restaurant = Restaurant.builder()
                .id(restaurantId)
                .owner(owner)
                .name("Test Restaurant")
                .description("A test restaurant")
                .location("Test Location")
                .build();

        menuItem = MenuItem.builder()
                .id(menuItemId)
                .restaurant(restaurant)
                .name("Butter Chicken")
                .description("Creamy curry dish")
                .price(new BigDecimal("250.00"))
                .isAvailable(true)
                .category("Main Course")
                .build();
    }

    // ─── createMenuItem ──────────────────────────────────────────────

    @Nested
    @DisplayName("createMenuItem")
    class CreateMenuItem {

        @Test
        @DisplayName("should create menu item when user is restaurant owner")
        void shouldCreateMenuItem_WhenUserIsOwner() {
            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Butter Chicken")
                    .description("Creamy curry dish")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(menuItemRepository.save(any(MenuItem.class))).thenReturn(menuItem);

            MenuItemResponse response = menuService.createMenuItem(ownerId, request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Butter Chicken");
            assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("250.00"));
            assertThat(response.getCategory()).isEqualTo("Main Course");
            assertThat(response.getRestaurantId()).isEqualTo(restaurantId);
            assertThat(response.isAvailable()).isTrue();

            verify(restaurantRepository).findById(restaurantId);
            verify(menuItemRepository).save(any(MenuItem.class));
        }

        @Test
        @DisplayName("should throw ForbiddenException when user is not restaurant owner")
        void shouldThrowForbidden_WhenUserIsNotOwner() {
            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Butter Chicken")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            assertThatThrownBy(() -> menuService.createMenuItem(otherUserId, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("You are not the owner of this restaurant");

            verify(menuItemRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when restaurant does not exist")
        void shouldThrowNotFound_WhenRestaurantDoesNotExist() {
            UUID nonExistentId = UUID.randomUUID();
            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(nonExistentId)
                    .name("Butter Chicken")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            when(restaurantRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> menuService.createMenuItem(ownerId, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Restaurant");

            verify(menuItemRepository, never()).save(any());
        }
    }

    // ─── getMenuItemById ─────────────────────────────────────────────

    @Nested
    @DisplayName("getMenuItemById")
    class GetMenuItemById {

        @Test
        @DisplayName("should return menu item when it exists")
        void shouldReturnMenuItem_WhenExists() {
            when(menuItemRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));

            MenuItemResponse response = menuService.getMenuItemById(menuItemId);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(menuItemId);
            assertThat(response.getName()).isEqualTo("Butter Chicken");
            assertThat(response.getDescription()).isEqualTo("Creamy curry dish");
            assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("250.00"));
            assertThat(response.isAvailable()).isTrue();
            assertThat(response.getCategory()).isEqualTo("Main Course");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when menu item does not exist")
        void shouldThrowNotFound_WhenDoesNotExist() {
            UUID nonExistentId = UUID.randomUUID();
            when(menuItemRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> menuService.getMenuItemById(nonExistentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("MenuItem");
        }
    }

    // ─── getMenuItemsByRestaurant ────────────────────────────────────

    @Nested
    @DisplayName("getMenuItemsByRestaurant")
    class GetMenuItemsByRestaurant {

        @Test
        @DisplayName("should return all menu items for a restaurant")
        void shouldReturnAllMenuItems() {
            MenuItem item2 = MenuItem.builder()
                    .id(UUID.randomUUID())
                    .restaurant(restaurant)
                    .name("Dal Makhani")
                    .description("Creamy black lentils")
                    .price(new BigDecimal("180.00"))
                    .isAvailable(true)
                    .category("Main Course")
                    .build();

            when(menuItemRepository.findByRestaurantId(restaurantId))
                    .thenReturn(List.of(menuItem, item2));

            List<MenuItemResponse> responses = menuService.getMenuItemsByRestaurant(restaurantId);

            assertThat(responses).hasSize(2);
            assertThat(responses).extracting(MenuItemResponse::getName)
                    .containsExactly("Butter Chicken", "Dal Makhani");
        }

        @Test
        @DisplayName("should return empty list when restaurant has no menu items")
        void shouldReturnEmptyList_WhenNoItems() {
            when(menuItemRepository.findByRestaurantId(restaurantId))
                    .thenReturn(List.of());

            List<MenuItemResponse> responses = menuService.getMenuItemsByRestaurant(restaurantId);

            assertThat(responses).isEmpty();
        }
    }

    // ─── getAvailableMenuItems ───────────────────────────────────────

    @Nested
    @DisplayName("getAvailableMenuItems")
    class GetAvailableMenuItems {

        @Test
        @DisplayName("should return only available menu items")
        void shouldReturnOnlyAvailableItems() {
            when(menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId))
                    .thenReturn(List.of(menuItem));

            List<MenuItemResponse> responses = menuService.getAvailableMenuItems(restaurantId);

            assertThat(responses).hasSize(1);
            assertThat(responses.getFirst().isAvailable()).isTrue();
        }

        @Test
        @DisplayName("should return empty list when no items are available")
        void shouldReturnEmptyList_WhenNoneAvailable() {
            when(menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId))
                    .thenReturn(List.of());

            List<MenuItemResponse> responses = menuService.getAvailableMenuItems(restaurantId);

            assertThat(responses).isEmpty();
        }
    }

    // ─── updateMenuItem ──────────────────────────────────────────────

    @Nested
    @DisplayName("updateMenuItem")
    class UpdateMenuItem {

        @Test
        @DisplayName("should update menu item when user is restaurant owner")
        void shouldUpdateMenuItem_WhenUserIsOwner() {
            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Updated Chicken")
                    .description("Updated description")
                    .price(new BigDecimal("300.00"))
                    .isAvailable(false)
                    .category("Specials")
                    .build();

            MenuItem updatedItem = MenuItem.builder()
                    .id(menuItemId)
                    .restaurant(restaurant)
                    .name("Updated Chicken")
                    .description("Updated description")
                    .price(new BigDecimal("300.00"))
                    .isAvailable(false)
                    .category("Specials")
                    .build();

            when(menuItemRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));
            when(menuItemRepository.save(any(MenuItem.class))).thenReturn(updatedItem);

            MenuItemResponse response = menuService.updateMenuItem(ownerId, menuItemId, request);

            assertThat(response.getName()).isEqualTo("Updated Chicken");
            assertThat(response.getDescription()).isEqualTo("Updated description");
            assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("300.00"));
            assertThat(response.isAvailable()).isFalse();
            assertThat(response.getCategory()).isEqualTo("Specials");
        }

        @Test
        @DisplayName("should keep availability unchanged when isAvailable is null in request")
        void shouldKeepAvailability_WhenIsAvailableIsNull() {
            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Updated Chicken")
                    .description("Updated description")
                    .price(new BigDecimal("300.00"))
                    .isAvailable(null)
                    .category("Main Course")
                    .build();

            when(menuItemRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));
            when(menuItemRepository.save(any(MenuItem.class))).thenReturn(menuItem);

            MenuItemResponse response = menuService.updateMenuItem(ownerId, menuItemId, request);

            // Original menuItem has isAvailable=true; since request.isAvailable is null,
            // it should not be changed
            assertThat(response.isAvailable()).isTrue();
        }

        @Test
        @DisplayName("should throw ForbiddenException when non-owner tries to update")
        void shouldThrowForbidden_WhenNonOwnerUpdates() {
            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Hacked Name")
                    .price(new BigDecimal("1.00"))
                    .category("Hacked")
                    .build();

            when(menuItemRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));

            assertThatThrownBy(() -> menuService.updateMenuItem(otherUserId, menuItemId, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("You are not the owner of this restaurant");

            verify(menuItemRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when menu item does not exist")
        void shouldThrowNotFound_WhenMenuItemDoesNotExist() {
            UUID nonExistentId = UUID.randomUUID();
            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Whatever")
                    .price(new BigDecimal("100.00"))
                    .category("Whatever")
                    .build();

            when(menuItemRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> menuService.updateMenuItem(ownerId, nonExistentId, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("MenuItem");
        }
    }

    // ─── deleteMenuItem ──────────────────────────────────────────────

    @Nested
    @DisplayName("deleteMenuItem")
    class DeleteMenuItem {

        @Test
        @DisplayName("should delete menu item when user is restaurant owner")
        void shouldDeleteMenuItem_WhenUserIsOwner() {
            when(menuItemRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));

            menuService.deleteMenuItem(ownerId, menuItemId);

            verify(menuItemRepository).delete(menuItem);
        }

        @Test
        @DisplayName("should throw ForbiddenException when non-owner tries to delete")
        void shouldThrowForbidden_WhenNonOwnerDeletes() {
            when(menuItemRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));

            assertThatThrownBy(() -> menuService.deleteMenuItem(otherUserId, menuItemId))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("You are not the owner of this restaurant");

            verify(menuItemRepository, never()).delete(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when menu item does not exist")
        void shouldThrowNotFound_WhenMenuItemDoesNotExist() {
            UUID nonExistentId = UUID.randomUUID();
            when(menuItemRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> menuService.deleteMenuItem(ownerId, nonExistentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("MenuItem");
        }
    }
}
