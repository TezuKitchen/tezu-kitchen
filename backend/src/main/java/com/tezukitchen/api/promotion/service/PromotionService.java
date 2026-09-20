package com.tezukitchen.api.promotion.service;

import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.promotion.dto.PromotionValidationResponse;
import com.tezukitchen.api.promotion.entity.Promotion;
import com.tezukitchen.api.promotion.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;

    @Transactional(readOnly = true)
    public PromotionValidationResponse validatePromotion(String code, Double orderAmount) {
        Promotion promo = promotionRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new BadRequestException("Invalid promotion code"));
        
        if (promo.getActive() == null || !promo.getActive()) {
            throw new BadRequestException("Promotion code is inactive");
        }
        
        if (promo.getExpirationDate() != null && promo.getExpirationDate().isBefore(Instant.now())) {
            throw new BadRequestException("Promotion code is expired");
        }
        
        if (promo.getMinOrderAmount() != null && orderAmount < promo.getMinOrderAmount()) {
            throw new BadRequestException("Order amount is less than the minimum required for this promotion");
        }
        
        double discount = (orderAmount * promo.getDiscountPercentage()) / 100.0;
        if (promo.getMaxDiscountAmount() != null && discount > promo.getMaxDiscountAmount()) {
            discount = promo.getMaxDiscountAmount();
        }
        
        return PromotionValidationResponse.builder()
                .discountAmount(discount)
                .build();
    }
}
