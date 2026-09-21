import { supabase } from "./supabaseClient";

const TEST_USER_ID = "309cc0ae-6b6b-420f-8e62-947653629601";

export async function testSupabase() {
  const profile = await supabase
    .from("profiles")
    .select("id,trader_name,journal_name,theme")
    .eq("id", TEST_USER_ID)
    .maybeSingle();

  const accounts = await supabase
    .from("accounts")
    .select("id,name,account_type,starting_balance,currency,pair")
    .eq("user_id", TEST_USER_ID)
    .order("created_at", { ascending: true });

  const trades = await supabase
    .from("trades")
    .select("id,trade_date,pair,direction,result,pnl,account_id")
    .eq("user_id", TEST_USER_ID)
    .order("trade_date", { ascending: false });

  const instruments = await supabase
    .from("instrument_catalog")
    .select("symbol,display_name,asset_type")
    .eq("active", true)
    .limit(5);

  return {
    profile,
    accounts,
    trades,
    instruments,
  };
}