package com.tezukitchen.api.promotion.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.promotion.dto.PromotionValidationResponse;
import com.tezukitchen.api.promotion.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<PromotionValidationResponse>> validatePromotion(
            @RequestParam("code") String code,
            @RequestParam("orderAmount") Double orderAmount) {
        
        PromotionValidationResponse response = promotionService.validatePromotion(code, orderAmount);
        return ResponseEntity.ok(ApiResponse.success("Promotion applied successfully", response));
    }
}
