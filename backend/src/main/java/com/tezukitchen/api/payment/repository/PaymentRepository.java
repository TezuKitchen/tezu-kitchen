package com.tezukitchen.api.payment.repository;

import com.tezukitchen.api.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Payment JPA repository.
 * <p>
 * TODO: Add custom query methods (e.g., findByOrderId)
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // TODO: Add custom query methods
}
