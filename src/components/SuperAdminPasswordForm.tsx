"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { clearSuperAuth } from "@/lib/api";

export default function SuperAdminPasswordForm() {
  const router = useRouter();
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  return <form className="mt-6 border-t border-zinc-800 pt-6 space-y-3" onSubmit={async e => {
    e.preventDefault();
    if (busy.current) return;
    if (newPassword !== confirmation) { setMessage("Yangi parollar mos emas"); return; }
    if ([...newPassword].length < 12 || new TextEncoder().encode(newPassword).length > 72) { setMessage("Parol kamida 12 belgi va ko‘pi bilan 72 bayt bo‘lsin"); return; }
    busy.current = true; setLoading(true); setMessage("");
    try {
      await api.post("/api/admin/settings/change-password", { old_password: oldPassword, new_password: newPassword });
      clearSuperAuth();
      router.replace("/admin/login");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Parol o‘zgarmadi"); }
    finally { busy.current = false; setLoading(false); }
  }}>
    <h3 className="font-semibold">Parolni almashtirish</h3>
    <p className="text-xs text-zinc-400">Muvaffaqiyatli almashgach barcha qurilmalarda qayta kirish kerak bo‘ladi.</p>
    {message && <p role="alert" className="text-red-400 text-sm">{message}</p>}
    <label className="block text-sm">Amaldagi parol<input className="block w-full bg-zinc-900 rounded p-2" type="password" autoComplete="current-password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} /></label>
    <label className="block text-sm">Yangi parol<input className="block w-full bg-zinc-900 rounded p-2" type="password" autoComplete="new-password" required minLength={12} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
    <label className="block text-sm">Yangi parolni takrorlang<input className="block w-full bg-zinc-900 rounded p-2" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
    <button className="rounded bg-indigo-600 px-4 py-2 disabled:opacity-50" disabled={loading}>{loading ? "Saqlanmoqda…" : "Parolni yangilash"}</button>
  </form>;
}
