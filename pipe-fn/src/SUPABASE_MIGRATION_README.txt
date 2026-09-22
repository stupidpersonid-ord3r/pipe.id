PIPE.ID Supabase migration notes

1. Supabase Auth is the only authentication system for FN.
2. auth.users.id is the canonical user ID used by FN.
3. profiles.id, accounts.user_id, trades.user_id, and account_transactions.user_id reference auth.users.id.
4. public.users is no longer used and has been removed.
5. pipeApi.js is retained only as pipeApi.js.bn.txt for possible future backend migration; FN must not import it.
