package com.tezukitchen.api.restaurant.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RestaurantResponse {
    private UUID id;
    private UUID ownerId;
    private String ownerName;
    private String name;
    private String description;
    private String location;
    private boolean isOpen;
    private Instant createdAt;
    private String logoUrl;
    private String bannerUrl;
    private List<RestaurantImageResponse> images;
}
