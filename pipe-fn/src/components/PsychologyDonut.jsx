import { Brain } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

function formatPnl(value) {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const items = [
  { key: "GREED", translationKey: "greed", color: "stroke-orange-400", dot: "bg-orange-400" },
  { key: "FEAR", translationKey: "fear", color: "stroke-blue-400", dot: "bg-blue-400" },
  { key: "NEUTRAL", translationKey: "neutral", color: "stroke-emerald-400", dot: "bg-emerald-400" },
];

function PsychologyDonut({ data }) {
  const { t } = useLanguage();
  const totalTrades = items.reduce(
    (sum, item) => sum + Number(data?.[item.key]?.trades || 0),
    0
  );

  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  const segments = items.reduce((result, item) => {
    const value = Number(data?.[item.key]?.trades || 0);
    const percentage = totalTrades > 0 ? value / totalTrades : 0;
    const previous = result.length ? result[result.length - 1].end : 0;
    result.push({ item, value, percentage, start: previous, end: previous + percentage });
    return result;
  }, []);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[220px_1fr]">
      <div className="flex justify-center">
        <div className="relative h-52 w-52">
          <svg
            viewBox="0 0 140 140"
            className="h-full w-full -rotate-90"
            aria-label={t("psychologyDonutAria")}
          >
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              className="text-slate-100 dark:text-slate-800"
            />

            {segments.map(({ item, value, percentage, start }) => {
              const length = circumference * percentage;
              const offset = -circumference * start;

              if (value === 0) return null;

              return (
                <circle
                  key={item.key}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="16"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  className={item.color}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalTrades}
            </span>
            <span className="text-xs text-slate-400">
              {t("totalTrades")}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const value = Number(data?.[item.key]?.trades || 0);
          const pnl = Number(data?.[item.key]?.pnl || 0);
          const percentage =
            totalTrades > 0 ? (value / totalTrades) * 100 : 0;

          return (
            <div
              key={item.key}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                  />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {t(item.translationKey)}
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {percentage.toFixed(1)}%
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-400">
                <span>
                  {value} {value === 1 ? t("trade") : t("trades")}
                </span>

                <span
                  className={`font-semibold ${
                    pnl > 0
                      ? "text-green-600"
                      : pnl < 0
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {pnl > 0 ? "+" : ""}${formatPnl(pnl)} {t("pnl")}
                </span>
              </div>
            </div>
          );
        })}

        {totalTrades === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900">
            <Brain size={17} />
            {t("noPsychologyData")}
          </div>
        )}
      </div>
    </div>
  );
}

export default PsychologyDonut;
