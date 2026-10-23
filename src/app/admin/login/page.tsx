"use client";

import api, { saveSuperAuth, getSuperUser } from "@/lib/api";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const submitting = useRef(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if already logged in
    const user = getSuperUser();
    if (user) {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");

    try {
      const data = await api.post<Parameters<typeof saveSuperAuth>[0]>("/api/admin/super/login", { phone, password });
      saveSuperAuth(data);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your credentials.");
    } finally {
      submitting.current = false;
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
              autoComplete="username"
              type="tel"
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
              autoComplete="current-password"
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

