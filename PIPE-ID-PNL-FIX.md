# PIPE.ID PnL Result Fix

## Behavior
- WIN: enter the profit amount only; PnL is stored positive.
- LOSS: enter the loss amount only; PnL is stored negative automatically.
- BREAKEVEN: PnL is forced to 0.
- Changing Result automatically re-signs the existing PnL amount.
- The PnL input shows the appropriate `+` / `−` prefix.

## Backend/database guard
- Backend validates the Result/PnL invariant.
- PostgreSQL migration adds `trades_result_pnl_consistency_check`.
- Supabase migration: `pipe-fn/supabase/trade_result_pnl_constraint.sql`.

Invariant:
- WIN -> pnl > 0
- LOSS -> pnl < 0
- BREAKEVEN -> pnl = 0
