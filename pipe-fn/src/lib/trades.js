// Trade persistence is handled through the PIPE.ID backend API.
// No localStorage trade database is used.
export const PSYCHOLOGY_VALUES = ["GREED", "FEAR", "NEUTRAL"];

export function normalizePsychology(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return PSYCHOLOGY_VALUES.includes(normalized) ? normalized : "NEUTRAL";
}
