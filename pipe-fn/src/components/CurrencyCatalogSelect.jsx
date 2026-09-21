import { useMemo } from "react";
import Select from "./Select";

const CURRENCY_CATALOG = [
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "BRL", label: "BRL — Brazilian Real" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
  { value: "DKK", label: "DKK — Danish Krone" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "HKD", label: "HKD — Hong Kong Dollar" },
  { value: "IDR", label: "IDR — Indonesian Rupiah" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "KRW", label: "KRW — South Korean Won" },
  { value: "MXN", label: "MXN — Mexican Peso" },
  { value: "MYR", label: "MYR — Malaysian Ringgit" },
  { value: "NOK", label: "NOK — Norwegian Krone" },
  { value: "NZD", label: "NZD — New Zealand Dollar" },
  { value: "PHP", label: "PHP — Philippine Peso" },
  { value: "PLN", label: "PLN — Polish Zloty" },
  { value: "SEK", label: "SEK — Swedish Krona" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "THB", label: "THB — Thai Baht" },
  { value: "TRY", label: "TRY — Turkish Lira" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "VND", label: "VND — Vietnamese Dong" },
  { value: "ZAR", label: "ZAR — South African Rand" },
];

export default function CurrencyCatalogSelect({
  value,
  onChange,
  required = false,
}) {
  const currencies = useMemo(() => CURRENCY_CATALOG, []);

  return (
    <div>
      <Select
        value={value}
        onChange={onChange}
        placeholder="Select currency"
        required={required}
        options={currencies}
      />

      <p className="mt-1.5 text-[11px] text-slate-400">
        Account currency
      </p>
    </div>
  );
}