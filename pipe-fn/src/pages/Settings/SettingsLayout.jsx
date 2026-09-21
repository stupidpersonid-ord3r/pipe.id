import { NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, Database, Palette, ShieldCheck, UserRound } from "lucide-react";

const links = [
  { to: "/settings/profile", label: "Profile", icon: UserRound },
  { to: "/settings/appearance", label: "Appearance", icon: Palette },
  { to: "/settings/security", label: "Security", icon: ShieldCheck },
  { to: "/settings/data", label: "Data", icon: Database },
];

export default function SettingsLayout() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <NavLink
          to="/settings"
          end
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`
          }
        >
          <ArrowLeft size={15} />
          Settings
        </NavLink>

        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon size={15} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
