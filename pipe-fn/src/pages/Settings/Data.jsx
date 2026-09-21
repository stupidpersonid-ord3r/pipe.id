import DataManagement from "../../components/DataManagement";

export default function Data() {
  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Data Management
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Export or import your trading journal data.
        </p>
      </div>
      <DataManagement />
    </div>
  );
}
