import { useCallback, useEffect, useMemo, useState } from "react";
import { pipeApi } from "../lib/pipeApi";
import { useAuth } from "../hooks/useAuth";
import { ProfileContext } from "./ProfileContextValue";

const fallbackProfile = { traderName: "Trader", journalName: "PIPE.ID", theme: "light", avatarUrl: "" };
function normalizeProfile(data, user) {
  return {
    traderName: data?.trader_name || user?.email?.split("@")[0] || "Trader",
    journalName: data?.journal_name === "Pipfolio" || data?.journal_name === "Trading Journal" ? "PIPE.ID" : data?.journal_name || "PIPE.ID",
    theme: data?.theme || "light",
    avatarUrl: data?.avatar_url || "",
  };
}
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "light") root.classList.remove("dark");
  else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(fallbackProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user) { applyTheme(localStorage.getItem("trading_journal_theme") || "light"); return undefined; }
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await pipeApi.profile.get();
        if (!active) return;
        const next = normalizeProfile(data, user);
        setProfile(next); localStorage.setItem("trading_journal_theme", next.theme); applyTheme(next.theme);
      } catch (e) { if (active) { setError(e.message); setProfile(normalizeProfile(null, user)); } }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  const updateProfile = useCallback(async (values) => {
    if (!user) throw new Error("You must be logged in.");
    const data = await pipeApi.profile.update({
      traderName: values.traderName?.trim() || user.email?.split("@")[0] || "Trader",
      journalName: values.journalName?.trim() || "PIPE.ID",
      theme: values.theme || profile.theme || "light",
      avatarUrl: values.avatarUrl ?? profile.avatarUrl ?? null,
      backupEmail: values.backupEmail,
      phoneWhatsapp: values.phoneWhatsapp,
    });
    const next = normalizeProfile(data, user);
    setProfile(next); localStorage.setItem("trading_journal_theme", next.theme); applyTheme(next.theme);
    return next;
  }, [profile, user]);

  const value = useMemo(() => ({ profile: user ? profile : fallbackProfile, loading: user ? loading : false, error: user ? error : "", updateProfile, applyTheme }), [profile, loading, error, user, updateProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
