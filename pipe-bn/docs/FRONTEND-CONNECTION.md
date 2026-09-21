# Connecting pipe-fn to pipe-bn

## 1. Start backend

```powershell
cd D:\projects-rayya\pipe.id\pipe-bn
npm run dev
```

Backend: `http://127.0.0.1:4000`

## 2. Frontend env

In `pipe-fn/.env.local`:

```env
VITE_API_URL=http://127.0.0.1:4000/api/v1
```

Restart Vite after changing `.env.local`.

## 3. Adapter

Copy `frontend-bridge/pipeApi.js` to:

`pipe-fn/src/lib/pipeApi.js`

The adapter automatically sends the access token and refreshes it once when the API returns 401.

## 4. Migration order

Switch frontend calls in this order:

1. Auth
2. Profile/settings
3. Accounts
4. Trades
5. Analytics/charts and shared date filters
6. Data export/import

The frontend no longer uses the Supabase client. Configure `VITE_API_URL` and use the included `pipeApi.js`.

## 5. Frontend responsibilities

PDF/Excel export can remain client-side using the already loaded API data. Excel import should validate before sending rows to the trade/account APIs.

Avatar storage is represented by `avatarUrl` in the backend contract. A production object-storage provider can be added without changing profile ownership rules.
