package com.tezukitchen.api.restaurant.service;

import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.restaurant.dto.request.CreateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.request.UpdateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantResponse;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceImplTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RestaurantServiceImpl restaurantService;

    private UUID ownerId;
    private UUID otherUserId;
    private UUID restaurantId;
    private User owner;
    private Restaurant restaurant;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        restaurantId = UUID.randomUUID();

        owner = User.builder()
                .id(ownerId)
                .name("Chef Bob")
                .email("bob@kitchen.com")
                .role(UserRole.OWNER)
                .build();

        restaurant = Restaurant.builder()
                .id(restaurantId)
                .owner(owner)
                .name("Campus Diner")
                .description("Good food")
                .location("Student Activity Center")
                .isOpen(true)
                .createdAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("createRestaurant")
    class CreateRestaurantTests {

        @Test
        @DisplayName("creates and returns RestaurantResponse when owner exists")
        void createRestaurant_Success() {
            CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                    .name("Campus Diner")
                    .description("Good food")
                    .location("Student Activity Center")
                    .build();

            when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
            when(restaurantRepository.save(any(Restaurant.class))).thenAnswer(invocation -> {
                Restaurant r = invocation.getArgument(0);
                r.setId(restaurantId);
                return r;
            });

            RestaurantResponse response = restaurantService.createRestaurant(ownerId, request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(restaurantId);
            assertThat(response.getName()).isEqualTo("Campus Diner");
            assertThat(response.getOwnerName()).isEqualTo("Chef Bob");
            assertThat(response.isOpen()).isTrue();
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when owner user does not exist")
        void createRestaurant_OwnerNotFound_ThrowsException() {
            CreateRestaurantRequest request = CreateRestaurantRequest.builder()
                    .name("Campus Diner")
                    .location("SAC")
                    .build();

            when(userRepository.findById(ownerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> restaurantService.createRestaurant(ownerId, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id");

            verify(restaurantRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getRestaurantById")
    class GetRestaurantByIdTests {

        @Test
        @DisplayName("returns RestaurantResponse when restaurant exists")
        void getRestaurantById_Success() {
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            RestaurantResponse response = restaurantService.getRestaurantById(restaurantId);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(restaurantId);
            assertThat(response.getName()).isEqualTo("Campus Diner");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when restaurant is not found")
        void getRestaurantById_NotFound_ThrowsException() {
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> restaurantService.getRestaurantById(restaurantId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Restaurant not found with id");
        }
    }

    @Nested
    @DisplayName("getAllRestaurants")
    class GetAllRestaurantsTests {

        @Test
        @DisplayName("returns paginated restaurants")
        void getAllRestaurants_Success() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Restaurant> page = new PageImpl<>(List.of(restaurant), pageable, 1);

            when(restaurantRepository.findAll(pageable)).thenReturn(page);

            Page<RestaurantResponse> result = restaurantService.getAllRestaurants(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Campus Diner");
        }
    }

    @Nested
    @DisplayName("getRestaurantsByOwner")
    class GetRestaurantsByOwnerTests {

        @Test
        @DisplayName("returns list of restaurants for a given owner ID")
        void getRestaurantsByOwner_Success() {
            when(restaurantRepository.findByOwnerId(ownerId)).thenReturn(List.of(restaurant));

            List<RestaurantResponse> list = restaurantService.getRestaurantsByOwner(ownerId);

            assertThat(list).hasSize(1);
            assertThat(list.get(0).getOwnerId()).isEqualTo(ownerId);
        }
    }

    @Nested
    @DisplayName("updateRestaurant")
    class UpdateRestaurantTests {

        @Test
        @DisplayName("owner can update restaurant details successfully")
        void updateRestaurant_Owner_Success() {
            UpdateRestaurantRequest request = UpdateRestaurantRequest.builder()
                    .name("Campus Diner Updated")
                    .description("Better food")
                    .location("New SAC")
                    .isOpen(false)
                    .build();

            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
            when(restaurantRepository.save(any(Restaurant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            RestaurantResponse response = restaurantService.updateRestaurant(ownerId, restaurantId, request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Campus Diner Updated");
            assertThat(response.isOpen()).isFalse();
            verify(restaurantRepository).save(restaurant);
        }

        @Test
        @DisplayName("throws ForbiddenException when non-owner tries to update restaurant")
        void updateRestaurant_NonOwner_ThrowsForbidden() {
            UpdateRestaurantRequest request = UpdateRestaurantRequest.builder()
                    .name("Hacked Name")
                    .location("SAC")
                    .build();

            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            assertThatThrownBy(() -> restaurantService.updateRestaurant(otherUserId, restaurantId, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("You are not the owner of this restaurant");

            verify(restaurantRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when restaurant does not exist")
        void updateRestaurant_NotFound_ThrowsException() {
            UpdateRestaurantRequest request = UpdateRestaurantRequest.builder()
                    .name("Name")
                    .location("SAC")
                    .build();

            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> restaurantService.updateRestaurant(ownerId, restaurantId, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteRestaurant")
    class DeleteRestaurantTests {

        @Test
        @DisplayName("owner can delete restaurant successfully")
        void deleteRestaurant_Owner_Success() {
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            restaurantService.deleteRestaurant(ownerId, restaurantId);

            verify(restaurantRepository).delete(restaurant);
        }

        @Test
        @DisplayName("throws ForbiddenException when non-owner tries to delete restaurant")
        void deleteRestaurant_NonOwner_ThrowsForbidden() {
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

            assertThatThrownBy(() -> restaurantService.deleteRestaurant(otherUserId, restaurantId))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("You are not the owner of this restaurant");

            verify(restaurantRepository, never()).delete(any());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when restaurant does not exist")
        void deleteRestaurant_NotFound_ThrowsException() {
            when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> restaurantService.deleteRestaurant(ownerId, restaurantId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
