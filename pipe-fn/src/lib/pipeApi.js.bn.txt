const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
let accessToken = localStorage.getItem("pipe_access_token");
let refreshToken = localStorage.getItem("pipe_refresh_token");

export function setPipeSession(session) {
  accessToken = session?.access_token || null;
  refreshToken = session?.refresh_token || null;
  if (accessToken) localStorage.setItem("pipe_access_token", accessToken); else localStorage.removeItem("pipe_access_token");
  if (refreshToken) localStorage.setItem("pipe_refresh_token", refreshToken); else localStorage.removeItem("pipe_refresh_token");
  window.dispatchEvent(new Event("pipe-session-change"));
}
export function clearPipeSession() {
  accessToken = null; refreshToken = null;
  localStorage.removeItem("pipe_access_token");
  localStorage.removeItem("pipe_refresh_token");
}

async function refreshSession() {
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
  if (!response.ok) { clearPipeSession(); return false; }
  const data = await response.json();
  setPipeSession(data.session);
  return true;
}

export async function pipeFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401 && refreshToken && !path.startsWith("/auth/refresh")) {
    if (await refreshSession()) {
      headers.Authorization = `Bearer ${accessToken}`;
      response = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error?.message || "PIPE.ID API request failed.");
    error.code = data?.error?.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

export const pipeApi = {
  register: async (body) => { const data = await pipeFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }); setPipeSession(data.session); return data; },
  login: async (body) => { const data = await pipeFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }); setPipeSession(data.session); return data; },
  status: () => pipeFetch("/auth/status"),
  logout: async () => { try { return await pipeFetch("/auth/logout", { method: "POST" }); } finally { clearPipeSession(); } },
  changePassword: (body) => pipeFetch("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  changeEmail: async (body) => { const data = await pipeFetch("/auth/change-email", { method: "POST", body: JSON.stringify(body) }); setPipeSession(data.session); return data; },
  forgotPassword: (body) => pipeFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body) => pipeFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  profile: {
    get: async () => (await pipeFetch("/profile")).data,
    update: async (body) => (await pipeFetch("/profile", { method: "PATCH", body: JSON.stringify(body) })).data,
  },
  accounts: {
    list: async () => (await pipeFetch("/accounts")).data || [],
    create: async (body) => (await pipeFetch("/accounts", { method: "POST", body: JSON.stringify(body) })).data,
    get: async (id) => (await pipeFetch(`/accounts/${id}`)).data,
    update: async (id, body) => (await pipeFetch(`/accounts/${id}`, { method: "PATCH", body: JSON.stringify(body) })).data,
    remove: (id) => pipeFetch(`/accounts/${id}`, { method: "DELETE" }),
    deposit: async (id, body) => (await pipeFetch(`/accounts/${id}/deposit`, { method: "POST", body: JSON.stringify(body) })).data,
    withdraw: async (id, body) => (await pipeFetch(`/accounts/${id}/withdraw`, { method: "POST", body: JSON.stringify(body) })).data,
    transactions: async (id) => (await pipeFetch(`/accounts/${id}/transactions`)).data || [],
  },
  trades: {
    list: async (query = "") => pipeFetch(`/trades${query ? `?${query}` : ""}`),
    create: async (body) => (await pipeFetch("/trades", { method: "POST", body: JSON.stringify(body) })).data,
    get: async (id) => (await pipeFetch(`/trades/${id}`)).data,
    update: async (id, body) => (await pipeFetch(`/trades/${id}`, { method: "PATCH", body: JSON.stringify(body) })).data,
    remove: (id) => pipeFetch(`/trades/${id}`, { method: "DELETE" }),
  },
  analytics: {
    overview: (accountId, params = {}) => pipeFetch(`/analytics/overview${queryString({ accountId, ...params })}`),
    equity: (accountId, params = {}) => pipeFetch(`/analytics/equity${queryString({ accountId, ...params })}`),
    monthly: (accountId, params = {}) => pipeFetch(`/analytics/monthly${queryString({ accountId, ...params })}`),
    psychology: () => pipeFetch("/analytics/psychology"),
    strategies: (accountId, params = {}) => pipeFetch(`/analytics/strategies${queryString({ accountId, ...params })}`),
    pairs: (accountId, params = {}) => pipeFetch(`/analytics/pairs${queryString({ accountId, ...params })}`),
  },
  instruments: async () => (await pipeFetch("/instruments")).data || [],
};

function queryString(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") params.set(key, value); });
  const value = params.toString();
  return value ? `?${value}` : "";
}

export { API_URL };
