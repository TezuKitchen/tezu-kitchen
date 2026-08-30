# TezuKitchen

A team-based food ordering application built with a modular monolith architecture.

## Architecture Overview

```
Client / Browser
       │
       ▼
Frontend Application
       │
    HTTPS / JSON
       │
       ▼
Spring Boot REST API (Modular Monolith)
       │
┌──────┬──────┬──────┬──────┬──────┐
│ Auth │ User │ Rest │ Menu │Order │ Payment
└──────┴──────┴──────┴──────┴──────┘
       │
       ▼
   PostgreSQL
```

The backend follows a **package-by-feature** structure where each feature module owns its Controller, Service, Repository, Entity, and DTO layers.

## Repository Structure

```
TezuKitchen/
├── backend/          # Spring Boot application
├── frontend/         # Frontend application (planned)
├── database/         # Database documentation & raw migrations
├── docs/             # Project documentation
├── .github/          # CI/CD workflows
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

- **Java 21** (LTS)
- **Maven 3.9+** (or use the included Maven wrapper `./mvnw`)
- **Docker & Docker Compose** (for local PostgreSQL)
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TezuKitchen
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Start the Application

The primary way to run the entire stack (database and backend) is through Docker Compose:

```bash
docker compose up -d --build
```

To check the backend logs:
```bash
docker compose logs -f backend
```

When you change only backend code and the database doesn't need touching, you can rebuild just the backend service:
```bash
docker compose up -d --build backend
```

To stop everything:
```bash
docker compose down
```

*(Alternative)* For a fast local development loop where you run the Java app directly on your host:

```bash
# Start only the database
docker compose up -d postgres

# Run backend via Maven
cd backend
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 5. Run Tests

```bash
cd backend
./mvnw test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/tezukitchen` |
| `DATABASE_USERNAME` | Database username | `tezukitchen` |
| `DATABASE_PASSWORD` | Database password | `changeme` |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `JWT_EXPIRATION_MS` | JWT token expiration in ms | `86400000` |
| `SERVER_PORT` | Application server port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `dev` |

> **⚠️ Never commit real secrets to Git.** Use `.env` locally and environment variables in production.

## Git Workflow

We follow a **feature-branch** workflow:

1. Create a branch: `git checkout -b feature/your-feature`
2. Implement and test your changes
3. Push: `git push origin feature/your-feature`
4. Open a Pull Request against `main`
5. Get code review approval
6. Merge into `main`

**Do not push directly to `main`.**

See [docs/development.md](docs/development.md) for detailed guidelines.

## Documentation

- [Architecture](docs/architecture.md) — System design and module structure
- [Development](docs/development.md) — Git workflow, code style, team boundaries
- [Database](docs/database.md) — Schema design and migration conventions
- [API](docs/api.md) — REST API conventions and planned endpoints

## Current Status

### ✅ Current
- Project architecture and scaffolding
- Modular monolith package structure
- Docker development environment
- CI pipeline
- Documentation

### 🔜 Planned
- Authentication & JWT
- User management
- Restaurant management
- Menu management
- Order processing
- Payment processing
- Frontend application
