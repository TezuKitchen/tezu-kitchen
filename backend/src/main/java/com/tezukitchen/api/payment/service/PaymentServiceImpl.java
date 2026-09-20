package com.tezukitchen.api.payment.service;

import com.tezukitchen.api.common.enums.PaymentMethod;
import com.tezukitchen.api.common.enums.PaymentStatus;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.order.repository.OrderRepository;
import com.tezukitchen.api.payment.dto.request.CreatePaymentRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;
import com.tezukitchen.api.payment.entity.Payment;
import com.tezukitchen.api.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public PaymentResponse createPayment(UUID authenticatedUserId, CreatePaymentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

        // Only the user who placed the order can create a payment
        if (!order.getUser().getId().equals(authenticatedUserId)) {
            throw new ForbiddenException("You can only pay for your own orders");
        }

        // Check if payment already exists
        if (paymentRepository.findByOrderId(order.getId()).isPresent()) {
            throw new BadRequestException("Payment already exists for this order");
        }

        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(request.getMethod().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment method: " + request.getMethod());
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .method(method)
                .status(PaymentStatus.PENDING)
                .build();

        payment = paymentRepository.save(payment);
        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID authenticatedUserId, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        verifyPaymentAccess(authenticatedUserId, payment);
        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(UUID authenticatedUserId, UUID orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        verifyPaymentAccess(authenticatedUserId, payment);
        return mapToResponse(payment);
    }

    private void verifyPaymentAccess(UUID authenticatedUserId, Payment payment) {
        boolean isOrderingUser = payment.getOrder().getUser().getId().equals(authenticatedUserId);
        boolean isRestaurantOwner = payment.getOrder().getRestaurant().getOwner().getId().equals(authenticatedUserId);
        if (!isOrderingUser && !isRestaurantOwner) {
            throw new ForbiddenException("You do not have access to this payment");
        }
    }

    private PaymentResponse mapToResponse(Payment payment) {
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
}
