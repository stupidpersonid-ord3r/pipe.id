import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Loader2, Search } from "lucide-react";
import { fetchInstruments, sortInstruments } from "../lib/instruments";
import { useLanguage } from "../hooks/useLanguage";

const TYPE_LABEL_KEYS = {
  forex: "forex",
  crypto: "crypto",
  commodities: "commodities",
  indices: "indices",
  stocks: "stocks",
  futures: "futures",
  other: "other",
};

function InstrumentPicker({ value, onChange, required = false }) {
  const { t } = useLanguage();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchInstruments();
        if (!cancelled) setInstruments(sortInstruments(data));
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || t("instrumentLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selected = useMemo(
    () =>
      instruments.find((item) => item.symbol === value) ||
      (value ? { symbol: value, display_name: t("legacyPair") } : null),
    [instruments, value, t]
  );

  const groups = useMemo(() => {
    const grouped = new Map();
    instruments.forEach((item) => {
      const type = item.asset_type || "other";
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type).push(item);
    });
    return [...grouped.entries()];
  }, [instruments]);

  const activeItems = useMemo(() => {
    const items = instruments.filter((item) => (item.asset_type || "other") === category);
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.symbol, item.display_name, item.base_asset, item.quote_asset, item.exchange]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [category, instruments, search]);

  function openPicker() {
    setOpen((current) => !current);
    if (!category && selected) setCategory(selected.asset_type || "other");
  }

  function selectCategory(type) {
    setCategory(type);
    setSearch("");
  }

  function selectInstrument(instrument) {
    onChange(instrument.symbol);
    setSearch("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${open ? "instrument-picker-open" : ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={openPicker}
        className="select-trigger flex w-full items-center justify-between gap-3 px-3 text-left"
      >
        <span className={selected ? "font-semibold" : "text-slate-400"}>
          {selected ? selected.symbol : t("selectPair")}
        </span>
        {loading ? <Loader2 size={16} className="shrink-0 animate-spin text-slate-400" /> : <ChevronDown size={17} className="shrink-0 text-slate-400" />}
      </button>

      {open && (
        <div className="select-menu absolute z-[100] mt-2 w-full overflow-hidden rounded-2xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              {t("loadingInstruments")}
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-sm text-red-500">{error}</div>
          ) : !category ? (
            <div className="p-3">
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("selectPair")}</div>
              <div className="grid gap-1 sm:grid-cols-2">
                {groups.map(([type, items]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectCategory(type)}
                    className="select-menu-item flex items-center justify-between rounded-xl px-3 py-3 text-left transition"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{t(TYPE_LABEL_KEYS[type] || "other")}</span>
                      <span className="block text-xs text-slate-400">{items.length} {t("pairs")}</span>
                    </span>
                    <ChevronDown size={15} className="-rotate-90 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setCategory(null); setSearch(""); }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={t("back")}
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{t(TYPE_LABEL_KEYS[category] || "other")}</div>
                  <div className="text-[11px] text-slate-400">{activeItems.length} {t("pairs")}</div>
                </div>
              </div>
              <div className="border-b border-slate-200 p-3 dark:border-slate-800">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("searchPair")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {activeItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">{t("noPairFound")}</div>
                ) : (
                  activeItems.map((instrument) => {
                    const isSelected = instrument.symbol === value;
                    return (
                      <button
                        key={instrument.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectInstrument(instrument)}
                        className={`select-menu-item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${isSelected ? "is-selected" : ""}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{instrument.symbol}</span>
                          <span className="block truncate text-xs text-slate-400">{instrument.display_name || [instrument.base_asset, instrument.quote_asset].filter(Boolean).join(" / ") || instrument.exchange || "—"}</span>
                        </span>
                        {isSelected && <Check size={17} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      <input type="text" tabIndex={-1} value={value || ""} required={required} readOnly className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden="true" />
    </div>
  );
}

export default InstrumentPicker;
