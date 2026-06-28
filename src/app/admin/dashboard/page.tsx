"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string;
  name: string;
  db_connection_string: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);
  const [createdSchools, setCreatedSchools] = useState<School[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("super_token");
    const userStr = localStorage.getItem("super_user");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (userStr) {
      setAdminUser(JSON.parse(userStr));
    }

    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/schools`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCreatedSchools(data);
        }
      } catch (err) {
        console.error("Failed to load schools list:", err);
      }
    };
    fetchSchools();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("super_token");
    localStorage.removeItem("super_user");
    router.push("/admin/login");
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("super_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/schools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: schoolName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create school");
      }

      setSuccess(`Successfully provisioned school DB: ${schoolName}`);
      setCreatedSchools((prev) => [data.school, ...prev]);
      setSchoolName("");
    } catch (err: any) {
      setError(err.message || "An error occurred while provisioning the database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Online Jurnal
            </h1>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Super Admin Console
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {adminUser && (
              <span className="text-sm text-zinc-400">
                Hi, {adminUser.first_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2 px-3 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-zinc-200 mb-2">
                Register New School (Tenant)
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                This process dynamically spins up an isolated PostgreSQL database, executes migrations, and configures the connection routing.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div>
                  <label htmlFor="super-admin-school-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    School Name
                  </label>
                  <input
                    id="super-admin-school-name"
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Cambridge School"
                    className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-4 py-3 text-sm transition outline-none"
                  />
                </div>

                <button
                  id="super-admin-create-school-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 outline-none cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Provisioning Database..." : "Provision School Database"}
                </button>
              </form>
            </div>
          </div>

          {/* List of Created Schools Side */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl h-full flex flex-col">
              <h2 className="text-lg font-bold text-zinc-200 mb-6">
                Active Tenant Databases
              </h2>

              {createdSchools.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl p-8 text-center">
                  <span className="text-zinc-500 text-3xl mb-2">🏫</span>
                  <p className="text-sm text-zinc-400">No schools provisioned in this session yet.</p>
                  <p className="text-xs text-zinc-500 mt-1">Use the form on the left to add a new database.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                  {createdSchools.map((school) => {
                    // Extract DB name from connection string for presentation
                    let dbName = "Unknown";
                    try {
                      const urlParts = school.db_connection_string.split("/");
                      dbName = urlParts[urlParts.length - 1].split("?")[0];
                    } catch (e) {}

                    return (
                      <div
                        key={school.id}
                        className="bg-[#18181b]/40 border border-zinc-800 hover:border-indigo-500/30 rounded-xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="font-semibold text-zinc-100 text-base">{school.name}</h3>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="text-zinc-400">ID: {school.id}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-indigo-400 font-mono">DB: {dbName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:block text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 font-mono overflow-x-auto max-w-full md:max-w-xs">
                            {school.db_connection_string}
                          </div>
                          <a
                            href={`/admin/schools/${school.id}`}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition"
                          >
                            Manage Admins
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
