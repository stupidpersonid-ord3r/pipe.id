# Frontend Audit Alignment

Audited against the supplied `fn-tanpa-node_modules.zip`.

## Frontend pages found
- Dashboard
- Calendar
- Trades / Add Trade / Trade Detail
- Analytics
- Charts
- Accounts
- Settings: Profile / Appearance / Security / Data
- Login / Register

## Backend domains required
- Auth
- Profile
- Accounts + deposit/withdraw + delete
- Trades + pagination/filter/detail/update
- Analytics: overview/equity/monthly/psychology/strategies/pairs

## Intentionally not added
- Weekly Review API
- Monthly Review API

The frontend runtime has been migrated to the PIPE.ID API for the instrument catalog and profile/avatar persistence.
