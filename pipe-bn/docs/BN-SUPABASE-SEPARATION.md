# BN / Supabase separation

`pipe-bn` is a standalone Fastify + PostgreSQL backend. It is kept as a rollback/migration target and is not the active frontend backend while PIPE.ID runs on Supabase.

## Connection safety

BN reads `DATABASE_URL` from the root `.env`. By default, startup rejects a PostgreSQL host containing `supabase.co`. This prevents an accidental BN -> Supabase database connection.

Only set `ALLOW_SUPABASE_DATABASE=true` for an intentional migration/test. Do not set it in the normal BN backup environment.

## Resetting BN user data

The reset script intentionally preserves `instrument_catalog` and removes only user-generated/auth/domain data:

```text
BN_RESET_CONFIRM=RESET_PIPE_BN_DATA npm run db:reset-data
```

On Windows PowerShell:

```powershell
$env:BN_RESET_CONFIRM="RESET_PIPE_BN_DATA"
npm run db:reset-data
Remove-Item Env:BN_RESET_CONFIRM
```

The reset is transactional and refuses to run without the exact confirmation value.

## Future Supabase -> BN migration

Keep `frontend-bridge/pipeApi.js` as the BN API bridge. A future migration should import Supabase `auth.users` into BN `users` using the same UUID as `users.id`, then import `profiles`, `accounts`, `account_transactions`, and `trades` using that UUID. Supabase password hashes are not assumed to be portable; users should complete a BN password-reset flow when moving authentication back to BN.

The active FN should continue using its Supabase provider until an intentional rollback/migration is performed.
