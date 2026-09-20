package com.tezukitchen.api.user.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUserRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @NotBlank(message = "Phone is required")
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @Size(max = 1024, message = "Avatar URL must not exceed 1024 characters")
    private String avatarUrl;

    private java.util.List<String> savedAddresses;

    @Size(max = 255, message = "Expo push token must not exceed 255 characters")
    private String expoPushToken;
}
