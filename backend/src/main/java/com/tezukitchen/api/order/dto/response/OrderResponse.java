package com.tezukitchen.api.order.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderResponse {
    private UUID id;
    private UUID userId;
    private UUID restaurantId;
    private String restaurantName;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private String status;
    private Instant placedAt;
    private Instant updatedAt;
    private List<OrderItemResponse> items;
}
