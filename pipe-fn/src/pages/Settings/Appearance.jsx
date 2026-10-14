import { useState } from "react";
import { Palette, RefreshCw } from "lucide-react";
import { useProfile } from "../../hooks/useProfile";
import { useJournalData } from "../../hooks/useJournalData";
import Select from "../../components/Select";
import { useLanguage } from "../../hooks/useLanguage";

export default function Appearance() {
  const { profile, updateProfile } = useProfile();
  const { t } = useLanguage();
  const {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
  } = useJournalData();

  const [theme, setTheme] = useState(() => profile?.theme || "light");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function applyTheme(nextTheme) {
    const root = document.documentElement;

    if (nextTheme === "dark") {
      root.classList.add("dark");
    } else if (nextTheme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.toggle(
        "dark",
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
    }

    localStorage.setItem("trading_journal_theme", nextTheme);
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: nextTheme }),
    );
  }

  async function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await updateProfile({ theme: nextTheme });
      setMessage(t("themeSaved"));
    } catch (err) {
      setError(err.message || t("themeSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("appearance")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("settingsThemeDescription")}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("theme")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("chooseThemeDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="sm:max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("theme")}
            </label>
            <Select
              value={theme}
              onChange={handleThemeChange}
              options={[
                { value: "light", label: t("light") },
                { value: "dark", label: t("dark") },
                { value: "system", label: t("system") },
              ]}
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {saving ? t("savingTheme") : t("themePreference")}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("themeSaved")}
              </p>
            </div>
            {message && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {message}
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("autoRefresh")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("autoRefreshDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {t("enableAutoRefresh")}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {autoRefresh ? t("currentlyEnabled") : t("currentlyDisabled")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              aria-pressed={autoRefresh}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
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
              {autoRefresh ? t("on") : t("off")}
            </button>
          </div>

          <div className="border-t border-slate-200 pt-5 dark:border-slate-800 sm:max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("refreshInterval")}
            </label>
            <Select
              value={String(refreshInterval)}
              onChange={(value) => setRefreshInterval(Number(value))}
              options={[
                { value: "15000", label: t("fifteenSeconds") },
                { value: "30000", label: t("thirtySeconds") },
                { value: "60000", label: t("oneMinute") },
                { value: "300000", label: t("fiveMinutes") },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
