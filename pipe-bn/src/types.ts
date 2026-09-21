export type AccountType = "LIVE" | "DEMO";
export type TradeDirection = "BUY" | "SELL";
export type TradeResult = "WIN" | "LOSS" | "BREAKEVEN";
export type Psychology = "GREED" | "FEAR" | "NEUTRAL";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL";

export interface ProfileRecord {
  id: string;
  trader_name: string | null;
  journal_name: string | null;
  theme: string | null;
  avatar_url: string | null;
  backup_email: string | null;
  phone_whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface AccountRecord {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  starting_balance: number;
  currency: string;
  pair: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountTransactionRecord {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface TradeRecord {
  id: string;
  user_id: string;
  account_id: string | null;
  trade_date: string;
  pair: string;
  direction: TradeDirection;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  result: TradeResult;
  pnl: number;
  strategy: string | null;
  session: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  psychology: Psychology;
  risk_reward: number | null;
}
