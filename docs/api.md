# TezuKitchen — API Documentation

## Overview

- **Base URL**: `/api/v1`
- **Format**: JSON
- **Authentication**: JWT Bearer token (`Authorization: Bearer <token>`)
- **API Docs**: Available at `/api/swagger-ui` when running locally

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00"
}
```

### Error Response

```json
{
  "status": 400,
  "message": "Error description",
  "errors": ["Field-level error 1", "Field-level error 2"],
  "timestamp": "2024-01-01T00:00:00"
}
```

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register a new user | No |
| POST | `/api/v1/auth/login` | Login and receive JWT access & refresh tokens | No |
| POST | `/api/v1/auth/refresh` | Refresh JWT token (token rotation) | No |
| POST | `/api/v1/auth/logout` | Logout (revoke refresh token / session) | Yes |

#### Auth Response Schema
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 3600000,
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "STUDENT"
}
```

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me` | Get current user profile | Yes |
| PUT | `/api/v1/users/me` | Update current user profile | Yes |
| GET | `/api/v1/users/{id}` | Get user by ID | Admin |
| GET | `/api/v1/users` | List all users | Admin |
| DELETE | `/api/v1/users/{id}` | Delete user | Admin |

### Restaurants (`/api/v1/restaurants`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/restaurants` | Create a restaurant | Yes (Owner) |
| GET | `/api/v1/restaurants` | List restaurants | No |
| GET | `/api/v1/restaurants/{id}` | Get restaurant details | No |
| PUT | `/api/v1/restaurants/{id}` | Update restaurant | Yes (Owner) |
| DELETE | `/api/v1/restaurants/{id}` | Delete restaurant | Yes (Owner/Admin) |

### Menu (`/api/v1/menu`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/menu` | Create menu item | Yes (Owner) |
| GET | `/api/v1/menu` | List menu items | No |
| GET | `/api/v1/menu/{id}` | Get menu item details | No |
| PUT | `/api/v1/menu/{id}` | Update menu item | Yes (Owner) |
| DELETE | `/api/v1/menu/{id}` | Delete menu item | Yes (Owner) |

### Orders (`/api/v1/orders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/orders` | Create a new order | Yes |
| GET | `/api/v1/orders` | List orders | Yes |
| GET | `/api/v1/orders/{id}` | Get order details | Yes |
| PUT | `/api/v1/orders/{id}/status` | Update order status | Yes (Owner/Admin) |
| DELETE | `/api/v1/orders/{id}` | Cancel order | Yes |

### Payments (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/payments` | Process payment | Yes |
| GET | `/api/v1/payments/{id}` | Get payment details | Yes |
| GET | `/api/v1/payments/order/{orderId}` | Get payment by order | Yes |

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — Request succeeded |
| 201 | Created — Resource created successfully |
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Missing or invalid authentication |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource does not exist |
| 409 | Conflict — Resource already exists |
| 500 | Internal Server Error — Unexpected server error |
