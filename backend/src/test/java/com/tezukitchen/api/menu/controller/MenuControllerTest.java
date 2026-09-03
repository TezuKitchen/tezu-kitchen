package com.tezukitchen.api.menu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.GlobalExceptionHandler;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.menu.dto.request.CreateMenuItemRequest;
import com.tezukitchen.api.menu.dto.request.UpdateMenuItemRequest;
import com.tezukitchen.api.menu.dto.response.MenuItemResponse;
import com.tezukitchen.api.menu.service.MenuService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller-level tests for MenuController.
 * <p>
 * Uses @WebMvcTest with addFilters=false to disable the full security filter chain
 * (which requires JWT_SECRET, JwtAuthenticationFilter, etc.). Authentication is
 * injected directly into SecurityContextHolder before each authenticated test,
 * matching what the real JwtAuthenticationFilter does in production.
 */
@WebMvcTest(MenuController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class MenuControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MenuService menuService;

    @MockitoBean
    private JwtService jwtService;

    private final UUID userId = UUID.randomUUID();
    private final UUID restaurantId = UUID.randomUUID();
    private final UUID menuItemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Clear security context before each test to prevent leakage
        SecurityContextHolder.clearContext();
    }

    /**
     * Sets up the SecurityContextHolder with a UUID principal, matching
     * what JwtAuthenticationFilter does in production.
     */
    private void authenticateAs(UUID uid) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        uid, null,
                        List.of(new SimpleGrantedAuthority("ROLE_RESTAURANT_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private MenuItemResponse sampleResponse() {
        return MenuItemResponse.builder()
                .id(menuItemId)
                .restaurantId(restaurantId)
                .name("Butter Chicken")
                .description("Creamy curry dish")
                .price(new BigDecimal("250.00"))
                .isAvailable(true)
                .category("Main Course")
                .build();
    }

    // ─── POST /api/v1/menu ───────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/menu")
    class CreateMenuItemTests {

        @Test
        @DisplayName("should return 201 when menu item is created successfully")
        void shouldReturn201_WhenCreated() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Butter Chicken")
                    .description("Creamy curry dish")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            when(menuService.createMenuItem(eq(userId), any(CreateMenuItemRequest.class)))
                    .thenReturn(sampleResponse());

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Menu item created successfully"))
                    .andExpect(jsonPath("$.data.name").value("Butter Chicken"))
                    .andExpect(jsonPath("$.data.price").value(250.00))
                    .andExpect(jsonPath("$.data.category").value("Main Course"));
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void shouldReturn400_WhenNameIsBlank() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(menuService, never()).createMenuItem(any(), any());
        }

        @Test
        @DisplayName("should return 400 when price is null")
        void shouldReturn400_WhenPriceIsNull() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Some Item")
                    .price(null)
                    .category("Main Course")
                    .build();

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(menuService, never()).createMenuItem(any(), any());
        }

        @Test
        @DisplayName("should return 400 when price is negative")
        void shouldReturn400_WhenPriceIsNegative() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Some Item")
                    .price(new BigDecimal("-10.00"))
                    .category("Main Course")
                    .build();

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(menuService, never()).createMenuItem(any(), any());
        }

        @Test
        @DisplayName("should return 400 when category is blank")
        void shouldReturn400_WhenCategoryIsBlank() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Some Item")
                    .price(new BigDecimal("100.00"))
                    .category("")
                    .build();

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(menuService, never()).createMenuItem(any(), any());
        }

        @Test
        @DisplayName("should return 400 when restaurantId is null")
        void shouldReturn400_WhenRestaurantIdIsNull() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(null)
                    .name("Some Item")
                    .price(new BigDecimal("100.00"))
                    .category("Main Course")
                    .build();

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(menuService, never()).createMenuItem(any(), any());
        }

        @Test
        @DisplayName("should return 403 when service throws ForbiddenException")
        void shouldReturn403_WhenNotOwner() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Butter Chicken")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            when(menuService.createMenuItem(eq(userId), any(CreateMenuItemRequest.class)))
                    .thenThrow(new ForbiddenException("You are not the owner of this restaurant"));

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when restaurant does not exist")
        void shouldReturn404_WhenRestaurantNotFound() throws Exception {
            authenticateAs(userId);

            CreateMenuItemRequest request = CreateMenuItemRequest.builder()
                    .restaurantId(restaurantId)
                    .name("Butter Chicken")
                    .price(new BigDecimal("250.00"))
                    .category("Main Course")
                    .build();

            when(menuService.createMenuItem(eq(userId), any(CreateMenuItemRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Restaurant", "id", restaurantId));

            mockMvc.perform(post("/api/v1/menu")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /api/v1/menu/{id} ───────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/menu/{id}")
    class GetMenuItemByIdTests {

        @Test
        @DisplayName("should return 200 with menu item")
        void shouldReturn200_WithMenuItem() throws Exception {
            when(menuService.getMenuItemById(menuItemId)).thenReturn(sampleResponse());

            mockMvc.perform(get("/api/v1/menu/{id}", menuItemId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Menu item retrieved successfully"))
                    .andExpect(jsonPath("$.data.id").value(menuItemId.toString()))
                    .andExpect(jsonPath("$.data.name").value("Butter Chicken"))
                    .andExpect(jsonPath("$.data.description").value("Creamy curry dish"))
                    .andExpect(jsonPath("$.data.price").value(250.00))
                    .andExpect(jsonPath("$.data.category").value("Main Course"));
        }

        @Test
        @DisplayName("should return 404 when menu item does not exist")
        void shouldReturn404_WhenNotFound() throws Exception {
            UUID nonExistentId = UUID.randomUUID();
            when(menuService.getMenuItemById(nonExistentId))
                    .thenThrow(new ResourceNotFoundException("MenuItem", "id", nonExistentId));

            mockMvc.perform(get("/api/v1/menu/{id}", nonExistentId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", containsString("MenuItem")));
        }
    }

    // ─── GET /api/v1/menu/restaurant/{restaurantId} ──────────────────

    @Nested
    @DisplayName("GET /api/v1/menu/restaurant/{restaurantId}")
    class GetMenuItemsByRestaurantTests {

        @Test
        @DisplayName("should return 200 with list of menu items")
        void shouldReturn200_WithMenuItems() throws Exception {
            MenuItemResponse item2 = MenuItemResponse.builder()
                    .id(UUID.randomUUID())
                    .restaurantId(restaurantId)
                    .name("Dal Makhani")
                    .description("Creamy black lentils")
                    .price(new BigDecimal("180.00"))
                    .isAvailable(true)
                    .category("Main Course")
                    .build();

            when(menuService.getMenuItemsByRestaurant(restaurantId))
                    .thenReturn(List.of(sampleResponse(), item2));

            mockMvc.perform(get("/api/v1/menu/restaurant/{restaurantId}", restaurantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].name").value("Butter Chicken"))
                    .andExpect(jsonPath("$.data[1].name").value("Dal Makhani"));
        }

        @Test
        @DisplayName("should return 200 with empty list when restaurant has no menu items")
        void shouldReturn200_WithEmptyList() throws Exception {
            when(menuService.getMenuItemsByRestaurant(restaurantId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/menu/restaurant/{restaurantId}", restaurantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── GET /api/v1/menu/restaurant/{restaurantId}/available ────────

    @Nested
    @DisplayName("GET /api/v1/menu/restaurant/{restaurantId}/available")
    class GetAvailableMenuItemsTests {

        @Test
        @DisplayName("should return 200 with only available items")
        void shouldReturn200_WithAvailableItems() throws Exception {
            when(menuService.getAvailableMenuItems(restaurantId))
                    .thenReturn(List.of(sampleResponse()));

            mockMvc.perform(get("/api/v1/menu/restaurant/{restaurantId}/available", restaurantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].available").value(true));
        }

        @Test
        @DisplayName("should return 200 with empty list when no items are available")
        void shouldReturn200_WhenNoneAvailable() throws Exception {
            when(menuService.getAvailableMenuItems(restaurantId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/menu/restaurant/{restaurantId}/available", restaurantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── PUT /api/v1/menu/{id} ───────────────────────────────────────

    @Nested
    @DisplayName("PUT /api/v1/menu/{id}")
    class UpdateMenuItemTests {

        @Test
        @DisplayName("should return 200 when menu item is updated successfully")
        void shouldReturn200_WhenUpdated() throws Exception {
            authenticateAs(userId);

            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Updated Chicken")
                    .description("Updated description")
                    .price(new BigDecimal("300.00"))
                    .isAvailable(false)
                    .category("Specials")
                    .build();

            MenuItemResponse updatedResponse = MenuItemResponse.builder()
                    .id(menuItemId)
                    .restaurantId(restaurantId)
                    .name("Updated Chicken")
                    .description("Updated description")
                    .price(new BigDecimal("300.00"))
                    .isAvailable(false)
                    .category("Specials")
                    .build();

            when(menuService.updateMenuItem(eq(userId), eq(menuItemId), any(UpdateMenuItemRequest.class)))
                    .thenReturn(updatedResponse);

            mockMvc.perform(put("/api/v1/menu/{id}", menuItemId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Menu item updated successfully"))
                    .andExpect(jsonPath("$.data.name").value("Updated Chicken"))
                    .andExpect(jsonPath("$.data.price").value(300.00))
                    .andExpect(jsonPath("$.data.available").value(false))
                    .andExpect(jsonPath("$.data.category").value("Specials"));
        }

        @Test
        @DisplayName("should return 400 when update has invalid data")
        void shouldReturn400_WhenInvalidData() throws Exception {
            authenticateAs(userId);

            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("")
                    .price(new BigDecimal("-5.00"))
                    .category("")
                    .build();

            mockMvc.perform(put("/api/v1/menu/{id}", menuItemId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(menuService, never()).updateMenuItem(any(), any(), any());
        }

        @Test
        @DisplayName("should return 403 when non-owner tries to update")
        void shouldReturn403_WhenNotOwner() throws Exception {
            authenticateAs(userId);

            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Hacked Name")
                    .price(new BigDecimal("1.00"))
                    .category("Hacked")
                    .build();

            when(menuService.updateMenuItem(eq(userId), eq(menuItemId), any(UpdateMenuItemRequest.class)))
                    .thenThrow(new ForbiddenException("You are not the owner of this restaurant"));

            mockMvc.perform(put("/api/v1/menu/{id}", menuItemId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when menu item does not exist")
        void shouldReturn404_WhenMenuItemNotFound() throws Exception {
            authenticateAs(userId);

            UUID nonExistentId = UUID.randomUUID();
            UpdateMenuItemRequest request = UpdateMenuItemRequest.builder()
                    .name("Whatever")
                    .price(new BigDecimal("100.00"))
                    .category("Whatever")
                    .build();

            when(menuService.updateMenuItem(eq(userId), eq(nonExistentId), any(UpdateMenuItemRequest.class)))
                    .thenThrow(new ResourceNotFoundException("MenuItem", "id", nonExistentId));

            mockMvc.perform(put("/api/v1/menu/{id}", nonExistentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── DELETE /api/v1/menu/{id} ────────────────────────────────────

    @Nested
    @DisplayName("DELETE /api/v1/menu/{id}")
    class DeleteMenuItemTests {

        @Test
        @DisplayName("should return 204 when menu item is deleted")
        void shouldReturn204_WhenDeleted() throws Exception {
            authenticateAs(userId);

            doNothing().when(menuService).deleteMenuItem(eq(userId), eq(menuItemId));

            mockMvc.perform(delete("/api/v1/menu/{id}", menuItemId))
                    .andExpect(status().isNoContent());

            verify(menuService).deleteMenuItem(eq(userId), eq(menuItemId));
        }

        @Test
        @DisplayName("should return 403 when non-owner tries to delete")
        void shouldReturn403_WhenNotOwner() throws Exception {
            authenticateAs(userId);

            doThrow(new ForbiddenException("You are not the owner of this restaurant"))
                    .when(menuService).deleteMenuItem(eq(userId), eq(menuItemId));

            mockMvc.perform(delete("/api/v1/menu/{id}", menuItemId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when menu item does not exist")
        void shouldReturn404_WhenNotFound() throws Exception {
            authenticateAs(userId);

            UUID nonExistentId = UUID.randomUUID();
            doThrow(new ResourceNotFoundException("MenuItem", "id", nonExistentId))
                    .when(menuService).deleteMenuItem(eq(userId), eq(nonExistentId));

            mockMvc.perform(delete("/api/v1/menu/{id}", nonExistentId))
                    .andExpect(status().isNotFound());
        }
    }
}
