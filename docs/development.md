# TezuKitchen — Development Guide

## Git Workflow

We use a **feature-branch** workflow:

```
main
  ↑
feature/auth-login
feature/restaurant-crud
feature/order-processing
...
```

### Branch Naming

```
feature/<module>-<description>    → New features
bugfix/<module>-<description>     → Bug fixes
hotfix/<description>              → Urgent production fixes
refactor/<module>-<description>   → Refactoring
testing/<Testing-type>            → Testing
```

Examples:
- `feature/auth-jwt-implementation`
- `feature/restaurant-crud`
- `bugfix/order-status-validation`
-  testing/api-testing

### Workflow Steps

1. **Pull latest main**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Implement your feature** within your module's package

4. **Run tests**:
   ```bash
   cd backend
   ./mvnw test
   ```

5. **Push your branch**:
   ```bash
   git push origin feature/your-feature
   ```

6. **Open a Pull Request** against `main`

7. **Get code review** from at least one team member

8. **Merge** after approval (squash merge recommended)

> ⚠️ **Do not push directly to `main`.** All changes go through Pull Requests.

### Commit Message Convention

```
<module>: <short description>

<optional body with details>
```

Examples:
- `auth: add JWT authentication filter`
- `restaurant: implement CRUD endpoints`
- `common: add validation error handling`

## Local Development Setup

### Prerequisites

- Java 21 (recommend using [SDKMAN](https://sdkman.io/) or similar)
- Docker & Docker Compose
- Git

### First-Time Setup

```bash
# Clone the repository
git clone <repository-url>
cd TezuKitchen

# Copy environment file and configure it
cp .env.example .env

# Build and start the entire stack
docker compose up -d --build
```

### Daily Development

```bash
# Start or update the stack
docker compose up -d --build

# View backend logs
docker compose logs -f backend

# Rebuild only the backend service
docker compose up -d --build backend

# Stop the stack
docker compose down
```

*(Alternative)* Fast local dev loop (Maven on host):
```bash
# Start only the database
docker compose up -d postgres

# Run backend
cd backend
./mvnw spring-boot:run
```

### Mobile App (Frontend) Development
```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Configure environment (for local or USB development)
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1 (for USB testing)
# or let it auto-detect via Metro bundler

# 3. For physical device testing via USB (recommended to bypass network isolation):
adb reverse tcp:8080 tcp:8080 && adb reverse tcp:8081 tcp:8081

# 4. Start Expo with cleared cache
npm start -- -c

# 5. Launch in Expo Go on Android device
adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"
```

### Running Tests

```bash
# Run tests
cd backend
./mvnw test
```

## Code Style

### General

- Use meaningful names for classes, methods, and variables
- Follow standard Java naming conventions
- Keep methods focused and small
- Write Javadoc for public APIs

### Package Structure

All code should live within its feature module:

```
com.tezukitchen.api.<module>.<layer>.<ClassName>
```

Example:
```
com.tezukitchen.api.restaurant.controller.RestaurantController
com.tezukitchen.api.restaurant.service.RestaurantService
com.tezukitchen.api.restaurant.repository.RestaurantRepository
```

### DTO Convention

- Request DTOs: `<Action><Entity>Request` (e.g., `CreateRestaurantRequest`)
- Response DTOs: `<Entity>Response` (e.g., `RestaurantResponse`)
- Never expose JPA entities in API responses

## Team Boundaries / Code Ownership

Each feature module is designed for independent development:

| Module | Scope | Dependencies |
|--------|-------|--------------|
| `auth` | Authentication, JWT, security | `user` (for user lookup) |
| `user` | User profiles, account management | `common` |
| `restaurant` | Restaurant CRUD, ownership | `common`, `user` |
| `menu` | Menu items, categories | `common`, `restaurant` |
| `order` | Order lifecycle, status | `common`, `user`, `restaurant`, `menu` |
| `payment` | Payment processing | `common`, `order` |

### Guidelines

1. **Stay in your module** — modify files only within your assigned module
2. **Use the common module** — for shared utilities, exceptions, and response types
3. **Cross-module calls go through Services** — never access another module's Repository
4. **Coordinate on shared changes** — changes to `common/` require team discussion
5. **Don't modify other modules' entities** — if you need a relationship, coordinate with the module owner

## Testing

### Test Location

Tests mirror the main source structure:

```
src/test/java/com/tezukitchen/api/<module>/
```

### Test Types

- **Unit tests**: Test services with mocked dependencies
- **Integration tests**: Test repositories with a test database
- **Controller tests**: Test endpoints with `@WebMvcTest`

### Running Tests

```bash
# All tests
./mvnw test

# Specific module tests
./mvnw test -Dtest="com.tezukitchen.api.restaurant.**"
```

## Security

### JWT Secret

The `JWT_SECRET` environment variable is **required** and validated at startup. The application will refuse to start if:

- `JWT_SECRET` is missing or blank
- `JWT_SECRET` is shorter than 256 bits (32 bytes) after Base64 decoding
- `JWT_SECRET` still matches the known placeholder value from `.env.example`

**Generate a secure secret:**
```bash
openssl rand -base64 64
```

Set it in your `.env` file:
```
JWT_SECRET=<your-generated-secret>
```

### CORS Configuration

CORS origins are controlled by the `ALLOWED_ORIGINS` environment variable — a comma-separated list of allowed origin patterns.

**Default (local development):**
```
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

For production, set this to your actual frontend domain(s):
```
ALLOWED_ORIGINS=https://app.tezukitchen.com
```

### Rate Limiting

Authentication endpoints are rate-limited to prevent brute-force attacks:

| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/v1/auth/login` | POST | 5 requests | 1 minute |
| `/api/v1/auth/register` | POST | 5 requests | 1 minute |

Rate limits are applied **per client IP address**. When the limit is exceeded, the API returns:

```json
{
  "status": 429,
  "message": "Too many requests. Please try again later.",
  "timestamp": "2026-09-16T12:00:00"
}
```

All other endpoints are **not** rate-limited.

> **Note:** The current implementation uses an in-memory rate limiter suitable for single-instance deployments. For multi-instance deployments behind a load balancer, this should be replaced with a Redis-backed solution.

### SQL Injection Protection

All database queries use Spring Data JPA derived query methods or `@Param`-bound JPQL queries. There are no string-concatenated SQL queries, `EntityManager.createNativeQuery()` calls, or raw `JdbcTemplate` usage anywhere in the codebase.

**Guidelines for new queries:**
- Prefer Spring Data derived query methods (e.g., `findByEmail`)
- For custom queries, use JPQL with `@Param` bindings (e.g., `@Query("... WHERE r.user.id = :userId")`)
- **Never** concatenate user input into query strings
- **Never** use `EntityManager.createNativeQuery()` with string interpolation

