/**
 * Modular API client utility for Super Admin Portal with Dual-Token handling and Silent Refresh.
 * Usage:
 *   import api from '@/lib/api';
 *   const data = await api.get('/api/admin/schools');
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const clearSuperAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("super_token");
  localStorage.removeItem("super_refresh_token");
  localStorage.removeItem("super_user");
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("super_token") : null;

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, config);

  if (response.status === 401 && !endpoint.includes("/api/schools/refresh") && !endpoint.includes("/api/admin/super/login")) {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("super_refresh_token") : null;
    if (!refreshToken) {
      clearSuperAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.replace("/admin/login");
      }
      throw new Error("Unauthorized: Session expired");
    }

    if (isRefreshing) {
      try {
        const newToken = await new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...config, headers });
      } catch (err) {
        clearSuperAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
          window.location.replace("/admin/login");
        }
        throw err;
      }
    } else {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_URL}/api/schools/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error("Token refresh failed");
        }

        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.token;
        const newRefreshToken = refreshData.refresh_token;

        if (!newAccessToken) {
          throw new Error("Invalid refresh response");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("super_token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("super_refresh_token", newRefreshToken);
          }
        }

        processQueue(null, newAccessToken);

        headers.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...config, headers });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearSuperAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
          window.location.replace("/admin/login");
        }
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }
  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

export default api;
