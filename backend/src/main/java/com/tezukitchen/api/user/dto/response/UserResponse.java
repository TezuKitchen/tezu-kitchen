package com.tezukitchen.api.user.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String avatarUrl;
    private java.util.List<String> savedAddresses;
    private Instant createdAt;
}
