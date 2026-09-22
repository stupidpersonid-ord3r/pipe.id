import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocation } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";

import { useAuth } from "../hooks/useAuth";

import { JournalDataContext } from "./JournalDataContextValue";

import { getRiskReward } from "../utils/riskReward";

const REFRESH_INTERVALS = [15000, 30000, 60000, 300000];

function normalizeTrade(trade) {
  return {
    ...trade,
    psychology: ["GREED", "FEAR", "NEUTRAL"].includes(trade.psychology)
      ? trade.psychology
      : "NEUTRAL",

    tradeDate: trade.trade_date,
    accountId: trade.account_id,
    accountName: trade.account_name ?? "Unknown Account",
    entryPrice: trade.entry_price,
    stopLoss: trade.stop_loss,
    takeProfit: trade.take_profit,
    lotSize: trade.lot_size,
    riskReward: getRiskReward(trade),
    createdAt: trade.created_at,
  };
}

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    accountId: transaction.account_id,
    type: transaction.transaction_type,
    transactionDate: transaction.transaction_date,
  };
}

function calculateAccountBalance(account, trades, transactions) {
  const initial = Number(
    account.starting_balance ?? account.balance ?? 0
  );

  const tx = transactions.filter(
    (item) => item.account_id === account.id
  );

  const deposits = tx
    .filter((item) => item.transaction_type === "DEPOSIT")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const withdrawals = tx
    .filter((item) => item.transaction_type === "WITHDRAWAL")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pnl = trades
    .filter((item) => item.accountId === account.id)
    .reduce((sum, item) => sum + Number(item.pnl || 0), 0);

  return {
    ...account,
    current_balance: initial + deposits - withdrawals + pnl,
    deposits,
    withdrawals,
    trading_pnl: pnl,
  };
}

async function getPipeUserId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("You must be logged in.");

  return user.id;
}

async function fetchAllTrades() {
  const { data, error } = await supabase
    .from("trades")
    .select(`
      *,
      accounts (
        name
      )
    `)
    .order("trade_date", { ascending: false });

  if (error) throw error;

  return (data || []).map((trade) => ({
    ...trade,
    account_name: trade.accounts?.name ?? "Unknown Account",
  }));
}

export function JournalDataProvider({ children }) {
  const { user } = useAuth();

  const location = useLocation();

  const needsTrades = useMemo(() => {
    const path = location.pathname;

    return (
      path === "/" ||
      path.startsWith("/dashboard") ||
      path.startsWith("/analytics") ||
      path.startsWith("/charts") ||
      path.startsWith("/trades") ||
      path.startsWith("/calendar") ||
      path.startsWith("/accounts") ||
      path.startsWith("/settings/data")
    );
  }, [location.pathname]);

  const [accounts, setAccounts] = useState([]);
  const [trades, setTrades] = useState([]);
  const [accountTransactions, setAccountTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAccountState, setSelectedAccountState] = useState(
    () =>
      localStorage.getItem("trading_journal_active_account") || ""
  );

  const [autoRefresh, setAutoRefreshState] = useState(
    () =>
      localStorage.getItem("trading_journal_auto_refresh") !== "off"
  );

  const [refreshInterval, setRefreshIntervalState] = useState(() => {
    const stored = Number(
      localStorage.getItem("trading_journal_refresh_interval")
    );

    return REFRESH_INTERVALS.includes(stored) ? stored : 15000;
  });

  const refreshInFlight = useRef(false);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (refreshInFlight.current) return;

      refreshInFlight.current = true;

      try {
        if (!user) {
          setAccounts([]);
          setTrades([]);
          setAccountTransactions([]);
          setLoading(false);
          return;
        }

        if (!silent) setLoading(true);

        setError("");

        const { data: accountsData, error: accountsError } =
          await supabase
            .from("accounts")
            .select("*")
            .order("created_at", { ascending: true });

        if (accountsError) throw accountsError;

        let normalizedTrades = [];

        if (needsTrades) {
          normalizedTrades = (await fetchAllTrades()).map(
            normalizeTrade
          );
        }

        const { data: transactionsData, error: transactionsError } =
          await supabase
            .from("account_transactions")
            .select("*")
            .order("transaction_date", { ascending: false });

        if (transactionsError) throw transactionsError;

        const transactions = (transactionsData || []).map(
          normalizeTransaction
        );

        setTrades(normalizedTrades);
        setAccountTransactions(transactions);

        setAccounts(
          (accountsData || []).map((account) =>
            calculateAccountBalance(
              account,
              normalizedTrades,
              transactions
            )
          )
        );
      } catch (e) {
        setError(
          e.message || "Failed to load journal data."
        );
      } finally {
        setLoading(false);
        refreshInFlight.current = false;
      }
    },
    [user, needsTrades]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (!user || !autoRefresh) return undefined;

    const interval = window.setInterval(() => {
      void loadData({ silent: true });
    }, refreshInterval);

    return () => window.clearInterval(interval);
  }, [user, autoRefresh, refreshInterval, loadData]);

  const addAccount = useCallback(
    async (account) => {
      if (!user) {
        throw new Error("You must be logged in.");
      }

      const pipeUserId = await getPipeUserId();

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: pipeUserId,
          name: account.name,
          account_type:
            account.accountType ||
            account.account_type ||
            "LIVE",
          starting_balance: Number(
            account.startingBalance ??
              account.starting_balance ??
              0
          ),
          currency: account.currency || "USD",
          pair: account.pair ?? null,
        })
        .select("*")
        .single();

      if (error) throw error;

      await loadData();

      return data;
    },
    [user, loadData]
  );

  const renameAccount = useCallback(
    async (id, name) => {
      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { data, error } = await supabase
        .from("accounts")
        .update({
          name: name.trim(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      await loadData();

      return data;
    },
    [user, loadData]
  );

  const addAccountTransaction = useCallback(
    async ({ accountId, type, amount, note = null }) => {
      if (!user) {
        throw new Error("You must be logged in.");
      }

      const value = Number(amount);

      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Amount must be greater than zero.");
      }

      const pipeUserId = await getPipeUserId();

      const transactionType =
        type === "WITHDRAWAL"
          ? "WITHDRAWAL"
          : "DEPOSIT";

      const { data, error } = await supabase
        .from("account_transactions")
        .insert({
          user_id: pipeUserId,
          account_id: accountId,
          transaction_type: transactionType,
          amount: value,
          note,
          transaction_date: new Date()
            .toISOString()
            .slice(0, 10),
        })
        .select("*")
        .single();

      if (error) throw error;

      await loadData();

      return normalizeTransaction(data);
    },
    [user, loadData]
  );

  const deleteAccount = useCallback(
    async (id) => {
      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (selectedAccountState === id) {
        setSelectedAccountState("");
        localStorage.removeItem(
          "trading_journal_active_account"
        );
      }

      await loadData();
    },
    [user, loadData, selectedAccountState]
  );

  const selectedAccountId = useMemo(() => {
    if (
      !selectedAccountState ||
      selectedAccountState === "all"
    ) {
      return selectedAccountState;
    }

    return accounts.some(
      (account) => account.id === selectedAccountState
    )
      ? selectedAccountState
      : "";
  }, [accounts, selectedAccountState]);

  const visibleTrades = useMemo(
    () =>
      !selectedAccountId ||
      selectedAccountId === "all"
        ? []
        : trades.filter(
            (trade) => trade.accountId === selectedAccountId
          ),
    [trades, selectedAccountId]
  );

  const selectedAccount = useMemo(
    () =>
      selectedAccountId
        ? accounts.find(
            (account) => account.id === selectedAccountId
          ) || null
        : null,
    [accounts, selectedAccountId]
  );

  const selectAccount = useCallback((id) => {
    const value = id || "";

    setSelectedAccountState(value);

    localStorage.setItem(
      "trading_journal_active_account",
      value
    );
  }, []);

  const setAutoRefresh = useCallback((enabled) => {
    const value = Boolean(enabled);

    setAutoRefreshState(value);

    localStorage.setItem(
      "trading_journal_auto_refresh",
      value ? "on" : "off"
    );
  }, []);

  const setRefreshInterval = useCallback((value) => {
    const next = Number(value);

    if (!REFRESH_INTERVALS.includes(next)) return;

    setRefreshIntervalState(next);

    localStorage.setItem(
      "trading_journal_refresh_interval",
      String(next)
    );
  }, []);

  const value = useMemo(
    () => ({
      accounts,
      trades,
      visibleTrades,
      accountTransactions,
      selectedAccountId,
      selectedAccount,
      selectAccount,
      loading,
      error,
      refresh: loadData,
      autoRefresh,
      setAutoRefresh,
      refreshInterval,
      setRefreshInterval,
      addAccount,
      renameAccount,
      addAccountTransaction,
      deleteAccount,
    }),
    [
      accounts,
      trades,
      visibleTrades,
      accountTransactions,
      selectedAccountId,
      selectedAccount,
      selectAccount,
      loading,
      error,
      loadData,
      autoRefresh,
      setAutoRefresh,
      refreshInterval,
      setRefreshInterval,
      addAccount,
      renameAccount,
      addAccountTransaction,
      deleteAccount,
    ]
  );

  return (
    <JournalDataContext.Provider value={value}>
      {children}
    </JournalDataContext.Provider>
  );
}