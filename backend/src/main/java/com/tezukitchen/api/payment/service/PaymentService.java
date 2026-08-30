package com.tezukitchen.api.payment.service;

import com.tezukitchen.api.payment.dto.request.CreatePaymentRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;

import java.util.UUID;

public interface PaymentService {
    PaymentResponse createPayment(UUID authenticatedUserId, CreatePaymentRequest request);
    PaymentResponse getPaymentById(UUID authenticatedUserId, UUID paymentId);
    PaymentResponse getPaymentByOrderId(UUID authenticatedUserId, UUID orderId);
}
