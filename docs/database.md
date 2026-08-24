# TezuKitchen — Database Documentation

## Overview

- **Database**: PostgreSQL 16
- **Migration tool**: Flyway
- **Schema management**: Version-controlled SQL migrations

## Entity Overview

The following entities are planned based on the team's database design:

| Entity | Table Name | Description |
|--------|-----------|-------------|
| User | `users` | Application users (customers, restaurant owners, admins) |
| Restaurant | `restaurants` | Restaurant information |
| MenuItem | `menu_items` | Food items available at restaurants |
| Order | `orders` | Customer orders |
| OrderItem | `order_items` | Individual items within an order |
| Payment | `payments` | Payment records for orders |

> ⚠️ **Do not invent columns or relationships.** Use the team's supplied DDL as the source of truth.

## Flyway Migrations

### Location

```
backend/src/main/resources/db/migration/
```

### Naming Convention

```
V<version>__<description>.sql
```

Examples:
- `V1__initial_schema.sql` — Initial database schema
- `V2__add_user_roles.sql` — Add roles to users table
- `V3__add_order_status_index.sql` — Add index for order status queries

### Creating V1 Migration

The team's existing PostgreSQL DDL should be placed as:

```
backend/src/main/resources/db/migration/V1__initial_schema.sql
```

This file should contain:
1. Table creation statements (`CREATE TABLE`)
2. Index creation (`CREATE INDEX`)
3. Constraint definitions
4. Enum types (if any)

### Rules

1. **Never modify an existing migration** — create a new version instead
2. **Migrations must be idempotent-safe** — Flyway tracks applied versions
3. **Test migrations locally** before pushing
4. **Include rollback comments** — document how to reverse the migration

## Local Database Setup

### Using Docker Compose

```bash
# Start PostgreSQL
docker compose up -d postgres

# Connect to database
docker exec -it tezukitchen-postgres psql -U tezukitchen -d tezukitchen

# Stop database (preserves data)
docker compose stop postgres

# Destroy database and volume
docker compose down -v
```

### Connection Details

| Property | Default Value |
|----------|---------------|
| Host | `localhost` |
| Port | `5432` |
| Database | `tezukitchen` |
| Username | `tezukitchen` |
| Password | `changeme` |
| JDBC URL | `jdbc:postgresql://localhost:5432/tezukitchen` |

## JPA Configuration

- `ddl-auto: validate` — Hibernate validates entities against the schema but does not modify it
- Schema changes are managed exclusively through Flyway migrations
- Entities must match the database schema exactly
