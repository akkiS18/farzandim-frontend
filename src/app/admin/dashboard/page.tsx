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
    localStorage.removeItem("super_refresh_token");
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
              className="text-xs text-zinc-400 hover:text-red-400 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">Provision New School</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Create a new school tenant with an isolated PostgreSQL database.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label htmlFor="school-name-input" className="block text-xs font-medium text-zinc-300 mb-1">
                  School Name
                </label>
                <input
                  id="school-name-input"
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. 15-Maktab"
                  className="w-full bg-[#18181b] border border-zinc-700 focus:border-indigo-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 outline-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "Provisioning Database..." : "Provision School"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Existing Tenants */}
        <div className="lg:col-span-2">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">Registered School DBs</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Active multi-tenant isolated databases managed by Central DB.
            </p>

            {createdSchools.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500">No schools provisioned yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="text-xs uppercase bg-[#18181b] text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">School Name</th>
                      <th className="px-4 py-3">Tenant ID</th>
                      <th className="px-4 py-3 rounded-r-lg">Database Connection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {createdSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-zinc-800/30 transition">
                        <td className="px-4 py-3.5 font-medium text-zinc-100">{school.name}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-indigo-400">{school.id}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-400 truncate max-w-[200px]">
                          {school.db_connection_string}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
