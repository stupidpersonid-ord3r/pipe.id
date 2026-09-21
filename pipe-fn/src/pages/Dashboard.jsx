import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
} from "lucide-react";
import { useJournalData } from "../hooks/useJournalData";
import PsychologyDonut from "../components/PsychologyDonut";
import { useLanguage } from "../hooks/useLanguage";
import { formatRiskReward, getRiskReward } from "../utils/riskReward";

function formatPnl(value) {
  const number = Number(value || 0);

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date, language = "EN") {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(language === "ID" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const { visibleTrades: trades, selectedAccountId, loading, error } = useJournalData();
  const { language, t } = useLanguage();

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          {t("loadingTradingData")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const totalTrades = trades.length;

  const summary = trades.reduce(
    (result, trade) => {
      const pnl = Number(trade.pnl || 0);
      result.totalPnl += pnl;

      if (trade.result === "WIN") result.wins += 1;
      else if (trade.result === "LOSS") result.losses += 1;
      else if (trade.result === "BREAKEVEN") result.breakevens += 1;

      if (pnl > 0) result.winningPnl += pnl;
      else if (pnl < 0) result.losingPnl += Math.abs(pnl);

      const psychology = ["GREED", "FEAR", "NEUTRAL"].includes(trade.psychology)
        ? trade.psychology
        : "NEUTRAL";
      result.psychology[psychology].trades += 1;
      result.psychology[psychology].pnl += pnl;

      return result;
    },
    {
      wins: 0,
      losses: 0,
      breakevens: 0,
      totalPnl: 0,
      winningPnl: 0,
      losingPnl: 0,
      psychology: {
        GREED: { trades: 0, pnl: 0 },
        FEAR: { trades: 0, pnl: 0 },
        NEUTRAL: { trades: 0, pnl: 0 },
      },
    }
  );

  const wins = summary.wins;
  const losses = summary.losses;
  const breakevens = summary.breakevens;
  const totalPnl = summary.totalPnl;

  const winRate =
    totalTrades > 0
      ? (wins / totalTrades) * 100
      : 0;

  const winningPnl = summary.winningPnl;
  const losingPnl = summary.losingPnl;

  const profitFactor =
    losingPnl > 0
      ? winningPnl / losingPnl
      : winningPnl > 0
      ? winningPnl
      : 0;

  const recentTrades = trades.slice(0, 5);

  const psychologyData = summary.psychology;


  return (
    <div className="max-w-7xl">
      {/* HEADER */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("dashboard")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("overviewTradingPerformance")}
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!selectedAccountId ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="page-enter mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <BarChart3
              size={22}
              className="text-slate-500"
            />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-900">
            {t("selectAccount")}
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {t("selectAccountPerformance")}
          </p>
        </div>
      ) : (
        <>
          {/* STAT CARDS */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={t("totalTrades")}
              value={totalTrades}
              description={t("totalTradesDescription").replace("{wins}", wins).replace("{losses}", losses)}
              icon={<BarChart3 size={19} />}
            />

            <StatCard
              title={t("winRate")}
              value={`${winRate.toFixed(1)}%`}
              description={t("winningTradesDescription").replace("{wins}", wins)}
              icon={<Target size={19} />}
            />

            <StatCard
              title={t("totalPnl")}
              value={
                totalPnl >= 0
                  ? `+${formatPnl(totalPnl)}`
                  : formatPnl(totalPnl)
              }
              description={
                totalPnl >= 0
                  ? t("netPositivePerformance")
                  : t("netNegativePerformance")
              }
              icon={
                totalPnl >= 0 ? (
                  <TrendingUp size={19} />
                ) : (
                  <TrendingDown size={19} />
                )
              }
              valueClass={
                totalPnl > 0
                  ? "text-green-600"
                  : totalPnl < 0
                  ? "text-red-600"
                  : "text-slate-900"
              }
            />

            <StatCard
              title={t("profitFactor")}
              value={profitFactor.toFixed(2)}
              description={t("breakevenTradesDescription").replace("{count}", breakevens)}
              icon={<TrendingUp size={19} />}
            />
          </div>

          {/* PERFORMANCE SUMMARY */}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* RESULT BREAKDOWN */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-base font-semibold text-slate-900">
                  {t("tradeResults")}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t("tradeResultsDescription")}
                </p>
              </div>

              <div className="space-y-5 p-6">
                <ResultRow
                  label={t("wins")}
                  value={wins}
                  total={totalTrades}
                />

                <ResultRow
                  label={t("losses")}
                  value={losses}
                  total={totalTrades}
                />

                <ResultRow
                  label={t("breakeven")}
                  value={breakevens}
                  total={totalTrades}
                />
              </div>
            </section>

            {/* PNL SUMMARY */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-base font-semibold text-slate-900">
                  {t("pnlSummary")}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t("pnlSummaryDescription")}
                </p>
              </div>

              <div className="space-y-5 p-6">
                <PnlRow
                  label={t("grossProfit")}
                  value={winningPnl}
                  positive
                />

                <PnlRow
                  label={t("grossLoss")}
                  value={losingPnl}
                />

                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      {t("netPnl")}
                    </span>

                    <span
                      className={`text-lg font-bold ${
                        totalPnl > 0
                          ? "text-green-600"
                          : totalPnl < 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {totalPnl > 0
                        ? `+${formatPnl(totalPnl)}`
                        : formatPnl(totalPnl)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* PSYCHOLOGY */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">
                {t("psychologyAtEntry")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("psychologyAtEntryDescription")}
              </p>
            </div>

            <div className="p-6">
              <PsychologyDonut data={psychologyData} />
            </div>
          </section>

          {/* RECENT TRADES */}
          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {t("recentTrades")}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t("recentTradesDescription")}
                </p>
              </div>

              <Link
                to="/trades"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                {t("viewAll")}
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("date")}
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("pair")}
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("direction")}
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("result")}
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("psychology")}
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("riskReward")}
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("pnl")}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(trade.tradeDate, language)}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/trades/${trade.id}`}
                          className="font-semibold text-slate-900 hover:underline"
                        >
                          {trade.pair}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            trade.direction === "BUY"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {trade.direction === "BUY" ? (
                            <ArrowUpRight size={13} />
                          ) : (
                            <ArrowDownRight size={13} />
                          )}

                          {trade.direction}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            trade.result === "WIN"
                              ? "bg-green-50 text-green-700"
                              : trade.result === "LOSS"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {trade.result === "WIN" ? t("win") : trade.result === "LOSS" ? t("loss") : t("breakeven")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <PsychologyBadge value={trade.psychology} />
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRiskReward(getRiskReward(trade))}
                      </td>

                      <td
                        className={`px-6 py-4 text-right text-sm font-semibold ${
                          Number(trade.pnl) > 0
                            ? "text-green-600"
                            : Number(trade.pnl) < 0
                            ? "text-red-600"
                            : "text-slate-600"
                        }`}
                      >
                        {Number(trade.pnl) > 0
                          ? `+${formatPnl(trade.pnl)}`
                          : formatPnl(trade.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function PsychologyBadge({ value }) {
  const { t } = useLanguage();
  const psychology = ["GREED", "FEAR", "NEUTRAL"].includes(value)
    ? value
    : "NEUTRAL";

  const styles = {
    GREED: "bg-orange-50 text-orange-700",
    FEAR: "bg-blue-50 text-blue-700",
    NEUTRAL: "bg-emerald-50 text-emerald-700",
  };

  const labelKey = psychology === "GREED" ? "greed" : psychology === "FEAR" ? "fear" : "neutral";
  const label = t(labelKey);

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[psychology]}`}>
      {label}
    </span>
  );
}

function StatCard({
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

function ResultRow({
  label,
  value,
  total,
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-900">
          {value}{" "}
          <span className="font-normal text-slate-400">
            ({percentage.toFixed(1)}%)
          </span>
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
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

function PnlRow({
  label,
  value,
  positive = false,
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span
        className={`text-sm font-semibold ${
          positive
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {positive ? "+" : "-"}
        {formatPnl(value)}
      </span>
    </div>
  );
}

export default Dashboard;