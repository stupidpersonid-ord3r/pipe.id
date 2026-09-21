import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  BarChart3,
  LineChart,
  Wallet,
  Settings,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";

function getInitialTheme() {
  return (
    localStorage.getItem("trading_journal_theme") || "light"
  );
}

function Sidebar() {
  const location = useLocation();
  const { t } = useLanguage();

  const [theme, setTheme] = useState(getInitialTheme);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === "dark";

  const isTradesActive =
    location.pathname.startsWith("/trades") ||
    location.pathname === "/analytics" ||
    location.pathname === "/charts";

  const activeMenu = isTradesActive ? "trades" : openMenu;

  useEffect(() => {
    function handleThemeChange(event) {
      const newTheme = event.detail;

      setTheme(newTheme);
      localStorage.setItem(
        "trading_journal_theme",
        newTheme
      );
    }

    function handleMobileMenu() {
      setMobileOpen((current) => !current);
    }

    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("togglemobilemenu", handleMobileMenu);

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("togglemobilemenu", handleMobileMenu);
    };
  }, []);

  function toggleMenu(menu) {
    setOpenMenu((current) => {
      return current === menu ? null : menu;
    });
  }

  const sidebarClass = isDark
    ? "bg-slate-950/90 text-white backdrop-blur-xl"
    : "bg-white/90 text-slate-900 backdrop-blur-xl";

  const borderClass = isDark
    ? "border-slate-800"
    : "border-slate-200";

  const inactiveClass = isDark
    ? "text-slate-400 hover:bg-slate-900 hover:text-white"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950";

  const activeClass = isDark
    ? "bg-emerald-400/15 text-emerald-100 shadow-sm"
    : "bg-slate-950 text-white shadow-sm";

  const tradesActiveClass = isDark
    ? "bg-emerald-400/10 text-emerald-100"
    : "bg-slate-100 text-slate-950";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("closeNavigation")}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-x-0 bottom-0 top-16 z-[80] bg-slate-950/40 backdrop-blur-[1px] md:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r transition-transform transition-colors max-md:top-16 max-md:z-[90] max-md:h-[calc(100dvh-4rem)] max-md:w-[min(78vw,240px)] max-md:shadow-2xl ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${sidebarClass} ${borderClass}`}
      >
      {/* HEADER */}
      <div className={`flex h-20 items-center px-5 max-md:hidden ${borderClass}`}>
        <img
          src="/logo.png"
          alt={t("journalName")}
          className="h-16 w-48 object-contain object-center"
        />
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 sm:py-5">
        <div className="space-y-1">

          {/* DASHBOARD */}
          <NavLink
            to="/dashboard"
            onClick={() => {
              setOpenMenu(null);
              setMobileOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? activeClass
                  : inactiveClass
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span>{t("dashboard")}</span>
          </NavLink>

          {/* CALENDAR */}
          <NavLink
            to="/calendar"
            onClick={() => {
              setOpenMenu(null);
              setMobileOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? activeClass
                  : inactiveClass
              }`
            }
          >
            <CalendarDays size={18} />
            <span>{t("calendar")}</span>
          </NavLink>

          {/* ALL TRADES */}
          <div>
            <div className="flex">
              <button
                type="button"
                onClick={() => toggleMenu("trades")}
                className={`flex flex-1 items-center gap-3 rounded-l-lg px-3 py-2.5 text-sm font-medium transition ${
                  isTradesActive
                    ? tradesActiveClass
                    : inactiveClass
                }`}
              >
                <BookOpen size={18} />
                <span>{t("allTrades")}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMenu("trades")}
                className={`rounded-r-lg px-3 transition ${
                  isTradesActive
                    ? tradesActiveClass
                    : inactiveClass
                }`}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    activeMenu === "trades"
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            </div>

            {/* SUBMENU */}
            {activeMenu === "trades" && (
              <div
                className={`ml-5 mt-1 space-y-1 border-l pl-3 ${
                  isDark
                    ? "border-slate-800"
                    : "border-slate-200"
                }`}
              >

                {/* ADD TRADE */}
                <NavLink
                  to="/trades/new"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? activeClass
                        : inactiveClass
                    }`
                  }
                >
                  <Plus size={16} />
                  <span>{t("addTrade")}</span>
                </NavLink>

                {/* ANALYTICS */}
                <NavLink
                  to="/analytics"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? activeClass
                        : inactiveClass
                    }`
                  }
                >
                  <BarChart3 size={16} />
                  <span>{t("analytics")}</span>
                </NavLink>

                {/* CHARTS */}
                <NavLink
                  to="/charts"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? activeClass
                        : inactiveClass
                    }`
                  }
                >
                  <LineChart size={16} />
                  <span>{t("charts")}</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* ACCOUNTS */}
          <NavLink
            to="/accounts"
            onClick={() => {
              setOpenMenu(null);
              setMobileOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? activeClass
                  : inactiveClass
              }`
            }
          >
            <Wallet size={18} />
            <span>{t("accounts")}</span>
          </NavLink>

          {/* SETTINGS */}
          <NavLink
            to="/settings"
            onClick={() => {
              setOpenMenu(null);
              setMobileOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? activeClass
                  : inactiveClass
              }`
            }
          >
            <Settings size={18} />
            <span>{t("settings")}</span>
          </NavLink>
        </div>
      </nav>

      {/* FOOTER */}
      <div
        className={`border-t p-4 ${borderClass}`}
      >
        <div
          className={`rounded-2xl px-3 py-3 ${
            isDark
              ? "bg-gradient-to-br from-emerald-950/70 to-slate-900"
              : "bg-gradient-to-br from-white to-slate-100"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {t("journalName")}
          </p>

          <p className="mt-1 text-[11px] text-slate-500">
            {t("keepImproving")}
          </p>
        </div>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;