# TezuKitchen — Architecture Documentation

## System Architecture

```
Client / Browser
       │
       ▼
Frontend Application
       │
    HTTPS / JSON
       │
       ▼
Spring Boot REST API
       │
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ Auth │ User │ Rest.│ Menu │Order │ Pay. │
└──────┴──────┴──────┴──────┴──────┴──────┘
       │
       ▼
   PostgreSQL
```

TezuKitchen uses a **modular monolith** architecture. The backend is a single Spring Boot application internally divided into feature modules. This provides the organizational benefits of microservices (team independence, clear boundaries) without the operational complexity.

## Architectural Style: Modular Monolith

### Why Not Microservices?

- **Simpler deployment**: One application to build, deploy, and monitor
- **No network overhead**: Feature modules communicate via method calls, not HTTP/gRPC
- **Simpler data management**: Single database, no distributed transactions
- **Team-scale appropriate**: Feature modules provide sufficient isolation for our team size

### Feature Module Boundaries

Each feature module owns its full vertical slice:

```
<feature>/
├── controller/    ← REST endpoints
├── service/       ← Business logic
├── repository/    ← Data access
├── entity/        ← JPA entities
└── dto/
    ├── request/   ← Inbound DTOs
    └── response/  ← Outbound DTOs
```

## Backend Layers

```
Controller   ← Handles HTTP requests, validates input, returns responses
    ↓
Service      ← Contains business logic, orchestrates operations
    ↓
Repository   ← Data access layer (Spring Data JPA)
    ↓
Database     ← PostgreSQL
```

### Layer Responsibilities

| Layer | Responsibility | Communicates With |
|-------|---------------|-------------------|
| **Controller** | Request handling, input validation, response formatting | Service |
| **Service** | Business logic, transaction management, cross-module coordination | Repository, other Services |
| **Repository** | Database queries, data persistence | Database |
| **DTO** | Data transfer between layers, API contract definition | Controller ↔ Service |
| **Entity** | Database table mapping, JPA lifecycle | Repository |

### Rules

1. **Controllers never access Repositories directly** — always go through a Service
2. **Entities are never exposed in API responses** — always use DTOs
3. **Cross-module communication goes through Services** — never access another module's Repository directly
4. **Each module manages its own transactions** — use `@Transactional` at the Service layer

## Feature Modules

| Module | Responsibility |
|--------|---------------|
| **Auth** | Authentication, JWT token management, security configuration |
| **User** | User profile management, account settings |
| **Restaurant** | Restaurant CRUD, restaurant owner management |
| **Menu** | Menu item management, categorization |
| **Order** | Order creation, status management, order history |
| **Payment** | Payment processing, payment status tracking |

## Common Module

Shared infrastructure used by all feature modules:

```
common/
├── config/       ← Application-wide configuration (CORS, web)
├── exception/    ← Global exception handling, custom exceptions
├── response/     ← Standard API response wrappers
└── validation/   ← Custom validation annotations
```

## Security Architecture

```
HTTP Request
    ↓
JwtAuthenticationFilter   ← Extracts and validates JWT from Authorization header
    ↓
SecurityFilterChain       ← Spring Security filter chain
    ↓
Controller                ← Authorized request reaches the endpoint
```

Security components live in `auth/security/` and include:
- `SecurityConfig` — Filter chain and endpoint authorization rules
- `JwtAuthenticationFilter` — JWT extraction and validation
- `JwtService` — Access & refresh token generation and parsing
- `AuthEntryPoint` — Unauthorized access handling

### Token Lifecycle & Revocation
- **Access Tokens**: Short-lived (1 hour default) stateless JWTs containing user ID, email, and role claims.
- **Refresh Tokens**: Longer-lived (7 days default) tokens persisted in PostgreSQL with automated single-use rotation and instant revocation on logout.

## Database Architecture

- **Database**: PostgreSQL 16
- **Migration tool**: Flyway
- **Entities**: User, RefreshToken, Restaurant, MenuItem, Order, OrderItem, Payment

See [database.md](database.md) for details.

## API Architecture

- **Base path**: `/api/v1/`
- **Format**: JSON
- **Documentation**: SpringDoc OpenAPI (Swagger UI at `/api/swagger-ui`)

See [api.md](api.md) for endpoint documentation.

## Deployment Architecture (Planned)

```
Internet
   ↓
Reverse Proxy (Nginx / Cloud Load Balancer)
   ↓
Spring Boot Docker Container
   ↓
Managed PostgreSQL (e.g., AWS RDS, GCP Cloud SQL)
```

### Production Considerations

- Application runs as a Docker container
- All configuration via environment variables
- Database managed by cloud provider
- Reverse proxy handles TLS termination
- Horizontal scaling via container orchestration (future)

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | Java 21 |
| Framework | Spring Boot 3.4 |
| Security | Spring Security + JWT |
| Database | PostgreSQL 16 |
| ORM | Spring Data JPA / Hibernate |
| Migrations | Flyway |
| Build | Maven |
| API Docs | SpringDoc OpenAPI |
| Container | Docker |
| CI/CD | GitHub Actions |
