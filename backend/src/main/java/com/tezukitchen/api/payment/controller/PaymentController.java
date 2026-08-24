package com.tezukitchen.api.payment.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Payment management REST controller.
 * <p>
 * Planned endpoints:
 * - POST /api/v1/payments — Process payment
 * - GET  /api/v1/payments/{id} — Get payment by ID
 * - GET  /api/v1/payments/order/{orderId} — Get payment by order ID
 */
@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    // TODO: Inject PaymentService
    // TODO: Implement payment endpoints
}
