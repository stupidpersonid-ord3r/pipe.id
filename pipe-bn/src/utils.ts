import type { AccountRecord, AccountTransactionRecord, TradeRecord } from "./types.js";

export function accountBalance(account: AccountRecord, txs: AccountTransactionRecord[], accountTrades: TradeRecord[]) {
  const deposits = txs.filter((tx) => tx.type === "DEPOSIT").reduce((sum, tx) => sum + tx.amount, 0);
  const withdrawals = txs.filter((tx) => tx.type === "WITHDRAWAL").reduce((sum, tx) => sum + tx.amount, 0);
  const tradingPnl = accountTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  return {
    current_balance: account.starting_balance + deposits - withdrawals + tradingPnl,
    deposits,
    withdrawals,
    trading_pnl: tradingPnl,
  };
}

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function sortTrades(tradeList: TradeRecord[]) {
  return [...tradeList].sort((a, b) => {
    const date = b.trade_date.localeCompare(a.trade_date);
    return date || b.created_at.localeCompare(a.created_at);
  });
}
