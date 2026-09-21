import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useJournalData } from "../hooks/useJournalData";
import { useLanguage } from "../hooks/useLanguage";
import PsychologyDonut from "../components/PsychologyDonut";
import PeriodFilter from "../components/PeriodFilter";
import { filterTradesByPeriod } from "../components/periodFilterUtils";
import { formatRiskReward, getRiskReward } from "../utils/riskReward";

function formatPnl(value) {
  const number = Number(value || 0);

  const formatted = Math.abs(number).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  if (number > 0) return `+${formatted}`;
  if (number < 0) return `-${formatted}`;

  return formatted;
}

function formatDate(
  dateValue,
  options = {
    month: "short",
    day: "numeric",
  }
) {
  if (!dateValue) return "";

  const date = new Date(
    `${dateValue}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(
    undefined,
    options
  );
}

function Charts() {
  const { visibleTrades: trades } = useJournalData();
  const { t } = useLanguage();

  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filteredTrades = useMemo(
    () =>
      filterTradesByPeriod(
        trades,
        period,
        customStart,
        customEnd
      ),
    [
      trades,
      period,
      customStart,
      customEnd,
    ]
  );

  const sortedTrades = useMemo(
    () =>
      [...filteredTrades].sort((a, b) => {
        const dateA = new Date(
          `${a.tradeDate}T00:00:00`
        ).getTime();

        const dateB = new Date(
          `${b.tradeDate}T00:00:00`
        ).getTime();

        return dateA - dateB;
      }),
    [filteredTrades]
  );

  const equityData = useMemo(() => {
    let cumulative = 0;
    const result = new Array(sortedTrades.length);

    for (let index = 0; index < sortedTrades.length; index += 1) {
      const trade = sortedTrades[index];
      cumulative += Number(trade.pnl || 0);
      result[index] = {
        ...trade,
        index,
        cumulative,
      };
    }

    return result;
  }, [sortedTrades]);

  const dailyData = useMemo(() => {
    const groups = {};

    sortedTrades.forEach((trade) => {
      if (!trade.tradeDate) return;

      groups[trade.tradeDate] =
        (groups[trade.tradeDate] || 0) +
        Number(trade.pnl || 0);
    });

    return Object.entries(groups)
      .map(([date, pnl]) => ({
        date,
        pnl,
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [sortedTrades]);

  const pairData = useMemo(() => {
    const groups = {};

    filteredTrades.forEach((trade) => {
      const pair = trade.pair || "Unknown";

      groups[pair] =
        (groups[pair] || 0) +
        Number(trade.pnl || 0);
    });

    return Object.entries(groups)
      .map(([name, pnl]) => ({
        name,
        pnl,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  const psychologyData = useMemo(
    () =>
      filteredTrades.reduce(
        (groups, trade) => {
          const psychology = [
            "GREED",
            "FEAR",
            "NEUTRAL",
          ].includes(trade.psychology)
            ? trade.psychology
            : "NEUTRAL";

          groups[psychology].trades += 1;
          groups[psychology].pnl +=
            Number(trade.pnl || 0);

          return groups;
        },
        {
          GREED: {
            trades: 0,
            pnl: 0,
          },
          FEAR: {
            trades: 0,
            pnl: 0,
          },
          NEUTRAL: {
            trades: 0,
            pnl: 0,
          },
        }
      ),
    [filteredTrades]
  );

  const totalPnl = filteredTrades.reduce(
    (sum, trade) =>
      sum + Number(trade.pnl || 0),
    0
  );

  const rrValues = filteredTrades
    .map((trade) => getRiskReward(trade))
    .filter((value) => value !== null);
  const averageRiskReward = rrValues.length
    ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length
    : null;

  const firstDate =
    sortedTrades[0]?.tradeDate;

  const lastDate =
    sortedTrades[
      sortedTrades.length - 1
    ]?.tradeDate;

  if (trades.length === 0) {
    return (
      <div className="max-w-7xl">
        <PageIntro t={t} />

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="page-enter mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <BarChart3
              size={24}
              className="text-slate-500"
            />
          </div>

          <h2 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">
            No chart data available
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add some trades first to see your charts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl pb-8">
      <PageIntro t={t} />

      <div className="mb-6">
        <PeriodFilter
          t={t}
          period={period}
          setPeriod={setPeriod}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      </div>

      {filteredTrades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("noChartDataPeriod")}
          </p>
        </div>
      ) : (
        <>
          {/* SELECTED PERIOD SUMMARY */}
          <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t("chartPeriod")}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {firstDate && lastDate
                  ? `${formatDate(
                      firstDate,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )} — ${formatDate(
                      lastDate,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}`
                  : t("noChartDataPeriod")}
              </p>
            </div>

            <div className="flex items-center gap-5 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{t("averageRiskReward")}</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatRiskReward(averageRiskReward)}</p>
              </div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {filteredTrades.length}{" "}
                {filteredTrades.length === 1 ? t("trade") : t("trades")}
              </div>
            </div>
          </div>

          {/* EQUITY CURVE */}
          <ChartSection
            title={t("equityCurve")}
            description={t(
              "chartEquityDescription"
            )}
            icon={<TrendingUp size={17} />}
            accent={
              totalPnl >= 0
                ? "positive"
                : "negative"
            }
            meta={formatPnl(totalPnl)}
            metaClass={
              totalPnl > 0
                ? "text-emerald-500"
                : totalPnl < 0
                ? "text-red-500"
                : "text-slate-500"
            }
          >
            <EquityChart data={equityData} />
          </ChartSection>

          {/* DAILY + PAIR */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartSection
              title={t("dailyPnl")}
              description={t(
                "chartDailyDescription"
              )}
              icon={<Activity size={17} />}
            >
              <DailyPnlChart data={dailyData} />
            </ChartSection>

            <ChartSection
              title={t("pnlByPair")}
              description={t(
                "chartPairDescription"
              )}
              icon={<BarChart3 size={17} />}
            >
              <div className="pair-chart-scroll"><PairChart data={pairData} /></div>
            </ChartSection>
          </div>

          {/* PSYCHOLOGY */}
          <ChartSection
            className="mt-6"
            title={t("psychologyAtEntry")}
            description={t(
              "chartPsychologyDescription"
            )}
            icon={<Activity size={17} />}
          >
            <PsychologyDonut
              data={psychologyData}
            />
          </ChartSection>
        </>
      )}
    </div>
  );
}

function PageIntro({ t }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("charts")}
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          {t("chartPageDescription")}
        </p>
      </div>
    </div>
  );
}

function ChartSection({
  title,
  description,
  icon,
  meta,
  metaClass,
  children,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {description}
            </p>
          </div>
        </div>

        {meta ? (
          <span
            className={`text-sm font-bold ${
              metaClass ||
              "text-slate-700 dark:text-slate-200"
            }`}
          >
            {meta}
          </span>
        ) : null}
      </div>

      <div className="p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function EquityChart({ data }) {
  const [activeIndex, setActiveIndex] =
    useState(data.length - 1);

  if (!data.length) return <EmptyChart />;

  const width = 1000;
  const height = 390;

  const padding = {
    top: 24,
    right: 22,
    bottom: 50,
    left: 72,
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const values = data.map(
    (item) => item.cumulative
  );

  let min = Math.min(...values, 0);
  let max = Math.max(...values, 0);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const range = max - min || 1;

  const points = data.map(
    (item, index) => ({
      ...item,
      x:
        padding.left +
        (index /
          Math.max(data.length - 1, 1)) *
          chartWidth,
      y:
        padding.top +
        (1 -
          (item.cumulative - min) /
            range) *
          chartHeight,
    })
  );

  const smoothPath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous =
        points[index - 1];

      const controlX =
        (previous.x + point.x) / 2;

      return `C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath = `${smoothPath} L ${
    points[points.length - 1].x
  } ${
    padding.top + chartHeight
  } L ${
    points[0].x
  } ${
    padding.top + chartHeight
  } Z`;

  const zeroY =
    padding.top +
    (1 - (0 - min) / range) *
      chartHeight;

  const safeActiveIndex = Math.min(
    Math.max(activeIndex, 0),
    points.length - 1
  );

  const active =
    points[safeActiveIndex];

  const handlePointer = (event) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const relativeX =
      ((event.clientX - rect.left) /
        rect.width) *
      width;

    const ratio = Math.max(
      0,
      Math.min(
        1,
        (relativeX - padding.left) /
          chartWidth
      )
    );

    const index = Math.round(
      ratio *
        Math.max(
          data.length - 1,
          1
        )
    );

    setActiveIndex(index);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-50/80 dark:bg-slate-950/40">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[300px] min-w-[720px] w-full sm:h-[350px]"
          onMouseMove={handlePointer}
          onTouchMove={(event) => {
            const touch =
              event.touches[0];

            if (!touch) return;

            const rect =
              event.currentTarget.getBoundingClientRect();

            const relativeX =
              ((touch.clientX - rect.left) /
                rect.width) *
              width;

            const ratio = Math.max(
              0,
              Math.min(
                1,
                (relativeX -
                  padding.left) /
                  chartWidth
              )
            );

            setActiveIndex(
              Math.round(
                ratio *
                  Math.max(
                    data.length - 1,
                    1
                  )
              )
            );
          }}
          role="img"
          aria-label="Equity curve"
        >
          <defs>
            <linearGradient
              id="equity-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="currentColor"
                className="text-emerald-400"
                stopOpacity="0.24"
              />

              <stop
                offset="100%"
                stopColor="currentColor"
                className="text-emerald-400"
                stopOpacity="0"
              />
            </linearGradient>

            <linearGradient
              id="equity-stroke"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="currentColor"
                className="text-emerald-400"
              />

              <stop
                offset="100%"
                stopColor="currentColor"
                className="text-emerald-600"
              />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map(
            (ratio) => {
              const y =
                padding.top +
                ratio * chartHeight;

              const value =
                max - ratio * range;

              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={
                      width -
                      padding.right
                    }
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200/80 dark:text-slate-800"
                  />

                  <text
                    x={padding.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[11px] dark:fill-slate-500"
                  >
                    {formatPnl(value)}
                  </text>
                </g>
              );
            }
          )}

          {zeroY >= padding.top &&
          zeroY <=
            padding.top +
              chartHeight ? (
            <line
              x1={padding.left}
              y1={zeroY}
              x2={
                width -
                padding.right
              }
              y2={zeroY}
              stroke="currentColor"
              strokeDasharray="5 6"
              className="text-slate-300 dark:text-slate-700"
            />
          ) : null}

          <path
            d={areaPath}
            fill="url(#equity-fill)"
          />

          <path
            d={smoothPath}
            fill="none"
            stroke="url(#equity-stroke)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {active ? (
            <>
              <line
                x1={active.x}
                y1={padding.top}
                x2={active.x}
                y2={
                  padding.top +
                  chartHeight
                }
                stroke="currentColor"
                strokeDasharray="4 5"
                className="text-slate-300 dark:text-slate-700"
              />

              <circle
                cx={active.x}
                cy={active.y}
                r="8"
                className="fill-white stroke-emerald-500 dark:fill-slate-900"
                strokeWidth="4"
              />

              <g
                transform={`translate(${Math.max(
                  88,
                  Math.min(
                    active.x - 80,
                    width - 190
                  )
                )}, ${Math.max(
                  8,
                  active.y - 72
                )})`}
              >
                <rect
                  width="160"
                  height="56"
                  rx="12"
                  className="fill-white/95 stroke-slate-200 dark:fill-slate-900/95 dark:stroke-slate-700"
                />

                <text
                  x="12"
                  y="21"
                  className="fill-slate-400 text-[10px]"
                >
                  {formatDate(
                    active.tradeDate,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </text>

                <text
                  x="12"
                  y="42"
                  className={`text-[15px] font-bold ${
                    active.cumulative >= 0
                      ? "fill-emerald-500"
                      : "fill-red-500"
                  }`}
                >
                  {formatPnl(
                    active.cumulative
                  )}
                </text>
              </g>
            </>
          ) : null}

          <text
            x={padding.left}
            y={height - 16}
            className="fill-slate-400 text-[11px] dark:fill-slate-500"
          >
            {formatDate(
              data[0]?.tradeDate
            )}
          </text>

          <text
            x={
              width -
              padding.right
            }
            y={height - 16}
            textAnchor="end"
            className="fill-slate-400 text-[11px] dark:fill-slate-500"
          >
            {formatDate(
              data[data.length - 1]
                ?.tradeDate
            )}
          </text>
        </svg>
      </div>
    </div>
  );
}

function DailyPnlChart({ data }) {
  const [activeIndex, setActiveIndex] =
    useState(null);

  if (!data.length) return <EmptyChart />;

  const maxAbs = Math.max(
    ...data.map((item) =>
      Math.abs(item.pnl)
    ),
    1
  );

  const barWidth = Math.max(
    14,
    Math.min(
      42,
      720 / data.length
    )
  );

  const chartHeight = 260;

  return (
    <div className="rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/40 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">
            P&L
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {data.length} trading days
          </p>
        </div>

        {activeIndex !== null ? (
          <div
            className={`text-sm font-bold ${
              data[activeIndex].pnl >=
              0
                ? "text-emerald-500"
                : "text-red-500"
            }`}
          >
            {formatPnl(
              data[activeIndex].pnl
            )}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="relative min-w-[620px]"
          style={{
            height:
              chartHeight + 56,
          }}
        >
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-300 dark:border-slate-700" />

          <div className="absolute inset-x-0 top-0 flex h-[260px] items-center justify-around gap-2 px-4">
            {data.map(
              (item, index) => {
                const positive =
                  item.pnl >= 0;

                const height =
                  Math.max(
                    5,
                    (Math.abs(
                      item.pnl
                    ) /
                      maxAbs) *
                      92
                  );

                return (
                  <button
                    type="button"
                    key={item.date}
                    title={`${formatDate(
                      item.date,
                      {
                        month:
                          "short",
                        day: "numeric",
                        year:
                          "numeric",
                      }
                    )}: ${formatPnl(
                      item.pnl
                    )}`}
                    onMouseEnter={() =>
                      setActiveIndex(
                        index
                      )
                    }
                    onFocus={() =>
                      setActiveIndex(
                        index
                      )
                    }
                    onMouseLeave={() =>
                      setActiveIndex(
                        null
                      )
                    }
                    className="group relative flex h-full min-w-[18px] flex-1 items-center justify-center outline-none"
                  >
                    <span
                      className={`absolute left-1/2 w-full -translate-x-1/2 rounded-lg transition-all duration-200 ${
                        positive
                          ? "bottom-1/2 origin-bottom bg-emerald-400/85 group-hover:bg-emerald-500"
                          : "top-1/2 origin-top bg-red-400/85 group-hover:bg-red-500"
                      }`}
                      style={{
                        height: `${height}%`,
                        maxWidth: `${barWidth}px`,
                      }}
                    />

                    {activeIndex ===
                    index ? (
                      <span
                        className={`absolute z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg dark:bg-white dark:text-slate-900 ${
                          positive
                            ? "bottom-[calc(50%+12px)]"
                            : "top-[calc(50%+12px)]"
                        }`}
                      >
                        {formatPnl(
                          item.pnl
                        )}
                      </span>
                    ) : null}
                  </button>
                );
              }
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-between px-4 text-[10px] text-slate-400 dark:text-slate-500">
            <span>
              {formatDate(
                data[0]?.date
              )}
            </span>

            <span>
              {formatDate(
                data[data.length - 1]
                  ?.date
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-5 text-[10px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Profit
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Loss
        </span>
      </div>
    </div>
  );
}

function PairChart({ data }) {
  const [active, setActive] =
    useState(null);

  if (!data.length) return <EmptyChart />;

  const maxAbs = Math.max(
    ...data.map((item) =>
      Math.abs(item.pnl)
    ),
    1
  );

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const positive =
          item.pnl >= 0;

        const percentage =
          (Math.abs(item.pnl) /
            maxAbs) *
          100;

        const width = Math.max(
          item.pnl === 0
            ? 0
            : 4,
          percentage
        );

        return (
          <button
            type="button"
            key={item.name}
            onMouseEnter={() =>
              setActive(index)
            }
            onMouseLeave={() =>
              setActive(null)
            }
            onFocus={() =>
              setActive(index)
            }
            className="w-full rounded-2xl border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-950/50"
          >
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
                    positive
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight
                      size={14}
                    />
                  ) : (
                    <ArrowDownRight
                      size={14}
                    />
                  )}
                </span>

                <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {item.name}
                </span>
              </div>

              <span
                className={`shrink-0 text-sm font-bold ${
                  positive
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {formatPnl(
                  item.pnl
                )}
              </span>
            </div>

            <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <span
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  positive
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
                style={{
                  width: `${width}%`,
                }}
              />
            </div>

            {active === index ? (
              <p className="mt-2 text-[10px] font-medium text-slate-400">
                {percentage.toFixed(
                  1
                )}
                % of largest pair P&L
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/40">
      <p className="text-sm text-slate-400">
        No data available for this period.
      </p>
    </div>
  );
}

export default Charts;