"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  db_connection_string?: string;
}

export default function ManageSchoolPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
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
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!schoolRes.ok) throw new Error("Maktab ma'lumotlarini yuklab bo'lmadi");
        const schoolData = await schoolRes.json();
        setSchool(schoolData);

        // 2. Fetch Admins list
        const adminsRes = await fetch(`${API_URL}/api/admin/schools/${schoolId}/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!adminsRes.ok) throw new Error("Administratorlar ro'yxatini yuklab bo'lmadi");
        const adminsData = await adminsRes.json();
        setAdmins(Array.isArray(adminsData) ? adminsData : []);
      } catch (err: any) {
        setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi.");
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
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      password,
    };

    try {
      const response = await fetch(`${API_URL}/api/admin/schools/${schoolId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Administrator qo'shishda xatolik yuz berdi");
      }

      setSuccess(`Admin ${firstName} ${lastName} muvaffaqiyatli ro'yxatga olindi.`);
      setAdmins((prev) => [data, ...prev]);

      // Reset form
      setFirstName("");
      setLastName("");
      setMiddleName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Administrator yaratishda kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    const q = searchQuery.toLowerCase();
    return admins.filter((a) => {
      const fullName = `${a.first_name || ""} ${a.last_name || ""} ${a.middle_name || ""}`.toLowerCase();
      const phoneNum = (a.phone || "").toLowerCase();
      const emailAddr = (a.email || "").toLowerCase();
      return fullName.includes(q) || phoneNum.includes(q) || emailAddr.includes(q);
    });
  }, [admins, searchQuery]);

  const getInitials = (first: string, last: string) => {
    const f = first ? first.charAt(0).toUpperCase() : "";
    const l = last ? last.charAt(0).toUpperCase() : "";
    return `${f}${l}` || "AD";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Noma'lum";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (fetching) {
    return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-zinc-400">Maktab ma'lumotlari va adminlar yuklanmoqda...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg transition"
            >
              <span>←</span>
              <span>Boshqaruv paneli</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-medium text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
              {school?.name || "Maktab"}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <span>+</span>
            <span>Yangi Admin Qo'shish</span>
          </button>
        </div>
      </header>

      {/* School Header Banner */}
      <section className="border-b border-zinc-800/60 bg-gradient-to-b from-indigo-950/25 via-zinc-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 text-xs font-medium">
                <span>🏫</span>
                <span>Maktab Ma'lumotlari</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {school ? school.name : "Maktab Tafsilotlari"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span className="font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-300 flex items-center gap-2">
                  <span>Tenant ID:</span>
                  <span className="text-indigo-400">{schoolId}</span>
                  <button
                    onClick={() => copyToClipboard(schoolId, "tenant_id")}
                    className="hover:text-white transition text-[11px] p-0.5 rounded"
                    title="Nusxa olish"
                  >
                    {copiedText === "tenant_id" ? "✓" : "📋"}
                  </button>
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  PostgreSQL Baza Ulangan
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 min-w-[130px] text-center backdrop-blur-sm">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Faol Adminlar
                </span>
                <span className="text-2xl font-black text-indigo-400 mt-1 block">
                  {admins.length}
                </span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 min-w-[130px] text-center backdrop-blur-sm">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Baza Turi
                </span>
                <span className="text-sm font-bold text-emerald-400 mt-2 block">
                  Izolyatsiyalangan
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs p-4 rounded-xl mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-white ml-3">✕</button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs p-4 rounded-xl mb-6 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-white ml-3">✕</button>
          </div>
        )}

        {/* Section Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>Faol Administratorlar Ro'yxati</span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                {filteredAdmins.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ushbu maktab tizimiga kirish huquqiga ega bo'lgan mas'ul shaxslar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Ism, telefon yoki email bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Admins Grid / Cards */}
        {admins.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl mx-auto mb-4">
              👤
            </div>
            <h3 className="text-base font-bold text-zinc-200">Hozircha adminlar biriktirilmagan</h3>
            <p className="text-xs text-zinc-400 mt-1 mb-6 leading-relaxed">
              Ushbu maktab uchun hali birorta administrator belgilanmagan. Maktab faoliyatini boshlash uchun birinchi adminni qo'shing.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <span>+</span>
              <span>Birinchi Adminni Qo'shish</span>
            </button>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-sm font-medium text-zinc-300">"{searchQuery}" bo'yicha administrator topilmadi.</p>
            <p className="text-xs text-zinc-500 mt-1">Qidiruv so'zini o'zgartirib ko'ring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAdmins.map((admin) => {
              const fullName = `${admin.first_name} ${admin.last_name}`;
              return (
                <div
                  key={admin.id}
                  className="bg-zinc-900/60 border border-zinc-800/90 hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-md transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
                          {getInitials(admin.first_name, admin.last_name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-100 text-sm group-hover:text-indigo-300 transition">
                            {fullName}
                          </h3>
                          {admin.middle_name && (
                            <p className="text-xs text-zinc-400 font-normal">
                              {admin.middle_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Faol Admin
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-black/30 border border-zinc-800/60 rounded-xl p-3 space-y-2 text-xs">
                      {/* Phone */}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-1.5">
                          <span>📞</span>
                          <span>Telefon:</span>
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <a
                            href={`tel:${admin.phone}`}
                            className="text-zinc-200 hover:text-indigo-400 transition"
                          >
                            {admin.phone}
                          </a>
                          <button
                            onClick={() => copyToClipboard(admin.phone, `phone_${admin.id}`)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                            title="Nusxa olish"
                          >
                            {copiedText === `phone_${admin.id}` ? "✓" : "📋"}
                          </button>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-1.5">
                          <span>✉️</span>
                          <span>Email:</span>
                        </span>
                        {admin.email ? (
                          <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                            <a
                              href={`mailto:${admin.email}`}
                              className="text-zinc-200 hover:text-indigo-400 transition truncate text-xs"
                            >
                              {admin.email}
                            </a>
                            <button
                              onClick={() => copyToClipboard(admin.email!, `email_${admin.id}`)}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 p-0.5 rounded shrink-0"
                              title="Nusxa olish"
                            >
                              {copiedText === `email_${admin.id}` ? "✓" : "📋"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600 italic">Kiritilmagan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Biriktirilgan:</span>
                    <span className="font-medium text-zinc-400">{formatDate(admin.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121215] border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Yangi Maktab Adminini Biriktirish</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ushbu foydalanuvchi maktabning ichki tizimiga kirish huquqiga ega bo'ladi.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ism <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Masalan: Sardor"
                    className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Familiya <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Masalan: Alimov"
                    className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Otasining ismi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Masalan: Rustamovich"
                  className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Telefon Raqami <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Email (ixtiyoriy)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@maktab.uz"
                    className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Parol <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin uchun ishonchli parol"
                  className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Ro'yxatga olinmoqda..." : "Adminni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
