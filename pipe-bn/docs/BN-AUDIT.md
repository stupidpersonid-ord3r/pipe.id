# BN audit checkpoint

## Separation
- BN runtime uses PostgreSQL through `DATABASE_URL`.
- No Supabase client, Supabase URL, or `VITE_SUPABASE_*` reference exists in `src/`.
- `frontend-bridge/pipeApi.js` is retained as the intentional BN rollback bridge.
- FN should not import this bridge while Supabase is active.

## Safety fix
- BN now rejects `DATABASE_URL` hosts containing `supabase.co` by default.
- Override requires explicit `ALLOW_SUPABASE_DATABASE=true` for an intentional migration/test.

## Data reset
- `scripts/db-reset-data.ts` removes users, profiles, accounts, account transactions, trades, sessions, and password-reset tokens.
- `instrument_catalog` is preserved.
- Reset requires `BN_RESET_CONFIRM=RESET_PIPE_BN_DATA` and runs in a transaction.

## Migration back to BN
- Keep Supabase UUIDs as the BN `users.id` during a future data migration.
- Import domain rows using the same user UUID.
- Do not assume Supabase password hashes can be imported into BN's password authentication; use a BN password-reset flow after migration.
