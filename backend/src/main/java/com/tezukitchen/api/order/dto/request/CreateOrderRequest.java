package com.tezukitchen.api.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateOrderRequest {

    @NotNull(message = "Restaurant ID is required")
    private UUID restaurantId;

    @NotBlank(message = "Delivery address is required")
    @Size(max = 500, message = "Delivery address must not exceed 500 characters")
    private String deliveryAddress;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;
}
