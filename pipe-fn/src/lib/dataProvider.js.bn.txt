import { pipeApi } from "./pipeApi";
import { createSupabaseApi } from "./supabaseApi";

export function getDataProvider(user) {
  const provider = import.meta.env.VITE_DATA_PROVIDER || "bn";

  if (provider === "supabase") {
    if (!user?.id) {
      throw new Error("A valid PIPE.ID user is required.");
    }

    return createSupabaseApi(user.id);
  }

  return pipeApi;
}