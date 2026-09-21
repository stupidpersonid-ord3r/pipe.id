create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  trader_name text,
  journal_name text,
  theme text,
  avatar_url text,
  backup_email text,
  phone_whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  account_type text not null default 'LIVE'
    check (account_type in ('LIVE', 'DEMO')),
  starting_balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  pair text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx
  on public.accounts(user_id);

create table if not exists public.account_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  transaction_type text not null
    check (transaction_type in ('DEPOSIT', 'WITHDRAWAL')),
  amount numeric(14,2) not null check (amount > 0),
  note text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists account_transactions_user_id_idx
  on public.account_transactions(user_id);

create index if not exists account_transactions_account_id_idx
  on public.account_transactions(account_id);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  trade_date date not null,
  pair text not null,
  direction text not null,
  entry_price numeric(18,8) not null,
  exit_price numeric(18,8),
  stop_loss numeric(18,8),
  take_profit numeric(18,8),
  lot_size numeric(18,8) not null default 0,
  result text not null,
  pnl numeric(18,2) not null,
  strategy text,
  session text,
  notes text,
  psychology text not null default 'NEUTRAL',
  risk_reward numeric(10,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trades_user_id_idx
  on public.trades(user_id);

create index if not exists trades_account_id_idx
  on public.trades(account_id);

create index if not exists trades_trade_date_idx
  on public.trades(trade_date);

create index if not exists trades_user_date_idx
  on public.trades(user_id, trade_date);

create index if not exists trades_user_account_idx
  on public.trades(user_id, account_id);

create table if not exists public.refresh_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists refresh_sessions_user_id_idx
  on public.refresh_sessions(user_id);

create index if not exists refresh_sessions_expires_at_idx
  on public.refresh_sessions(expires_at);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens(user_id);

create index if not exists password_reset_tokens_expires_at_idx
  on public.password_reset_tokens(expires_at);

create table if not exists public.instrument_catalog (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  display_name text,
  asset_type text,
  base_asset text,
  quote_asset text,
  exchange text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instrument_catalog_symbol_idx
  on public.instrument_catalog(symbol);

create index if not exists instrument_catalog_asset_type_idx
  on public.instrument_catalog(asset_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists trades_set_updated_at on public.trades;
create trigger trades_set_updated_at
before update on public.trades
for each row
execute function public.set_updated_at();

drop trigger if exists instrument_catalog_set_updated_at
on public.instrument_catalog;

create trigger instrument_catalog_set_updated_at
before update on public.instrument_catalog
for each row
execute function public.set_updated_at();