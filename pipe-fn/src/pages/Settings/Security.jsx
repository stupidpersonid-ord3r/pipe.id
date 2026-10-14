import { useEffect, useState } from "react";
import { AtSign, KeyRound, Mail, Phone, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { assessPassword } from "../../utils/passwordPolicy";

const PHONE_COUNTRIES = [
  { code: "ID", nameKey: "countryIndonesia", dial: "+62" },
  { code: "MY", nameKey: "countryMalaysia", dial: "+60" },
  { code: "SG", nameKey: "countrySingapore", dial: "+65" },
  { code: "US", nameKey: "countryUnitedStates", dial: "+1" },
  { code: "GB", nameKey: "countryUnitedKingdom", dial: "+44" },
  { code: "AU", nameKey: "countryAustralia", dial: "+61" },
  { code: "JP", nameKey: "countryJapan", dial: "+81" },
  { code: "KR", nameKey: "countrySouthKorea", dial: "+82" },
  { code: "IN", nameKey: "countryIndia", dial: "+91" },
  { code: "AE", nameKey: "countryUnitedArabEmirates", dial: "+971" },
];

const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/;

function isGmail(value) {
  return GMAIL_REGEX.test(String(value || "").trim());
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseStoredPhone(value) {
  const raw = String(value || "").trim();
  const match = PHONE_COUNTRIES.find((country) =>
    raw.startsWith(country.dial),
  );

  if (!match) {
    return { country: "ID", number: normalizePhone(raw) };
  }

  return {
    country: match.code,
    number: normalizePhone(raw.slice(match.dial.length)),
  };
}

export default function Security() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { t } = useLanguage();

  const [backupEmail, setBackupEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("ID");
  const [phoneNumber, setPhoneNumber] = useState("");
  const currentEmail = user?.email || "";
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadSecurity() {
      try {
        setBackupEmail(profile?.backupEmail || "");
        const parsed = parseStoredPhone(profile?.phoneWhatsapp || "");
        setPhoneCountry(parsed.country);
        setPhoneNumber(parsed.number);
      } catch (loadError) {
        setError(loadError.message || t("securityLoadFailed"));
      }
    }

    loadSecurity();
  }, [user, profile, t]);

  async function saveContacts(event) {
    event.preventDefault();
    if (!user) return;

    const email = backupEmail.trim();
    const number = normalizePhone(phoneNumber);
    const country = PHONE_COUNTRIES.find((item) => item.code === phoneCountry);

    setContactSaving(true);
    setMessage("");
    setError("");

    if (email && !isGmail(email)) {
      setError(t("backupEmailInvalid"));
      setContactSaving(false);
      return;
    }

    if (email && email === currentEmail.trim()) {
      setError(t("backupEmailDifferent"));
      setContactSaving(false);
      return;
    }

    if (phoneNumber && (!number || number.length < 11 || number.length > 12)) {
      setError(t("phoneDigitsInvalid"));
      setContactSaving(false);
      return;
    }

    const storedPhone = number && country ? `${country.dial}${number}` : null;

    try {
      await updateProfile({ backupEmail: email || null, phoneWhatsapp: storedPhone });
      setMessage(t("securitySaved"));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setContactSaving(false);
    }
  }

  async function changeEmail(event) {
    event.preventDefault();

    const email = newEmail.trim();
    const password = emailCurrentPassword;

    setMessage("");
    setError("");

    if (!email || !isGmail(email)) {
      setError(t("newEmailInvalid"));
      return;
    }

    if (email === currentEmail.trim()) {
      setError(t("newEmailSameCurrent"));
      return;
    }

    if (email === backupEmail.trim()) {
      setError(t("newEmailSameBackup"));
      return;
    }

    if (!password) {
      setError(t("currentPasswordRequiredEmail"));
      return;
    }

    setEmailSaving(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password,
      });
      if (verifyError) throw verifyError;

      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setNewEmail("");
      setEmailCurrentPassword("");
      setMessage(t("emailChanged"));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setEmailSaving(false);
    }
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordMessage("");
    setPasswordError("");
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t("fillAllPasswordFields"));
      return;
    }

    const assessment = assessPassword(newPassword, user?.email || "");

    if (!assessment.lengthValid) {
      setPasswordError(t("passwordLength"));
      return;
    }

    if (assessment.level < 3) {
      setPasswordError(t("passwordStrongRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }

    setChangingPassword(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: currentPassword,
      });
      if (verifyError) throw verifyError;

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage(t("passwordChangedSuccessfully"));
    } catch (err) {
      setPasswordError(err.message || t("passwordChangeFailed"));
    } finally {
      setChangingPassword(false);
    }
  }

  const strength = passwordForm.newPassword
    ? assessPassword(passwordForm.newPassword, user?.email || "")
    : null;

  const selectedCountry =
    PHONE_COUNTRIES.find((item) => item.code === phoneCountry) || PHONE_COUNTRIES[0];

  // Realtime validation: show field-level feedback while the user types.
  const backupEmailTrimmed = backupEmail.trim();
  const backupEmailError =
    backupEmailTrimmed && !isGmail(backupEmailTrimmed)
      ? t("backupEmailInvalid")
      : backupEmailTrimmed && backupEmailTrimmed === currentEmail.trim()
        ? t("backupEmailDifferent")
        : "";

  const phoneDigits = normalizePhone(phoneNumber);
  const phoneError = phoneNumber && (phoneDigits.length < 11 || phoneDigits.length > 12)
    ? "Phone / WhatsApp must contain 11 to 12 digits."
    : "";

  const newEmailTrimmed = newEmail.trim();
  const newEmailError =
    newEmailTrimmed && !isGmail(newEmailTrimmed)
      ? t("backupEmailInvalid")
      : newEmailTrimmed && newEmailTrimmed === currentEmail.trim()
        ? t("newEmailSameCurrent")
        : newEmailTrimmed && newEmailTrimmed === backupEmailTrimmed
          ? t("newEmailSameBackup")
          : "";

  const emailPasswordError =
    emailCurrentPassword === "" ? t("currentPasswordRequired") : "";

  const newPasswordAssessment = passwordForm.newPassword
    ? assessPassword(passwordForm.newPassword, user?.email || "")
    : null;
  const newPasswordError = passwordForm.newPassword && newPasswordAssessment
    ? !newPasswordAssessment.lengthValid
      ? t("passwordLength")
      : newPasswordAssessment.level < 3 || !newPasswordAssessment.compositionValid
        ? t("passwordStrongRequired")
        : ""
    : "";
  const confirmPasswordError =
    passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
      ? t("passwordMismatch")
      : "";

  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("security")}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("securityPageDescription")}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("recoveryContact")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("recoveryContactDescription")}</p>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={saveContacts} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("backupEmail")}</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                inputMode="email"
                value={backupEmail}
                onChange={(event) => setBackupEmail(event.target.value)}
                placeholder="backup@gmail.com"
                autoComplete="email"
                className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${backupEmailError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`}
                aria-invalid={Boolean(backupEmailError)}
              />
            </div>
            {backupEmailError ? (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{backupEmailError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">{t("onlyGmail")}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("country")}</label>
            <select
              value={phoneCountry}
              onChange={(event) => setPhoneCountry(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {t(country.nameKey)} ({country.dial})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("phoneWhatsapp")}</label>
            <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950">
              <span className="flex items-center border-r border-slate-200 px-3 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <Phone size={15} className="mr-2" />
                {selectedCountry.dial}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(normalizePhone(event.target.value).slice(0, 12))}
                placeholder="81234567890"
                maxLength={12}
                aria-invalid={Boolean(phoneError)}
                className={`min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none dark:text-white ${phoneError ? "border-red-400" : ""}`}
              />
            </div>
            {phoneError ? (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{phoneError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">{t("numbersOnly")}</p>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="submit" disabled={contactSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <ShieldCheck size={16} />
              {contactSaving ? t("saving") : t("saveContact")}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300"><AtSign size={20} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("changeEmail")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("changeEmailDescription")}</p>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={changeEmail} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("currentEmail")}</label>
            <input value={currentEmail} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("newGmail")}</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input type="text" inputMode="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="newaccount@gmail.com" autoComplete="email" aria-invalid={Boolean(newEmailError)} className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${newEmailError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
            </div>
            {newEmailError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{newEmailError}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("currentPassword")}</label>
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input type="password" value={emailCurrentPassword} onChange={(event) => setEmailCurrentPassword(event.target.value)} placeholder={t("currentPasswordPlaceholder")} autoComplete="current-password" aria-invalid={Boolean(emailPasswordError)} className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${emailPasswordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
            </div>
            {emailPasswordError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{emailPasswordError}</p>}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="submit" disabled={emailSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <Mail size={16} />
              {emailSaving ? t("updating") : t("changeEmail")}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300"><KeyRound size={20} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("changePassword")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("changePasswordDescription")}</p>
            </div>
          </div>
        </div>

        <form onSubmit={changePassword} className="space-y-5 p-6">
          <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder={t("currentPasswordPlaceholder")} autoComplete="current-password" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder={t("newPasswordPlaceholder")} autoComplete="new-password" maxLength={8} aria-invalid={Boolean(newPasswordError)} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${newPasswordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
          {newPasswordError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{newPasswordError}</p>}

          {strength && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex justify-between text-xs"><span className="text-slate-500">{t("passwordStrengthLabel")}</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{t(["", "weak", "medium", "strong", "veryStrong"][strength.level] || "passwordStrength")}</span></div>
            </div>
          )}

          <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder={t("confirmNewPasswordPlaceholder")} autoComplete="new-password" maxLength={8} aria-invalid={Boolean(confirmPasswordError)} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${confirmPasswordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
          {confirmPasswordError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{confirmPasswordError}</p>}

          {passwordMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">{passwordMessage}</div>}
          {passwordError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{passwordError}</div>}

          <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="submit" disabled={changingPassword} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><KeyRound size={16} />{changingPassword ? "Changing..." : "Change Password"}</button>
          </div>
        </form>
      </section>

      {(message || error) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>
          {error || message}
        </div>
      )}
    </div>
  );
}
