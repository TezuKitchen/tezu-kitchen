package com.tezukitchen.api.notification.service;

import com.tezukitchen.api.order.entity.Order;
import com.tezukitchen.api.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestTemplate restTemplate;

    public PushNotificationService() {
        this.restTemplate = new RestTemplate();
    }

    public void notifyNewOrder(Order order) {
        try {
            if (order.getRestaurant() == null || order.getRestaurant().getOwner() == null) {
                return;
            }
            User owner = order.getRestaurant().getOwner();
            String expoPushToken = owner.getExpoPushToken();
            if (expoPushToken == null || expoPushToken.isBlank()) {
                log.info("Owner {} has no registered push token; skipping notification", owner.getEmail());
                return;
            }

            String title = "New Order Received! 🔔";
            String body = String.format("Order #%s for ₹%s has been placed.", 
                    order.getId().toString().substring(0, 8), order.getTotalAmount());

            Map<String, Object> data = new HashMap<>();
            data.put("orderId", order.getId().toString());
            data.put("type", "NEW_ORDER");

            CompletableFuture.runAsync(() -> sendPushNotification(expoPushToken, title, body, data));
        } catch (Exception e) {
            log.warn("Error preparing new order notification: {}", e.getMessage());
        }
    }

    public void notifyOrderStatusChanged(Order order) {
        try {
            if (order.getUser() == null) {
                return;
            }
            User student = order.getUser();
            String expoPushToken = student.getExpoPushToken();
            if (expoPushToken == null || expoPushToken.isBlank()) {
                log.info("Student {} has no registered push token; skipping notification", student.getEmail());
                return;
            }

            String statusStr = order.getStatus() != null ? order.getStatus().name() : "UPDATED";
            String title = getTitleForStatus(statusStr);
            String restaurantName = (order.getRestaurant() != null && order.getRestaurant().getName() != null)
                    ? order.getRestaurant().getName() : "the kitchen";
            String body = String.format("Your order from %s is now %s.", restaurantName, formatStatus(statusStr));

            Map<String, Object> data = new HashMap<>();
            data.put("orderId", order.getId().toString());
            data.put("type", "STATUS_UPDATE");
            data.put("status", statusStr);

            CompletableFuture.runAsync(() -> sendPushNotification(expoPushToken, title, body, data));
        } catch (Exception e) {
            log.warn("Error preparing order status notification: {}", e.getMessage());
        }
    }

    private String getTitleForStatus(String status) {
        switch (status) {
            case "ACCEPTED": return "Order Accepted! 👨‍🍳";
            case "PREPARING": return "Cooking in Progress! 🍳";
            case "OUT_FOR_DELIVERY": return "Out for Delivery! 🛵";
            case "DELIVERED": return "Order Delivered! 🎉";
            case "CANCELLED": return "Order Cancelled ❌";
            case "REJECTED": return "Order Rejected ⚠️";
            default: return "Order Update 🔔";
        }
    }

    private String formatStatus(String status) {
        return status.toLowerCase().replace('_', ' ');
    }

    private void sendPushNotification(String expoPushToken, String title, String body, Map<String, Object> data) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("to", expoPushToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            payload.put("priority", "high");
            payload.put("data", data);

            restTemplate.postForEntity(EXPO_PUSH_URL, payload, String.class);
            log.info("Dispatched Expo push notification to token: {}", expoPushToken);
        } catch (Exception e) {
            log.warn("Failed to dispatch push notification to {}: {}", expoPushToken, e.getMessage());
        }
    }
}
