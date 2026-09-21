# PIPE.ID Frontend ↔ Backend Integration

This frontend package is cleaned and prepared for the PIPE.ID backend (`pipe-bn`).

The frontend uses `src/lib/pipeApi.js` as the runtime data-access layer for `pipe-bn`.

## Environment

Set `VITE_API_URL=http://127.0.0.1:4000/api/v1` in `.env.local` when starting API integration.

Do not commit `.env` or `.env.local`.

## Important

- `node_modules/`, `.env`, `.git/`, and `dist/` are intentionally excluded from this source package.
- The frontend no longer requires the Supabase JavaScript SDK.
