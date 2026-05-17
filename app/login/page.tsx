"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
        setTimeout(() => {
          router.push("/");
        }, 500);
    } else {
      setError(signInError.message || "Gagal login");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full items-center justify-center p-5 bg-[#0f172a]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#3b82f6]/20 text-[#3b82f6] rounded-[20px] flex items-center justify-center mb-4">
                <BrainCircuit strokeWidth={2} size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white text-center tracking-tight m-0">DailyMind</h2>
            <p className="text-[0.85rem] text-[#94a3b8] text-center mt-2 m-0">Lanjutkan latihan otakmu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-[0.85rem] text-red-500 bg-red-500/10 rounded-xl border border-dashed border-red-500/50 text-center">{error}</div>}
          <div className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-[rgba(255,255,255,0.05)] text-white placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] transition-colors text-[0.9rem]"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-[rgba(255,255,255,0.05)] text-white placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] transition-colors text-[0.9rem]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white text-[#2563eb] rounded-xl font-bold transition-all disabled:opacity-50 text-[0.9rem]"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-[0.85rem] text-[#64748b]">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#3b82f6] hover:text-white font-semibold transition-colors">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
