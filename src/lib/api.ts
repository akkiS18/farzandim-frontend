/** Only this client attaches credentials; global fetch is never modified. */
export interface SuperUser { id: string; first_name: string; last_name?: string; role: "SUPER_ADMIN" }
interface AuthResponse { token: string; refresh_token: string; user: SuperUser }
let generation = 0;
let refreshPromise: Promise<string> | null = null;

function apiURL(endpoint: string): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured && process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_API_URL sozlanmagan");
  const base = new URL(configured || "http://localhost:6560");
  if (base.username || base.password || base.search || base.hash || base.pathname !== "/") throw new Error("API manzili faqat origin bo‘lishi kerak");
  if (base.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && base.protocol === "http:")) throw new Error("API uchun HTTPS talab qilinadi");
  const url = new URL(endpoint, base);
  if (url.origin !== base.origin || !(url.pathname.startsWith("/api/admin/") || url.pathname === "/api/schools/refresh")) throw new Error("API manziliga ruxsat yo‘q");
  return url.toString();
}
export function clearSuperAuth() {
  generation++;
  refreshPromise = null;
  for (const key of ["super_token", "super_refresh_token", "super_user"]) localStorage.removeItem(key);
}
export function getSuperUser(): SuperUser | null {
  try {
    const user = JSON.parse(localStorage.getItem("super_user") || "null");
    return user?.role === "SUPER_ADMIN" && localStorage.getItem("super_token") ? user : null;
  } catch { return null; }
}
export function saveSuperAuth(data: AuthResponse) {
  if (data.user?.role !== "SUPER_ADMIN" || typeof data.token !== "string" || !data.token || typeof data.refresh_token !== "string" || !data.refresh_token) throw new Error("Login javobi noto‘g‘ri");
  clearSuperAuth();
  localStorage.setItem("super_token", data.token);
  localStorage.setItem("super_refresh_token", data.refresh_token);
  localStorage.setItem("super_user", JSON.stringify(data.user));
}
function expireSession() {
  clearSuperAuth();
  window.location.replace("/admin/login");
}
async function refresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const version = generation;
  const oldRefresh = localStorage.getItem("super_refresh_token");
  const pending = (async () => {
    if (!oldRefresh) { expireSession(); throw new Error("Sessiya tugagan"); }
    const response = await fetch(apiURL("/api/schools/refresh"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: oldRefresh }), cache: "no-store", redirect: "error", credentials: "omit",
    });
    if (version !== generation || localStorage.getItem("super_refresh_token") !== oldRefresh) throw new Error("Sessiya o‘zgargan");
    if (response.status === 401 || response.status === 403) { expireSession(); throw new Error("Qayta tizimga kiring"); }
    if (!response.ok) throw new Error("Sessiyani yangilab bo‘lmadi. Qayta urinib ko‘ring");
    const data = await response.json();
    if (version !== generation || localStorage.getItem("super_refresh_token") !== oldRefresh) throw new Error("Sessiya o‘zgargan");
    if (typeof data.token !== "string" || !data.token || typeof data.refresh_token !== "string" || !data.refresh_token) throw new Error("Sessiya javobi noto‘g‘ri");
    localStorage.setItem("super_token", data.token);
    localStorage.setItem("super_refresh_token", data.refresh_token);
    return data.token as string;
  })();
  refreshPromise = pending;
  try { return await pending; } finally { if (refreshPromise === pending) refreshPromise = null; }
}
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = apiURL(endpoint);
  const login = new URL(url).pathname === "/api/admin/super/login";
  const version = generation;
  const headers = new Headers(options.headers);
  headers.delete("Authorization");
  headers.set("Content-Type", "application/json");
  const token = localStorage.getItem("super_token");
  if (!login && token) headers.set("Authorization", `Bearer ${token}`);
  const config: RequestInit = { ...options, headers, cache: "no-store", redirect: "error", credentials: "omit" };
  let response = await fetch(url, config);
  if (!login && response.status === 401) {
    if (version !== generation) throw new Error("Sessiya o‘zgargan");
    // A concurrent request may already have refreshed the same expired token.
    const current = localStorage.getItem("super_token");
    const fresh = current && current !== token ? current : await refresh();
    if (version !== generation) throw new Error("Sessiya o‘zgargan");
    headers.set("Authorization", `Bearer ${fresh}`);
    response = await fetch(url, config);
    if (response.status === 401) { expireSession(); throw new Error("Qayta tizimga kiring"); }
  }
  const data = await response.json().catch(() => ({}));
  if (!login && version !== generation) throw new Error("Sessiya o‘zgargan");
  if (!response.ok) throw new Error(data.error || `So‘rov bajarilmadi (${response.status})`);
  return data as T;
}
export const api = {
  get: <T>(path: string, options?: RequestInit) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) => apiRequest<T>(path, { ...options, method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
};
export default api;
