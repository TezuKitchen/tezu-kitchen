package com.tezukitchen.api.review.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.review.dto.ReviewRequest;
import com.tezukitchen.api.review.dto.ReviewResponse;
import com.tezukitchen.api.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> addReview(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody ReviewRequest request) {
        UUID userId = getAuthenticatedUserId();
        ReviewResponse response = reviewService.addReview(userId, restaurantId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review added successfully", response));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsForRestaurant(
            @PathVariable UUID restaurantId) {
        List<ReviewResponse> response = reviewService.getReviewsForRestaurant(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully", response));
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
