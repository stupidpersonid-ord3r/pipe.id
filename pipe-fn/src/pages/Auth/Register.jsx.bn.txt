import { useEffect, useState } from "react";

import { Eye, EyeOff, LockKeyhole, Mail, TrendingUp, Sun, Moon } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { pipeApi } from "../../lib/pipeApi";

import { useLanguage } from "../../hooks/useLanguage";

import { assessPassword } from "../../utils/passwordPolicy";

function Register() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("trading_journal_theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("trading_journal_theme", nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: nextTheme }));
  };

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
    setSuccess("");
    if (name === "email") setEmailTouched(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setEmailTouched(true);

    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(form.email.trim())) {
      setError("Email must use lowercase letters and end in @gmail.com.");
      return;
    }

    const passwordAssessment = assessPassword(form.password, form.email);

    if (passwordAssessment.lengthValid === false) {
      setError(t("passwordLength"));
      return;
    }

    if (passwordAssessment.level < 3 || !passwordAssessment.compositionValid) {
      setError(t("passwordStrongRequired"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      await pipeApi.register({ email: form.email.trim(), password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell relative flex min-h-[100dvh] !items-center !justify-center overflow-x-hidden overflow-y-auto bg-slate-100 px-3 py-8 sm:min-h-screen sm:px-4 sm:py-10 dark:bg-slate-950">
      <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-slate-200/70 blur-3xl dark:bg-slate-800/40" />

      <div className="auth-page-enter relative w-full max-w-md rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-2xl shadow-slate-900/10 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <div className="auth-controls absolute right-4 top-4 flex items-center gap-2 sm:right-5 sm:top-5">
          <button
            type="button"
            onClick={() => setLanguage(language === "EN" ? "ID" : "EN")}
            className="auth-language inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("language")}
          >
            {language === "EN" ? "ID" : "EN"}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="auth-theme inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
            title={theme === "dark" ? t("lightMode") : t("darkMode")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="mb-6 pt-1 sm:mb-8 sm:pt-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 sm:h-11 sm:w-11">
            <TrendingUp size={20} />
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:mt-7 sm:text-xs">
            {t("journalName")}
          </p>

          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">
            {t("createWorkspace")}
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 sm:mt-2">
            {t("startRecording")}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            {success}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <Field label={t("email")}>
            <div className="auth-input-wrap">
              <span className="auth-input-leading" aria-hidden="true">
                <Mail size={16} />
              </span>

              <input
                autoComplete="email"
                type="text" inputMode="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={() => setEmailTouched(true)}
                required
                placeholder="you@example.com"
                aria-invalid={
                  emailTouched &&
                  form.email.length > 0 &&
                  !/^[a-z0-9._%+-]+@gmail\.com$/.test(form.email)
                }
                className={`input auth-input auth-input-icon ${
                  emailTouched &&
                  form.email.length > 0 &&
                  !/^[a-z0-9._%+-]+@gmail\.com$/.test(form.email)
                    ? "auth-input-invalid"
                    : ""
                }`}
              />
            </div>

            {emailTouched &&
              form.email.length > 0 &&
              !/^[a-z0-9._%+-]+@gmail\.com$/.test(form.email) && (
                <p className="auth-field-error">{t("emailInvalid")}</p>
              )}
          </Field>

          <PasswordField
            label={t("password")}
            name="password"
            value={form.password}
            onChange={handleChange}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="new-password"
            placeholder={t("passwordLength")}
            t={t}
            email={form.email}
            maxLength={8}
            showStrength
          />

          <PasswordField
            label={t("confirmPassword")}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            show={showConfirm}
            setShow={setShowConfirm}
            autoComplete="new-password"
            placeholder={t("confirmPassword")}
            t={t}
          />

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {loading ? t("creatingWorkspace") : t("createWorkspaceButton")}
          </button>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500 dark:border-slate-800 sm:mt-8 sm:pt-5">
          {t("alreadyHaveAccount")}{" "}
          <Link
            to="/login"
            className="auth-link font-semibold text-slate-900 hover:underline dark:text-white"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="auth-field block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300 sm:mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function PasswordStrength({ value, email, t }) {
  if (!value) return null;

  const assessment = assessPassword(value, email);
  const levelKeys = ["", "weak", "medium", "fairlyStrong", "strong", "veryStrong"];
  const levelKey = levelKeys[assessment.level];
  const level = t(levelKey);

  const levelClass =
    assessment.level >= 3
      ? "text-emerald-600 dark:text-emerald-400"
      : assessment.level === 2
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const items = [
    ["uppercase", "A–Z"],
    ["lowercase", "a–z"],
    ["number", "0–9"],
    ["symbol", "!@#"],
  ];

  return (
    <div className="auth-strength" aria-live="polite">
      <div className="auth-strength-head">
        <span>{t("passwordStrength")}</span>
        <strong className={levelClass}>{level}</strong>
      </div>

      <div className="auth-strength-chips" aria-label={level}>
        {items.map(([key, label]) => {
          const met = assessment.criteria[key];

          return (
            <span
              key={key}
              className={`auth-strength-chip ${met ? "is-met" : ""}`}
            >
              <span className="auth-strength-dot" aria-hidden="true">
                {met ? "✓" : "·"}
              </span>
              {label}
            </span>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] leading-4 text-slate-400">
        {t("passwordRuleLength")}
      </p>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  show,
  setShow,
  autoComplete,
  placeholder,
  t,
  email,
  maxLength,
  showStrength = false,
}) {
  return (
    <Field label={label}>
      <div className="auth-input-wrap">
        <span className="auth-input-leading" aria-hidden="true">
          <LockKeyhole size={16} />
        </span>

        <input
          autoComplete={autoComplete}
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          maxLength={maxLength}
          placeholder={placeholder}
          className="input auth-input auth-input-icon auth-input-password"
        />

        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          className="auth-input-toggle"
          aria-label={show ? t("hidePassword") : t("showPassword")}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showStrength && (
        <PasswordStrength value={value} email={email} t={t} />
      )}
    </Field>
  );
}

export default Register;
