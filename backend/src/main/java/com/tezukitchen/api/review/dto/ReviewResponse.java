package com.tezukitchen.api.review.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private UUID restaurantId;
    private Integer rating;
    private String comment;
    private Instant createdAt;
}
