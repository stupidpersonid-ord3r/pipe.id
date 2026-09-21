import { ChevronDown, Languages, LogOut, Menu, RefreshCw, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useLanguage } from "../hooks/useLanguage";
import { useJournalData } from "../hooks/useJournalData";

function AccountStatusDot({ type }) {
  const isDemo = String(type || "").toUpperCase() === "DEMO";

  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/70 dark:ring-slate-900 ${
        isDemo ? "bg-amber-400" : "bg-emerald-500"
      }`}
      title={isDemo ? "DEMO" : "LIVE"}
      aria-label={isDemo ? "DEMO" : "LIVE"}
    />
  );
}

function AccountSelector() {
  const { t } = useLanguage();
  const { accounts, selectedAccountId, selectAccount } = useJournalData();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = accounts.find(
    (account) => account.id === selectedAccountId
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline">
        Account
      </span>

      <div ref={rootRef} className="relative min-w-0">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="select-trigger flex h-10 w-[112px] min-w-0 items-center gap-1.5 px-2.5 text-left text-[11px] font-semibold backdrop-blur transition sm:w-44 sm:gap-2 sm:px-3 sm:text-xs"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? (
            <AccountStatusDot type={selected.account_type} />
          ) : null}

          <span className="min-w-0 flex-1 truncate">
            {selected
              ? `${selected.name} • ${selected.currency}`
              : t("selectAccount")}
          </span>

          <ChevronDown
            size={15}
            className={`shrink-0 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="select-menu absolute right-0 z-50 mt-2 w-full overflow-hidden rounded-2xl p-1.5">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                role="option"
                aria-selected={account.id === selectedAccountId}
                onClick={() => {
                  selectAccount(account.id);
                  setOpen(false);
                }}
                className={`select-menu-item flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                  account.id === selectedAccountId ? "is-selected" : ""
                }`}
              >
                <AccountStatusDot type={account.account_type} />

                <span className="min-w-0 flex-1 truncate">
                  <span className="block truncate text-xs font-semibold">
                    {account.name} • {account.currency}
                  </span>

                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {account.account_type}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogoutConfirm({ open, onCancel, onConfirm, loading, t }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgb(15_23_42/0.22)] ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
          <LogOut size={19} />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
          {t("logoutConfirmTitle")}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t("logoutConfirmDescription")}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <LogOut size={15} />
            {loading ? t("loggingOut") : t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { language, setLanguage, t } = useLanguage();
  const { autoRefresh, setAutoRefresh } = useJournalData();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const profileRef = useRef(null);

  const traderName =
    profile?.traderName || user?.email?.split("@")[0] || "Trader";

  const journalName = profile?.journalName || "PIPE.ID";
  const avatarUrl = profile?.avatarUrl || "";
  const initial = traderName.charAt(0).toUpperCase();

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      setLogoutOpen(false);
      setProfileOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-[100] flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-slate-200/60 bg-white/80 px-3 backdrop-blur-xl sm:gap-3 sm:px-6 dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("togglemobilemenu"))
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
            aria-label={t("openNavigation")}
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
              {journalName}
            </h2>

            <p className="hidden text-xs text-slate-500 sm:block">
              {t("trackPerformance")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          <AccountSelector />

          <button
            type="button"
            onClick={() => setLanguage(language === "EN" ? "ID" : "EN")}
            title={language === "EN" ? "Bahasa Indonesia" : "English"}
            aria-label={
              language === "EN"
                ? "Switch to Indonesian"
                : "Switch to English"
            }
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-white/75 px-2 text-xs font-bold text-slate-700 shadow-[0_8px_24px_rgb(15_23_42/0.05)] backdrop-blur transition hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Languages size={14} />
            <span>{language === "EN" ? "ID" : "EN"}</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={t("autoRefresh")}
            aria-label={t("autoRefresh")}
            aria-pressed={autoRefresh}
            className="hidden h-10 items-center gap-2 rounded-xl bg-white/75 px-2.5 text-xs font-semibold text-slate-700 shadow-[0_8px_24px_rgb(15_23_42/0.05)] backdrop-blur transition hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-flex"
          >
            <RefreshCw
              size={14}
              className={
                autoRefresh ? "text-emerald-500" : "text-slate-400"
              }
            />

            <span className="hidden lg:inline">
              {t("autoRefresh")}
            </span>

            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                autoRefresh
                  ? "bg-emerald-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  autoRefresh ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setProfileOpen((current) => !current)
              }
              className="flex h-10 shrink-0 items-center gap-1 rounded-2xl bg-white/65 p-1 pr-1.5 text-left shadow-[0_8px_24px_rgb(15_23_42/0.05)] transition hover:bg-white dark:bg-slate-900/65 dark:hover:bg-slate-900"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl.startsWith("data:") ? avatarUrl : `${avatarUrl}${
                    avatarUrl.includes("?") ? "&" : "?"
                  }v=${encodeURIComponent(avatarUrl)}`}
                  alt={traderName}
                  className="h-8 w-8 rounded-xl object-cover sm:h-9 sm:w-9"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl sm:h-9 sm:w-9 bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  {initial}
                </div>
              )}

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-36 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {traderName}
                </p>

                <p className="max-w-36 truncate text-[11px] text-slate-500">
                  {journalName}
                </p>
              </div>

              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl theme-popover p-1.5">
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {traderName}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>

                <div className="my-1 h-px theme-popover-divider" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="theme-popover-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  <Settings size={16} />
                  {t("editProfile")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setLogoutOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                >
                  <LogOut size={16} />
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <LogoutConfirm
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        t={t}
      />
    </>
  );
}

export default Header;