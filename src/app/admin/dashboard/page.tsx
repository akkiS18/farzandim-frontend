"use client";

import api, { clearSuperAuth, getSuperUser, type SuperUser } from "@/lib/api";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SuperAdminPasswordForm from "@/components/SuperAdminPasswordForm";

interface School {
  id: string;
  name: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const submitting = useRef(false);
  const [schoolName, setSchoolName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminUser, setAdminUser] = useState<SuperUser | null>(null);
  const [createdSchools, setCreatedSchools] = useState<School[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  useEffect(() => {
    const user = getSuperUser();
    if (!user) { clearSuperAuth(); router.replace("/admin/login"); return; }
    setAdminUser(user);
    const controller = new AbortController();
    api.get<School[]>("/api/admin/schools", { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setCreatedSchools(data || []); })
      .catch(err => { if (!controller.signal.aborted) setListError(err.message || "Maktablar yuklanmadi"); })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [router]);

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await api.post("/api/admin/super/logout");
      clearSuperAuth();
      router.replace("/admin/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chiqish bajarilmadi. Qayta urinib ko‘ring");
    } finally { setLogoutLoading(false); }
  };

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(id); } catch { setError("ID nusxalanmadi"); return; }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || submitting.current || listLoading || listError) return;
    submitting.current = true;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await api.post<{ school: School }>("/api/admin/schools", { name: schoolName.trim() });
      setSuccess(`Muvaffaqiyatli yaratildi: ${schoolName}`);
      setCreatedSchools((prev) => [data.school, ...prev]);
      setSchoolName("");
    } catch (err: any) {
      setError(err.message || "Maktab ma'lumotlar bazasini yaratishda xatolik yuz berdi.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return createdSchools;
    const q = searchQuery.toLowerCase();
    return createdSchools.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [createdSchools, searchQuery]);

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
              FJ
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-300 via-zinc-100 to-violet-300 bg-clip-text text-transparent leading-none">
                Farzandim Admin
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase mt-0.5">
                Super Admin Central Console
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {adminUser && (
              <div className="hidden sm:flex items-center space-x-2.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs text-zinc-300 font-medium">
                  {adminUser.first_name} {adminUser.last_name || ""}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="text-xs font-medium text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {logoutLoading ? "Chiqilmoqda…" : "Barcha qurilmalardan chiqish"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="border-b border-zinc-800/60 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Jami Maktablar
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {createdSchools.length}
                </span>
                <span className="text-xs text-emerald-400 font-medium">Ta'lim muassasalari</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Tizim Holati
              </span>
              <div className="mt-2 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-semibold text-emerald-400">{listLoading ? "Yuklanmoqda" : "Maktablar boshqaruvi"}</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Adminlar Boshqaruvi
              </span>
              <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Har bir maktab qatoridagi <span className="text-indigo-400 font-medium">"Adminlar ro'yxati"</span> tugmasi orqali faol adminlar ro'yxatiga o'tishingiz mumkin.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-24 backdrop-blur-md">
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h2 className="text-base font-bold text-zinc-100">Yangi Maktab Qo'shish</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Yangi maktab kiritilganda unga avtomatik alohida PostgreSQL ma'lumotlar bazasi ochiladi.
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
                <label htmlFor="school-name-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Maktab Nomi
                </label>
                <input
                  id="school-name-input"
                  type="text"
                  required
                  maxLength={255}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Masalan: 15-IDUM yoki Smart School"
                  className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || listLoading || !!listError}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Baza yaratilmoqda...</span>
                  </>
                ) : (
                  <>
                    <span>+ Maktabni Ro'yxatga Olish</span>
                  </>
                )}
              </button>
            </form>
            <SuperAdminPasswordForm />
          </div>
        </div>

        {/* Right Column: Existing Tenants */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Ro'yxatdan O'tgan Maktablar</span>
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                    {filteredSchools.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Har bir maktabning administratorlarini ko'rish yoki yangi admin biriktirish uchun qatordagi tugmani bosing.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Maktab yoki ID qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600"
                />
              </div>
            </div>

            {listLoading ? <p className="p-6">Maktablar yuklanmoqda…</p> : listError ? <p role="alert" className="p-6 text-red-400">{listError}. Sahifani qayta yuklang.</p> : createdSchools.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-zinc-800/60 text-zinc-400 flex items-center justify-center mx-auto mb-3 text-xl">
                  🏫
                </div>
                <p className="text-sm font-medium text-zinc-300">Hozircha maktablar mavjud emas</p>
                <p className="text-xs text-zinc-500 mt-1">Chapdagi forma orqali birinchi maktabni oching.</p>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-400">"{searchQuery}" so'rovi bo'yicha maktab topilmadi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="text-[11px] uppercase tracking-wider bg-[#18181b] text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Maktab Nomi</th>
                      <th className="px-4 py-3">Tenant ID</th>
                      <th className="px-4 py-3">Holati</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Harakat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredSchools.map((school) => (
                      <tr
                        key={school.id}
                        className="hover:bg-zinc-800/40 transition group cursor-pointer"
                        onClick={() => router.push(`/admin/schools/${school.id}`)}
                      >
                        <td className="px-4 py-4 font-semibold text-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                              {school.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="group-hover:text-indigo-400 transition">{school.name}</span>
                              <span className="block text-[11px] text-zinc-500 font-normal">Izolyatsiyalangan Baza</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">
                              {school.id.length > 14 ? `${school.id.slice(0, 12)}...` : school.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(school.id, e)}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded transition"
                              title="ID dan nusxa olish"
                            >
                              {copiedId === school.id ? "✓" : "📋"}
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Ro‘yxatda
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/admin/schools/${school.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                          >
                            <span>Adminlar ro'yxati</span>
                            <span>→</span>
                          </Link>
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

