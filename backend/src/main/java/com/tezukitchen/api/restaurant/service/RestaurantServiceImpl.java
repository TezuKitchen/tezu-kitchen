package com.tezukitchen.api.restaurant.service;

import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.restaurant.dto.request.AddRestaurantImageRequest;
import com.tezukitchen.api.restaurant.dto.request.CreateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.request.UpdateRestaurantRequest;
import com.tezukitchen.api.restaurant.dto.response.RestaurantImageResponse;
import com.tezukitchen.api.restaurant.dto.response.RestaurantResponse;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.restaurant.entity.RestaurantImage;
import com.tezukitchen.api.restaurant.repository.RestaurantImageRepository;
import com.tezukitchen.api.restaurant.repository.RestaurantRepository;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.user.entity.User;
import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final RestaurantImageRepository restaurantImageRepository;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository,
                                  UserRepository userRepository,
                                  RestaurantImageRepository restaurantImageRepository) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
        this.restaurantImageRepository = restaurantImageRepository;
    }

    @Override
    @Transactional
    public RestaurantResponse createRestaurant(UUID ownerId, CreateRestaurantRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

        if (owner.getRole() != UserRole.OWNER && owner.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only restaurant owners or admins can create a restaurant");
        }

        Restaurant restaurant = Restaurant.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .isOpen(true)
                .build();

        restaurant = restaurantRepository.save(restaurant);
        return mapToResponse(restaurant);
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantResponse getRestaurantById(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
        return mapToResponse(restaurant);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RestaurantResponse> getAllRestaurants(Pageable pageable) {
        return restaurantRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantResponse> getRestaurantsByOwner(UUID ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public RestaurantResponse updateRestaurant(UUID authenticatedUserId, UUID restaurantId, UpdateRestaurantRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        verifyOwnership(authenticatedUserId, restaurant);

        restaurant.setName(request.getName());
        restaurant.setDescription(request.getDescription());
        restaurant.setLocation(request.getLocation());
        if (request.getIsOpen() != null) {
            restaurant.setOpen(request.getIsOpen());
        }

        restaurant = restaurantRepository.save(restaurant);
        return mapToResponse(restaurant);
    }

    @Override
    @Transactional
    public void deleteRestaurant(UUID authenticatedUserId, UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        verifyOwnership(authenticatedUserId, restaurant);
        restaurantRepository.delete(restaurant);
    }

    @Override
    @Transactional
    public RestaurantImageResponse addImage(UUID authenticatedUserId, UUID restaurantId, AddRestaurantImageRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        verifyOwnership(authenticatedUserId, restaurant);

        if (restaurantImageRepository.countByRestaurantId(restaurantId) >= 7) {
            throw new BadRequestException("Maximum 7 images allowed per restaurant");
        }

        RestaurantImage image = RestaurantImage.builder()
                .restaurant(restaurant)
                .imageUrl(request.getImageUrl())
                .cloudinaryPublicId(request.getCloudinaryPublicId())
                .imageType(request.getImageType())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        image = restaurantImageRepository.save(image);

        return RestaurantImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .cloudinaryPublicId(image.getCloudinaryPublicId())
                .imageType(image.getImageType())
                .displayOrder(image.getDisplayOrder())
                .build();
    }

    @Override
    @Transactional
    public void removeImage(UUID authenticatedUserId, UUID restaurantId, UUID imageId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));

        verifyOwnership(authenticatedUserId, restaurant);

        RestaurantImage image = restaurantImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("RestaurantImage", "id", imageId));

        if (!image.getRestaurant().getId().equals(restaurantId)) {
            throw new BadRequestException("Image does not belong to this restaurant");
        }

        restaurantImageRepository.delete(image);
    }

    private void verifyOwnership(UUID authenticatedUserId, Restaurant restaurant) {
        if (!restaurant.getOwner().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not the owner of this restaurant");
        }
    }

    private RestaurantResponse mapToResponse(Restaurant restaurant) {
        String logoUrl = null;
        String bannerUrl = null;
        if (restaurant.getImages() != null) {
            logoUrl = restaurant.getImages().stream()
                    .filter(img -> "LOGO".equals(img.getImageType()))
                    .map(RestaurantImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
            bannerUrl = restaurant.getImages().stream()
                    .filter(img -> "BANNER".equals(img.getImageType()))
                    .map(RestaurantImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
        }

        List<RestaurantImageResponse> imageResponses = restaurant.getImages() != null ?
                restaurant.getImages().stream()
                        .map(img -> RestaurantImageResponse.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .cloudinaryPublicId(img.getCloudinaryPublicId())
                                .imageType(img.getImageType())
                                .displayOrder(img.getDisplayOrder())
                                .build())
                        .toList() : List.of();

        return RestaurantResponse.builder()
                .id(restaurant.getId())
                .ownerId(restaurant.getOwner().getId())
                .ownerName(restaurant.getOwner().getName())
                .name(restaurant.getName())
                .description(restaurant.getDescription())
                .location(restaurant.getLocation())
                .isOpen(restaurant.isOpen())
                .createdAt(restaurant.getCreatedAt())
                .logoUrl(logoUrl)
                .bannerUrl(bannerUrl)
                .images(imageResponses)
                .build();
    }
}
