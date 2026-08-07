"use client";

import { useEffect } from "react";

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

const clearSuperAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("super_token");
  localStorage.removeItem("super_refresh_token");
  localStorage.removeItem("super_user");
};

export default function AuthInterceptor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      // Do not intercept refresh or login requests
      if (
        requestUrl.includes("/api/schools/refresh") ||
        requestUrl.includes("/api/admin/super/login") ||
        window.location.pathname.startsWith("/admin/login")
      ) {
        return originalFetch.apply(this, [input, init]);
      }

      // Attach super_token automatically if available
      const storedToken = localStorage.getItem("super_token");
      if (storedToken) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${storedToken}`);
        }
        init.headers = headers;
      }

      const response = await originalFetch.apply(this, [input, init]);

      let isUnauthorized = response.status === 401;

      if (!isUnauthorized && !response.ok) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data && data.error && typeof data.error === "string") {
            const errText = data.error.toLowerCase();
            if (
              errText.includes("expired token") ||
              errText.includes("invalid or expired token") ||
              errText.includes("token required") ||
              errText.includes("unauthorized")
            ) {
              isUnauthorized = true;
            }
          }
        } catch (_) {
          // Ignore parsing errors
        }
      }

      if (isUnauthorized) {
        const refreshToken = localStorage.getItem("super_refresh_token");
        if (!refreshToken) {
          clearSuperAuth();
          window.location.replace("/admin/login");
          return response;
        }

        if (isRefreshing) {
          try {
            const newToken = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });

            const retriedHeaders = new Headers(init?.headers || {});
            retriedHeaders.set("Authorization", `Bearer ${newToken}`);
            const retriedInit = { ...init, headers: retriedHeaders };
            return originalFetch.apply(this, [input, retriedInit]);
          } catch (err) {
            clearSuperAuth();
            window.location.replace("/admin/login");
            return response;
          }
        }

        isRefreshing = true;

        try {
          const refreshRes = await originalFetch(`${API_URL}/api/schools/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!refreshRes.ok) {
            throw new Error("Token refresh failed");
          }

          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.token;
          const newRefreshToken = refreshData.refresh_token;

          if (!newAccessToken) {
            throw new Error("No token returned from refresh endpoint");
          }

          localStorage.setItem("super_token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("super_refresh_token", newRefreshToken);
          }

          processQueue(null, newAccessToken);

          const retriedHeaders = new Headers(init?.headers || {});
          retriedHeaders.set("Authorization", `Bearer ${newAccessToken}`);
          const retriedInit = { ...init, headers: retriedHeaders };
          return originalFetch.apply(this, [input, retriedInit]);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          clearSuperAuth();
          window.location.replace("/admin/login");
          return response;
        } finally {
          isRefreshing = false;
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
