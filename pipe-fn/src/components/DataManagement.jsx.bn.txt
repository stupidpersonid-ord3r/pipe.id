import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pipeApi } from "../lib/pipeApi";
import { useAuth } from "../hooks/useAuth";
import { useJournalData } from "../hooks/useJournalData";
import { useLanguage } from "../hooks/useLanguage";
import { useProfile } from "../hooks/useProfile";
import PeriodFilter from "./PeriodFilter";
import Select from "./Select";
import { filterTradesByPeriod, getPeriodRange } from "./periodFilterUtils";
import { formatRiskReward, getRiskReward } from "../utils/riskReward";

const PSYCHOLOGY_VALUES = ["GREED", "FEAR", "NEUTRAL"];
const RESULT_VALUES = ["WIN", "LOSS", "BREAKEVEN"];

const PDF_COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  grid: "#e2e8f0",
  surface: "#ffffff",
  soft: "#f8fafc",
  green: "#059669",
  emerald: "#10b981",
  red: "#e11d48",
  amber: "#d97706",
};

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateText(value) {
  if (!value) return "-";
  const date = value instanceof Date
    ? value
    : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizePsychology(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return PSYCHOLOGY_VALUES.includes(normalized) ? normalized : "NEUTRAL";
}

function tradeDate(trade) {
  return trade.tradeDate ?? trade.trade_date ?? "";
}

function accountId(trade) {
  return trade.accountId ?? trade.account_id ?? "";
}

function getTradeRows(trades) {
  return trades.map((trade) => ({
    trade_date: tradeDate(trade),
    account_id: accountId(trade),
    account_name: trade.accountName ?? "",
    pair: trade.pair ?? "",
    direction: trade.direction ?? "",
    entry_price: trade.entryPrice ?? trade.entry_price ?? "",
    stop_loss: trade.stopLoss ?? trade.stop_loss ?? "",
    take_profit: trade.takeProfit ?? trade.take_profit ?? "",
    lot_size: trade.lotSize ?? trade.lot_size ?? "",
    risk_reward: getRiskReward(trade),
    risk_reward_display: formatRiskReward(getRiskReward(trade)),
    result: trade.result ?? "",
    pnl: number(trade.pnl),
    strategy: trade.strategy ?? "",
    session: trade.session ?? "",
    psychology: normalizePsychology(trade.psychology),
    notes: trade.notes ?? "",
    created_at: trade.createdAt ?? trade.created_at ?? "",
  }));
}

function getAccountRows(accounts) {
  return accounts.map((account) => ({
    account_id: account.id ?? "",
    account_name: account.name ?? "",
    account_type: account.account_type ?? "LIVE",
    currency: account.currency ?? "",
    initial_balance: number(account.starting_balance),
    current_balance: number(account.current_balance),
    trading_pnl: number(account.trading_pnl),
    deposits: number(account.deposits),
    withdrawals: number(account.withdrawals),
    primary_pair: account.pair ?? "",
  }));
}

function buildSummary(trades) {
  const totalTrades = trades.length;
  const wins = trades.filter((trade) => trade.result === "WIN").length;
  const losses = trades.filter((trade) => trade.result === "LOSS").length;
  const breakevens = trades.filter((trade) => trade.result === "BREAKEVEN").length;
  const totalPnl = trades.reduce((sum, trade) => sum + number(trade.pnl), 0);
  const positive = trades.filter((trade) => number(trade.pnl) > 0);
  const negative = trades.filter((trade) => number(trade.pnl) < 0);
  const grossProfit = positive.reduce((sum, trade) => sum + number(trade.pnl), 0);
  const grossLoss = Math.abs(negative.reduce((sum, trade) => sum + number(trade.pnl), 0));
  const rrValues = trades.map(getRiskReward).filter((value) => value !== null);

  const groups = (key) => {
    const map = {};
    trades.forEach((trade) => {
      const name = trade[key] || "Unspecified";
      if (!map[name]) map[name] = { name, trades: 0, wins: 0, losses: 0, breakevens: 0, pnl: 0, rrTotal: 0, rrCount: 0 };
      map[name].trades += 1;
      map[name].pnl += number(trade.pnl);
      if (trade.result === "WIN") map[name].wins += 1;
      if (trade.result === "LOSS") map[name].losses += 1;
      if (trade.result === "BREAKEVEN") map[name].breakevens += 1;
      const rr = getRiskReward(trade);
      if (rr !== null) {
        map[name].rrTotal += rr;
        map[name].rrCount += 1;
      }
    });
    return Object.values(map)
      .map((item) => ({
        ...item,
        winRate: item.trades ? (item.wins / item.trades) * 100 : 0,
        avgRiskReward: item.rrCount ? item.rrTotal / item.rrCount : null,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  };

  const monthly = {};
  const daily = {};
  const psychology = Object.fromEntries(PSYCHOLOGY_VALUES.map((key) => [key, { trades: 0, pnl: 0 }]));
  trades.forEach((trade) => {
    const date = String(tradeDate(trade) || "");
    const month = date.slice(0, 7) || "Unknown";
    monthly[month] = (monthly[month] || 0) + number(trade.pnl);
    if (date) daily[date] = (daily[date] || 0) + number(trade.pnl);
    const psych = normalizePsychology(trade.psychology);
    psychology[psych].trades += 1;
    psychology[psych].pnl += number(trade.pnl);
  });

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    totalPnl,
    grossProfit,
    grossLoss,
    averagePnl: totalTrades ? totalPnl / totalTrades : 0,
    averageWin: positive.length ? grossProfit / positive.length : 0,
    averageLoss: negative.length ? grossLoss / negative.length : 0,
    winRate: totalTrades ? (wins / totalTrades) * 100 : 0,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0,
    averageRiskReward: rrValues.length ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length : null,
    byPair: groups("pair"),
    byStrategy: groups("strategy"),
    bySession: groups("session"),
    psychology,
    monthly: Object.entries(monthly).map(([name, pnl]) => ({ name, pnl })).sort((a, b) => a.name.localeCompare(b.name)),
    daily: Object.entries(daily).map(([name, pnl]) => ({ name, pnl })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function setPdfTheme() {
  const dark = document.documentElement.classList.contains("dark");
  return dark
    ? {
        ink: "#f8fafc",
        muted: "#94a3b8",
        grid: "#334155",
        surface: "#0f172a",
        soft: "#111827",
        green: "#34d399",
        emerald: "#10b981",
        red: "#fb7185",
        amber: "#fbbf24",
      }
    : PDF_COLORS;
}

function createCanvas(width = 1200, height = 620, colors = PDF_COLORS) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx, colors };
}

function chartHeader(ctx, title, subtitle, width, colors) {
  ctx.fillStyle = colors.ink;
  ctx.font = "700 27px Arial";
  ctx.fillText(title, 42, 48);
  ctx.fillStyle = colors.muted;
  ctx.font = "400 15px Arial";
  ctx.fillText(subtitle, 42, 74);
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(42, 94);
  ctx.lineTo(width - 42, 94);
  ctx.stroke();
}

function drawLineChart(points, title, subtitle, colors) {
  const { canvas, ctx } = createCanvas(1200, 620, colors);
  chartHeader(ctx, title, subtitle, canvas.width, colors);
  if (!points.length) return canvas.toDataURL("image/png");

  const left = 88;
  const right = canvas.width - 48;
  const top = 128;
  const bottom = canvas.height - 72;
  const values = points.map((point) => number(point.value));
  let min = Math.min(...values, 0);
  let max = Math.max(...values, 0);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;

  for (let i = 0; i <= 4; i += 1) {
    const y = top + (i / 4) * (bottom - top);
    const value = max - (i / 4) * range;
    ctx.strokeStyle = colors.grid;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(2), left - 10, y + 4);
  }

  const coords = points.map((point, index) => ({
    x: left + (index / Math.max(points.length - 1, 1)) * (right - left),
    y: top + (1 - (number(point.value) - min) / range) * (bottom - top),
  }));

  const path = new Path2D();
  coords.forEach((point, index) => {
    if (index === 0) path.moveTo(point.x, point.y);
    else path.lineTo(point.x, point.y);
  });

  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, `${colors.emerald}55`);
  gradient.addColorStop(1, `${colors.emerald}00`);
  ctx.fillStyle = gradient;
  const area = new Path2D(path);
  area.lineTo(coords[coords.length - 1].x, bottom);
  area.lineTo(coords[0].x, bottom);
  area.closePath();
  ctx.fill(area);

  ctx.strokeStyle = colors.emerald;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(path);

  ctx.fillStyle = colors.muted;
  ctx.font = "12px Arial";
  ctx.textAlign = "left";
  ctx.fillText(points[0]?.label || "", left, canvas.height - 28);
  ctx.textAlign = "right";
  ctx.fillText(points[points.length - 1]?.label || "", right, canvas.height - 28);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

function drawBarChart(items, title, subtitle, colors, horizontal = false) {
  const { canvas, ctx } = createCanvas(1200, 620, colors);
  chartHeader(ctx, title, subtitle, canvas.width, colors);
  const visible = horizontal ? items.slice(0, 10) : items.slice(0, 16);
  if (!visible.length) return canvas.toDataURL("image/png");

  if (horizontal) {
    const left = 230;
    const right = canvas.width - 65;
    const top = 130;
    const row = Math.min(44, (canvas.height - 165) / visible.length);
    const maxAbs = Math.max(...visible.map((item) => Math.abs(number(item.value))), 1);

    visible.forEach((item, index) => {
      const y = top + index * row;
      const value = number(item.value);
      const width = (Math.abs(value) / maxAbs) * (right - left);
      ctx.fillStyle = colors.soft;
      ctx.fillRect(left, y, right - left, 24);
      ctx.fillStyle = value >= 0 ? colors.green : colors.red;
      ctx.fillRect(left, y, Math.max(width, value ? 4 : 0), 24);
      ctx.fillStyle = colors.ink;
      ctx.font = "600 14px Arial";
      ctx.fillText(String(item.name).slice(0, 28), 42, y + 17);
      ctx.textAlign = "right";
      ctx.fillText(number(item.value).toFixed(2), canvas.width - 25, y + 17);
      ctx.textAlign = "left";
    });
  } else {
    const left = 64;
    const right = canvas.width - 42;
    const top = 135;
    const bottom = canvas.height - 72;
    const maxAbs = Math.max(...visible.map((item) => Math.abs(number(item.value))), 1);
    const step = (right - left) / visible.length;
    const barWidth = Math.max(12, Math.min(44, step * 0.62));
    const zeroY = top + (bottom - top) / 2;

    ctx.strokeStyle = colors.grid;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(left, zeroY);
    ctx.lineTo(right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    visible.forEach((item, index) => {
      const value = number(item.value);
      const height = (Math.abs(value) / maxAbs) * ((bottom - top) / 2 - 12);
      const x = left + index * step + (step - barWidth) / 2;
      const y = value >= 0 ? zeroY - height : zeroY;
      ctx.fillStyle = value >= 0 ? colors.green : colors.red;
      ctx.fillRect(x, y, barWidth, Math.max(height, value ? 3 : 0));
      ctx.fillStyle = colors.muted;
      ctx.font = "11px Arial";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(x + barWidth / 2, bottom + 22);
      ctx.rotate(-0.45);
      ctx.fillText(String(item.name).slice(0, 12), 0, 0);
      ctx.restore();
      ctx.textAlign = "left";
    });
  }

  return canvas.toDataURL("image/png");
}

function drawDonut(values, labels, title, subtitle, colors) {
  const { canvas, ctx } = createCanvas(1200, 620, colors);
  chartHeader(ctx, title, subtitle, canvas.width, colors);
  const total = values.reduce((sum, value) => sum + number(value), 0);
  const cx = 315;
  const cy = 350;
  const radius = 140;
  const inner = 82;
  let angle = -Math.PI / 2;

  if (!total) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = radius - inner;
    ctx.beginPath();
    ctx.arc(cx, cy, (radius + inner) / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    values.forEach((value, index) => {
      const next = angle + (number(value) / total) * Math.PI * 2;
      ctx.strokeStyle = [colors.amber, colors.red, colors.emerald][index];
      ctx.lineWidth = radius - inner;
      ctx.beginPath();
      ctx.arc(cx, cy, (radius + inner) / 2, angle, next);
      ctx.stroke();
      angle = next;
    });
  }

  ctx.fillStyle = colors.ink;
  ctx.textAlign = "center";
  ctx.font = "700 38px Arial";
  ctx.fillText(String(total), cx, cy + 8);
  ctx.font = "400 14px Arial";
  ctx.fillStyle = colors.muted;
  ctx.fillText("total trades", cx, cy + 34);
  ctx.textAlign = "left";

  labels.forEach((label, index) => {
    const y = 220 + index * 105;
    ctx.fillStyle = [colors.amber, colors.red, colors.emerald][index];
    ctx.beginPath();
    ctx.arc(650, y - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.ink;
    ctx.font = "700 17px Arial";
    ctx.fillText(label, 675, y);
    ctx.fillStyle = colors.muted;
    ctx.font = "400 14px Arial";
    const pct = total ? (number(values[index]) / total) * 100 : 0;
    ctx.fillText(`${values[index]} trades • ${pct.toFixed(1)}%`, 675, y + 26);
  });

  return canvas.toDataURL("image/png");
}

function DataManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const {
    accounts,
    trades,
    accountTransactions,
    selectedAccountId,
    refresh,
  } = useJournalData();

  const fileInputRef = useRef(null);
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [accountFilter, setAccountFilter] = useState(selectedAccountId || "all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);

  const accountFilteredTrades = useMemo(() => {
    if (accountFilter === "all") return trades;
    return trades.filter((trade) => accountId(trade) === accountFilter);
  }, [trades, accountFilter]);

  const filteredTrades = useMemo(
    () => filterTradesByPeriod(accountFilteredTrades, period, customStart, customEnd),
    [accountFilteredTrades, period, customStart, customEnd]
  );

  const filteredAccounts = useMemo(
    () => (accountFilter === "all" ? accounts : accounts.filter((account) => account.id === accountFilter)),
    [accounts, accountFilter]
  );

  const filteredTransactions = useMemo(() => {
    const { start, end } = getPeriodRange(period, customStart, customEnd);
    return accountTransactions.filter((transaction) => {
      if (accountFilter !== "all" && transaction.account_id !== accountFilter) return false;
      const date = String(transaction.created_at || "").slice(0, 10);
      return (!start || date >= start) && (!end || date <= end);
    });
  }, [accountTransactions, accountFilter, period, customStart, customEnd]);

  const summary = useMemo(() => buildSummary(filteredTrades), [filteredTrades]);

  const filterLabel = useMemo(() => {
    const account = accounts.find((item) => item.id === accountFilter);
    const accountText = account ? `${account.name} • ${account.currency}` : t("allAccounts");
    const periodText = period === "custom"
      ? `${customStart || "…"} → ${customEnd || "…"}`
      : t(
          period === "all"
            ? "allTime"
            : period === "7d"
            ? "last7Days"
            : period === "30d"
            ? "last30Days"
            : period === "3m"
            ? "last3Months"
            : "yearToDate"
        );
    return `${accountText} · ${periodText}`;
  }, [accounts, accountFilter, period, customStart, customEnd, t]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function exportContext() {
    return {
      trades: filteredTrades,
      accounts: filteredAccounts,
      transactions: filteredTransactions,
      summary,
      filterLabel,
    };
  }

  async function exportXLSX() {
    clearMessages();
    setExporting("xlsx");

    try {
      const context = exportContext();
      if (!context.trades.length && !context.accounts.length) throw new Error("There is no data to export.");

      const workbook = XLSX.utils.book_new();
      const filterSheet = XLSX.utils.json_to_sheet([
        { field: "User", value: user?.email || "" },
        { field: "Trader", value: profile?.traderName || "" },
        { field: "Journal", value: profile?.journalName || "PIPE.ID" },
        { field: "Account filter", value: context.filterLabel },
        { field: "Period filter", value: filterLabel },
        { field: "Exported at", value: new Date().toISOString() },
      ]);

      const summarySheet = XLSX.utils.json_to_sheet([
        { metric: "Total Trades", value: context.summary.totalTrades },
        { metric: "Wins", value: context.summary.wins },
        { metric: "Losses", value: context.summary.losses },
        { metric: "Breakeven", value: context.summary.breakevens },
        { metric: "Win Rate (%)", value: Number(context.summary.winRate.toFixed(2)) },
        { metric: "Total P&L", value: Number(context.summary.totalPnl.toFixed(2)) },
        { metric: "Gross Profit", value: Number(context.summary.grossProfit.toFixed(2)) },
        { metric: "Gross Loss", value: Number(context.summary.grossLoss.toFixed(2)) },
        { metric: "Profit Factor", value: Number(context.summary.profitFactor.toFixed(2)) },
        { metric: "Average P&L", value: Number(context.summary.averagePnl.toFixed(2)) },
        { metric: "Average Win", value: Number(context.summary.averageWin.toFixed(2)) },
        { metric: "Average Loss", value: Number(context.summary.averageLoss.toFixed(2)) },
        { metric: "Average R:R", value: context.summary.averageRiskReward === null ? "" : Number(context.summary.averageRiskReward.toFixed(4)) },
      ]);

      const tradesSheet = XLSX.utils.json_to_sheet(getTradeRows(context.trades));
      const accountsSheet = XLSX.utils.json_to_sheet(getAccountRows(context.accounts));
      const transactionsSheet = XLSX.utils.json_to_sheet(
        context.transactions.map((tx) => ({
          date: tx.created_at ? new Date(tx.created_at).toISOString() : "",
          account_id: tx.account_id || "",
          type: tx.type || "",
          amount: number(tx.amount),
          note: tx.note || "",
        }))
      );

      const categorySheet = (items, key) =>
        XLSX.utils.json_to_sheet(items.map((item) => ({
          [key]: item.name,
          trades: item.trades,
          wins: item.wins,
          losses: item.losses,
          breakeven: item.breakevens,
          win_rate_percent: Number(item.winRate.toFixed(2)),
          average_rr: item.avgRiskReward === null ? "" : Number(item.avgRiskReward.toFixed(4)),
          pnl: Number(item.pnl.toFixed(2)),
        })));

      const pairSheet = categorySheet(context.summary.byPair, "pair");
      const strategySheet = categorySheet(context.summary.byStrategy, "strategy");
      const sessionSheet = categorySheet(context.summary.bySession, "session");
      const psychologySheet = XLSX.utils.json_to_sheet(
        PSYCHOLOGY_VALUES.map((key) => ({
          psychology: key,
          trades: context.summary.psychology[key].trades,
          share_percent: context.summary.totalTrades ? Number(((context.summary.psychology[key].trades / context.summary.totalTrades) * 100).toFixed(2)) : 0,
          pnl: Number(context.summary.psychology[key].pnl.toFixed(2)),
        }))
      );
      const resultSheet = XLSX.utils.json_to_sheet(
        RESULT_VALUES.map((result) => ({
          result,
          trades: context.trades.filter((trade) => trade.result === result).length,
          pnl: Number(context.trades.filter((trade) => trade.result === result).reduce((sum, trade) => sum + number(trade.pnl), 0).toFixed(2)),
        }))
      );
      const monthlySheet = XLSX.utils.json_to_sheet(context.summary.monthly.map((item) => ({ month: item.name, pnl: Number(item.pnl.toFixed(2)) })));
      const dailySheet = XLSX.utils.json_to_sheet(context.summary.daily.map((item) => ({ date: item.name, pnl: Number(item.pnl.toFixed(2)) })));

      [filterSheet, summarySheet, tradesSheet, accountsSheet, transactionsSheet, pairSheet, strategySheet, sessionSheet, psychologySheet, resultSheet, monthlySheet, dailySheet]
        .forEach((sheet) => {
          sheet["!cols"] = Object.keys(sheet).filter((key) => !key.startsWith("!")).length
            ? [{ wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 24 }]
            : [];
        });

      XLSX.utils.book_append_sheet(workbook, filterSheet, "Filters");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(workbook, tradesSheet, "Trades");
      XLSX.utils.book_append_sheet(workbook, accountsSheet, "Accounts");
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions");
      XLSX.utils.book_append_sheet(workbook, pairSheet, "By Pair");
      XLSX.utils.book_append_sheet(workbook, strategySheet, "By Strategy");
      XLSX.utils.book_append_sheet(workbook, sessionSheet, "By Session");
      XLSX.utils.book_append_sheet(workbook, psychologySheet, "Psychology");
      XLSX.utils.book_append_sheet(workbook, resultSheet, "By Result");
      XLSX.utils.book_append_sheet(workbook, monthlySheet, "Monthly P&L");
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily P&L");

      XLSX.writeFile(workbook, "Trading-Journal.xlsx");
      setMessage(t("excelExported"));
    } catch (err) {
      console.error(err);
      setError(err.message || t("exportExcelFailed"));
    } finally {
      setExporting("");
    }
  }

  async function exportPDF() {
    clearMessages();
    setExporting("pdf");

    try {
      const context = exportContext();
      if (!context.trades.length) throw new Error("There are no trades in the selected filter.");

      const colors = setPdfTheme();
      const sorted = [...context.trades].sort((a, b) => String(tradeDate(a)).localeCompare(String(tradeDate(b))));
      let cumulative = 0;
      const equity = sorted.map((trade) => {
        cumulative += number(trade.pnl);
        return { label: dateText(tradeDate(trade)), value: cumulative };
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;

      const pageBg = colors.surface === "#ffffff" ? [255, 255, 255] : [15, 23, 42];
      const paintPage = () => {
        doc.setFillColor(...pageBg);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
      };

      const textRgb = colors.surface === "#ffffff" ? [15, 23, 42] : [248, 250, 252];
      const mutedRgb = colors.surface === "#ffffff" ? [100, 116, 139] : [148, 163, 184];
      const lineRgb = colors.surface === "#ffffff" ? [226, 232, 240] : [51, 65, 85];

      function header(title, subtitle = context.filterLabel) {
        doc.setTextColor(...textRgb);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text(title, margin, 14);
        doc.setTextColor(...mutedRgb);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(subtitle, margin, 19);
        doc.text(`${t("generated")} ${dateText(new Date())}`, pageWidth - margin, 14, { align: "right" });
        doc.setDrawColor(...lineRgb);
        doc.line(margin, 23, pageWidth - margin, 23);
      }

      function metric(x, y, w, label, value) {
        doc.setDrawColor(...lineRgb);
        doc.setFillColor(...(colors.surface === "#ffffff" ? [248, 250, 252] : [17, 24, 39]));
        doc.roundedRect(x, y, w, 23, 3, 3, "FD");
        doc.setTextColor(...mutedRgb);
        doc.setFontSize(7);
        doc.text(label, x + 4, y + 7);
        doc.setTextColor(...textRgb);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(String(value), x + 4, y + 16);
        doc.setFont("helvetica", "normal");
      }

      function addChartPage(title, image, subtitle) {
        doc.addPage();
        paintPage();
        header(title, subtitle);
        if (image) doc.addImage(image, "PNG", margin, 30, pageWidth - margin * 2, 155);
      }

      paintPage();
      header("Trading Journal Report", context.filterLabel);

      const metricGap = 4;
      const metricW = (pageWidth - margin * 2 - metricGap * 4) / 5;
      [
        [t("totalTrades"), context.summary.totalTrades],
        [t("winRate"), `${context.summary.winRate.toFixed(1)}%`],
        [t("netPnl"), context.summary.totalPnl >= 0 ? `+${context.summary.totalPnl.toFixed(2)}` : context.summary.totalPnl.toFixed(2)],
        [t("profitFactor"), context.summary.profitFactor.toFixed(2)],
        [t("averageRiskReward"), formatRiskReward(context.summary.averageRiskReward)],
      ].forEach(([label, value], index) => metric(margin + index * (metricW + metricGap), 29, metricW, label, value));

      doc.setTextColor(...mutedRgb);
      doc.setFontSize(8);
      doc.text(`${t("traderName")}: ${profile?.traderName || "-"}`, margin, 62);
      doc.text(`${t("settingsJournalName")}: ${profile?.journalName || "PIPE.ID"}`, margin, 68);
      doc.text(`${t("email")}: ${user?.email || "-"}`, 120, 68);

      const equityImage = drawLineChart(equity, t("equityCurve"), t("cumulativePnlOrdered"), colors);
      doc.addImage(equityImage, "PNG", margin, 76, pageWidth - margin * 2, 105);

      const monthlyImage = drawBarChart(context.summary.monthly.map((item) => ({ name: item.name, value: item.pnl })), t("monthlyPnl"), t("netPnlByMonth"), colors);
      const resultImage = drawDonut(
        RESULT_VALUES.map((key) => context.trades.filter((trade) => trade.result === key).length),
        [t("win"), t("loss"), t("breakeven")],
        t("tradeResults"),
        t("tradeResultsDescription"),
        colors
      );
      addChartPage(t("monthlyPnl"), monthlyImage, t("netPnlByMonth"));
      addChartPage(t("tradeResults"), resultImage, t("tradeResultsDescription"));

      const pairImage = drawBarChart(context.summary.byPair.map((item) => ({ name: item.name, value: item.pnl })), t("pnlByPair"), t("highestImpactPairs"), colors, true);
      const strategyImage = drawBarChart(context.summary.byStrategy.map((item) => ({ name: item.name, value: item.pnl })), t("pnlByStrategy"), t("highestImpactStrategies"), colors, true);
      addChartPage(t("pnlByPair"), pairImage, t("highestImpactPairs"));
      addChartPage(t("pnlByStrategy"), strategyImage, t("highestImpactStrategies"));

      const psychologyImage = drawDonut(
        PSYCHOLOGY_VALUES.map((key) => context.summary.psychology[key].trades),
        [t("greed"), t("fear"), t("neutral")],
        t("psychologyPerformance"),
        t("psychologyDescription"),
        colors
      );
      addChartPage(t("psychologyPerformance"), psychologyImage, t("psychologyDescription"));

      doc.addPage();
      paintPage();
      header(t("performanceBreakdown"), context.filterLabel);
      doc.setTextColor(...textRgb);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`${t("totalPnl")}: ${context.summary.totalPnl.toFixed(2)}`, margin, 34);
      doc.text(`${t("averagePnl")}: ${context.summary.averagePnl.toFixed(2)}`, margin, 42);
      doc.text(`${t("averageWin")}: ${context.summary.averageWin.toFixed(2)}`, 105, 34);
      doc.text(`${t("averageLoss")}: ${context.summary.averageLoss.toFixed(2)}`, 105, 42);
      doc.text(`${t("averageRiskReward")}: ${formatRiskReward(context.summary.averageRiskReward)}`, 200, 34);
      doc.text(`${t("profitFactor")}: ${context.summary.profitFactor.toFixed(2)}`, 200, 42);

      function performanceTable(title, items, startY = 34) {
        doc.setTextColor(...textRgb);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, margin, startY);

        autoTable(doc, {
          startY: startY + 6,
          margin: { left: margin, right: margin, bottom: 12 },
          head: [[t("name"), t("tradesLabel"), t("winRate"), t("averageRiskReward"), t("pnl")]],
          body: items.map((item) => [
            item.name,
            item.trades,
            `${item.winRate.toFixed(1)}%`,
            formatRiskReward(item.avgRiskReward),
            item.pnl.toFixed(2),
          ]),
          theme: "grid",
          styles: { fontSize: 7.2, cellPadding: 2.7, textColor: textRgb, fillColor: pageBg, lineColor: lineRgb },
          headStyles: {
            fillColor: colors.surface === "#ffffff" ? [15, 23, 42] : [30, 41, 59],
            textColor: [255, 255, 255],
          },
        });
      }

      performanceTable(t("performanceByPair"), context.summary.byPair, 62);
      [context.summary.byStrategy, context.summary.bySession, Object.entries(context.summary.psychology).map(([key, item]) => {
        const values = context.trades
          .filter((trade) => normalizePsychology(trade.psychology) === key)
          .map(getRiskReward)
          .filter((value) => value !== null);
        return {
          name: t(key === "GREED" ? "greed" : key === "FEAR" ? "fear" : "neutral"),
          trades: item.trades,
          winRate: item.trades
            ? (context.trades.filter((trade) => normalizePsychology(trade.psychology) === key && trade.result === "WIN").length / item.trades) * 100
            : 0,
          avgRiskReward: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
          pnl: item.pnl,
        };
      })].forEach((items, index) => {
        doc.addPage();
        paintPage();
        header(t("performanceBreakdown"), context.filterLabel);
        performanceTable(
          [t("performanceByStrategy"), t("performanceBySession"), t("performanceByPsychology")][index],
          items
        );
      });

      if (context.accounts.length) {
        doc.addPage();
        paintPage();
        header(t("accounts"), context.filterLabel);
        autoTable(doc, {
          startY: 31,
          margin: { left: margin, right: margin, bottom: 12 },
          head: [[t("account"), t("accountType"), t("currency"), t("initialBalance"), t("currentBalance"), t("tradingPnl")]],
          body: context.accounts.map((account) => [
            account.name || "-",
            account.account_type || "-",
            account.currency || "-",
            number(account.starting_balance).toFixed(2),
            number(account.current_balance).toFixed(2),
            number(account.trading_pnl).toFixed(2),
          ]),
          theme: "grid",
          styles: { fontSize: 7.5, cellPadding: 3, textColor: textRgb, fillColor: pageBg, lineColor: lineRgb },
          headStyles: { fillColor: colors.surface === "#ffffff" ? [15, 23, 42] : [30, 41, 59], textColor: [255, 255, 255] },
        });
      }

      if (context.transactions.length) {
        doc.addPage();
        paintPage();
        header(t("balanceMovement"), context.filterLabel);
        autoTable(doc, {
          startY: 31,
          margin: { left: margin, right: margin, bottom: 12 },
          head: [[t("date"), t("account"), t("type"), t("amount"), t("notes")]],
          body: context.transactions.map((transaction) => [
            dateText(transaction.created_at),
            context.accounts.find((account) => account.id === transaction.account_id)?.name || "-",
            transaction.type || "-",
            number(transaction.amount).toFixed(2),
            transaction.note || "-",
          ]),
          theme: "grid",
          styles: { fontSize: 7.5, cellPadding: 3, textColor: textRgb, fillColor: pageBg, lineColor: lineRgb },
          headStyles: { fillColor: colors.surface === "#ffffff" ? [15, 23, 42] : [30, 41, 59], textColor: [255, 255, 255] },
        });
      }

      if (context.trades.some((trade) => trade.notes)) {
        doc.addPage();
        paintPage();
        header(t("notes"), context.filterLabel);
        autoTable(doc, {
          startY: 31,
          margin: { left: margin, right: margin, bottom: 12 },
          head: [[t("legacyDate"), t("account"), t("pair"), t("strategy"), t("psychology"), t("notes")]],
          body: context.trades.filter((trade) => trade.notes).map((trade) => [
            dateText(tradeDate(trade)),
            trade.accountName || "-",
            trade.pair || "-",
            trade.strategy || "-",
            t(normalizePsychology(trade.psychology) === "GREED" ? "greed" : normalizePsychology(trade.psychology) === "FEAR" ? "fear" : "neutral"),
            trade.notes,
          ]),
          theme: "striped",
          styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak", textColor: textRgb, fillColor: pageBg, lineColor: lineRgb },
          headStyles: { fillColor: colors.surface === "#ffffff" ? [15, 23, 42] : [30, 41, 59], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: colors.surface === "#ffffff" ? [248, 250, 252] : [17, 24, 39] },
        });
      }

      doc.addPage();
      paintPage();
      header(t("tradeLog"), t("completeExportedTrades"));
      autoTable(doc, {
        startY: 29,
        margin: { left: 8, right: 8, top: 29, bottom: 10 },
        head: [[
          t("legacyDate"), t("account"), t("pair"), t("direction"), t("entry"),
          t("stopLoss"), t("takeProfit"), t("lot"), t("riskReward"), t("result"),
          t("psychology"), t("pnl"), t("strategy"), t("session")
        ]],
        body: getTradeRows(context.trades).map((trade) => [
          dateText(trade.trade_date),
          trade.account_name || "-",
          trade.pair || "-",
          trade.direction || "-",
          trade.entry_price || "-",
          trade.stop_loss || "-",
          trade.take_profit || "-",
          trade.lot_size || "-",
          trade.risk_reward_display,
          trade.result || "-",
          t(trade.psychology === "GREED" ? "greed" : trade.psychology === "FEAR" ? "fear" : "neutral"),
          number(trade.pnl).toFixed(2),
          trade.strategy || "-",
          trade.session || "-",
        ]),
        theme: "striped",
        styles: {
          fontSize: 5.7,
          cellPadding: 1.8,
          overflow: "linebreak",
          valign: "middle",
          textColor: textRgb,
          fillColor: pageBg,
          lineColor: lineRgb,
        },
        headStyles: {
          fillColor: colors.surface === "#ffffff" ? [15, 23, 42] : [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 5.8,
        },
        alternateRowStyles: { fillColor: colors.surface === "#ffffff" ? [248, 250, 252] : [17, 24, 39] },
        willDrawPage: () => {
          paintPage();
          header(t("tradeLog"), t("completeExportedTrades"));
        },
      });

      doc.save(`Trading-Journal-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      setMessage(t("pdfExported"));
    } catch (err) {
      console.error(err);
      setError(err.message || t("exportPdfFailed"));
    } finally {
      setExporting("");
    }
  }

  function resetImport() {
    setShowImportModal(false);
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImportFile(event) {
    clearMessages();
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const tradesSheet = workbook.Sheets.Trades;
      const accountsSheet = workbook.Sheets.Accounts;
      if (!tradesSheet && !accountsSheet) throw new Error("The Excel file must contain a Trades or Accounts sheet.");

      setImportPreview({
        fileName: file.name,
        trades: tradesSheet ? XLSX.utils.sheet_to_json(tradesSheet, { defval: "" }) : [],
        accounts: accountsSheet ? XLSX.utils.sheet_to_json(accountsSheet, { defval: "" }) : [],
      });
      setShowImportModal(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to read the Excel file.");
    } finally {
      setImporting(false);
    }
  }

  async function confirmImport() {
    if (!user || !importPreview) return;
    clearMessages(); setImporting(true);
    try {
      const importedAccounts = importPreview.accounts || [];
      const importedTrades = importPreview.trades || [];
      const existingAccounts = await pipeApi.accounts.list();
      const accountIdMap = new Map();
      for (const account of importedAccounts) {
        const name = String(account.account_name || "").trim();
        if (!name) continue;
        const type = String(account.account_type || "LIVE").toUpperCase() === "DEMO" ? "DEMO" : "LIVE";
        const currency = String(account.currency || "").trim().toUpperCase();
        if (!currency) continue;
        const existing = existingAccounts.find((item) => item.name === name);
        if (existing) { if (account.account_id) accountIdMap.set(String(account.account_id), existing.id); continue; }
        const created = await pipeApi.accounts.create({ name, accountType: type, currency, startingBalance: number(account.initial_balance), pair: account.primary_pair ? String(account.primary_pair).trim().toUpperCase() : null });
        if (account.account_id) accountIdMap.set(String(account.account_id), created.id);
      }
      const allAccounts = await pipeApi.accounts.list();
      allAccounts.forEach((account) => accountIdMap.set(String(account.id), account.id));
      const existingResponse = await pipeApi.trades.list(new URLSearchParams({ page: "1", limit: "1000" }).toString());
      const existingTrades = existingResponse.data || [];
      const duplicates = new Set(existingTrades.map((trade) => [trade.account_id, trade.trade_date, trade.pair, trade.direction, number(trade.entry_price), number(trade.pnl)].join("|")));
      let importedCount = 0;
      for (const imported of importedTrades) {
        const mappedAccountId = accountIdMap.get(String(imported.account_id || ""));
        if (!mappedAccountId) continue;
        const psychology = normalizePsychology(imported.psychology);
        const pair = String(imported.pair || "").trim().toUpperCase();
        if (!pair || !imported.trade_date) continue;
        const duplicateKey = [mappedAccountId, imported.trade_date, pair, String(imported.direction || "BUY").toUpperCase(), number(imported.entry_price), number(imported.pnl)].join("|");
        if (duplicates.has(duplicateKey)) continue;
        const rr = Number(imported.risk_reward);
        const result = RESULT_VALUES.includes(String(imported.result || "").toUpperCase()) ? String(imported.result).toUpperCase() : "BREAKEVEN";
        const pnl = number(imported.pnl);
        await pipeApi.trades.create({ accountId: mappedAccountId, tradeDate: imported.trade_date, pair, direction: String(imported.direction || "BUY").toUpperCase(), entryPrice: number(imported.entry_price), stopLoss: imported.stop_loss === "" ? null : number(imported.stop_loss), takeProfit: imported.take_profit === "" ? null : number(imported.take_profit), lotSize: number(imported.lot_size) || 0.01, riskReward: Number.isFinite(rr) && rr > 0 ? rr : null, result, pnl, strategy: String(imported.strategy || "").trim() || null, session: String(imported.session || "").trim() || null, psychology, notes: String(imported.notes || "").trim() || null });
        duplicates.add(duplicateKey); importedCount += 1;
      }
      await refresh(); setMessage(t("excelImportComplete").replace("{count}", importedCount)); resetImport();
    } catch (err) { console.error(err); setError(err.message || "Failed to import Excel data."); }
    finally { setImporting(false); }
  }

  return (
    <section className="ui-section ui-card mt-8 overflow-hidden">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("dataManagement")}</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t("dataManagementDescription")}</p>
              </div>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            {filteredTrades.length} {t("tradesLabel")}
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <PeriodFilter
          t={t}
          period={period}
          setPeriod={setPeriod}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />

        <div className="mt-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/45">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("accountFilter")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("exportUserScope")}</p>
            </div>
            <Select
              value={accountFilter}
              onChange={setAccountFilter}
              className="md:min-w-64"
              options={[
                { value: "all", label: t("allAccounts") },
                ...accounts.map((account) => ({
                  value: account.id,
                  label: `${account.name} • ${account.currency} • ${account.account_type}`,
                })),
              ]}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">
            {t("activeExportFilter")}: {filterLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <button
          type="button"
          onClick={exportPDF}
          disabled={exporting || !filteredTrades.length}
          className="group rounded-2xl bg-red-50/80 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/20"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm dark:bg-slate-900 dark:text-red-300">
              {exporting === "pdf" ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            </div>
            <Download size={18} className="text-red-300" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{t("pdfPerformanceReport")}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t("pdfDescription")}</p>
        </button>

        <button
          type="button"
          onClick={exportXLSX}
          disabled={exporting || (!filteredTrades.length && !filteredAccounts.length)}
          className="group rounded-2xl bg-emerald-50/80 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed dark:bg-emerald-950/20"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
              {exporting === "xlsx" ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
            </div>
            <Download size={18} className="text-emerald-300" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{t("excelWorkbook")}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{t("excelDescription")}</p>
        </button>
      </div>

      {(message || error) && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${message ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}>
            {message ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0" />}
            <span>{message || error}</span>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("excelImport")}</h3>
            <p className="mt-1 text-xs text-slate-500">{t("excelImportDescription")}</p>
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              {importing ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
              {t("chooseExcelFile")}
            </button>
          </div>
        </div>
      </div>

      {showImportModal && importPreview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{t("reviewExcelImport")}</h3>
                <p className="mt-1 max-w-sm truncate text-xs text-slate-500">{importPreview.fileName}</p>
              </div>
              <button type="button" onClick={resetImport} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <PreviewCard label={t("tradesLabel")} value={importPreview.trades.length} />
              <PreviewCard label={t("accountsCount")} value={importPreview.accounts.length} />
            </div>
            <div className="mx-6 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              {t("psychologyImportNote")}
            </div>
            <div className="flex justify-end gap-2 px-6 py-5">
              <button type="button" onClick={resetImport} disabled={importing} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{t("cancel")}</button>
              <button type="button" onClick={confirmImport} disabled={importing} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-slate-950">
                {importing && <Loader2 size={16} className="animate-spin" />}
                {importing ? t("importing") : t("importData")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default DataManagement;