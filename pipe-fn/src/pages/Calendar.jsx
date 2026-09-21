import { Children, isValidElement, useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useJournalData } from "../hooks/useJournalData";
import { useLanguage } from "../hooks/useLanguage";
import Select from "../components/Select";
import { formatRiskReward, getRiskReward } from "../utils/riskReward";

const WEEKDAYS = {
  EN: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ID: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
};

const MONTHS = {
  EN: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  ID: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ],
};

function formatPnl(value) {
  const number = Number(value || 0);

  return number > 0
    ? `+${number.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : number.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Calendar() {
  const { visibleTrades: trades } = useJournalData();
  const { language, t } = useLanguage();

  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [accountFilter, setAccountFilter] = useState("all");
  const [pairFilter, setPairFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");

  const [selectedDate, setSelectedDate] = useState(null);

  // ---------------------------------------------------------
  // FILTER OPTIONS
  // ---------------------------------------------------------

  const accounts = useMemo(() => {
    return [
      ...new Map(
        trades
          .filter((trade) => trade.accountId)
          .map((trade) => [
            trade.accountId,
            trade.accountName || t("unnamedAccount"),
          ])
      ),
    ];
  }, [trades, t]);

  const pairs = useMemo(() => {
    return [
      ...new Set(
        trades
          .map((trade) => trade.pair)
          .filter(Boolean)
      ),
    ].sort();
  }, [trades]);

  const strategies = useMemo(() => {
    return [
      ...new Set(
        trades
          .map((trade) => trade.strategy)
          .filter(Boolean)
      ),
    ].sort();
  }, [trades]);

  // ---------------------------------------------------------
  // FILTERED TRADES
  // ---------------------------------------------------------

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      if (
        accountFilter !== "all" &&
        trade.accountId !== accountFilter
      ) {
        return false;
      }

      if (
        pairFilter !== "all" &&
        trade.pair !== pairFilter
      ) {
        return false;
      }

      if (
        resultFilter !== "all" &&
        trade.result !== resultFilter
      ) {
        return false;
      }

      if (
        strategyFilter !== "all" &&
        (trade.strategy || "") !== strategyFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    trades,
    accountFilter,
    pairFilter,
    resultFilter,
    strategyFilter,
  ]);

  // ---------------------------------------------------------
  // CALENDAR DAYS
  // ---------------------------------------------------------

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);

    // Convert Sunday = 0 into Monday = 0
    const startingDay =
      firstDay.getDay() === 0
        ? 6
        : firstDay.getDay() - 1;

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const days = [];

    // Previous month empty cells
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        new Date(year, month, day)
      );
    }

    return days;
  }, [currentDate]);

  // ---------------------------------------------------------
  // GROUP TRADES BY DATE
  // ---------------------------------------------------------

  const tradesByDate = useMemo(() => {
    const grouped = {};

    filteredTrades.forEach((trade) => {
      if (!trade.tradeDate) {
        return;
      }

      const key = trade.tradeDate;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(trade);
    });

    return grouped;
  }, [filteredTrades]);

  // ---------------------------------------------------------
  // SELECTED DAY
  // ---------------------------------------------------------

  const selectedTrades = selectedDate
    ? tradesByDate[selectedDate] || []
    : [];

  const selectedDayPnl = selectedTrades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  // ---------------------------------------------------------
  // MONTH SUMMARY
  // ---------------------------------------------------------

  const monthTrades = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return filteredTrades.filter((trade) => {
      if (!trade.tradeDate) {
        return false;
      }

      const date = new Date(`${trade.tradeDate}T00:00:00`);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });
  }, [filteredTrades, currentDate]);

  const monthPnl = monthTrades.reduce(
    (total, trade) =>
      total + Number(trade.pnl || 0),
    0
  );

  const monthWins = monthTrades.filter(
    (trade) => trade.result === "WIN"
  ).length;

  const monthLosses = monthTrades.filter(
    (trade) => trade.result === "LOSS"
  ).length;

  // ---------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------

  function previousMonth() {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );

    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );

    setSelectedDate(null);
  }

  function goToToday() {
    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(null);
  }

  function resetFilters() {
    setAccountFilter("all");
    setPairFilter("all");
    setResultFilter("all");
    setStrategyFilter("all");
  }

  return (
    <div className="max-w-7xl">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("calendar")}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {t("calendarDescription")}
        </p>
      </div>

      {/* FILTERS */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label={t("account")}
            value={accountFilter}
            onChange={setAccountFilter}
          >
            <option value="all">{t("allAccounts")}</option>

            {accounts.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label={t("pair")}
            value={pairFilter}
            onChange={setPairFilter}
          >
            <option value="all">{t("allPairs")}</option>

            {pairs.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label={t("result")}
            value={resultFilter}
            onChange={setResultFilter}
          >
            <option value="all">{t("allResults")}</option>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
            <option value="BREAKEVEN">
              BREAKEVEN
            </option>
          </FilterSelect>

          <FilterSelect
            label={t("strategy")}
            value={strategyFilter}
            onChange={setStrategyFilter}
          >
            <option value="all">{t("allStrategies")}</option>

            {strategies.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </FilterSelect>

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X size={15} />
            {t("reset")}
          </button>
        </div>
      </div>

      {/* MONTH HEADER */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {MONTHS[language][currentDate.getMonth()]}{" "}
              {currentDate.getFullYear()}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {monthTrades.length} {t("trades")} ·{" "}
              <span
                className={
                  monthPnl > 0
                    ? "text-green-600"
                    : monthPnl < 0
                    ? "text-red-600"
                    : ""
                }
              >
                {formatPnl(monthPnl)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("today")}
            </button>

            <button
              type="button"
              onClick={previousMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              type="button"
              onClick={nextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="overflow-x-auto p-3 sm:p-4">
          <div className="min-w-[720px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-7">
            {WEEKDAYS[language].map((day) => (
              <div
                key={day}
                className="border-b border-r border-slate-200 bg-slate-50 px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[108px] border-b border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                  />
                );
              }

              const dateKey = getDateKey(date);
              const dayTrades =
                tradesByDate[dateKey] || [];

              const dayPnl = dayTrades.reduce(
                (total, trade) =>
                  total + Number(trade.pnl || 0),
                0
              );

              const isToday =
                dateKey === getDateKey(today);

              const hasTrades =
                dayTrades.length > 0;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() =>
                    hasTrades
                      ? setSelectedDate(dateKey)
                      : setSelectedDate(null)
                  }
                  className={`min-h-[108px] border-b border-r border-slate-200 p-3 text-left transition ${
                    hasTrades
                      ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                      : "cursor-default"
                  } ${
                    selectedDate === dateKey
                      ? "bg-slate-100"
                       : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {hasTrades && (
                      <span className="text-[10px] text-slate-400">
                        {t("tradeCount").replace("{count}", dayTrades.length).replace("{plural}", dayTrades.length !== 1 ? "s" : "")}
                      </span>
                    )}
                  </div>

                  {hasTrades && (
                    <div className="mt-5">
                      <p
                        className={`text-sm font-bold ${
                          dayPnl > 0
                            ? "text-green-600"
                            : dayPnl < 0
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {formatPnl(dayPnl)}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {dayTrades
                          .slice(0, 3)
                          .map((trade) => (
                            <span
                              key={trade.id}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                trade.result === "WIN"
                                  ? "bg-green-50 text-green-700"
                                  : trade.result ===
                                    "LOSS"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {trade.pair}
                            </span>
                          ))}

                        {dayTrades.length > 3 && (
                          <span className="px-1 text-[9px] text-slate-400">
                            +{dayTrades.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* MONTH SUMMARY */}
        <div className="grid border-t border-slate-200 dark:border-slate-800 sm:grid-cols-3">
          <SummaryItem
            label={t("trades")}
            value={monthTrades.length}
          />

          <SummaryItem
            label={t("winsLosses")}
            value={`${monthWins} / ${monthLosses}`}
          />

          <SummaryItem
            label={t("monthlyPnlLabel")}
            value={formatPnl(monthPnl)}
            valueClass={
              monthPnl > 0
                ? "text-green-600"
                : monthPnl < 0
                ? "text-red-600"
                : "text-slate-900"
            }
          />
        </div>
      </div>

      {/* SELECTED DATE */}
      {selectedDate && (
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {new Date(
                    `${selectedDate}T00:00:00`
                  ).toLocaleDateString(language === "ID" ? "id-ID" : "en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedTrades.length} {t("trades")} ·{" "}
                  <span
                    className={
                      selectedDayPnl > 0
                        ? "text-green-600"
                        : selectedDayPnl < 0
                        ? "text-red-600"
                        : ""
                    }
                  >
                    {formatPnl(selectedDayPnl)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto overscroll-contain">
            <table className="w-full min-w-[820px] text-left">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <tr>
                  <TableHeader>{t("pair")}</TableHeader>
                  <TableHeader>{t("account")}</TableHeader>
                  <TableHeader>{t("direction")}</TableHeader>
                  <TableHeader>{t("result")}</TableHeader>
                  <TableHeader>{t("psychology")}</TableHeader>
                  <TableHeader>{t("riskReward")}</TableHeader>
                  <TableHeader>{t("strategy")}</TableHeader>
                  <TableHeader>{t("pnl")}</TableHeader>
                  <TableHeader>{t("detail")}</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {selectedTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {trade.pair}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {trade.accountName || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <span
                        className={
                          trade.direction === "BUY"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {trade.direction}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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

                    <td className="px-5 py-4 text-sm">
                      <PsychologyBadge value={trade.psychology} />
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRiskReward(getRiskReward(trade))}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {trade.strategy || "-"}
                    </td>

                    <td
                      className={`px-5 py-4 text-sm font-semibold ${
                        Number(trade.pnl) > 0
                          ? "text-green-600"
                          : Number(trade.pnl) < 0
                          ? "text-red-600"
                          : "text-slate-600"
                      }`}
                    >
                      {formatPnl(trade.pnl)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/trades/${trade.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
        </section>
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

function FilterSelect({ label, value, onChange, children }) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled,
    }));

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <Select value={value} onChange={onChange} options={options} />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="border-r border-slate-200 px-4 py-5 last:border-r-0 dark:border-slate-800 sm:px-6">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

export default Calendar;