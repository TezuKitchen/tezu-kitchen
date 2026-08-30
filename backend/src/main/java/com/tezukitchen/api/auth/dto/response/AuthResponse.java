package com.tezukitchen.api.auth.dto.response;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private UUID userId;
    private String name;
    private String email;
    private String role;
}
