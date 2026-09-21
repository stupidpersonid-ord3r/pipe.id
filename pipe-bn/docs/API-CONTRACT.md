# PIPE.ID API Contract v1

Base URL: `http://127.0.0.1:4000/api/v1`

Authenticated requests use `Authorization: Bearer <access_token>`.

## Auth

POST `/auth/register` `{email,password}`
POST `/auth/login` `{email,password}`
POST `/auth/logout`
POST `/auth/refresh` `{refreshToken}`
GET `/auth/status`
POST `/auth/change-password` `{currentPassword,newPassword}`
POST `/auth/change-email` `{password,email}`
POST `/auth/forgot-password` `{email}`
POST `/auth/reset-password` `{token,password}`

## Profile

GET `/profile`
PATCH `/profile` with `traderName,journalName,theme,avatarUrl,backupEmail,phoneWhatsapp`.

## Accounts

GET/POST `/accounts`
GET/PATCH `/accounts/:id`
POST `/accounts/:id/deposit` `{amount,note?}`
POST `/accounts/:id/withdraw` `{amount,note?}`
GET `/accounts/:id/transactions`

## Trades

GET `/trades` with `accountId,page,limit,pair,result,psychology,from,to`
POST `/trades`
GET `/trades/:id`
PATCH `/trades/:id`

## Analytics

GET `/analytics/overview`
GET `/analytics/equity`
GET `/analytics/monthly`
GET `/analytics/psychology`
GET `/analytics/strategies`
GET `/analytics/pairs`

## Data rules

- Email: lowercase Gmail only.
- Password: exactly 8 characters: exactly 2 lowercase, 2 uppercase, 2 digits, 2 special characters.
- Psychology: `GREED | FEAR | NEUTRAL`.
- Direction: `BUY | SELL`.
- Result: `WIN | LOSS | BREAKEVEN`.
- Account type: `LIVE | DEMO`.
- The server derives user identity from the access token; frontend must never send a user id to select ownership.
