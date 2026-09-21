import { useMemo, useState } from "react";
import {
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useJournalData } from "../hooks/useJournalData";
import { useLanguage } from "../hooks/useLanguage";
import PsychologyDonut from "../components/PsychologyDonut";
import PeriodFilter from "../components/PeriodFilter";
import { filterTradesByPeriod } from "../components/periodFilterUtils";
import { formatRiskReward, getRiskReward } from "../utils/riskReward";

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPnl(value) {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${formatNumber(number)}`;
  }

  return formatNumber(number);
}

function getPerformanceGroups(trades, key) {
  const groups = {};

  trades.forEach((trade) => {
    const name = trade[key] || "Unspecified";

    if (!groups[name]) {
      groups[name] = {
        name,
        trades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        pnl: 0,
        rrTotal: 0,
        rrCount: 0,
      };
    }

    groups[name].trades += 1;
    groups[name].pnl += Number(trade.pnl || 0);
    const rr = getRiskReward(trade);
    if (rr !== null) {
      groups[name].rrTotal += rr;
      groups[name].rrCount += 1;
    }

    if (trade.result === "WIN") {
      groups[name].wins += 1;
    } else if (trade.result === "LOSS") {
      groups[name].losses += 1;
    } else if (trade.result === "BREAKEVEN") {
      groups[name].breakevens += 1;
    }
  });

  return Object.values(groups)
    .map((group) => ({
      ...group,
      winRate:
        group.trades > 0
          ? (group.wins / group.trades) * 100
          : 0,
      avgRiskReward:
        group.rrCount > 0 ? group.rrTotal / group.rrCount : null,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

function Analytics() {
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
    [trades, period, customStart, customEnd]
  );

  const analytics = useMemo(() => {
    const totalTrades = filteredTrades.length;

    const wins = filteredTrades.filter(
      (trade) => trade.result === "WIN"
    ).length;

    const losses = filteredTrades.filter(
      (trade) => trade.result === "LOSS"
    ).length;

    const breakevens = filteredTrades.filter(
      (trade) => trade.result === "BREAKEVEN"
    ).length;

    const totalPnl = filteredTrades.reduce(
      (total, trade) =>
        total + Number(trade.pnl || 0),
      0
    );

    const winningTrades = filteredTrades.filter(
      (trade) => Number(trade.pnl) > 0
    );

    const losingTrades = filteredTrades.filter(
      (trade) => Number(trade.pnl) < 0
    );

    const grossProfit = winningTrades.reduce(
      (total, trade) =>
        total + Number(trade.pnl || 0),
      0
    );

    const grossLoss = Math.abs(
      losingTrades.reduce(
        (total, trade) =>
          total + Number(trade.pnl || 0),
        0
      )
    );

    const averageWin =
      winningTrades.length > 0
        ? grossProfit / winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? grossLoss / losingTrades.length
        : 0;

    const winRate =
      totalTrades > 0
        ? (wins / totalTrades) * 100
        : 0;

    const profitFactor =
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
        ? grossProfit
        : 0;

    const rrValues = filteredTrades
      .map((trade) => getRiskReward(trade))
      .filter((value) => value !== null);
    const averageRiskReward = rrValues.length
      ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length
      : null;

    return {
      totalTrades,
      wins,
      losses,
      breakevens,
      totalPnl,
      grossProfit,
      grossLoss,
      averageWin,
      averageLoss,
      winRate,
      profitFactor,
      averageRiskReward,

      byPair: getPerformanceGroups(
        filteredTrades,
        "pair"
      ),

      byStrategy: getPerformanceGroups(
        filteredTrades,
        "strategy"
      ),

      bySession: getPerformanceGroups(
        filteredTrades,
        "session"
      ),

      byPsychology: getPerformanceGroups(
        filteredTrades.map((trade) => ({
          ...trade,
          psychology:
            trade.psychology || "NEUTRAL",
        })),
        "psychology"
      ),
    };
  }, [filteredTrades]);

  if (trades.length === 0) {
    return (
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Analyze your trading performance.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="page-enter mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <BarChart3
              size={22}
              className="text-slate-500"
            />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-900">
            No analytics available yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Add some trades to start analyzing your
            trading performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Analytics
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Analyze your trading performance and
          discover patterns in your trades.
        </p>
      </div>

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
            {t("noAnalyticsPeriodData")}
          </p>
        </div>
      ) : (
        <>
          {/* MAIN STATS */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsCard
              title="Total Trades"
              value={analytics.totalTrades}
              description={`${analytics.wins} wins · ${analytics.losses} losses`}
              icon={<BarChart3 size={19} />}
            />

            <AnalyticsCard
              title="Win Rate"
              value={`${analytics.winRate.toFixed(1)}%`}
              description="Winning trades percentage"
              icon={<Target size={19} />}
            />

            <AnalyticsCard
              title="Net P&L"
              value={formatPnl(analytics.totalPnl)}
              description={
                analytics.totalPnl >= 0
                  ? "Overall positive performance"
                  : "Overall negative performance"
              }
              icon={
                analytics.totalPnl >= 0 ? (
                  <TrendingUp size={19} />
                ) : (
                  <TrendingDown size={19} />
                )
              }
              valueClass={
                analytics.totalPnl > 0
                  ? "text-green-600"
                  : analytics.totalPnl < 0
                  ? "text-red-600"
                  : "text-slate-900"
              }
            />

            <AnalyticsCard
              title="Profit Factor"
              value={analytics.profitFactor.toFixed(2)}
              description="Gross profit ÷ gross loss"
              icon={<Activity size={19} />}
            />
          </div>

          {/* SECONDARY STATS */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Average Win"
              value={`+${formatNumber(
                analytics.averageWin
              )}`}
              valueClass="text-green-600"
            />

            <MetricCard
              title="Average Loss"
              value={`-${formatNumber(
                analytics.averageLoss
              )}`}
              valueClass="text-red-600"
            />

            <MetricCard
              title="Gross Profit"
              value={`+${formatNumber(
                analytics.grossProfit
              )}`}
              valueClass="text-green-600"
            />

            <MetricCard
              title="Gross Loss"
              value={`-${formatNumber(
                analytics.grossLoss
              )}`}
              valueClass="text-red-600"
            />

            <MetricCard
              title={t("averageRiskReward")}
              value={formatRiskReward(analytics.averageRiskReward)}
              valueClass="text-emerald-600"
            />
          </div>

          {/* RESULTS */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">
                Trade Results
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Distribution of your trading results.
              </p>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-3">
              <ResultCard
                label="Wins"
                value={analytics.wins}
                total={analytics.totalTrades}
                className="text-green-600"
              />

              <ResultCard
                label="Losses"
                value={analytics.losses}
                total={analytics.totalTrades}
                className="text-red-600"
              />

              <ResultCard
                label="Breakeven"
                value={analytics.breakevens}
                total={analytics.totalTrades}
                className="text-slate-600"
              />
            </div>
          </section>

          {/* PERFORMANCE TABLES */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <PerformanceTable
              title="Performance by Pair"
              description="See which instruments perform best."
              data={analytics.byPair}
            />

            <PerformanceTable
              title="Performance by Strategy"
              description="Compare your trading strategies."
              data={analytics.byStrategy}
            />

            <PerformanceTable
              title="Performance by Session"
              description="Analyze your preferred trading sessions."
              data={analytics.bySession}
            />

            {/* PSYCHOLOGY */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Psychology at Entry
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Understand how your mindset at entry
                  is distributed and how each mindset
                  performs.
                </p>
              </div>

              <div className="p-6">
                <PsychologyDonut
                  data={Object.fromEntries(
                    analytics.byPsychology.map(
                      (item) => [
                        item.name.toUpperCase(),
                        {
                          trades: item.trades,
                          pnl: item.pnl,
                        },
                      ]
                    )
                  )}
                />
              </div>
            </section>

            <PerformanceTable
              title="Performance by Psychology"
              description="Compare win rate and P&L for each entry mindset."
              data={analytics.byPsychology}
            />

            <BestWorstCard
              data={analytics.byPair}
            />
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  description,
  icon,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">
          {title}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p
        className={`mt-4 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  valueClass,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>

      <p
        className={`mt-3 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  total,
  className,
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-end justify-between">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <p
          className={`text-2xl font-bold ${className}`}
        >
          {value}
        </p>
      </div>

      <p className="mt-1 text-xs text-slate-400">
        {percentage.toFixed(1)}% of total trades
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function PerformanceTable({
  title,
  description,
  data,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="performance-table-scroll max-h-[360px] overflow-auto overscroll-contain">
        <table className="performance-table w-full min-w-[680px] table-fixed text-left">
          <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="w-[36%] whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>

              <th className="w-[13%] whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trades
              </th>

              <th className="w-[19%] whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Win Rate
              </th>

              <th className="w-[12%] whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                R:R
              </th>

              <th className="w-[20%] whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                P&L
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr
                key={item.name}
                className="transition hover:bg-slate-50"
              >
                <td className="max-w-0 px-5 py-4 text-sm font-medium text-slate-900">
                  <span className="block truncate" title={item.name}>
                    {item.name}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {item.trades}
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {item.winRate.toFixed(1)}%
                </td>

                <td className="px-5 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatRiskReward(item.avgRiskReward)}
                </td>

                <td
                  className={`px-5 py-4 text-right text-sm font-semibold ${
                    item.pnl > 0
                      ? "text-green-600"
                      : item.pnl < 0
                      ? "text-red-600"
                      : "text-slate-600"
                  }`}
                >
                  {formatPnl(item.pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BestWorstCard({ data }) {
  const best = data[0];

  const worst =
    data.length > 0
      ? [...data].sort(
          (a, b) => a.pnl - b.pnl
        )[0]
      : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Best & Worst Pair
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Quick overview of your strongest and weakest
          instruments.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Best Pair
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {best?.name || "-"}
          </p>

          <p className="mt-1 text-sm font-semibold text-green-600">
            {best ? formatPnl(best.pnl) : "-"}
          </p>
        </div>

        <div className="rounded-lg border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Worst Pair
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {worst?.name || "-"}
          </p>

          <p
            className={`mt-1 text-sm font-semibold ${
              worst?.pnl < 0
                ? "text-red-600"
                : "text-slate-600"
            }`}
          >
            {worst ? formatPnl(worst.pnl) : "-"}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Analytics;