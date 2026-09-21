import { useMemo, useState } from "react";
import { Edit3, Plus, Wallet, X, ArrowDownToLine, ArrowUpFromLine, Trash2 } from "lucide-react";
import { useJournalData } from "../hooks/useJournalData";
import { useLanguage } from "../hooks/useLanguage";
import CurrencyCatalogSelect from "../components/CurrencyCatalogSelect";
import Select from "../components/Select";

const SYMBOLS = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", CHF: "CHF ", NZD: "NZ$", SGD: "S$", HKD: "HK$", IDR: "Rp ", MYR: "RM " };
const emptyForm = { name: "", account_type: "LIVE", currency: "", starting_balance: "" };

function money(value, currency) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return `${SYMBOLS[currency] || ""}${Number(value || 0).toLocaleString()}`; }
}

function AccountStatusDot({ type }) {
  const demo = String(type || "").toUpperCase() === "DEMO";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${demo ? "bg-amber-400" : "bg-emerald-500"}`} title={demo ? "DEMO" : "LIVE"} aria-label={demo ? "DEMO" : "LIVE"} />;
}

function Accounts() {
  const { accounts, loading, error, addAccount, renameAccount, addAccountTransaction, deleteAccount, accountTransactions } = useJournalData();
  const { t } = useLanguage();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);

  const txForSelected = useMemo(() => selected ? accountTransactions.filter((x) => x.account_id === selected.id).slice(0, 8) : [], [accountTransactions, selected]);

  function openCreate() { setForm(emptyForm); setFormError(""); setModal("create"); }
  function openManage(account) { setSelected(account); setForm({ name: account.name || "" }); setAmount(""); setTransactionType(null); setFormError(""); setModal("manage"); }
  function close() { if (!saving && !deleteSaving) setModal(null); }

  async function create(event) {
    event.preventDefault();
    const balance = Number(form.starting_balance);
    if (!form.name.trim()) return setFormError(t("accountNameRequired"));
    if (!Number.isFinite(balance) || balance < 0) return setFormError(t("initialBalanceInvalid"));
    if (!form.currency) return setFormError(t("currencyRequired"));
    setSaving(true); setFormError("");
    try { await addAccount({ name: form.name.trim(), account_type: form.account_type, currency: form.currency, starting_balance: balance }); setModal(null); }
    catch (e) { setFormError(e.message || "Failed to create account."); }
    finally { setSaving(false); }
  }

  async function rename(event) {
    event.preventDefault();
    if (!form.name.trim()) return setFormError(t("accountNameRequired"));
    setSaving(true); setFormError("");
    try { await renameAccount(selected.id, form.name); setSelected((x) => ({ ...x, name: form.name.trim() })); }
    catch (e) { setFormError(e.message || "Failed to rename account."); }
    finally { setSaving(false); }
  }

  function beginTransaction(type) {
    setTransactionType(type);
    setAmount("");
    setFormError("");
  }

  function cancelTransaction() {
    if (saving) return;
    setTransactionType(null);
    setAmount("");
    setFormError("");
  }

  async function transaction(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setFormError(t("amountGreaterThanZero"));
    const current = Number(accounts.find((a) => a.id === selected.id)?.current_balance || 0);
    if (transactionType === "WITHDRAWAL" && value > current) return setFormError(t("withdrawalExceedsBalance").replace("{balance}", money(current, selected.currency)));
    setSaving(true); setFormError("");
    try { await addAccountTransaction({ accountId: selected.id, type: transactionType, amount: value }); setAmount(""); setTransactionType(null); }
    catch (e) { setFormError(e.message || "Failed to update balance."); }
    finally { setSaving(false); }
  }

  return (
    <div className="page-enter mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t("workspace")}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t("accounts")}</h1><p className="mt-1 text-sm text-slate-500">{t("manageTradingAccounts")}</p></div>
        <div className="flex gap-2"><button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"><Plus size={17}/>{t("addAccount")}</button></div>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {loading && accounts.length === 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((x)=><div key={x} className="h-60 animate-pulse ui-card rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"/>)}</div> : accounts.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900"><Wallet className="mx-auto text-slate-400" size={28}/><h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{t("noAccounts")}</h2><p className="mt-1 text-sm text-slate-500">{t("createAccountBeforeTrade")}</p><button onClick={openCreate} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"><Plus size={16} className="mr-2 inline"/>{t("createAccount")}</button></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{accounts.map((account)=><div key={account.id} className="ui-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Wallet size={20}/></div><div className="min-w-0"><div className="flex items-center gap-2"><AccountStatusDot type={account.account_type}/><h2 className="truncate font-semibold text-slate-900 dark:text-white">{account.name}</h2></div><p className="text-xs text-slate-500">{account.name} - {account.currency} • {account.account_type}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{account.account_type}</span></div>
        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t("currentBalance")}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{money(account.current_balance, account.currency)}</p></div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-slate-400">{t("initialBalance")}</p><p className="mt-1 font-medium text-slate-700 dark:text-slate-300">{money(account.starting_balance, account.currency)}</p></div><div><p className="text-xs text-slate-400">{t("deposit")}</p><p className="mt-1 font-medium text-emerald-600">+{money(account.deposits, account.currency)}</p></div><div><p className="text-xs text-slate-400">{t("withdrawal")}</p><p className="mt-1 font-medium text-rose-600">-{money(account.withdrawals, account.currency)}</p></div></div>
        <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button onClick={()=>openManage(account)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"><Edit3 size={15}/>{t("manageBalance")}</button></div>
      </div>)}</div>}

      {modal === "create" && <Modal title={t("addAccount")} close={close}><form onSubmit={create} className="space-y-4"><Field label={t("accountName")}><input className="input" name="name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder={t("legacyMyTradingAccount")} required autoFocus/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={t("accountType")}><Select value={form.account_type} onChange={(value)=>setForm({...form,account_type:value})} options={[{value:"LIVE",label:"LIVE"},{value:"DEMO",label:"DEMO"}]} /></Field><Field label={t("currency")}><CurrencyCatalogSelect value={form.currency} onChange={(currency)=>setForm({...form,currency})} required /></Field></div><Field label={t("initialBalance")}><input className="input" type="number" min="0" step="0.01" value={form.starting_balance} onChange={(e)=>setForm({...form,starting_balance:e.target.value})} placeholder="10000" required/></Field>{formError&&<ErrorBox text={formError}/>}<Actions close={close} saving={saving} primary={t("createAccount")} cancelLabel={t("cancel")} savingLabel={t("saving")}/></form></Modal>}

      {modal === "manage" && selected && <Modal title={t("manageBalance")} close={close}><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs text-slate-500">{selected.name}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{money(accounts.find((a)=>a.id===selected.id)?.current_balance, selected.currency)}</p></div><form onSubmit={rename} className="mt-5 space-y-3"><Field label={t("accountName")}><input className="input" value={form.name} onChange={(e)=>setForm({name:e.target.value})}/></Field><button disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">{t("saveChanges")}</button></form><div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700"><button type="button" onClick={()=>{setFormError("");setModal("delete");}} disabled={saving || deleteSaving} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/30"><Trash2 size={15}/>{t("deleteAccount")}</button></div><div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div><p className="text-sm font-semibold text-slate-900 dark:text-white">{t("balanceMovement")}</p><p className="mt-1 text-xs text-slate-500">{t("chooseDepositWithdrawal")}</p></div>{!transactionType ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" disabled={saving} onClick={()=>beginTransaction("DEPOSIT")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"><ArrowDownToLine size={16}/>{t("deposit")}</button><button type="button" disabled={saving} onClick={()=>beginTransaction("WITHDRAWAL")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><ArrowUpFromLine size={16}/>{t("withdrawal")}</button></div> : <form onSubmit={transaction} className="mt-4 space-y-3"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm font-semibold">{transactionType === "DEPOSIT" ? <ArrowDownToLine size={16}/> : <ArrowUpFromLine size={16}/>} {transactionType === "DEPOSIT" ? t("deposit") : t("withdrawal")}</span><button type="button" onClick={cancelTransaction} disabled={saving} className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">{t("change")}</button></div><Field label={t("amount")}><input className="input" type="number" min="0.01" step="0.01" max={transactionType === "WITHDRAWAL" ? Number(accounts.find((a)=>a.id===selected.id)?.current_balance || 0) : undefined} value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder={transactionType === "DEPOSIT" ? "500" : "200"} autoFocus required/></Field><div className="flex justify-end gap-2"><button type="button" onClick={cancelTransaction} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium dark:border-slate-700">{t("cancel")}</button><button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">{saving ? t("saving") : t("save")}</button></div></form>}{formError&&<div className="mt-4"><ErrorBox text={formError}/></div>}</div><div className="mt-6"><h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("recentBalanceMovements")}</h3>{txForSelected.length===0?<p className="mt-2 text-sm text-slate-500">{t("noTransactions")}</p>:<div className="mt-3 space-y-2">{txForSelected.map((tx)=><div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"><span>{tx.type}</span><span className={tx.type==="DEPOSIT"?"text-emerald-600":"text-rose-600"}>{tx.type==="DEPOSIT"?"+":"-"}{money(tx.amount,selected.currency)}</span></div>)}</div>}</div></Modal>}

      {modal === "delete" && selected && <Modal title={t("deleteAccount")} close={close}><div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300"><Trash2 size={18}/></div><div><p className="text-sm font-semibold text-rose-900 dark:text-rose-200">{t("deleteAccountConfirmTitle")}</p><p className="mt-1 text-sm leading-6 text-rose-800 dark:text-rose-300">{t("deleteAccountConfirmDescription").replace("{account}", selected.name || "-")}</p></div></div></div>{formError&&<div className="mt-4"><ErrorBox text={formError}/></div>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setModal("manage")} disabled={deleteSaving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">{t("cancel")}</button><button type="button" disabled={deleteSaving} onClick={async()=>{setDeleteSaving(true);setFormError("");try{await deleteAccount(selected.id);setSelected(null);setModal(null);}catch(e){setFormError(e.message||t("deleteAccountFailed"));}finally{setDeleteSaving(false);}}} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><Trash2 size={15}/>{deleteSaving?t("deleting"):t("deleteAccount")}</button></div></Modal>}
    </div>
  );
}
function Modal({title,close,children}){return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="modal-enter max-h-[90vh] w-full max-w-lg overflow-y-auto ui-card rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2><button onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button></div>{children}</div></div>}
function Field({label,children}){return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>{children}</label>}
function ErrorBox({text}){return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{text}</div>}
function Actions({close,saving,primary,cancelLabel,savingLabel}){return <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={close} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium dark:border-slate-700">{cancelLabel}</button><button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">{saving?savingLabel:primary}</button></div>}
export default Accounts;
