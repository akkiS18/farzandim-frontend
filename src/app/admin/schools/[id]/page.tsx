"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone: string;
  email?: string;
  created_at: string;
}

interface School {
  id: string;
  name: string;
}

export default function ManageSchoolPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("super_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const loadData = async () => {
      setFetching(true);
      setError("");
      try {
        // 1. Fetch School details
        const schoolRes = await fetch(`${API_URL}/api/admin/schools/${schoolId}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!schoolRes.ok) throw new Error("Failed to load school details");
        const schoolData = await schoolRes.json();
        setSchool(schoolData);

        // 2. Fetch Admins list
        const adminsRes = await fetch(`${API_URL}/api/admin/schools/${schoolId}/admins`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!adminsRes.ok) throw new Error("Failed to load administrators");
        const adminsData = await adminsRes.json();
        setAdmins(adminsData);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching school configurations.");
      } finally {
        setFetching(false);
      }
    };

    if (schoolId) {
      loadData();
    }
  }, [schoolId, router]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("super_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || undefined,
      phone,
      email: email || undefined,
      password,
    };

    try {
      const response = await fetch(`${API_URL}/api/admin/schools/${schoolId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add administrator");
      }

      setSuccess(`Admin ${firstName} ${lastName} successfully registered.`);
      setAdmins((prev) => [...prev, data]);
      
      // Clear form inputs
      setFirstName("");
      setLastName("");
      setMiddleName("");
      setPhone("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the administrator.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-zinc-400">Loading school configurations...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded-lg transition"
            >
              ← Back to Control Panel
            </button>
            <h1 className="text-lg font-bold text-zinc-200">
              {school ? school.name : "School Admin Management"}
            </h1>
          </div>
          <span className="text-xs text-zinc-500 font-mono hidden md:inline">
            School ID: {schoolId}
          </span>
        </div>
      </header>

      {/* Content Area */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Admin Form */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-zinc-200 mb-2">
                Register School Admin
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                Creates a new user record inside this school's isolated database with administrative access.
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

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm transition outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm transition outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Robert"
                    className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +998901234567"
                    className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.com"
                    className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#18181b]/50 border border-zinc-800 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm transition outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 outline-none cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Registering Admin..." : "Register Admin User"}
                </button>
              </form>
            </div>
          </div>

          {/* List of Admins */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl h-full flex flex-col">
              <h2 className="text-lg font-bold text-zinc-200 mb-6">
                Active School Administrators
              </h2>

              {admins.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl p-8 text-center">
                  <span className="text-zinc-500 text-3xl mb-2">👤</span>
                  <p className="text-sm text-zinc-400">No administrators registered for this school yet.</p>
                  <p className="text-xs text-zinc-500 mt-1">Use the registration form on the left to add one.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="bg-[#18181b]/40 border border-zinc-800 hover:border-zinc-700/60 rounded-xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-100 text-base">
                          {admin.first_name} {admin.last_name} {admin.middle_name && <span className="text-zinc-400 text-sm">({admin.middle_name})</span>}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                          <span>Phone: {admin.phone}</span>
                          {admin.email && (
                            <>
                              <span className="text-zinc-600 hidden md:inline">|</span>
                              <span>Email: {admin.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20 font-medium self-start md:self-center">
                        Active Admin
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
