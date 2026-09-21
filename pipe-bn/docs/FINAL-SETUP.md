# Final backend setup

This is the only backend setup required before connecting the frontend.

## 1. PostgreSQL

Create an empty PostgreSQL database for PIPE.ID.

## 2. `.env`

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=32-or-more-random-characters
```

Keep `.env` out of Git.

## 3. Dependencies

This final backend introduces the PostgreSQL driver, so if the old `pipe-bn/node_modules` does not already contain `pg`, run **one**:

```powershell
npm install
```

There is no repeated install after that unless `package.json` changes.

## 4. Database migration

```powershell
npm run db:migrate
npm run db:check
```

## 5. Validate and start

```powershell
npm run check
npm run build
npm run dev
```

Expected:

- `/` returns API ready status.
- `/health` reports `database: connected`.

## 6. Connect frontend

In `pipe-fn/.env.local`:

```env
VITE_API_URL=http://127.0.0.1:4000/api/v1
```

The frontend already contains the PIPE API client and no longer requires the Supabase JavaScript SDK.
