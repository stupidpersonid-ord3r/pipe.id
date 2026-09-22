import { useEffect, useState } from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sun,
  Moon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { pipeApi } from "../../lib/pipeApi";
import { useLanguage } from "../../hooks/useLanguage";
import { assessPassword } from "../../utils/passwordPolicy";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const [isFlipped, setIsFlipped] = useState(
    () => location.pathname === "/register"
  );

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginEmailTouched, setLoginEmailTouched] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerEmailTouched, setRegisterEmailTouched] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({
      ...current,
      [name]: value,
    }));
    setLoginError("");
    if (name === "email") setLoginEmailTouched(true);
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoginError("");
    setLoginEmailTouched(true);

    if (!isValidEmail(loginForm.email)) {
      setLoginError("Email must use lowercase letters and end in @gmail.com.");
      return;
    }

    setLoginLoading(true);

    try {
      await pipeApi.login({ email: loginForm.email.trim(), password: loginForm.password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginError(error.message);
      setLoginLoading(false);
    }
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((current) => ({
      ...current,
      [name]: value,
    }));
    setRegisterError("");
    setRegisterSuccess("");
    if (name === "email") setRegisterEmailTouched(true);
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterEmailTouched(true);

    if (!isValidEmail(registerForm.email)) {
      setRegisterError("Email must use lowercase letters and end in @gmail.com.");
      return;
    }

    const passwordAssessment = assessPassword(
      registerForm.password,
      registerForm.email
    );

    if (passwordAssessment.lengthValid === false) {
      setRegisterError(t("passwordLength"));
      return;
    }

    if (passwordAssessment.level < 3 || !passwordAssessment.compositionValid) {
      setRegisterError(t("passwordStrongRequired"));
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError(t("passwordMismatch"));
      return;
    }

    setRegisterLoading(true);

    try {
      await pipeApi.register({ email: registerForm.email.trim(), password: registerForm.password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setRegisterError(error.message);
      setRegisterLoading(false);
    }
  }

  function handleFlipToRegister() {
    setLoginError("");
    setRegisterError("");
    setRegisterSuccess("");
    setIsFlipped(true);
    navigate("/register", { replace: true });
  }

  function handleFlipToLogin() {
    setLoginError("");
    setRegisterError("");
    setRegisterSuccess("");
    setIsFlipped(false);
    navigate("/login", { replace: true });
  }

  return (
    <div className="auth-shell relative flex min-h-[100dvh] !items-center !justify-center overflow-x-hidden overflow-y-auto bg-transparent px-3 py-8 sm:min-h-screen sm:px-4 sm:py-8">
      <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-slate-200/70 blur-3xl dark:bg-slate-800/40" />

      <div className="auth-flip-container relative w-full max-w-md max-h-none">
        <div className={`auth-flip-card ${isFlipped ? "is-flipped" : ""}`}>
          <div className="auth-flip-face auth-flip-front rounded-[1.75rem] border border-slate-200/70 bg-white/70 px-5 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8 sm:pb-9 dark:border-emerald-400/15 dark:bg-emerald-950/58 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <AuthControls
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              toggleTheme={toggleTheme}
              t={t}
            />

            <div className="mb-5 pt-0 sm:mb-6">
              <img
                src="/logo.png"
                alt={t("journalName")}
                className="h-20 w-36 object-contain object-left drop-shadow-sm sm:h-28 sm:w-48"
              />

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("journalName")}
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:mt-1 sm:text-3xl dark:text-white">
                {t("welcomeBack")}
              </h1>

              <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:mt-1 sm:text-sm">
                {t("signInToContinue")}
              </p>
            </div>

            {loginError && (
              <div
                role="alert"
                className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:mb-4 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                {loginError}
              </div>
            )}

            <form noValidate onSubmit={handleLoginSubmit} className="space-y-4">
              <Field label={t("email")}>
                <div className="auth-input-wrap">
                  <span className="auth-input-leading" aria-hidden="true">
                    <Mail size={16} />
                  </span>

                  <input
                    autoComplete="email"
                    type="text" inputMode="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    onBlur={() => setLoginEmailTouched(true)}
                    required
                    placeholder="you@example.com"
                    aria-invalid={
                      loginEmailTouched &&
                      loginForm.email.length > 0 &&
                      !isValidEmail(loginForm.email)
                    }
                    className={`input auth-input auth-input-icon ${
                      loginEmailTouched &&
                      loginForm.email.length > 0 &&
                      !isValidEmail(loginForm.email)
                        ? "auth-input-invalid"
                        : ""
                    }`}
                  />
                </div>

                {loginEmailTouched &&
                  loginForm.email.length > 0 &&
                  !isValidEmail(loginForm.email) && (
                    <p className="auth-field-error">{t("emailInvalid")}</p>
                  )}
              </Field>

              <PasswordField
                label={t("password")}
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                show={showLoginPassword}
                setShow={setShowLoginPassword}
                autoComplete="current-password"
                placeholder={t("password")}
                t={t}
              />

              <button
                type="submit"
                disabled={loginLoading}
                className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {loginLoading ? t("signingIn") : t("signIn")}
              </button>
            </form>

            <p className="mt-5 border-t border-slate-200/60 pt-4 text-center text-sm text-slate-500 dark:border-emerald-400/10">
              {t("dontHaveAccount")}{" "}
              <button
                type="button"
                onClick={handleFlipToRegister}
                className="auth-link font-semibold text-slate-900 hover:underline dark:text-white"
              >
                {t("signUp")}
              </button>
            </p>
          </div>

          <div className="auth-flip-face auth-flip-back max-h-none overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/70 px-4 py-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:max-h-none sm:overflow-visible sm:p-8 sm:pb-9 dark:border-emerald-400/15 dark:bg-emerald-950/58 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <AuthControls
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              toggleTheme={toggleTheme}
              t={t}
            />

            <div className="mb-2 pt-0 sm:mb-6">
              <img
                src="/logo.png"
                alt={t("journalName")}
                className="h-12 w-28 object-contain object-left drop-shadow-sm sm:h-28 sm:w-48"
              />

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t("journalName")}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                {t("createWorkspace")}
              </h1>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {t("startRecording")}
              </p>
            </div>

            {registerError && (
              <div
                role="alert"
                className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:mb-4 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                {registerError}
              </div>
            )}

            {registerSuccess && (
              <div
                role="status"
                className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 sm:mb-4 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                {registerSuccess}
              </div>
            )}

            <form noValidate onSubmit={handleRegisterSubmit} className="space-y-2 sm:space-y-5">
              <Field label={t("email")}>
                <div className="auth-input-wrap">
                  <span className="auth-input-leading" aria-hidden="true">
                    <Mail size={16} />
                  </span>

                  <input
                    autoComplete="email"
                    type="text" inputMode="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    onBlur={() => setRegisterEmailTouched(true)}
                    required
                    placeholder="you@example.com"
                    aria-invalid={
                      registerEmailTouched &&
                      registerForm.email.length > 0 &&
                      !isValidEmail(registerForm.email)
                    }
                    className={`input auth-input auth-input-icon h-10 sm:h-auto ${
                      registerEmailTouched &&
                      registerForm.email.length > 0 &&
                      !isValidEmail(registerForm.email)
                        ? "auth-input-invalid"
                        : ""
                    }`}
                  />
                </div>

                {registerEmailTouched &&
                  registerForm.email.length > 0 &&
                  !isValidEmail(registerForm.email) && (
                    <p className="auth-field-error">{t("emailInvalid")}</p>
                  )}
              </Field>

              <PasswordField
                label={t("password")}
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                show={showRegisterPassword}
                setShow={setShowRegisterPassword}
                autoComplete="new-password"
                placeholder={t("passwordLength")}
                t={t}
                email={registerForm.email}
                maxLength={8}
                showStrength
              />

              <PasswordField
                label={t("confirmPassword")}
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                autoComplete="new-password"
                placeholder={t("confirmPassword")}
                t={t}
                maxLength={8}
              />

              <button
                type="submit"
                disabled={registerLoading}
                className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {registerLoading
                  ? t("creatingWorkspace")
                  : t("createWorkspaceButton")}
              </button>
            </form>

            <p className="mt-2 border-t border-slate-200/60 pt-2 text-center text-xs text-slate-500 dark:border-emerald-400/10 sm:mt-6 sm:pt-4 sm:text-sm">
              {t("alreadyHaveAccount")}{" "}
              <button
                type="button"
                onClick={handleFlipToLogin}
                className="auth-link font-semibold text-slate-900 hover:underline dark:text-white"
              >
                {t("signIn")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthControls({ language, setLanguage, theme, toggleTheme, t }) {
  return (
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

function isValidEmail(value) {
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(value.trim());
}

function PasswordStrength({ value, email, t }) {
  if (!value) return null;

  const assessment = assessPassword(value, email);
  const strengthLevel =
    assessment.level <= 1 ? 1 : assessment.level === 2 ? 2 : assessment.level === 3 ? 3 : 4;

  const labels = ["weak", "medium", "strong", "veryStrong"];
  const levelKey = labels[strengthLevel - 1];
  const level = t(levelKey);

  const levelClass =
    strengthLevel === 1
      ? "text-red-600 dark:text-red-300"
      : strengthLevel === 2
        ? "text-amber-600 dark:text-amber-300"
        : "text-emerald-600 dark:text-emerald-300";

  return (
    <div className="auth-strength -mt-1" aria-live="polite">
      <div className="auth-strength-head">
        <span>{t("passwordStrength")}</span>
        <strong className={levelClass}>{level}</strong>
      </div>

      <div
        className="grid grid-cols-4 gap-1.5"
        role="progressbar"
        aria-label={`${t("passwordStrength")}: ${level}`}
        aria-valuemin="1"
        aria-valuemax="4"
        aria-valuenow={strengthLevel}
      >
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 rounded-full transition-colors ${
              segment <= strengthLevel
                ? strengthLevel === 1
                  ? "bg-red-500"
                  : strengthLevel === 2
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
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

export default Login;
