package com.tezukitchen.api.payment.service;

import com.tezukitchen.api.common.enums.PaymentStatus;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.payment.entity.Payment;
import com.tezukitchen.api.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RazorpayServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private RazorpayService razorpayService;

    private final String WEBHOOK_SECRET = "test_webhook_secret";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(razorpayService, "webhookSecret", WEBHOOK_SECRET);
    }

    private String generateSignature(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }

    @Test
    void testProcessWebhook_validSignature() throws Exception {
        String payload = "{\n" +
                "  \"event\": \"payment.captured\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"pay_29QQoUBi66xm2f\",\n" +
                "        \"order_id\": \"order_9A33XWu170gUtm\"\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        Payment payment = Payment.builder()
                .status(PaymentStatus.PENDING)
                .build();
        
        when(paymentRepository.findByRazorpayOrderId("order_9A33XWu170gUtm")).thenReturn(Optional.of(payment));

        razorpayService.processWebhook(payload, signature);

        verify(paymentRepository).save(payment);
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals("pay_29QQoUBi66xm2f", payment.getRazorpayPaymentId());
    }

    @Test
    void testProcessWebhook_tamperedSignature() throws Exception {
        String payload = "{\n" +
                "  \"event\": \"payment.captured\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"pay_29QQoUBi66xm2f\",\n" +
                "        \"order_id\": \"order_9A33XWu170gUtm\"\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        String signature = generateSignature(payload, WEBHOOK_SECRET);
        String tamperedSignature = signature.substring(0, signature.length() - 1) + "0";

        assertThrows(BadRequestException.class, () -> {
            razorpayService.processWebhook(payload, tamperedSignature);
        });

        verify(paymentRepository, never()).save(any());
    }
}
