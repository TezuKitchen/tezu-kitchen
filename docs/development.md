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
