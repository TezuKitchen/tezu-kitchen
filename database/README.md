# TezuKitchen — Database

This directory contains database-related documentation and raw migration scripts.

## Directory Structure

```
database/
├── README.md          ← This file
└── migrations/        ← Raw SQL scripts (staging area)
```

## Workflow

1. Place raw DDL/SQL scripts in `migrations/` for review
2. Once approved, convert them to Flyway-versioned migrations
3. Move the versioned migration to `backend/src/main/resources/db/migration/`

See [docs/database.md](../docs/database.md) for full documentation.
