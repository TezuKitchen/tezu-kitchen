package com.tezukitchen.api.order.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateOrderStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;
}
