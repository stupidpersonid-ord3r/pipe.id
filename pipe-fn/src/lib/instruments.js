import { pipeApi } from "./pipeApi";
export async function fetchInstruments() { return pipeApi.instruments(); }
export const ASSET_TYPE_ORDER = ["forex", "crypto", "commodities", "indices", "stocks", "futures", "other"];
export function sortInstruments(items) { return [...items].sort((a, b) => { const typeA = ASSET_TYPE_ORDER.indexOf(a.asset_type); const typeB = ASSET_TYPE_ORDER.indexOf(b.asset_type); const rankA = typeA === -1 ? 999 : typeA; const rankB = typeB === -1 ? 999 : typeB; if (rankA !== rankB) return rankA - rankB; return String(a.symbol).localeCompare(String(b.symbol)); }); }
