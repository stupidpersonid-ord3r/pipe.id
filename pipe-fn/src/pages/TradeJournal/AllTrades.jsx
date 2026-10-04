import { useMemo, useState } from "react";
import { useJournalData } from "../../hooks/useJournalData";
import { Link } from "react-router-dom";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { formatRiskReward, getRiskReward } from "../../utils/riskReward";

function formatDate(date) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPnl(value) {
  const number = Number(value || 0);
  return number > 0
    ? `+${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AllTrades() {
  const { visibleTrades: trades, loading, error, refresh } = useJournalData();
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize));

  const safePage = Math.min(page, totalPages);

  const pagedTrades = useMemo(() => {

    const start = (safePage - 1) * pageSize;
    return trades.slice(start, start + pageSize);
  }, [trades, safePage]);

  if (loading) {
    return <Status message="Loading trades..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  const wins = trades.filter((trade) => trade.result === "WIN").length;
  const totalPnl = trades.reduce((total, trade) => total + Number(trade.pnl || 0), 0);

  return (
    <div className="max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("allTrades")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("legacyViewAllTrades")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

          <Link
            to="/trades/new"
            className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Add Trade
          </Link>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="page-enter mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Plus size={22} className="text-slate-500" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-900">
            No trades yet
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("legacyStartRecording")}
          </p>

          <Link
            to="/trades/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Add Trade
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <SummaryCard title={t("totalTrades")} value={trades.length} />
            <SummaryCard title={t("wins")} value={wins} valueClass="text-green-600" />
            <SummaryCard
              title={t("totalPnl")}
              value={formatPnl(totalPnl)}
              valueClass={totalPnl >= 0 ? "text-green-600" : "text-red-600"}
            />
          </div>

          <div className="overflow-hidden ui-section ui-card">
            <div className="max-h-[620px] overflow-auto overscroll-contain">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    {[t("legacyDate"), t("account"), t("pair"), t("direction"), t("result"), t("psychology"), t("riskReward"), t("pnl"), t("strategy"), t("detail")].map((label) => (
                      <th
                        key={label}
                        className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 ${label === "View" ? "text-right" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pagedTrades.map((trade) => (
                    <tr key={trade.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {formatDate(trade.tradeDate)}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        {trade.accountName || t("legacyUnknownAccount")}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {trade.pair}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
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
                          {trade.direction === "BUY" ? t("buy") : t("sell")}
                        </span>
                      </td>

                      <td className="px-5 py-4">
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

                      <td className="px-5 py-4">
                        <PsychologyBadge value={trade.psychology} t={t} />
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRiskReward(getRiskReward(trade))}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold">
                        <span
                          className={
                            Number(trade.pnl) > 0
                              ? "text-green-600"
                              : Number(trade.pnl) < 0
                              ? "text-red-600"
                              : "text-slate-600"
                          }
                        >
                          {formatPnl(trade.pnl)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {trade.strategy || "-"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/trades/${trade.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          View
                          <ArrowUpRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  {Math.min((safePage - 1) * pageSize + 1, trades.length)}–{Math.min(safePage * pageSize, trades.length)} of {trades.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="min-w-20 text-center text-xs font-medium text-slate-600">
                    Page {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PsychologyBadge({ value, t }) {
  const psychology = ["GREED", "FEAR", "NEUTRAL"].includes(value)
    ? value
    : "NEUTRAL";

  const styles = {
    GREED: "bg-orange-50 text-orange-700",
    FEAR: "bg-blue-50 text-blue-700",
    NEUTRAL: "bg-emerald-50 text-emerald-700",
  };

  const label = t(psychology === "GREED" ? "greed" : psychology === "FEAR" ? "fear" : "neutral");

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[psychology]}`}>
      {label}
    </span>
  );
}

function SummaryCard({ title, value, valueClass = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function Status({ message }) {
  return (
    <div className="max-w-7xl rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default AllTrades;
