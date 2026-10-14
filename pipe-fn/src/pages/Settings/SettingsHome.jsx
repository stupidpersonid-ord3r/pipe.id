import { Link } from "react-router-dom";
import { UserRound, Palette, ShieldCheck, Database } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const items = [
  { to: "/settings/profile", titleKey: "profilePageTitle", descriptionKey: "profileSectionDescription", icon: UserRound },
  { to: "/settings/appearance", titleKey: "appearance", descriptionKey: "appearanceSectionDescription", icon: Palette },
  { to: "/settings/security", titleKey: "security", descriptionKey: "securitySectionDescription", icon: ShieldCheck },
  { to: "/settings/data", titleKey: "dataSectionTitle", descriptionKey: "dataSectionDescription", icon: Database },
];

export default function SettingsHome() {
  const { t } = useLanguage();
  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("settingsPageTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("settingsPageDescription")}
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
                {t(item.titleKey)}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(item.descriptionKey)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
