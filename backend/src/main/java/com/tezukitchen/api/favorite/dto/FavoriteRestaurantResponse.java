package com.tezukitchen.api.favorite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteRestaurantResponse {
    private UUID id;
    private UUID restaurantId;
    private String restaurantName;
    private String restaurantDescription;
    private String restaurantLocation;
    private boolean restaurantIsOpen;
    private String restaurantLogoUrl;
    private String restaurantBannerUrl;
    private Instant createdAt;
}
