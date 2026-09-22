import { createSupabaseApi } from "./supabaseApi";
import { supabase } from "./supabaseClient";

export async function getDataProvider() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("A valid Supabase user is required.");

  return createSupabaseApi(user.id);
}
