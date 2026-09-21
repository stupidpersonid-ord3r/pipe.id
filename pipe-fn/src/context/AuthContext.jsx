import { useEffect, useState } from "react";
import { pipeApi, clearPipeSession } from "../lib/pipeApi";
import { AuthContext } from "./AuthContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!localStorage.getItem("pipe_access_token")) { if (active) setLoading(false); return; }
        const data = await pipeApi.status();
        if (active) setUser(data.user || null);
      } catch {
        clearPipeSession();
        if (active) setUser(null);
      } finally { if (active) setLoading(false); }
    }
    load();
    const handleSessionChange = () => load();
    window.addEventListener("pipe-session-change", handleSessionChange);
    return () => { active = false; window.removeEventListener("pipe-session-change", handleSessionChange); };
  }, []);

  async function logout() {
    await pipeApi.logout();
    setUser(null);
  }

  async function refreshUser() {
    const data = await pipeApi.status();
    setUser(data.user || null);
    return data.user;
  }

  return <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
