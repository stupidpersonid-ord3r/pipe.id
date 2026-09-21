# Backend status

**Status: FINAL API BASELINE — READY FOR FRONTEND CONNECTION AFTER POSTGRESQL SETUP.**

The source code is complete for the current PIPE.ID domain. The only required external setup is PostgreSQL and its credentials; production recovery/storage providers are documented provider boundaries.

Core API domains:

- Auth
- Profile/settings
- Accounts
- Deposits/withdrawals
- Trades
- Analytics
- Shared date-range filtering instead of separate weekly/monthly review endpoints

The frontend bridge is in `frontend-bridge/pipeApi.js`.
