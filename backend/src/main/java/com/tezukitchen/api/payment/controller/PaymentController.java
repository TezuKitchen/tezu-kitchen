package com.tezukitchen.api.payment.controller;

import com.tezukitchen.api.common.response.ApiResponse;
import com.tezukitchen.api.payment.dto.request.CreatePaymentRequest;
import com.tezukitchen.api.payment.dto.request.RazorpayOrderRequest;
import com.tezukitchen.api.payment.dto.request.RazorpayVerifyRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;
import com.tezukitchen.api.payment.dto.response.RazorpayOrderResponse;
import com.tezukitchen.api.payment.service.PaymentService;
import com.tezukitchen.api.payment.service.RazorpayService;
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
    private final RazorpayService razorpayService;

    public PaymentController(PaymentService paymentService, RazorpayService razorpayService) {
        this.paymentService = paymentService;
        this.razorpayService = razorpayService;
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

    @PostMapping("/razorpay/create-order")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createRazorpayOrder(
            @Valid @RequestBody RazorpayOrderRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        RazorpayOrderResponse response = razorpayService.createRazorpayOrder(authenticatedUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Razorpay order created successfully", response));
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyRazorpayPayment(
            @Valid @RequestBody RazorpayVerifyRequest request) {
        UUID authenticatedUserId = getAuthenticatedUserId();
        PaymentResponse response = razorpayService.verifyPayment(authenticatedUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }

    @PostMapping("/razorpay/webhook")
    public ResponseEntity<Void> handleRazorpayWebhook(
            @RequestHeader("X-Razorpay-Signature") String signature,
            @RequestBody String payload) {
        razorpayService.processWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    private UUID getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) authentication.getPrincipal();
    }
}
