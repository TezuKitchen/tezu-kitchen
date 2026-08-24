/**
 * Security infrastructure for JWT-based authentication.
 * <p>
 * Planned components:
 * - SecurityConfig — Spring Security filter chain configuration
 * - JwtAuthenticationFilter — OncePerRequestFilter for JWT validation
 * - JwtService — JWT token generation, validation, and parsing
 * - UserDetailsServiceImpl — loads user details from database
 * - AuthEntryPoint — handles unauthorized access attempts
 * - AccessDeniedHandlerImpl — handles forbidden access attempts
 */
package com.tezukitchen.api.auth.security;
