// ── API Configuration ──
function normalizeApiBase(url) {
  const trimmed = String(url || "")
    .trim()
    .replace(/\/+$/, "");
  if (!trimmed) return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const API_BASE = normalizeApiBase(window.APP_CONFIG?.API_URL || window.API_URL);

const api = {
  async request(method, path, body = null, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : { message: await res.text() };
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  get: (path, token) => api.request("GET", path, null, token),
  post: (path, body, token) => api.request("POST", path, body, token),
  delete: (path, token) => api.request("DELETE", path, null, token),

  // File download (Excel)
  async download(path, token, filename) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// ── Token storage ──
const tokenStore = {
  get: () => localStorage.getItem("ep_token"),
  set: (t) => localStorage.setItem("ep_token", t),
  clear: () => localStorage.removeItem("ep_token"),
};

const userStore = {
  get: () => JSON.parse(localStorage.getItem("ep_user") || "null"),
  set: (u) => localStorage.setItem("ep_user", JSON.stringify(u)),
  clear: () => localStorage.removeItem("ep_user"),
};
