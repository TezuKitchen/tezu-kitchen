package com.tezukitchen.api.payment.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.payment.dto.request.CreatePaymentRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;
import com.tezukitchen.api.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        PaymentResponse response = paymentService.createPayment(authenticatedUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable UUID id) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        PaymentResponse response = paymentService.getPaymentById(authenticatedUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(@PathVariable UUID orderId) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        PaymentResponse response = paymentService.getPaymentByOrderId(authenticatedUserId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
