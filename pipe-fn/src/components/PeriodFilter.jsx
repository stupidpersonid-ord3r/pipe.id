import { CalendarDays } from "lucide-react";
import { PRESETS } from "./periodFilterUtils";

export default function PeriodFilter({
  t,
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CalendarDays size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              {t("period")}
            </p>

            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t(
                period === "custom"
                  ? "customRange"
                  : PRESETS.find(
                      ([value]) => value === period
                    )?.[1] || "allTime"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(([value, key]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  period === value
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>

          {period === "custom" ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{t("from")}</span>

                <input
                  type="date"
                  value={customStart}
                  onChange={(event) =>
                    setCustomStart(event.target.value)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{t("to")}</span>

                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(event) =>
                    setCustomEnd(event.target.value)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}