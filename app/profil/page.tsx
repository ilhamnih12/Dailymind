"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Profil() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
         if (data.error) router.push("/login");
         else setUser(data);
      });
  }, [router]);

  const handleLogout = async () => {
     await fetch("/api/auth/logout", { method: "POST" });
     router.push("/login");
  };

  if (!user) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-700 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full p-5 bg-[#0f172a] text-[#f8fafc]">
        <h1 className="text-xl font-bold mb-6 m-0">Profil</h1>

        <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#3b82f6] to-[#2563eb] rounded-[24px] flex items-center justify-center text-white mb-4 shadow-[0_10px_15px_-3px_rgba(59,130,246,0.3)]">
                <UserIcon size={32} />
            </div>
            <h2 className="text-[1.1rem] font-bold text-white m-0">{user.email}</h2>
            <div className="mt-2 text-[#94a3b8] text-[0.8rem] font-medium">
                Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID')}
            </div>
        </div>

        <div className="card p-4 mb-5">
            <h3 className="text-[0.75rem] font-bold text-[#94a3b8] mb-4 uppercase tracking-wider m-0">Pencapaian</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[#f8fafc] font-medium text-[0.9rem]">Level Saat Ini</span>
                    <span className="bg-[#1e293b] border border-[rgba(255,255,255,0.05)] px-3 py-1 rounded-xl text-[#3b82f6] font-bold text-[0.9rem] shadow-sm">{user.level}</span>
                </div>
                <div className="h-px bg-[#1e293b]"></div>
                <div className="flex items-center justify-between">
                    <span className="text-[#f8fafc] font-medium text-[0.9rem]">
                       Skor Otak Maks
                    </span>
                    <span className="bg-[#1e293b] border border-[rgba(255,255,255,0.05)] px-3 py-1 rounded-xl text-amber-500 font-bold text-[0.9rem] shadow-sm">{Math.max(user.brainScore, 0)}</span>
                </div>
            </div>
        </div>

        <button 
           onClick={handleLogout}
           className="mt-auto mb-6 flex items-center justify-center gap-2 w-full py-3.5 bg-[#1e293b] hover:bg-[#334155] text-red-400 font-semibold rounded-xl transition-colors border border-[rgba(255,255,255,0.05)] text-[0.9rem]"
        >
            <LogOut size={18} />
            Keluar akun
        </button>
    </div>
  );
}
