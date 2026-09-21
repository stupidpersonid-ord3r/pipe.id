import { useEffect, useState } from "react";
import { AtSign, KeyRound, Mail, Phone, ShieldCheck } from "lucide-react";
import { pipeApi } from "../../lib/pipeApi";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { assessPassword } from "../../utils/passwordPolicy";

const PHONE_COUNTRIES = [
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
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
        const data = await pipeApi.profile.get();
        setBackupEmail(data?.backup_email || "");
        const parsed = parseStoredPhone(data?.phone_whatsapp || "");
        setPhoneCountry(parsed.country);
        setPhoneNumber(parsed.number);
      } catch (loadError) {
        setError(loadError.message || "Failed to load security settings.");
      }
    }

    loadSecurity();
  }, [user]);

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
      setError("Backup email must use lowercase letters and end in @gmail.com.");
      setContactSaving(false);
      return;
    }

    if (email && email === currentEmail.trim()) {
      setError("Backup email must be different from your registered email.");
      setContactSaving(false);
      return;
    }

    if (phoneNumber && (!number || number.length < 11 || number.length > 12)) {
      setError("Phone / WhatsApp number must contain 11 to 12 digits.");
      setContactSaving(false);
      return;
    }

    const storedPhone = number && country ? `${country.dial}${number}` : null;

    try {
      await pipeApi.profile.update({ backupEmail: email || null, phoneWhatsapp: storedPhone });
      setMessage("Security contact information saved successfully.");
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
      setError("New email must use lowercase letters and end in @gmail.com.");
      return;
    }

    if (email === currentEmail.trim()) {
      setError("The new email is the same as your current email.");
      return;
    }

    if (email === backupEmail.trim()) {
      setError("The new email must be different from your backup email.");
      return;
    }

    if (!password) {
      setError("Enter your current password before changing your email.");
      return;
    }

    setEmailSaving(true);

    try {
      await pipeApi.changeEmail({ email, password });
      setNewEmail("");
      setEmailCurrentPassword("");
      setMessage("Email changed successfully.");
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
      await pipeApi.changePassword({ currentPassword, newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage(t("passwordChangedSuccessfully"));
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
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
      ? "Use lowercase letters only and a Gmail address ending in @gmail.com."
      : backupEmailTrimmed && backupEmailTrimmed === currentEmail.trim()
        ? "Backup email must be different from your registered email."
        : "";

  const phoneDigits = normalizePhone(phoneNumber);
  const phoneError = phoneNumber && (phoneDigits.length < 11 || phoneDigits.length > 12)
    ? "Phone / WhatsApp must contain 11 to 12 digits."
    : "";

  const newEmailTrimmed = newEmail.trim();
  const newEmailError =
    newEmailTrimmed && !isGmail(newEmailTrimmed)
      ? "Use lowercase letters only and a Gmail address ending in @gmail.com."
      : newEmailTrimmed && newEmailTrimmed === currentEmail.trim()
        ? "This is the same as your current email."
        : newEmailTrimmed && newEmailTrimmed === backupEmailTrimmed
          ? "This email is already your backup email."
          : "";

  const emailPasswordError =
    emailCurrentPassword === "" ? "Current password is required." : "";

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage account email, backup contact information, and password.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recovery & Contact</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Keep your backup contact information up to date.</p>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={saveContacts} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Backup Email</label>
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
              <p className="mt-1.5 text-xs text-slate-400">Only Gmail addresses ending in @gmail.com are accepted.</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Country</label>
            <select
              value={phoneCountry}
              onChange={(event) => setPhoneCountry(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.dial})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone / WhatsApp</label>
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
              <p className="mt-1.5 text-xs text-slate-400">Numbers only. Country code is selected separately.</p>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="submit" disabled={contactSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <ShieldCheck size={16} />
              {contactSaving ? "Saving..." : "Save Contact"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300"><AtSign size={20} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Change Email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Verify your current password before changing the sign-in email.</p>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={changeEmail} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Current Email</label>
            <input value={currentEmail} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">New Gmail</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input type="text" inputMode="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="newaccount@gmail.com" autoComplete="email" aria-invalid={Boolean(newEmailError)} className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${newEmailError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
            </div>
            {newEmailError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{newEmailError}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Current Password</label>
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input type="password" value={emailCurrentPassword} onChange={(event) => setEmailCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" aria-invalid={Boolean(emailPasswordError)} className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${emailPasswordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
            </div>
            {emailPasswordError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{emailPasswordError}</p>}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="submit" disabled={emailSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <Mail size={16} />
              {emailSaving ? "Updating..." : "Change Email"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-emerald-300"><KeyRound size={20} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Verify your current password before setting a new one.</p>
            </div>
          </div>
        </div>

        <form onSubmit={changePassword} className="space-y-5 p-6">
          <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Current password" autoComplete="current-password" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="New password" autoComplete="new-password" maxLength={8} aria-invalid={Boolean(newPasswordError)} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${newPasswordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
          {newPasswordError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" aria-live="polite">{newPasswordError}</p>}

          {strength && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Password strength</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{t(["", "weak", "medium", "strong", "veryStrong"][strength.level] || "passwordStrength")}</span></div>
            </div>
          )}

          <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password" autoComplete="new-password" maxLength={8} aria-invalid={Boolean(confirmPasswordError)} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${confirmPasswordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/70" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-slate-700"}`} />
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
