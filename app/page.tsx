"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Brain } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // Just empty user or error
      }
      
      if (!data) {
        // create profile if not exists
        const { data: newData } = await supabase.from('profiles').insert([
          { id: session.user.id, email: session.user.email, xp: 0, level: 1, streak: 0, brainscore: 0 }
        ]).select().single();
        setUser(newData);
      } else {
        setUser(data);
      }
      
      setLoading(false);
    };
    
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const xpProgress = user ? (user.xp % 100) : 0;
  const daysToMystery = 3 - ((user?.streak || 0) % 3);

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      // Simulate claim via Supabase update
      const { data } = await supabase
        .from('profiles')
        .update({ 
          xp: user.xp + 50, 
          lastrewarddate: new Date().toISOString() 
        })
        .eq('id', user.id)
        .select()
        .single();
        
      if (data) setUser(data);
    } catch {}
    setClaiming(false);
  };

  const hasClaimedDaily = Boolean(
    user?.lastrewarddate && new Date(user.lastrewarddate).toDateString() === new Date().toDateString()
  );

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-[#f8fafc]">
      <header className="p-5 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold m-0 tracking-tight">DailyMind</h1>
        <div className="bg-[#1e293b] rounded-xl px-2.5 py-1 flex items-center gap-2">
          <div className="w-5 h-5 bg-[#3b82f6] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {user?.level || 1}
          </div>
          <span className="text-xs font-semibold">Level Pemula</span>
        </div>
      </header>

      <div className="flex-1 px-5 space-y-4 pb-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-card p-5 rounded-[20px]"
        >
          <h2 className="m-0 mb-1 text-[1.1rem] font-bold tracking-tight">Tantangan Hari Ini</h2>
          <p className="m-0 mb-4 text-[0.85rem] opacity-90 leading-snug">
            Latih logika dan kecepatan analisismu dengan 5 soal atau game hari ini.
          </p>
          <div className="flex gap-2">
            <button 
               onClick={() => router.push('/challenge')}
               className="btn-primary flex-1"
            >
              Mulai Challenge
            </button>
            {!hasClaimedDaily && (
              <button 
                onClick={handleClaimReward}
                disabled={claiming}
                className="bg-amber-500 text-white font-bold rounded-xl px-4 text-[0.9rem] disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                {claiming ? "..." : "🎁 Klaim XP"}
              </button>
            )}
          </div>
        </motion.div>

        <section className="grid grid-cols-2 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4 flex flex-col gap-2"
          >
            <span className="stat-label">Streak</span>
            <div className="flex items-center">
                <Flame className="w-5 h-5 text-orange-500 mr-1" />
                <span className="stat-value leading-none">{user?.streak || 0} Hr</span>
            </div>
            <div className="bg-amber-500/10 border border-dashed border-amber-500 text-amber-500 p-2 rounded-xl text-[0.7rem] text-center font-medium mt-1">
               +{daysToMystery} hari ke Mystery Box
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-4 flex flex-col gap-2 justify-between"
          >
            <span className="stat-label">Brain Score</span>
            <div className="flex items-center justify-between">
              <span className="stat-value leading-none">{user?.brainscore || 0}</span>
              <div className="w-12 h-12 border-4 border-[#3b82f6] rounded-full flex items-center justify-center font-bold text-[0.9rem]">
                 {user?.brainscore || 0}
              </div>
            </div>
          </motion.div>
        </section>

        <motion.div 
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="card p-4"
        >
          <div className="flex justify-between items-end mb-2">
            <div>
               <span className="stat-label">Progres XP</span>
               <div className="text-[1rem] font-bold mt-1 text-[#f8fafc]">
                 {user?.xp || 0} / {((user?.level || 1) * 100)} XP
               </div>
            </div>
            <span className="text-[12px] text-[#64748b] font-medium">{xpProgress}%</span>
          </div>
          <div className="progress-bar">
             <div className="progress-fill" style={{ width: `${xpProgress}%` }}></div>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
           className="card p-4 flex gap-4 items-center"
        >
          <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl">
             📊
          </div>
          <div>
            <h3 className="m-0 text-[0.9rem] font-bold">Insight Mingguan</h3>
            <p className="m-0 mt-1 text-[0.75rem] text-[#94a3b8] leading-snug">
               Kemampuan logika kamu meningkat 12% minggu ini!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
