package com.tezukitchen.api.payment.service;

import com.tezukitchen.api.common.enums.OrderStatus;
import com.tezukitchen.api.common.enums.PaymentMethod;
import com.tezukitchen.api.common.enums.PaymentStatus;
import com.tezukitchen.api.common.enums.UserRole;
import com.tezukitchen.api.common.exception.BadRequestException;
import com.tezukitchen.api.common.exception.ForbiddenException;
import com.tezukitchen.api.common.exception.ResourceNotFoundException;
import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.order.repository.OrderRepository;
import com.tezukitchen.api.payment.dto.request.CreatePaymentRequest;
import com.tezukitchen.api.payment.dto.response.PaymentResponse;
import com.tezukitchen.api.payment.entity.Payment;
import com.tezukitchen.api.payment.repository.PaymentRepository;
import com.tezukitchen.api.restaurant.entity.Restaurant;
import com.tezukitchen.api.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private UUID studentId;
    private UUID ownerId;
    private UUID otherUserId;
    private UUID orderId;
    private UUID paymentId;
    private User student;
    private User owner;
    private Restaurant restaurant;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        paymentId = UUID.randomUUID();

        student = User.builder().id(studentId).name("Student").role(UserRole.STUDENT).build();
        owner = User.builder().id(ownerId).name("Owner").role(UserRole.OWNER).build();

        restaurant = Restaurant.builder()
                .id(UUID.randomUUID())
                .name("Campus Cafe")
                .owner(owner)
                .build();

        order = Order.builder()
                .id(orderId)
                .user(student)
                .restaurant(restaurant)
                .totalAmount(new BigDecimal("350.00"))
                .status(OrderStatus.PLACED)
                .deliveryAddress("Hostel A")
                .build();

        payment = Payment.builder()
                .id(paymentId)
                .order(order)
                .amount(new BigDecimal("350.00"))
                .method(PaymentMethod.COD)
                .status(PaymentStatus.PENDING)
                .build();
    }

    @Nested
    @DisplayName("createPayment")
    class CreatePaymentTests {

        @Test
        @DisplayName("creates payment successfully for order owner")
        void createPayment_Success() {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("UPI")
                    .build();

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
            when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
                Payment p = invocation.getArgument(0);
                p.setId(paymentId);
                return p;
            });

            PaymentResponse response = paymentService.createPayment(studentId, request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(paymentId);
            assertThat(response.getOrderId()).isEqualTo(orderId);
            assertThat(response.getAmount()).isEqualByComparingTo("350.00");
            assertThat(response.getMethod()).isEqualTo("UPI");
            assertThat(response.getStatus()).isEqualTo("PENDING");
            verify(paymentRepository).save(any(Payment.class));
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when order does not exist")
        void createPayment_OrderNotFound_ThrowsException() {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("COD")
                    .build();

            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.createPayment(studentId, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Order not found with id");

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ForbiddenException when another user tries to pay for the order")
        void createPayment_NotOrderOwner_ThrowsForbidden() {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("COD")
                    .build();

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> paymentService.createPayment(otherUserId, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("You can only pay for your own orders");

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws BadRequestException when payment already exists for this order")
        void createPayment_AlreadyExists_ThrowsBadRequest() {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("COD")
                    .build();

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> paymentService.createPayment(studentId, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Payment already exists for this order");

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws BadRequestException when payment method is invalid")
        void createPayment_InvalidMethod_ThrowsBadRequest() {
            CreatePaymentRequest request = CreatePaymentRequest.builder()
                    .orderId(orderId)
                    .method("CRYPTO")
                    .build();

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.createPayment(studentId, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid payment method: CRYPTO");

            verify(paymentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getPaymentById")
    class GetPaymentByIdTests {

        @Test
        @DisplayName("student who placed order can view payment")
        void getPaymentById_Student_Success() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            PaymentResponse response = paymentService.getPaymentById(studentId, paymentId);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(paymentId);
        }

        @Test
        @DisplayName("restaurant owner can view payment")
        void getPaymentById_RestaurantOwner_Success() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            PaymentResponse response = paymentService.getPaymentById(ownerId, paymentId);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(paymentId);
        }

        @Test
        @DisplayName("unrelated user cannot view payment and gets ForbiddenException")
        void getPaymentById_UnrelatedUser_ThrowsForbidden() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> paymentService.getPaymentById(otherUserId, paymentId))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("You do not have access to this payment");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when payment not found")
        void getPaymentById_NotFound_ThrowsException() {
            when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.getPaymentById(studentId, paymentId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getPaymentByOrderId")
    class GetPaymentByOrderIdTests {

        @Test
        @DisplayName("student can view payment by order ID")
        void getPaymentByOrderId_Student_Success() {
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

            PaymentResponse response = paymentService.getPaymentByOrderId(studentId, orderId);

            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(orderId);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when payment for order does not exist")
        void getPaymentByOrderId_NotFound_ThrowsException() {
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.getPaymentByOrderId(studentId, orderId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
