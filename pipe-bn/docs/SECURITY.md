# Security baseline

- No browser-supplied `user_id` is trusted.
- All protected queries filter by authenticated user id.
- Passwords use Node `scrypt` with random salt.
- Refresh tokens are hashed in the database and rotated on refresh.
- Password change and reset revoke active refresh sessions.
- Production requires `DATABASE_URL` and `JWT_SECRET`.
- CORS uses an allow-list.
- Helmet and rate limiting are enabled.
- Validation is performed with Zod before database writes.
- Keep `.env` out of Git.
- Use TLS for deployed API and PostgreSQL connections.
- Add an external email/OTP provider before enabling production recovery flows.
