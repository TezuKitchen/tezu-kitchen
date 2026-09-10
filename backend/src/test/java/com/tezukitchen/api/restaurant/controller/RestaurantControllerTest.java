package com.tezukitchen.api.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.GlobalExceptionHandler;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.restaurant.dto.request.CreateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.request.UpdateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantResponse;
import com.tezukitchen.api.restaurant.service.RestaurantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RestaurantController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class RestaurantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RestaurantService restaurantService;

    @MockitoBean
    private JwtService jwtService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID restaurantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ownerId, null, List.of(new SimpleGrantedAuthority("ROLE_RESTAURANT_OWNER")))
        );
    }

    @Nested
    @DisplayName("POST /api/v1/restaurants")
    class CreateRestaurantTests {

        @Test
        @DisplayName("returns 201 when restaurant is created successfully")
        void createRestaurant_Success() throws Exception {
            CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                    .name("Campus Diner")
                    .description("Tasty food")
                    .location("SAC")
                    .build();

            RestaurantResponse response = RestaurantResponse.builder()
                    .id(restaurantId)
                    .ownerId(ownerId)
                    .ownerName("Chef Bob")
                    .name("Campus Diner")
                    .description("Tasty food")
                    .location("SAC")
                    .isOpen(true)
                    .createdAt(Instant.now())
                    .build();

            when(restaurantService.createRestaurant(eq(ownerId), any(CreateRestaurantRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/v1/restaurants")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Restaurant created successfully"))
                    .andExpect(jsonPath("$.data.id").value(restaurantId.toString()))
                    .andExpect(jsonPath("$.data.name").value("Campus Diner"));
        }

        @Test
        @DisplayName("returns 400 when name or location is blank")
        void createRestaurant_ValidationError_Returns400() throws Exception {
            CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                    .name("")
                    .location("")
                    .build();

            mockMvc.perform(post("/api/v1/restaurants")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.errors", hasSize(greaterThanOrEqualTo(2))));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/restaurants/{id}")
    class GetRestaurantByIdTests {

        @Test
        @DisplayName("returns 200 with restaurant details when found")
        void getRestaurantById_Success() throws Exception {
            RestaurantResponse response = RestaurantResponse.builder()
                    .id(restaurantId)
                    .ownerId(ownerId)
                    .name("Campus Diner")
                    .location("SAC")
                    .isOpen(true)
                    .build();

            when(restaurantService.getRestaurantById(restaurantId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/restaurants/{id}", restaurantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(restaurantId.toString()))
                    .andExpect(jsonPath("$.data.name").value("Campus Diner"));
        }

        @Test
        @DisplayName("returns 404 when restaurant is not found")
        void getRestaurantById_NotFound_Returns404() throws Exception {
            when(restaurantService.getRestaurantById(restaurantId))
                    .thenThrow(new ResourceNotFoundException("Restaurant", "id", restaurantId));

            mockMvc.perform(get("/api/v1/restaurants/{id}", restaurantId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/restaurants")
    class GetAllRestaurantsTests {

        @Test
        @DisplayName("returns 200 with paginated restaurants")
        void getAllRestaurants_Success() throws Exception {
            RestaurantResponse response = RestaurantResponse.builder()
                    .id(restaurantId)
                    .name("Campus Diner")
                    .location("SAC")
                    .build();

            Page<RestaurantResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 10), 1);
            when(restaurantService.getAllRestaurants(any(Pageable.class))).thenReturn(page);

            mockMvc.perform(get("/api/v1/restaurants"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(1)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/restaurants/owner/{ownerId}")
    class GetRestaurantsByOwnerTests {

        @Test
        @DisplayName("returns 200 with list of restaurants owned by user")
        void getRestaurantsByOwner_Success() throws Exception {
            RestaurantResponse response = RestaurantResponse.builder()
                    .id(restaurantId)
                    .ownerId(ownerId)
                    .name("Campus Diner")
                    .build();

            when(restaurantService.getRestaurantsByOwner(ownerId)).thenReturn(List.of(response));

            mockMvc.perform(get("/api/v1/restaurants/owner/{ownerId}", ownerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].id").value(restaurantId.toString()));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/restaurants/{id}")
    class UpdateRestaurantTests {

        @Test
        @DisplayName("returns 200 when restaurant is successfully updated by owner")
        void updateRestaurant_Success() throws Exception {
            UpdateRestaurantRequest request = UpdateRestaurantRequest.builder()
                    .name("Campus Diner Renamed")
                    .location("SAC 2")
                    .isOpen(false)
                    .build();

            RestaurantResponse response = RestaurantResponse.builder()
                    .id(restaurantId)
                    .ownerId(ownerId)
                    .name("Campus Diner Renamed")
                    .location("SAC 2")
                    .isOpen(false)
                    .build();

            when(restaurantService.updateRestaurant(eq(ownerId), eq(restaurantId), any(UpdateRestaurantRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/v1/restaurants/{id}", restaurantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Campus Diner Renamed"))
                    .andExpect(jsonPath("$.data.open").value(false));
        }

        @Test
        @DisplayName("returns 403 when user is not the owner")
        void updateRestaurant_Forbidden_Returns403() throws Exception {
            UpdateRestaurantRequest request = UpdateRestaurantRequest.builder()
                    .name("Campus Diner Renamed")
                    .location("SAC")
                    .build();

            when(restaurantService.updateRestaurant(eq(ownerId), eq(restaurantId), any(UpdateRestaurantRequest.class)))
                    .thenThrow(new ForbiddenException("You are not the owner of this restaurant"));

            mockMvc.perform(put("/api/v1/restaurants/{id}", restaurantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("returns 404 when restaurant is not found")
        void updateRestaurant_NotFound_Returns404() throws Exception {
            UpdateRestaurantRequest request = UpdateRestaurantRequest.builder()
                    .name("Campus Diner Renamed")
                    .location("SAC")
                    .build();

            when(restaurantService.updateRestaurant(eq(ownerId), eq(restaurantId), any(UpdateRestaurantRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Restaurant", "id", restaurantId));

            mockMvc.perform(put("/api/v1/restaurants/{id}", restaurantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/restaurants/{id}")
    class DeleteRestaurantTests {

        @Test
        @DisplayName("returns 204 when restaurant is deleted by owner")
        void deleteRestaurant_Success() throws Exception {
            doNothing().when(restaurantService).deleteRestaurant(ownerId, restaurantId);

            mockMvc.perform(delete("/api/v1/restaurants/{id}", restaurantId))
                    .andExpect(status().isNoContent());

            verify(restaurantService).deleteRestaurant(ownerId, restaurantId);
        }

        @Test
        @DisplayName("returns 403 when user is not the owner")
        void deleteRestaurant_Forbidden_Returns403() throws Exception {
            doThrow(new ForbiddenException("You are not the owner of this restaurant"))
                    .when(restaurantService).deleteRestaurant(ownerId, restaurantId);

            mockMvc.perform(delete("/api/v1/restaurants/{id}", restaurantId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("returns 404 when restaurant is not found")
        void deleteRestaurant_NotFound_Returns404() throws Exception {
            doThrow(new ResourceNotFoundException("Restaurant", "id", restaurantId))
                    .when(restaurantService).deleteRestaurant(ownerId, restaurantId);

            mockMvc.perform(delete("/api/v1/restaurants/{id}", restaurantId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }
}
