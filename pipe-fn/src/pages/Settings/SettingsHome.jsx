import { Link } from "react-router-dom";
import { UserRound, Palette, ShieldCheck, Database } from "lucide-react";

const items = [
  {
    to: "/settings/profile",
    title: "Profile",
    description: "Trader name, journal name, and profile photo.",
    icon: UserRound,
  },
  {
    to: "/settings/appearance",
    title: "Appearance",
    description: "Theme and automatic refresh preferences.",
    icon: Palette,
  },
  {
    to: "/settings/security",
    title: "Security",
    description: "Password, email, backup email, and phone / WhatsApp.",
    icon: ShieldCheck,
  },
  {
    to: "/settings/data",
    title: "Data Management",
    description: "Export and import your journal data.",
    icon: Database,
  },
];

export default function SettingsHome() {
  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Keep each setting organized in its own section.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-emerald-300 dark:group-hover:bg-emerald-950/40">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
