import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pipeApi } from "../../lib/pipeApi";
import { useAuth } from "../../hooks/useAuth";
import { useJournalData } from "../../hooks/useJournalData";
import { useLanguage } from "../../hooks/useLanguage";
import InstrumentPicker from "../../components/InstrumentPicker";
import Select from "../../components/Select";
import { calculateRiskReward, formatRiskReward } from "../../utils/riskReward";

const initialForm = {
  tradeDate: new Date().toISOString().slice(0, 10),
  accountId: "",
  pair: "",
  direction: "BUY",
  lotSize: "0.10",
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  result: "WIN",
  pnl: "",
  strategy: "",
  session: "LONDON",
  psychology: "NEUTRAL",
  notes: "",
};

const requiredFields = [
  "tradeDate",
  "accountId",
  "pair",
  "direction",
  "entryPrice",
  "stopLoss",
  "takeProfit",
  "result",
  "pnl",
  "strategy",
  "session",
  "psychology",
];

function validateForm(form, t) {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!String(form[field] ?? "").trim()) {
      errors[field] = t("fieldRequired");
    }
  });

  const lot = Number(form.lotSize);
  if (!String(form.lotSize).trim()) {
    errors.lotSize = t("lotRequired");
  } else if (!Number.isFinite(lot) || lot < 0.01 || lot > 20) {
    errors.lotSize = t("lotRange");
  }

  ["entryPrice", "stopLoss", "takeProfit", "pnl"].forEach((field) => {
    if (
      String(form[field] ?? "").trim() &&
      !Number.isFinite(Number(form[field]))
    ) {
      errors[field] = t("numberInvalid");
    }
  });

  const rr = calculateRiskReward({
    direction: form.direction,
    entryPrice: form.entryPrice,
    stopLoss: form.stopLoss,
    takeProfit: form.takeProfit,
  });

  if (
    form.entryPrice &&
    form.stopLoss &&
    form.takeProfit &&
    rr === null
  ) {
    errors.riskReward = t("riskRewardInvalid");
  }

  return errors;
}

function AddTrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, selectedAccountId, loading: loadingAccounts } = useJournalData();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    ...initialForm,
    accountId: selectedAccountId || "",
  });
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const effectiveAccountId = form.accountId || selectedAccountId || "";
  const validation = useMemo(
    () => validateForm({ ...form, accountId: effectiveAccountId }, t),
    [form, effectiveAccountId, t]
  );

  const rr = useMemo(
    () =>
      calculateRiskReward({
        direction: form.direction,
        entryPrice: form.entryPrice,
        stopLoss: form.stopLoss,
        takeProfit: form.takeProfit,
      }),
    [form.direction, form.entryPrice, form.stopLoss, form.takeProfit]
  );

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "result") {
      setForm((current) => {
        const raw = Number(current.pnl);
        const amount = Number.isFinite(raw) ? Math.abs(raw) : 0;
        const nextPnl =
          value === "WIN"
            ? (amount ? String(amount) : "")
            : value === "LOSS"
            ? (amount ? String(-amount) : "")
            : "0";
        return { ...current, result: value, pnl: nextPnl };
      });
    } else if (name === "pnl") {
      const digitsOnly = String(value).replace(/[^0-9.]/g, "");
      const numeric = Number(digitsOnly);
      const amount = Number.isFinite(numeric) ? Math.abs(numeric) : 0;
      setForm((current) => ({
        ...current,
        pnl:
          current.result === "LOSS"
            ? (amount ? String(-amount) : "")
            : current.result === "BREAKEVEN"
            ? "0"
            : (amount ? String(amount) : ""),
      }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }

    setTouched((current) => ({ ...current, [name]: true }));
    setError("");
  }

  function touchField(name) {
    setTouched((current) => ({ ...current, [name]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const allTouched = Object.fromEntries(
      [...requiredFields, "lotSize", "riskReward"].map((field) => [field, true])
    );
    setTouched(allTouched);
    
    const submitForm = { ...form, accountId: effectiveAccountId };
    const errors = validateForm(submitForm, t);
    if (Object.keys(errors).length > 0) {
      setError(t("fixFormErrors"));
      return;
    }

    if (!user) return;
    setSaving(true);
    setError("");

    try {
      await pipeApi.trades.create({
        accountId: submitForm.accountId,
        tradeDate: submitForm.tradeDate,
        pair: submitForm.pair.trim().toUpperCase(),
        direction: submitForm.direction,
        entryPrice: Number(submitForm.entryPrice),
        stopLoss: Number(submitForm.stopLoss),
        takeProfit: Number(submitForm.takeProfit),
        lotSize: Number(submitForm.lotSize),
        result: submitForm.result,
        pnl: Number(submitForm.pnl),
        strategy: submitForm.strategy.trim(),
        session: submitForm.session,
        psychology: submitForm.psychology,
        notes: submitForm.notes.trim() || null,
        riskReward: rr,
      });
      navigate("/trades");
    } catch (error) {
      setError(error.message);
      setSaving(false);
    }
  }

  const showError = (field) => touched[field] && validation[field];

  return (
    <div className="page-enter mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          {t("trading")}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("addTradeTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("addTradeDescription")}</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!loadingAccounts && accounts.length === 0 && (
        <div className="mb-6 rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/25">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200">{t("noTradingAccount")}</h2>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{t("createAccountBeforeTrade")}</p>
          <button type="button" onClick={() => navigate("/accounts")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-emerald-500 dark:text-slate-950">
            {t("goToAccounts")}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="trade-form space-y-5">
        <section className="ui-section ui-card">
          <SectionTitle title={t("tradeSetup")} description={t("corePosition")} />
          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <Field label={t("tradeDate")} error={showError("tradeDate")}>
              <input className="input" type="date" name="tradeDate" value={form.tradeDate} onChange={handleChange} onBlur={() => touchField("tradeDate")} />
            </Field>

            <Field label={t("account")} error={showError("accountId")}>
              <Select
                value={effectiveAccountId}
                onChange={(value) => handleChange({ target: { name: "accountId", value } })}
                placeholder={t("selectAccount")}
                disabled={!accounts.length}
                required
                options={accounts.map((account) => ({
                  value: account.id,
                  label: `${account.name} • ${account.currency} • ${account.account_type}`,
                }))}
              />
            </Field>

            <Field label={t("pair")} error={showError("pair")}>
              <InstrumentPicker
                value={form.pair}
                onChange={(pair) => {
                  setForm((current) => ({ ...current, pair }));
                  touchField("pair");
                }}
                required
              />
            </Field>

            <Field label={t("direction")} error={showError("direction")}>
              <Select
                value={form.direction}
                onChange={(value) => handleChange({ target: { name: "direction", value } })}
                options={[
                  { value: "BUY", label: t("buy") },
                  { value: "SELL", label: t("sell") },
                ]}
              />
            </Field>

            <Field label={t("lotSize")} error={showError("lotSize")}>
              <input className={`input ${showError("lotSize") ? "input-invalid" : ""}`} type="number" step="0.01" min="0.01" max="20" name="lotSize" value={form.lotSize} onChange={handleChange} onBlur={() => touchField("lotSize")} />
            </Field>

            <Field label={t("session")} error={showError("session")}>
              <Select
                value={form.session}
                onChange={(value) => handleChange({ target: { name: "session", value } })}
                options={[
                  { value: "ASIA", label: t("asia") },
                  { value: "LONDON", label: t("london") },
                  { value: "NEW_YORK-AM", label: t("newYorkAm") },
                  { value: "NEW_YORK-PM", label: t("newYorkPm") },
                ]}
              />
            </Field>
          </div>
        </section>

        <section className="ui-section ui-card">
          <SectionTitle title={t("priceResult")} description={t("executionOutcome")} />
          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <Field label={t("entryPrice")} error={showError("entryPrice")}>
              <input className="input" type="number" step="any" name="entryPrice" value={form.entryPrice} onChange={handleChange} onBlur={() => touchField("entryPrice")} placeholder="1.08500" />
            </Field>

            <Field label={t("stopLoss")} error={showError("stopLoss")}>
              <input className="input" type="number" step="any" name="stopLoss" value={form.stopLoss} onChange={handleChange} onBlur={() => touchField("stopLoss")} placeholder="1.08000" />
            </Field>

            <Field label={t("takeProfit")} error={showError("takeProfit")}>
              <input className="input" type="number" step="any" name="takeProfit" value={form.takeProfit} onChange={handleChange} onBlur={() => touchField("takeProfit")} placeholder="1.09500" />
            </Field>

            <div className={`rounded-2xl p-4 ${rr ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-slate-50 dark:bg-slate-800/60"}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("riskReward")}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{rr ? formatRiskReward(rr) : "—"}</p>
                </div>
                {rr ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-slate-400" />}
              </div>
              {touched.riskReward && validation.riskReward && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">{validation.riskReward}</p>}
              <p className="mt-1 text-[11px] text-slate-400">{t("riskRewardDescription")}</p>
            </div>

            <Field label={t("result")} error={showError("result")}>
              <Select
                value={form.result}
                onChange={(value) => handleChange({ target: { name: "result", value } })}
                options={[
                  { value: "WIN", label: t("win") },
                  { value: "LOSS", label: t("loss") },
                  { value: "BREAKEVEN", label: t("breakeven") },
                ]}
              />
            </Field>

            <Field label={t("pnl")} error={showError("pnl")}>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                name="pnl"
                value={Math.abs(Number(form.pnl || 0)) || ""}
                onChange={handleChange}
                onBlur={() => touchField("pnl")}
                placeholder={form.result === "BREAKEVEN" ? "0.00" : "125.50"}
                disabled={form.result === "BREAKEVEN"}
              />

              <p className="mt-1.5 text-xs text-slate-400">
                {form.result === "LOSS"
                  ? "Loss akan otomatis disimpan sebagai nilai negatif."
                  : form.result === "WIN"
                  ? "Profit akan otomatis disimpan sebagai nilai positif."
                  : "Break-even otomatis disimpan sebagai 0."}
              </p>
            </Field>

            <Field label={t("strategy")} error={showError("strategy")}>
              <input className="input" type="text" name="strategy" value={form.strategy} onChange={handleChange} onBlur={() => touchField("strategy")} placeholder={t("strategyPlaceholder")} />
            </Field>
          </div>
        </section>

        <section className="ui-section ui-card">
          <SectionTitle title={t("psychologyAtEntry")} description={t("mindsetBefore")} />
          <div className="grid gap-3 p-5 sm:p-6 md:grid-cols-3">
            {[
              { value: "GREED", label: t("greed"), hint: t("chasingSetup") },
              { value: "FEAR", label: t("fear"), hint: t("hesitationRisk") },
              { value: "NEUTRAL", label: t("neutral"), hint: t("calmRules") },
            ].map((option) => {
              const selected = form.psychology === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({ ...current, psychology: option.value }));
                    touchField("psychology");
                  }}
                  className={`rounded-2xl p-4 text-left transition ${
                    selected
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/10"
                      : "bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{option.label}</span>
                    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <p className={`mt-1 text-xs ${selected ? "text-emerald-50" : "text-slate-400"}`}>{option.hint}</p>
                </button>
              );
            })}
          </div>
          {showError("psychology") && <p className="px-5 pb-5 text-xs font-medium text-red-600 dark:text-red-300">{validation.psychology}</p>}
        </section>

        <section className="ui-section ui-card">
          <SectionTitle title={t("notes")} description={t("futureReview")} />
          <div className="p-5 sm:p-6">
            <textarea className="input min-h-32 resize-y" name="notes" value={form.notes} onChange={handleChange} placeholder={t("whyTrade")} />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/trades")} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{t("cancel")}</button>
          <button type="submit" disabled={saving || accounts.length === 0} className="trade-submit-button rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? t("saving") : t("saveTrade")}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-600 dark:text-red-300">{error}</span>}
    </label>
  );
}

export default AddTrade;