import { supabase } from "./supabaseClient";

function throwSupabaseError(error, fallback = "Supabase request failed.") {
  if (!error) return;

  const next = new Error(error.message || fallback);
  next.code = error.code;
  next.status = error.status;
  throw next;
}

function createSupabaseApi(userId) {
  if (!userId) {
    throw new Error("A valid PIPE.ID user is required.");
  }

  return {
    profile: {
      async get() {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        throwSupabaseError(error);
        return data;
      },

      async update(values) {
        const payload = {
          id: userId,
          trader_name: values.traderName ?? null,
          journal_name: values.journalName ?? "PIPE.ID",
          theme: values.theme ?? "light",
          avatar_url: values.avatarUrl ?? null,
          backup_email: values.backupEmail ?? null,
          phone_whatsapp: values.phoneWhatsapp ?? null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("profiles")
          .upsert(payload)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },
    },

    accounts: {
      async list() {
        const { data, error } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        throwSupabaseError(error);
        return data || [];
      },

      async get(id) {
        const { data, error } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle();

        throwSupabaseError(error);
        return data;
      },

      async create(account) {
        const payload = {
          user_id: userId,
          name: account.name,
          account_type: account.accountType || "LIVE",
          starting_balance: Number(account.startingBalance ?? 0),
          currency: account.currency || "USD",
          pair: account.pair ?? null,
        };

        const { data, error } = await supabase
          .from("accounts")
          .insert(payload)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },

      async update(id, values) {
        const payload = {};

        if (values.name !== undefined) payload.name = values.name;
        if (values.accountType !== undefined) {
          payload.account_type = values.accountType;
        }
        if (values.startingBalance !== undefined) {
          payload.starting_balance = Number(values.startingBalance);
        }
        if (values.currency !== undefined) {
          payload.currency = values.currency;
        }
        if (values.pair !== undefined) {
          payload.pair = values.pair;
        }

        const { data, error } = await supabase
          .from("accounts")
          .update(payload)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },

      async remove(id) {
        const { error } = await supabase
          .from("accounts")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        throwSupabaseError(error);
        return { success: true };
      },


      async deposit(id, body) {
        const payload = {
          user_id: userId,
          account_id: id,
          transaction_type: "DEPOSIT",
          amount: Number(body.amount),
          note: body.note ?? null,
        };

        const { data, error } = await supabase
          .from("account_transactions")
          .insert(payload)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },

      async withdraw(id, body) {
        const payload = {
          user_id: userId,
          account_id: id,
          transaction_type: "WITHDRAWAL",
          amount: Number(body.amount),
          note: body.note ?? null,
        };

        const { data, error } = await supabase
          .from("account_transactions")
          .insert(payload)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },

      async transactions(id) {
        const { data, error } = await supabase
          .from("account_transactions")
          .select("*")
          .eq("account_id", id)
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        throwSupabaseError(error);
        return data || [];
      },
    },

    trades: {
      async list() {
        const { data, error } = await supabase
          .from("trades")
          .select(`
            *,
            accounts (
              name,
              currency,
              account_type
            )
          `)
          .eq("user_id", userId)
          .order("trade_date", { ascending: false })
          .order("created_at", { ascending: false });

        throwSupabaseError(error);

        return {
          data: (data || []).map((trade) => ({
            ...trade,
            account_name: trade.accounts?.name ?? null,
            account_currency: trade.accounts?.currency ?? null,
            account_type: trade.accounts?.account_type ?? null,
          })),
        };
      },

      async get(id) {
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle();

        throwSupabaseError(error);
        return data;
      },

      async create(trade) {
        const payload = {
          user_id: userId,
          account_id: trade.accountId,
          trade_date: trade.tradeDate,
          pair: trade.pair,
          direction: trade.direction,
          entry_price: trade.entryPrice,
          exit_price: trade.exitPrice ?? null,
          stop_loss: trade.stopLoss ?? null,
          take_profit: trade.takeProfit ?? null,
          lot_size: trade.lotSize ?? 0,
          result: trade.result,
          pnl: trade.pnl ?? 0,
          strategy: trade.strategy ?? null,
          session: trade.session ?? null,
          notes: trade.notes ?? null,
          psychology: trade.psychology ?? "NEUTRAL",
          risk_reward: trade.riskReward ?? null,
        };

        const { data, error } = await supabase
          .from("trades")
          .insert(payload)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },

      async update(id, trade) {
        const payload = {};

        const fields = {
          accountId: "account_id",
          tradeDate: "trade_date",
          pair: "pair",
          direction: "direction",
          entryPrice: "entry_price",
          exitPrice: "exit_price",
          stopLoss: "stop_loss",
          takeProfit: "take_profit",
          lotSize: "lot_size",
          result: "result",
          pnl: "pnl",
          strategy: "strategy",
          session: "session",
          notes: "notes",
          psychology: "psychology",
          riskReward: "risk_reward",
        };

        Object.entries(fields).forEach(([source, target]) => {
          if (trade[source] !== undefined) {
            payload[target] = trade[source];
          }
        });

        const { data, error } = await supabase
          .from("trades")
          .update(payload)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
          .single();

        throwSupabaseError(error);
        return data;
      },

      async remove(id) {
        const { error } = await supabase
          .from("trades")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        throwSupabaseError(error);
        return { success: true };
      },
    },

    instruments: async () => {
      const { data, error } = await supabase
        .from("instrument_catalog")
        .select("*")
        .eq("active", true)
        .order("asset_type", { ascending: true })
        .order("symbol", { ascending: true });

      throwSupabaseError(error);
      return data || [];
    },
  };
}

export { createSupabaseApi };