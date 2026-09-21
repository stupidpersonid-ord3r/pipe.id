export const PRESETS = [
  ["all", "allTime"],
  ["7d", "last7Days"],
  ["30d", "last30Days"],
  ["3m", "last3Months"],
  ["ytd", "yearToDate"],
  ["custom", "customRange"],
];

export function getPeriodRange(
  period,
  customStart = "",
  customEnd = ""
) {
  if (period === "custom") {
    return {
      start: customStart || "",
      end: customEnd || "",
    };
  }

  if (period === "all") {
    return {
      start: "",
      end: "",
    };
  }

  const now = new Date();

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let start = new Date(end);

  if (period === "7d") {
    start.setDate(start.getDate() - 6);
  }

  if (period === "30d") {
    start.setDate(start.getDate() - 29);
  }

  if (period === "3m") {
    start.setMonth(start.getMonth() - 3);
  }

  if (period === "ytd") {
    start = new Date(end.getFullYear(), 0, 1);
  }

  return {
    start: toDateInput(start),
    end: toDateInput(end),
  };
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function filterTradesByPeriod(
  trades,
  period,
  customStart,
  customEnd
) {
  const { start, end } = getPeriodRange(
    period,
    customStart,
    customEnd
  );

  if (!start && !end) {
    return [...trades];
  }

  return trades.filter((trade) => {
    const date =
      trade.tradeDate || trade.trade_date;

    if (!date) {
      return false;
    }

    return (
      (!start || date >= start) &&
      (!end || date <= end)
    );
  });
}