package com.tezukitchen.api.order.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemRequest {

    @NotNull(message = "Menu item ID is required")
    private UUID menuItemId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
}
