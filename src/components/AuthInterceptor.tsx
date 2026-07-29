"use client";

import { useEffect } from "react";

export default function AuthInterceptor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);

      const currentPath = window.location.pathname;
      // Do not intercept if already on the admin login page
      if (currentPath.startsWith("/admin/login")) {
        return response;
      }

      // 401 Unauthorized status indicates missing, invalid or expired token
      if (response.status === 401) {
        localStorage.removeItem("super_token");
        localStorage.removeItem("super_user");
        window.location.href = "/admin/login";
      } else if (!response.ok) {
        // Inspect response body for token expiration error messages
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
              localStorage.removeItem("super_token");
              localStorage.removeItem("super_user");
              window.location.href = "/admin/login";
            }
          }
        } catch (_) {
          // Ignore non-JSON response parsing errors
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
