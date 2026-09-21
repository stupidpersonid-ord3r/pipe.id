# Database layer

The runtime database layer uses PostgreSQL through `pg`.

Apply `prisma/migrations/001_init.sql` before starting a production/dev instance with `DATABASE_URL` configured.

The `prisma/` directory is retained as the schema/migration home for the project, but the runtime deliberately uses parameterized SQL through `pg` so the API does not depend on a generated ORM client during the frontend migration.
