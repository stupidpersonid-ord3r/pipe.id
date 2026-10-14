import DataManagement from "../../components/DataManagement";
import { useLanguage } from "../../hooks/useLanguage";

export default function Data() {
  const { t } = useLanguage();

  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("dataSectionTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("dataSectionDescription")}
        </p>
      </div>
      <DataManagement />
    </div>
  );
}
