# Database Migrations

This directory contains Flyway versioned migrations.

## Convention

- `V1__initial_schema.sql` — The initial database schema (to be created from the team's existing DDL)
- `V2__description.sql` — Subsequent migrations follow `V<number>__<description>.sql`

## Important

The team's existing PostgreSQL DDL should be placed here as `V1__initial_schema.sql`.
Do not invent tables or columns — use the supplied database design.

See [docs/database.md](../../../../../docs/database.md) for full documentation.
