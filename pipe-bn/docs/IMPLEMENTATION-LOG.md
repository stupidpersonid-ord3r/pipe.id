# PIPE.ID Backend Final Implementation Log

## Finalized

- Replaced in-memory runtime persistence with PostgreSQL.
- Added users, profiles, accounts, account transactions, trades, refresh sessions and password-reset-token tables.
- Added parameterized SQL repository access through `pg`.
- Added persistent refresh-token rotation and revocation.
- Added password-change session invalidation.
- Added account balance calculation from starting balance + deposits - withdrawals + trade P&L.
- Added account ownership checks before account and trade access.
- Added trade pagination and filters matching the frontend domain.
- Added psychology, strategy, pair and monthly/equity analytics.
- Removed standalone weekly/monthly review endpoints; date-range filtering remains the shared mechanism used by the frontend.
- Added profile backup email and WhatsApp storage validation.
- Added frontend API adapter with access-token refresh handling.
- Added final connection, security, migration and status documentation.

## Deliberate external integrations

- PostgreSQL connection is configured by `DATABASE_URL`.
- Production password recovery needs an email delivery provider. Development can return a reset token for local testing only.
- WhatsApp OTP delivery remains provider-specific and is not coupled to the core API.
- Avatar binary storage remains provider-neutral; the API stores `avatarUrl` so an S3-compatible/object-storage provider can be added without changing profile ownership logic.
- PDF/Excel report generation remains in the frontend during migration because those layouts already exist there.

## Migration principle

Supabase direct access has been removed from the frontend source. Data reconciliation remains a production cutover task.
