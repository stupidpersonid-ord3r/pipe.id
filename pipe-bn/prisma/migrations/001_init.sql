create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references users(id) on delete cascade,
  trader_name text,
  journal_name text default 'Trading Journal',
  theme text default 'light',
  avatar_url text,
  backup_email text,
  phone_whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_backup_email_gmail_check check (backup_email is null or backup_email ~ '^[a-z0-9._%+-]+@gmail\\.com$'),
  constraint profiles_phone_check check (phone_whatsapp is null or phone_whatsapp ~ '^\\+[0-9]{6,15}$')
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  account_type text not null default 'LIVE' check (account_type in ('LIVE','DEMO')),
  starting_balance numeric(14,2) not null default 0 check (starting_balance >= 0),
  currency varchar(3) not null default 'USD',
  pair text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_user_id_idx on accounts(user_id);

create table if not exists account_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  type text not null check (type in ('DEPOSIT','WITHDRAWAL')),
  amount numeric(14,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists account_transactions_account_idx on account_transactions(account_id, created_at desc);
create index if not exists account_transactions_user_idx on account_transactions(user_id);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  trade_date date not null,
  pair text not null,
  direction text not null check (direction in ('BUY','SELL')),
  entry_price numeric(18,8) not null,
  exit_price numeric(18,8),
  stop_loss numeric(18,8),
  take_profit numeric(18,8),
  lot_size numeric(12,4) not null default 0,
  result text not null check (result in ('WIN','LOSS','BREAKEVEN')),
  pnl numeric(14,2) not null default 0,
  constraint trades_result_pnl_consistency_check check (
    (result = 'WIN' and pnl > 0)
    or (result = 'LOSS' and pnl < 0)
    or (result = 'BREAKEVEN' and pnl = 0)
  ),
  strategy text,
  session text,
  notes text,
  psychology text not null default 'NEUTRAL' check (psychology in ('GREED','FEAR','NEUTRAL')),
  risk_reward numeric(12,4) check (risk_reward is null or risk_reward > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trades_user_id_idx on trades(user_id);
create index if not exists trades_account_id_idx on trades(account_id);
create index if not exists trades_trade_date_idx on trades(trade_date);
create index if not exists trades_pair_idx on trades(pair);
create index if not exists trades_user_account_date_idx on trades(user_id, account_id, trade_date);

create table if not exists refresh_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists refresh_sessions_user_idx on refresh_sessions(user_id);
create index if not exists refresh_sessions_expiry_idx on refresh_sessions(expires_at);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_user_idx on password_reset_tokens(user_id);


-- PIPE.ID instrument catalog.
-- PIPE.ID - Instrument Catalog
-- Applied by the PIPE.ID PostgreSQL migration.
-- This stores only instrument metadata (NOT price/candle history).

create table if not exists instrument_catalog (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  display_name text,
  asset_type text not null default 'other',
  base_asset text,
  quote_asset text,
  exchange text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instrument_catalog_symbol_key unique (symbol),
  constraint instrument_catalog_asset_type_check check (
    asset_type in ('forex', 'crypto', 'commodities', 'indices', 'stocks', 'futures', 'other')
  )
);

create index if not exists idx_instrument_catalog_symbol
  on instrument_catalog (symbol);

create index if not exists idx_instrument_catalog_asset_type_active
  on instrument_catalog (asset_type, active);

-- Initial Forex catalog.
insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values
  ('AUDCAD', 'Australian Dollar / Canadian Dollar', 'forex', 'AUD', 'CAD', 'FOREX', true),
  ('AUDCHF', 'Australian Dollar / Swiss Franc', 'forex', 'AUD', 'CHF', 'FOREX', true),
  ('AUDJPY', 'Australian Dollar / Japanese Yen', 'forex', 'AUD', 'JPY', 'FOREX', true),
  ('AUDNZD', 'Australian Dollar / New Zealand Dollar', 'forex', 'AUD', 'NZD', 'FOREX', true),
  ('AUDUSD', 'Australian Dollar / US Dollar', 'forex', 'AUD', 'USD', 'FOREX', true),
  ('CADCHF', 'Canadian Dollar / Swiss Franc', 'forex', 'CAD', 'CHF', 'FOREX', true),
  ('CADJPY', 'Canadian Dollar / Japanese Yen', 'forex', 'CAD', 'JPY', 'FOREX', true),
  ('CHFJPY', 'Swiss Franc / Japanese Yen', 'forex', 'CHF', 'JPY', 'FOREX', true),
  ('EURAUD', 'Euro / Australian Dollar', 'forex', 'EUR', 'AUD', 'FOREX', true),
  ('EURCAD', 'Euro / Canadian Dollar', 'forex', 'EUR', 'CAD', 'FOREX', true),
  ('EURCHF', 'Euro / Swiss Franc', 'forex', 'EUR', 'CHF', 'FOREX', true),
  ('EURGBP', 'Euro / British Pound', 'forex', 'EUR', 'GBP', 'FOREX', true),
  ('EURJPY', 'Euro / Japanese Yen', 'forex', 'EUR', 'JPY', 'FOREX', true),
  ('EURNZD', 'Euro / New Zealand Dollar', 'forex', 'EUR', 'NZD', 'FOREX', true),
  ('EURUSD', 'Euro / US Dollar', 'forex', 'EUR', 'USD', 'FOREX', true),
  ('GBPAUD', 'British Pound / Australian Dollar', 'forex', 'GBP', 'AUD', 'FOREX', true),
  ('GBPCAD', 'British Pound / Canadian Dollar', 'forex', 'GBP', 'CAD', 'FOREX', true),
  ('GBPCHF', 'British Pound / Swiss Franc', 'forex', 'GBP', 'CHF', 'FOREX', true),
  ('GBPJPY', 'British Pound / Japanese Yen', 'forex', 'GBP', 'JPY', 'FOREX', true),
  ('GBPNZD', 'British Pound / New Zealand Dollar', 'forex', 'GBP', 'NZD', 'FOREX', true),
  ('GBPUSD', 'British Pound / US Dollar', 'forex', 'GBP', 'USD', 'FOREX', true),
  ('NZDCAD', 'New Zealand Dollar / Canadian Dollar', 'forex', 'NZD', 'CAD', 'FOREX', true),
  ('NZDCHF', 'New Zealand Dollar / Swiss Franc', 'forex', 'NZD', 'CHF', 'FOREX', true),
  ('NZDJPY', 'New Zealand Dollar / Japanese Yen', 'forex', 'NZD', 'JPY', 'FOREX', true),
  ('NZDUSD', 'New Zealand Dollar / US Dollar', 'forex', 'NZD', 'USD', 'FOREX', true),
  ('USDCAD', 'US Dollar / Canadian Dollar', 'forex', 'USD', 'CAD', 'FOREX', true),
  ('USDCHF', 'US Dollar / Swiss Franc', 'forex', 'USD', 'CHF', 'FOREX', true),
  ('USDJPY', 'US Dollar / Japanese Yen', 'forex', 'USD', 'JPY', 'FOREX', true),
  ('XAUUSD', 'Gold / US Dollar', 'commodities', 'XAU', 'USD', 'FOREX', true),
  ('XAGUSD', 'Silver / US Dollar', 'commodities', 'XAG', 'USD', 'FOREX', true)
on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();

-- Initial crypto catalog. These are symbol records only; no market history is stored.
insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values
  ('BTCUSDT', 'Bitcoin / Tether', 'crypto', 'BTC', 'USDT', 'BINANCE', true),
  ('ETHUSDT', 'Ethereum / Tether', 'crypto', 'ETH', 'USDT', 'BINANCE', true),
  ('BNBUSDT', 'BNB / Tether', 'crypto', 'BNB', 'USDT', 'BINANCE', true),
  ('SOLUSDT', 'Solana / Tether', 'crypto', 'SOL', 'USDT', 'BINANCE', true),
  ('XRPUSDT', 'XRP / Tether', 'crypto', 'XRP', 'USDT', 'BINANCE', true),
  ('ADAUSDT', 'Cardano / Tether', 'crypto', 'ADA', 'USDT', 'BINANCE', true),
  ('DOGEUSDT', 'Dogecoin / Tether', 'crypto', 'DOGE', 'USDT', 'BINANCE', true),
  ('AVAXUSDT', 'Avalanche / Tether', 'crypto', 'AVAX', 'USDT', 'BINANCE', true),
  ('DOTUSDT', 'Polkadot / Tether', 'crypto', 'DOT', 'USDT', 'BINANCE', true),
  ('LINKUSDT', 'Chainlink / Tether', 'crypto', 'LINK', 'USDT', 'BINANCE', true),
  ('LTCUSDT', 'Litecoin / Tether', 'crypto', 'LTC', 'USDT', 'BINANCE', true),
  ('BCHUSDT', 'Bitcoin Cash / Tether', 'crypto', 'BCH', 'USDT', 'BINANCE', true),
  ('UNIUSDT', 'Uniswap / Tether', 'crypto', 'UNI', 'USDT', 'BINANCE', true),
  ('ATOMUSDT', 'Cosmos / Tether', 'crypto', 'ATOM', 'USDT', 'BINANCE', true),
  ('ETCUSDT', 'Ethereum Classic / Tether', 'crypto', 'ETC', 'USDT', 'BINANCE', true),
  ('FILUSDT', 'Filecoin / Tether', 'crypto', 'FIL', 'USDT', 'BINANCE', true),
  ('APTUSDT', 'Aptos / Tether', 'crypto', 'APT', 'USDT', 'BINANCE', true),
  ('ARBUSDT', 'Arbitrum / Tether', 'crypto', 'ARB', 'USDT', 'BINANCE', true),
  ('OPUSDT', 'Optimism / Tether', 'crypto', 'OP', 'USDT', 'BINANCE', true),
  ('NEARUSDT', 'NEAR Protocol / Tether', 'crypto', 'NEAR', 'USDT', 'BINANCE', true),
  ('SUIUSDT', 'Sui / Tether', 'crypto', 'SUI', 'USDT', 'BINANCE', true),
  ('INJUSDT', 'Injective / Tether', 'crypto', 'INJ', 'USDT', 'BINANCE', true),
  ('AAVEUSDT', 'Aave / Tether', 'crypto', 'AAVE', 'USDT', 'BINANCE', true),
  ('MATICUSDT', 'Polygon / Tether', 'crypto', 'MATIC', 'USDT', 'BINANCE', true),
  ('ALGOUSDT', 'Algorand / Tether', 'crypto', 'ALGO', 'USDT', 'BINANCE', true),
  ('VETUSDT', 'VeChain / Tether', 'crypto', 'VET', 'USDT', 'BINANCE', true),
  ('ICPUSDT', 'Internet Computer / Tether', 'crypto', 'ICP', 'USDT', 'BINANCE', true),
  ('TRXUSDT', 'TRON / Tether', 'crypto', 'TRX', 'USDT', 'BINANCE', true),
  ('XLMUSDT', 'Stellar / Tether', 'crypto', 'XLM', 'USDT', 'BINANCE', true),
  ('HBARUSDT', 'Hedera / Tether', 'crypto', 'HBAR', 'USDT', 'BINANCE', true),
  ('PEPEUSDT', 'Pepe / Tether', 'crypto', 'PEPE', 'USDT', 'BINANCE', true),
  ('SHIBUSDT', 'Shiba Inu / Tether', 'crypto', 'SHIB', 'USDT', 'BINANCE', true),
  ('FLOKIUSDT', 'FLOKI / Tether', 'crypto', 'FLOKI', 'USDT', 'BINANCE', true),
  ('BONKUSDT', 'Bonk / Tether', 'crypto', 'BONK', 'USDT', 'BINANCE', true),
  ('WIFUSDT', 'dogwifhat / Tether', 'crypto', 'WIF', 'USDT', 'BINANCE', true),
  ('SEIUSDT', 'Sei / Tether', 'crypto', 'SEI', 'USDT', 'BINANCE', true),
  ('TIAUSDT', 'Celestia / Tether', 'crypto', 'TIA', 'USDT', 'BINANCE', true),
  ('RUNEUSDT', 'THORChain / Tether', 'crypto', 'RUNE', 'USDT', 'BINANCE', true),
  ('LDOUSDT', 'Lido DAO / Tether', 'crypto', 'LDO', 'USDT', 'BINANCE', true),
  ('CRVUSDT', 'Curve DAO / Tether', 'crypto', 'CRV', 'USDT', 'BINANCE', true),
  ('MKRUSDT', 'Maker / Tether', 'crypto', 'MKR', 'USDT', 'BINANCE', true),
  ('SANDUSDT', 'The Sandbox / Tether', 'crypto', 'SAND', 'USDT', 'BINANCE', true),
  ('MANAUSDT', 'Decentraland / Tether', 'crypto', 'MANA', 'USDT', 'BINANCE', true),
  ('AXSUSDT', 'Axie Infinity / Tether', 'crypto', 'AXS', 'USDT', 'BINANCE', true),
  ('GALAUSDT', 'Gala / Tether', 'crypto', 'GALA', 'USDT', 'BINANCE', true),
  ('EGLDUSDT', 'MultiversX / Tether', 'crypto', 'EGLD', 'USDT', 'BINANCE', true),
  ('FTMUSDT', 'Fantom / Tether', 'crypto', 'FTM', 'USDT', 'BINANCE', true),
  ('ENSUSDT', 'Ethereum Name Service / Tether', 'crypto', 'ENS', 'USDT', 'BINANCE', true),
  ('COMPUSDT', 'Compound / Tether', 'crypto', 'COMP', 'USDT', 'BINANCE', true),
  ('SNXUSDT', 'Synthetix / Tether', 'crypto', 'SNX', 'USDT', 'BINANCE', true),
  ('1INCHUSDT', '1inch / Tether', 'crypto', '1INCH', 'USDT', 'BINANCE', true),
  ('ZRXUSDT', '0x / Tether', 'crypto', 'ZRX', 'USDT', 'BINANCE', true),
  ('ENJUSDT', 'Enjin Coin / Tether', 'crypto', 'ENJ', 'USDT', 'BINANCE', true)
on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();

  -- ============================================================
-- PIPE.ID - Additional Instrument Catalog v.2
-- ============================================================
-- Existing catalog : 83 instruments
-- Additional       : 142 instruments
-- Final target     : 225 instruments
--
-- Categories:
-- Forex       : +42  -> total 70
-- Commodities : +13  -> total 15
-- Indices     : +25
-- Crypto      : +22  -> total 75
-- Stocks      : +40
-- Futures     : +0
--
-- IMPORTANT:
-- These symbols are additional records only.
-- Existing 83 symbols are NOT repeated intentionally.
-- ON CONFLICT keeps this script safe to re-run.
-- ============================================================


-- ============================================================
-- 1. FOREX
-- Existing : 28
-- Added    : 42
-- Final    : 70
-- ============================================================

insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values

  ('EURPLN', 'Euro / Polish Zloty', 'forex', 'EUR', 'PLN', 'FOREX', true),
  ('EURSEK', 'Euro / Swedish Krona', 'forex', 'EUR', 'SEK', 'FOREX', true),
  ('EURNOK', 'Euro / Norwegian Krone', 'forex', 'EUR', 'NOK', 'FOREX', true),
  ('EURDKK', 'Euro / Danish Krone', 'forex', 'EUR', 'DKK', 'FOREX', true),
  ('EURCZK', 'Euro / Czech Koruna', 'forex', 'EUR', 'CZK', 'FOREX', true),
  ('EURHUF', 'Euro / Hungarian Forint', 'forex', 'EUR', 'HUF', 'FOREX', true),
  ('EURTRY', 'Euro / Turkish Lira', 'forex', 'EUR', 'TRY', 'FOREX', true),
  ('EURZAR', 'Euro / South African Rand', 'forex', 'EUR', 'ZAR', 'FOREX', true),
  ('EURMXN', 'Euro / Mexican Peso', 'forex', 'EUR', 'MXN', 'FOREX', true),
  ('EURSGD', 'Euro / Singapore Dollar', 'forex', 'EUR', 'SGD', 'FOREX', true),
  ('EURHKD', 'Euro / Hong Kong Dollar', 'forex', 'EUR', 'HKD', 'FOREX', true),
  ('EURCNH', 'Euro / Chinese Yuan Offshore', 'forex', 'EUR', 'CNH', 'FOREX', true),
  ('EURILS', 'Euro / Israeli Shekel', 'forex', 'EUR', 'ILS', 'FOREX', true),

  ('GBPPLN', 'British Pound / Polish Zloty', 'forex', 'GBP', 'PLN', 'FOREX', true),
  ('GBPSEK', 'British Pound / Swedish Krona', 'forex', 'GBP', 'SEK', 'FOREX', true),
  ('GBPNOK', 'British Pound / Norwegian Krone', 'forex', 'GBP', 'NOK', 'FOREX', true),
  ('GBPTRY', 'British Pound / Turkish Lira', 'forex', 'GBP', 'TRY', 'FOREX', true),
  ('GBPZAR', 'British Pound / South African Rand', 'forex', 'GBP', 'ZAR', 'FOREX', true),
  ('GBPSGD', 'British Pound / Singapore Dollar', 'forex', 'GBP', 'SGD', 'FOREX', true),

  ('AUDSGD', 'Australian Dollar / Singapore Dollar', 'forex', 'AUD', 'SGD', 'FOREX', true),
  ('AUDHKD', 'Australian Dollar / Hong Kong Dollar', 'forex', 'AUD', 'HKD', 'FOREX', true),
  ('AUDCNH', 'Australian Dollar / Chinese Yuan Offshore', 'forex', 'AUD', 'CNH', 'FOREX', true),

  ('NZDSGD', 'New Zealand Dollar / Singapore Dollar', 'forex', 'NZD', 'SGD', 'FOREX', true),
  ('NZDHKD', 'New Zealand Dollar / Hong Kong Dollar', 'forex', 'NZD', 'HKD', 'FOREX', true),

  ('CADSGD', 'Canadian Dollar / Singapore Dollar', 'forex', 'CAD', 'SGD', 'FOREX', true),
  ('CADNOK', 'Canadian Dollar / Norwegian Krone', 'forex', 'CAD', 'NOK', 'FOREX', true),
  ('CADSEK', 'Canadian Dollar / Swedish Krona', 'forex', 'CAD', 'SEK', 'FOREX', true),

  ('CHFSGD', 'Swiss Franc / Singapore Dollar', 'forex', 'CHF', 'SGD', 'FOREX', true),

  ('USDNOK', 'US Dollar / Norwegian Krone', 'forex', 'USD', 'NOK', 'FOREX', true),
  ('USDSEK', 'US Dollar / Swedish Krona', 'forex', 'USD', 'SEK', 'FOREX', true),
  ('USDDKK', 'US Dollar / Danish Krone', 'forex', 'USD', 'DKK', 'FOREX', true),
  ('USDPLN', 'US Dollar / Polish Zloty', 'forex', 'USD', 'PLN', 'FOREX', true),
  ('USDHUF', 'US Dollar / Hungarian Forint', 'forex', 'USD', 'HUF', 'FOREX', true),
  ('USDCZK', 'US Dollar / Czech Koruna', 'forex', 'USD', 'CZK', 'FOREX', true),
  ('USDTRY', 'US Dollar / Turkish Lira', 'forex', 'USD', 'TRY', 'FOREX', true),
  ('USDZAR', 'US Dollar / South African Rand', 'forex', 'USD', 'ZAR', 'FOREX', true),
  ('USDMXN', 'US Dollar / Mexican Peso', 'forex', 'USD', 'MXN', 'FOREX', true),
  ('USDHKD', 'US Dollar / Hong Kong Dollar', 'forex', 'USD', 'HKD', 'FOREX', true),
  ('USDSGD', 'US Dollar / Singapore Dollar', 'forex', 'USD', 'SGD', 'FOREX', true),
  ('USDTHB', 'US Dollar / Thai Baht', 'forex', 'USD', 'THB', 'FOREX', true),
  ('USDINR', 'US Dollar / Indian Rupee', 'forex', 'USD', 'INR', 'FOREX', true),
  ('USDKRW', 'US Dollar / South Korean Won', 'forex', 'USD', 'KRW', 'FOREX', true)

on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();


-- ============================================================
-- 2. COMMODITIES
-- Existing : 2
-- Added    : 13
-- Final    : 15
-- ============================================================

insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values

  ('XPTUSD', 'Platinum / US Dollar', 'commodities', 'XPT', 'USD', 'FOREX', true),
  ('XPDUSD', 'Palladium / US Dollar', 'commodities', 'XPD', 'USD', 'FOREX', true),
  ('XCUUSD', 'Copper / US Dollar', 'commodities', 'XCU', 'USD', 'FOREX', true),

  ('WTIUSD', 'WTI Crude Oil / US Dollar', 'commodities', 'WTI', 'USD', 'COMMODITIES', true),
  ('BRENTUSD', 'Brent Crude Oil / US Dollar', 'commodities', 'BRENT', 'USD', 'COMMODITIES', true),
  ('NATGAS', 'Natural Gas / US Dollar', 'commodities', 'NATGAS', 'USD', 'COMMODITIES', true),

  ('COCOA', 'Cocoa', 'commodities', 'COCOA', 'USD', 'COMMODITIES', true),
  ('COFFEE', 'Coffee', 'commodities', 'COFFEE', 'USD', 'COMMODITIES', true),
  ('COTTON', 'Cotton', 'commodities', 'COTTON', 'USD', 'COMMODITIES', true),
  ('SUGAR', 'Sugar', 'commodities', 'SUGAR', 'USD', 'COMMODITIES', true),
  ('WHEAT', 'Wheat', 'commodities', 'WHEAT', 'USD', 'COMMODITIES', true),
  ('CORN', 'Corn', 'commodities', 'CORN', 'USD', 'COMMODITIES', true),
  ('SOYBEAN', 'Soybean', 'commodities', 'SOYBEAN', 'USD', 'COMMODITIES', true)

on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();


-- ============================================================
-- 3. INDICES
-- Added : 25
-- ============================================================

insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values

  ('US30', 'Dow Jones Industrial Average', 'indices', 'US30', 'USD', 'INDEX', true),
  ('US500', 'S&P 500', 'indices', 'US500', 'USD', 'INDEX', true),
  ('NAS100', 'Nasdaq 100', 'indices', 'NAS100', 'USD', 'INDEX', true),
  ('US2000', 'Russell 2000', 'indices', 'US2000', 'USD', 'INDEX', true),
  ('VIX', 'CBOE Volatility Index', 'indices', 'VIX', 'USD', 'INDEX', true),

  ('GER40', 'Germany 40', 'indices', 'GER40', 'EUR', 'INDEX', true),
  ('UK100', 'FTSE 100', 'indices', 'UK100', 'GBP', 'INDEX', true),
  ('FRA40', 'France 40', 'indices', 'FRA40', 'EUR', 'INDEX', true),
  ('EU50', 'Euro Stoxx 50', 'indices', 'EU50', 'EUR', 'INDEX', true),
  ('ESP35', 'Spain 35', 'indices', 'ESP35', 'EUR', 'INDEX', true),
  ('ITA40', 'Italy 40', 'indices', 'ITA40', 'EUR', 'INDEX', true),
  ('NED25', 'Netherlands 25', 'indices', 'NED25', 'EUR', 'INDEX', true),

  ('JP225', 'Japan 225', 'indices', 'JP225', 'JPY', 'INDEX', true),
  ('HK50', 'Hong Kong 50', 'indices', 'HK50', 'HKD', 'INDEX', true),
  ('CHN50', 'China 50', 'indices', 'CHN50', 'CNY', 'INDEX', true),
  ('AUS200', 'Australia 200', 'indices', 'AUS200', 'AUD', 'INDEX', true),
  ('SGX50', 'Singapore 50', 'indices', 'SGX50', 'SGD', 'INDEX', true),
  ('IND50', 'India 50', 'indices', 'IND50', 'INR', 'INDEX', true),
  ('KOR200', 'South Korea 200', 'indices', 'KOR200', 'KRW', 'INDEX', true),

  ('CAN60', 'Canada 60', 'indices', 'CAN60', 'CAD', 'INDEX', true),
  ('BRA50', 'Brazil 50', 'indices', 'BRA50', 'BRL', 'INDEX', true),
  ('MEX35', 'Mexico 35', 'indices', 'MEX35', 'MXN', 'INDEX', true),
  ('SA40', 'South Africa 40', 'indices', 'SA40', 'ZAR', 'INDEX', true),
  ('TUR30', 'Turkey 30', 'indices', 'TUR30', 'TRY', 'INDEX', true),
  ('ISR35', 'Israel 35', 'indices', 'ISR35', 'ILS', 'INDEX', true)

on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();


-- ============================================================
-- 4. CRYPTO
-- Existing : 53
-- Added    : 22
-- Final    : 75
-- ============================================================

insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values

  ('BTCUSDC', 'Bitcoin / USD Coin', 'crypto', 'BTC', 'USDC', 'BINANCE', true),
  ('ETHUSDC', 'Ethereum / USD Coin', 'crypto', 'ETH', 'USDC', 'BINANCE', true),
  ('SOLUSDC', 'Solana / USD Coin', 'crypto', 'SOL', 'USDC', 'BINANCE', true),

  ('ATOMUSDC', 'Cosmos / USD Coin', 'crypto', 'ATOM', 'USDC', 'BINANCE', true),
  ('AVAXUSDC', 'Avalanche / USD Coin', 'crypto', 'AVAX', 'USDC', 'BINANCE', true),
  ('LINKUSDC', 'Chainlink / USD Coin', 'crypto', 'LINK', 'USDC', 'BINANCE', true),

  ('BTCFDUSD', 'Bitcoin / First Digital USD', 'crypto', 'BTC', 'FDUSD', 'BINANCE', true),
  ('ETHFDUSD', 'Ethereum / First Digital USD', 'crypto', 'ETH', 'FDUSD', 'BINANCE', true),

  ('LTCUSDC', 'Litecoin / USD Coin', 'crypto', 'LTC', 'USDC', 'BINANCE', true),
  ('XRPUSDC', 'XRP / USD Coin', 'crypto', 'XRP', 'USDC', 'BINANCE', true),

  ('TAOUSDT', 'Bittensor / Tether', 'crypto', 'TAO', 'USDT', 'BINANCE', true),
  ('RENDERUSDT', 'Render / Tether', 'crypto', 'RENDER', 'USDT', 'BINANCE', true),
  ('FETUSDT', 'Artificial Superintelligence Alliance / Tether', 'crypto', 'FET', 'USDT', 'BINANCE', true),
  ('JASMYUSDT', 'JasmyCoin / Tether', 'crypto', 'JASMY', 'USDT', 'BINANCE', true),
  ('THETAUSDT', 'Theta Network / Tether', 'crypto', 'THETA', 'USDT', 'BINANCE', true),
  ('ALICEUSDT', 'MyNeighborAlice / Tether', 'crypto', 'ALICE', 'USDT', 'BINANCE', true),
  ('MAVUSDT', 'Maverick Protocol / Tether', 'crypto', 'MAV', 'USDT', 'BINANCE', true),
  ('IMXUSDT', 'Immutable / Tether', 'crypto', 'IMX', 'USDT', 'BINANCE', true),
  ('STXUSDT', 'Stacks / Tether', 'crypto', 'STX', 'USDT', 'BINANCE', true),
  ('APTUSDC', 'Aptos / USD Coin', 'crypto', 'APT', 'USDC', 'BINANCE', true),
  ('ARBUSDC', 'Arbitrum / USD Coin', 'crypto', 'ARB', 'USDC', 'BINANCE', true),
  ('OPUSDC', 'Optimism / USD Coin', 'crypto', 'OP', 'USDC', 'BINANCE', true)

on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();


-- ============================================================
-- 5. STOCKS
-- Added : 40
--
-- US listed stocks
-- ============================================================

insert into instrument_catalog
  (symbol, display_name, asset_type, base_asset, quote_asset, exchange, active)
values

  ('AAPL', 'Apple Inc.', 'stocks', 'AAPL', 'USD', 'NASDAQ', true),
  ('MSFT', 'Microsoft Corporation', 'stocks', 'MSFT', 'USD', 'NASDAQ', true),
  ('NVDA', 'NVIDIA Corporation', 'stocks', 'NVDA', 'USD', 'NASDAQ', true),
  ('AMZN', 'Amazon.com Inc.', 'stocks', 'AMZN', 'USD', 'NASDAQ', true),
  ('META', 'Meta Platforms Inc.', 'stocks', 'META', 'USD', 'NASDAQ', true),
  ('GOOGL', 'Alphabet Inc. Class A', 'stocks', 'GOOGL', 'USD', 'NASDAQ', true),
  ('GOOG', 'Alphabet Inc. Class C', 'stocks', 'GOOG', 'USD', 'NASDAQ', true),
  ('TSLA', 'Tesla Inc.', 'stocks', 'TSLA', 'USD', 'NASDAQ', true),

  ('AVGO', 'Broadcom Inc.', 'stocks', 'AVGO', 'USD', 'NASDAQ', true),
  ('AMD', 'Advanced Micro Devices Inc.', 'stocks', 'AMD', 'USD', 'NASDAQ', true),
  ('NFLX', 'Netflix Inc.', 'stocks', 'NFLX', 'USD', 'NASDAQ', true),
  ('QCOM', 'Qualcomm Incorporated', 'stocks', 'QCOM', 'USD', 'NASDAQ', true),
  ('INTC', 'Intel Corporation', 'stocks', 'INTC', 'USD', 'NASDAQ', true),
  ('AMAT', 'Applied Materials Inc.', 'stocks', 'AMAT', 'USD', 'NASDAQ', true),
  ('MU', 'Micron Technology Inc.', 'stocks', 'MU', 'USD', 'NASDAQ', true),
  ('ADBE', 'Adobe Inc.', 'stocks', 'ADBE', 'USD', 'NASDAQ', true),
  ('CSCO', 'Cisco Systems Inc.', 'stocks', 'CSCO', 'USD', 'NASDAQ', true),
  ('INTU', 'Intuit Inc.', 'stocks', 'INTU', 'USD', 'NASDAQ', true),
  ('COST', 'Costco Wholesale Corporation', 'stocks', 'COST', 'USD', 'NASDAQ', true),
  ('PEP', 'PepsiCo Inc.', 'stocks', 'PEP', 'USD', 'NASDAQ', true),

  ('JPM', 'JPMorgan Chase & Co.', 'stocks', 'JPM', 'USD', 'NYSE', true),
  ('V', 'Visa Inc.', 'stocks', 'V', 'USD', 'NYSE', true),
  ('MA', 'Mastercard Incorporated', 'stocks', 'MA', 'USD', 'NYSE', true),
  ('BAC', 'Bank of America Corporation', 'stocks', 'BAC', 'USD', 'NYSE', true),
  ('WMT', 'Walmart Inc.', 'stocks', 'WMT', 'USD', 'NYSE', true),
  ('JNJ', 'Johnson & Johnson', 'stocks', 'JNJ', 'USD', 'NYSE', true),
  ('XOM', 'Exxon Mobil Corporation', 'stocks', 'XOM', 'USD', 'NYSE', true),
  ('CVX', 'Chevron Corporation', 'stocks', 'CVX', 'USD', 'NYSE', true),
  ('KO', 'The Coca-Cola Company', 'stocks', 'KO', 'USD', 'NYSE', true),
  ('DIS', 'The Walt Disney Company', 'stocks', 'DIS', 'USD', 'NYSE', true),

  ('CRM', 'Salesforce Inc.', 'stocks', 'CRM', 'USD', 'NYSE', true),
  ('ORCL', 'Oracle Corporation', 'stocks', 'ORCL', 'USD', 'NYSE', true),
  ('IBM', 'International Business Machines', 'stocks', 'IBM', 'USD', 'NYSE', true),
  ('UBER', 'Uber Technologies Inc.', 'stocks', 'UBER', 'USD', 'NYSE', true),
  ('SHOP', 'Shopify Inc.', 'stocks', 'SHOP', 'USD', 'NYSE', true),
  ('PLTR', 'Palantir Technologies Inc.', 'stocks', 'PLTR', 'USD', 'NASDAQ', true),
  ('COIN', 'Coinbase Global Inc.', 'stocks', 'COIN', 'USD', 'NASDAQ', true),
  ('MSTR', 'Strategy Inc.', 'stocks', 'MSTR', 'USD', 'NASDAQ', true),
  ('PYPL', 'PayPal Holdings Inc.', 'stocks', 'PYPL', 'USD', 'NASDAQ', true),
  ('SNOW', 'Snowflake Inc.', 'stocks', 'SNOW', 'USD', 'NYSE', true)

on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_type = excluded.asset_type,
  base_asset = excluded.base_asset,
  quote_asset = excluded.quote_asset,
  exchange = excluded.exchange,
  active = excluded.active,
  updated_at = now();


-- ============================================================
-- 6. OPTIONAL: VERIFY TOTAL
-- ============================================================

select
  asset_type,
  count(*) as total
from instrument_catalog
where active = true
group by asset_type
order by
  case asset_type
    when 'forex' then 1
    when 'commodities' then 2
    when 'indices' then 3
    when 'crypto' then 4
    when 'stocks' then 5
    when 'futures' then 6
    else 7
  end;


-- ============================================================
-- EXPECTED RESULT
--
-- commodities : 15
-- crypto      : 75
-- forex       : 70
-- indices     : 25
-- stocks      : 40
-- ----------------
-- TOTAL       : 225
-- ============================================================

select count(*) as total_active_instruments
from instrument_catalog
where active = true;
