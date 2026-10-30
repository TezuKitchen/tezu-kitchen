package com.tezukitchen.api.cart.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateCartItemRequest {

    @Min(value = 0, message = "Quantity must not be negative")
    private int quantity;
}
