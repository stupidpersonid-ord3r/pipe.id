import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { pipeApi } from "../../lib/pipeApi";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { formatRiskReward, getRiskReward } from "../../utils/riskReward";

function formatDate(date) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatNumber(value, digits = 2) {
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return number.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPnl(value) {
  const number = Number(value || 0);
  return number > 0 ? `+${formatNumber(number)}` : formatNumber(number);
}

function formatPsychology(value, t) {
  const normalized = ["GREED", "FEAR", "NEUTRAL"].includes(value)
    ? value
    : "NEUTRAL";

  return t(normalized === "GREED" ? "greed" : normalized === "FEAR" ? "fear" : "neutral");
}

function normalizeTrade(trade) {
  return {
    ...trade,
    tradeDate: trade.trade_date,
    accountId: trade.account_id,
    accountName: trade.accounts?.name ?? "Unknown Account",
    entryPrice: trade.entry_price,
    stopLoss: trade.stop_loss,
    takeProfit: trade.take_profit,
    lotSize: trade.lot_size,
    riskReward: getRiskReward(trade),
    createdAt: trade.created_at,
  };
}

function TradeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTrade() {
      if (!user || !id) return;

      setLoading(true);
      setError("");

      try {
        const data = await pipeApi.trades.get(id);
        if (!active) return;
        setTrade(data ? normalizeTrade(data) : null);
      } catch (queryError) {
        if (!active) return;
        setError(queryError.message);
        setTrade(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTrade();

    return () => {
      active = false;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="max-w-5xl rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">{t("loadingTrade")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl">
        <Link
          to="/trades"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {t("legacyBackToAllTrades")}
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="max-w-4xl">
        <Link
          to="/trades"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {t("legacyBackToAllTrades")}
        </Link>

        <div className="ui-section ui-card p-12 text-center">
          <h1 className="text-xl font-bold text-slate-900">{t("tradeNotFound")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("legacyTradeDoesNotExist")}
          </p>
        </div>
      </div>
    );
  }

  const isWin = trade.result === "WIN";
  const isLoss = trade.result === "LOSS";
  const isBuy = trade.direction === "BUY";

  return (
    <div className="max-w-5xl">
      <Link
        to="/trades"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        {t("legacyBackToAllTrades")}
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{trade.pair}</h1>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isBuy ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {isBuy ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trade.direction}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {formatDate(trade.tradeDate)} · {trade.accountName}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isWin
                ? "bg-green-50 text-green-700"
                : isLoss
                ? "bg-red-50 text-red-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {trade.result}
          </span>

          <p
            className={`mt-2 text-2xl font-bold ${
              Number(trade.pnl) > 0
                ? "text-green-600"
                : Number(trade.pnl) < 0
                ? "text-red-600"
                : "text-slate-600"
            }`}
          >
            {formatPnl(trade.pnl)}
          </p>
        </div>
      </div>

      <section className="ui-section ui-card">
        <SectionTitle
          title={t("tradeInformation")}
          description={t("legacyCompleteTradeInfo")}
        />

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label={t("tradeDate")} value={formatDate(trade.tradeDate)} />
          <InfoItem label={t("account")} value={trade.accountName} />
          <InfoItem label={t("pair")} value={trade.pair} />
          <InfoItem label={t("direction")} value={trade.direction} />
          <InfoItem label={t("psychologyAtEntry")} value={formatPsychology(trade.psychology, t)} />
          <InfoItem label={t("session")} value={trade.session || "-"} />
          <InfoItem label={t("lotSize")} value={formatNumber(trade.lotSize)} />
          <InfoItem label={t("riskReward")} value={formatRiskReward(trade.riskReward)} />
        </div>
      </section>

      <section className="mt-6 ui-section ui-card">
        <SectionTitle
          title={t("priceInformation")}
          description={t("legacyEntryExitRisk")}
        />

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label={t("entryPrice")} value={formatNumber(trade.entryPrice, 5)} />
          <InfoItem
            label={t("stopLoss")}
            value={trade.stopLoss ? formatNumber(trade.stopLoss, 5) : "-"}
          />
          <InfoItem
            label={t("takeProfit")}
            value={trade.takeProfit ? formatNumber(trade.takeProfit, 5) : "-"}
          />
        </div>
      </section>

      <section className="mt-6 ui-section ui-card">
        <SectionTitle title={t("strategy")} />
        <div className="p-6">
          <p className="text-sm font-medium text-slate-900">
            {trade.strategy || t("legacyNoStrategy")}
          </p>
        </div>
      </section>

      <section className="mt-6 ui-section ui-card">
        <SectionTitle title={t("notes")} />
        <div className="p-6">
          {trade.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {trade.notes}
            </p>
          ) : (
            <p className="text-sm text-slate-400">{t("noNotes")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="border-b border-slate-200 px-6 py-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default TradeDetail;