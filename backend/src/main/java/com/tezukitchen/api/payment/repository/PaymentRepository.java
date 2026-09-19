package com.tezukitchen.api.payment.repository;

import com.tezukitchen.api.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByOrderId(UUID orderId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.order.status = 'PLACED' AND p.order.placedAt < :thresholdTime")
    java.util.List<Payment> findStuckPayments(@org.springframework.data.repository.query.Param("thresholdTime") java.time.Instant thresholdTime);
}

