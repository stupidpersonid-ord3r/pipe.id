# PIPE.ID

PIPE.ID is now organized as a single npm workspace:

- `pipe-fn/` — React/Vite frontend
- `pipe-bn/` — Fastify/PostgreSQL backend
- one `node_modules/` at the repository root
- one root `.env` for local development
- Supabase is no longer a runtime dependency

## Requirements

- Node.js 24+
- npm 10+
- PostgreSQL 14+ (or a compatible PostgreSQL server)

## First setup

From the `PIPE.ID` root:

```bash
npm install
copy .env.example .env
```

On PowerShell, the second command is:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set a real PostgreSQL `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters.

## Database

Run:

```bash
npm run db:migrate
npm run db:check
```

## Development

Open two terminals in the `PIPE.ID` root.

Terminal 1 — backend:

```bash
npm run dev:bn
```

Backend:
`http://127.0.0.1:4000`

Terminal 2 — frontend:

```bash
npm run dev:fn
```

Frontend:
`http://127.0.0.1:5173`

## Validation

```bash
npm run check:bn
npm run lint
npm run build
```

## Important

Do not commit `.env`. The repository only contains `.env.example`.

The old Supabase frontend client and legacy Supabase SQL folder were removed from this package. The existing Supabase project should remain untouched until its data has been migrated and verified in the new PostgreSQL database.
