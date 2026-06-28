"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+998901112233");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem("super_token");
    if (token) {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/admin/super/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("super_token", data.token);
      localStorage.setItem("super_user", JSON.stringify(data.user));
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-radial from-[#1e1b4b] to-[#09090b] px-4">
      <div className="w-full max-w-md bg-[#09090b]/80 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-indigo-500/5">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Online Jurnal
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Super Admin Centralized Management Portal
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="super-admin-login-phone" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input
              id="super-admin-login-phone"
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901112233"
              className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-4 py-3 text-sm transition outline-none"
            />
          </div>

          <div>
            <label htmlFor="super-admin-login-password" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="super-admin-login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-4 py-3 text-sm transition outline-none"
            />
          </div>

          <button
            id="super-admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Access Control Panel"}
          </button>
        </form>
      </div>
    </main>
  );
}
