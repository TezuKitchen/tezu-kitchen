package com.tezukitchen.api.payment.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.tezukitchen.api.common.enums.PaymentMethod;
import com.tezukitchen.api.common.enums.PaymentStatus;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.order.repository.OrderRepository;
import com.tezukitchen.api.payment.dto.request.RazorpayOrderRequest;
import com.tezukitchen.api.payment.dto.request.RazorpayVerifyRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;
import com.tezukitchen.api.payment.dto.response.RazorpayOrderResponse;
import com.tezukitchen.api.payment.entity.Payment;
import com.tezukitchen.api.payment.repository.PaymentRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Value("${app.razorpay.key-id}")
    private String keyId;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    @Value("${app.razorpay.webhook-secret:}")
    private String webhookSecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() throws RazorpayException {
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
    }

    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(UUID authenticatedUserId, RazorpayOrderRequest request) {
        com.tezukitchen.api.order.entity.Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + request.getOrderId()));

        if (!order.getUser().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not authorized to pay for this order");
        }

        Optional<Payment> optionalPayment = paymentRepository.findByOrderId(order.getId());
        Payment payment;

        if (optionalPayment.isPresent()) {
            payment = optionalPayment.get();
            if (payment.getRazorpayOrderId() != null) {
                return RazorpayOrderResponse.builder()
                        .razorpayOrderId(payment.getRazorpayOrderId())
                        .keyId(keyId)
                        .amount(order.getTotalAmount().multiply(new BigDecimal(100)))
                        .currency("INR")
                        .build();
            }
        } else {
            payment = Payment.builder()
                    .order(order)
                    .amount(order.getTotalAmount())
                    .method(PaymentMethod.CARD)
                    .status(PaymentStatus.PENDING)
                    .build();
        }

        try {
            JSONObject orderRequest = new JSONObject();
            BigDecimal amountInPaise = order.getTotalAmount().multiply(new BigDecimal(100));
            orderRequest.put("amount", amountInPaise.intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", order.getId().toString());

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            payment.setRazorpayOrderId(razorpayOrderId);
            paymentRepository.save(payment);

            return RazorpayOrderResponse.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .keyId(keyId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .build();
        } catch (RazorpayException e) {
            throw new RuntimeException("Error creating Razorpay order: " + e.getMessage(), e);
        }
    }

    @Transactional
    public PaymentResponse verifyPayment(UUID authenticatedUserId, RazorpayVerifyRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for Razorpay Order ID: " + request.getRazorpayOrderId()));

        if (!payment.getOrder().getUser().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You are not authorized to verify this payment");
        }

        // Idempotency check: if already SUCCESS with the same payment ID, just return the response
        if (payment.getStatus() == PaymentStatus.SUCCESS && 
            request.getRazorpayPaymentId().equals(payment.getRazorpayPaymentId())) {
            return PaymentResponse.builder()
                    .id(payment.getId())
                    .orderId(payment.getOrder().getId())
                    .amount(payment.getAmount())
                    .method(payment.getMethod().name())
                    .status(payment.getStatus().name())
                    .transactionRef(payment.getTransactionRef())
                    .paidAt(payment.getPaidAt())
                    .build();
        }

        try {
            String data = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            String expectedSignature = hexString.toString();

            if (expectedSignature.equals(request.getRazorpaySignature())) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
                payment.setTransactionRef(request.getRazorpaySignature());
                payment.setPaidAt(Instant.now());
                paymentRepository.save(payment);

                return PaymentResponse.builder()
                        .id(payment.getId())
                        .orderId(payment.getOrder().getId())
                        .amount(payment.getAmount())
                        .method(payment.getMethod().name())
                        .status(payment.getStatus().name())
                        .transactionRef(payment.getTransactionRef())
                        .paidAt(payment.getPaidAt())
                        .build();
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                throw new BadRequestException("Invalid payment signature");
            }
        } catch (Exception e) {
            if (e instanceof BadRequestException) {
                throw (BadRequestException) e;
            }
            throw new RuntimeException("Error verifying payment signature", e);
        }
    }

    @Transactional
    public void processWebhook(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new BadRequestException("Webhook secret is not configured");
        }
        try {
            boolean isValid = com.razorpay.Utils.verifyWebhookSignature(payload, signature, webhookSecret);
            if (!isValid) {
                throw new BadRequestException("Invalid webhook signature");
            }

            JSONObject json = new JSONObject(payload);
            String event = json.optString("event");

            if ("order.paid".equals(event) || "payment.captured".equals(event)) {
                JSONObject entity = json.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
                String razorpayOrderId = entity.getString("order_id");
                String razorpayPaymentId = entity.getString("id");

                paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
                    if (payment.getStatus() != PaymentStatus.SUCCESS) {
                        payment.setStatus(PaymentStatus.SUCCESS);
                        payment.setRazorpayPaymentId(razorpayPaymentId);
                        payment.setTransactionRef(signature);
                        payment.setPaidAt(Instant.now());
                        paymentRepository.save(payment);
                    }
                });
            }
        } catch (RazorpayException e) {
            throw new BadRequestException("Webhook verification failed: " + e.getMessage());
        }
    }
}
