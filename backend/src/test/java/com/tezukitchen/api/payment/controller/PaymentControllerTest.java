package com.tezukitchen.api.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tezukitchen.api.auth.security.JwtService;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.GlobalExceptionHandler;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.payment.dto.request.CreatePaymentRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;
import com.tezukitchen.api.payment.service.PaymentService;
import com.tezukitchen.api.payment.service.RazorpayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private RazorpayService razorpayService;

    @MockitoBean
    private JwtService jwtService;

    private final UUID authenticatedUserId = UUID.randomUUID();
    private final UUID orderId = UUID.randomUUID();
    private final UUID paymentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(authenticatedUserId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))
        );
    }

    @Nested
    @DisplayName("POST /api/v1/payments")
    class CreatePaymentTests {

        @Test
        @DisplayName("returns 201 when payment is created successfully")
        void createPayment_Success() throws Exception {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("UPI")
                    .build();

            PaymentResponse response = PaymentResponse.builder()
                    .id(paymentId)
                    .orderId(orderId)
                    .amount(new BigDecimal("299.00"))
                    .method("UPI")
                    .status("PENDING")
                    .paidAt(Instant.now())
                    .build();

            when(paymentService.createPayment(eq(authenticatedUserId), any(CreatePaymentRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/v1/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payment created successfully"))
                    .andExpect(jsonPath("$.data.id").value(paymentId.toString()))
                    .andExpect(jsonPath("$.data.method").value("UPI"))
                    .andExpect(jsonPath("$.data.status").value("PENDING"));
        }

        @Test
        @DisplayName("returns 400 when required fields are missing")
        void createPayment_MissingFields_Returns400() throws Exception {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(null)
                    .method("")
                    .build();

            mockMvc.perform(post("/api/v1/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.errors", hasSize(greaterThanOrEqualTo(2))));
        }

        @Test
        @DisplayName("returns 400 when payment already exists for order")
        void createPayment_Duplicate_Returns400() throws Exception {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("COD")
                    .build();

            when(paymentService.createPayment(eq(authenticatedUserId), any(CreatePaymentRequest.class)))
                    .thenThrow(new BadRequestException("Payment already exists for this order"));

            mockMvc.perform(post("/api/v1/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").value("Payment already exists for this order"));
        }

        @Test
        @DisplayName("returns 403 when user is not the order owner")
        void createPayment_Forbidden_Returns403() throws Exception {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("COD")
                    .build();

            when(paymentService.createPayment(eq(authenticatedUserId), any(CreatePaymentRequest.class)))
                    .thenThrow(new ForbiddenException("You can only pay for your own orders"));

            mockMvc.perform(post("/api/v1/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("returns 404 when order is not found")
        void createPayment_OrderNotFound_Returns404() throws Exception {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("COD")
                    .build();

            when(paymentService.createPayment(eq(authenticatedUserId), any(CreatePaymentRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Order", "id", orderId));

            mockMvc.perform(post("/api/v1/payments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/payments/{id}")
    class GetPaymentByIdTests {

        @Test
        @DisplayName("returns 200 with payment details when found")
        void getPaymentById_Success() throws Exception {
            PaymentResponse response = PaymentResponse.builder()
                    .id(paymentId)
                    .orderId(orderId)
                    .amount(new BigDecimal("299.00"))
                    .method("UPI")
                    .status("PENDING")
                    .build();

            when(paymentService.getPaymentById(authenticatedUserId, paymentId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/payments/{id}", paymentId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(paymentId.toString()))
                    .andExpect(jsonPath("$.data.amount").value(299.00));
        }

        @Test
        @DisplayName("returns 403 when user does not have permission")
        void getPaymentById_Forbidden_Returns403() throws Exception {
            when(paymentService.getPaymentById(authenticatedUserId, paymentId))
                    .thenThrow(new ForbiddenException("You do not have access to this payment"));

            mockMvc.perform(get("/api/v1/payments/{id}", paymentId))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("returns 404 when payment does not exist")
        void getPaymentById_NotFound_Returns404() throws Exception {
            when(paymentService.getPaymentById(authenticatedUserId, paymentId))
                    .thenThrow(new ResourceNotFoundException("Payment", "id", paymentId));

            mockMvc.perform(get("/api/v1/payments/{id}", paymentId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/payments/order/{orderId}")
    class GetPaymentByOrderIdTests {

        @Test
        @DisplayName("returns 200 with payment details for valid order")
        void getPaymentByOrderId_Success() throws Exception {
            PaymentResponse response = PaymentResponse.builder()
                    .id(paymentId)
                    .orderId(orderId)
                    .amount(new BigDecimal("299.00"))
                    .method("UPI")
                    .status("PENDING")
                    .build();

            when(paymentService.getPaymentByOrderId(authenticatedUserId, orderId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/payments/order/{orderId}", orderId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.orderId").value(orderId.toString()));
        }

        @Test
        @DisplayName("returns 404 when payment for order does not exist")
        void getPaymentByOrderId_NotFound_Returns404() throws Exception {
            when(paymentService.getPaymentByOrderId(authenticatedUserId, orderId))
                    .thenThrow(new ResourceNotFoundException("Payment", "orderId", orderId));

            mockMvc.perform(get("/api/v1/payments/order/{orderId}", orderId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }
}
