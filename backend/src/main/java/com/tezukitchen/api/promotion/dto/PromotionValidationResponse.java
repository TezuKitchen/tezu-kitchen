package com.tezukitchen.api.promotion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionValidationResponse {
    private Double discountAmount;
}
