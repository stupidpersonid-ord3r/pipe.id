# Final backend status

## Implemented

- Fastify API server
- PostgreSQL persistence layer using `pg`
- SQL migration for users, profiles, accounts, account transactions, trades, refresh sessions and password reset tokens
- Auth register/login/refresh/logout/change password/change email
- Gmail lowercase validation
- Exact 8-character password policy
- Persistent refresh-session rotation and revocation
- Profile and recovery contact storage
- Account CRUD + deposit/withdraw + balance calculation
- Trade CRUD + pagination/filtering
- Psychology support: GREED/FEAR/NEUTRAL
- Analytics overview/equity/monthly/psychology/strategy/pair with account/date filtering support
- Ownership checks on every user-owned resource
- CORS, Helmet, rate limiting, body limits and validation
- Frontend connection adapter
- API and migration documentation

## Deliberate boundaries

- Supabase is not referenced by the backend.
- Object storage for avatar binaries is provider-neutral; the profile API stores the resulting URL.
- PDF/Excel generation is intentionally client-side during the migration because the existing frontend already owns those report layouts.
- Password reset token creation works in development and is intentionally not returned in production. An email provider must deliver the token/link in production.
- WhatsApp OTP delivery is provider-specific and is not hard-coded into the core backend.

## Ready state

After PostgreSQL is configured and the SQL migration is applied, the backend is ready for `pipe-fn` API integration.
