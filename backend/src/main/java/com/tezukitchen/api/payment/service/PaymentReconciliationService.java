package com.tezukitchen.api.payment.service;

import com.tezukitchen.api.payment.entity.Payment;
import com.tezukitchen.api.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentReconciliationService {

    private final PaymentRepository paymentRepository;

    /**
     * Scheduled task to run every 15 minutes.
     * Finds orders stuck in PLACED status with a PENDING payment
     * for more than 30 minutes, and flags them for manual review or automated cancellation.
     * This safeguards against silently dropped webhook callbacks from Razorpay.
     */
    @Scheduled(fixedRate = 900000) // 15 minutes in ms
    @Transactional(readOnly = true)
    public void checkStuckPayments() {
        log.info("Running scheduled reconciliation task for stuck payments...");
        Instant thirtyMinutesAgo = Instant.now().minus(30, ChronoUnit.MINUTES);
        
        List<Payment> stuckPayments = paymentRepository.findStuckPayments(thirtyMinutesAgo);
        
        if (stuckPayments.isEmpty()) {
            log.info("No stuck payments found.");
            return;
        }

        log.warn("Found {} payments stuck in PENDING for >30 minutes.", stuckPayments.size());

        for (Payment payment : stuckPayments) {
            // Ideally, we would invoke the Razorpay API to fetch the actual status of the payment
            // and update it. For now, we simply log an alert for manual intervention.
            log.warn("ALERT: Payment [{}] for Order [{}] is PENDING. Razorpay Order ID: {}", 
                    payment.getId(), payment.getOrder().getId(), payment.getRazorpayOrderId());
        }
    }
}
