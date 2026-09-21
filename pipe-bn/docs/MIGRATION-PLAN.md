# Migration plan

1. Migrate the existing frontend from Supabase to the PIPE.ID API.
2. Configure PostgreSQL for pipe-bn and apply the migration.
3. Migrate/auth-test users, profiles, accounts, transactions and trades.
4. Connect pipe-fn auth/profile/accounts.
5. Connect trades.
6. Connect analytics and shared date filters.
7. Verify counts, P&L, win rate, account isolation and exports.
8. Keep a verified backup/export of the old data until production cutover is complete.
9. Remove the old Supabase dependency after API verification.
