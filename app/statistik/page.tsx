"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Clock, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

export default function Statistik() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) return;
       
       const { data: histories } = await supabase
           .from('challenge_history')
           .select('*')
           .eq('user_id', session.user.id)
           .order('tanggal', { ascending: false })
           .limit(10);
           
       if (histories && histories.length > 0) {
           const avgAkurasi = histories.reduce((acc, curr) => acc + curr.akurasi, 0) / histories.length;
           const avgWaktu = histories.reduce((acc, curr) => acc + curr.waktu, 0) / histories.length;
           
           const chartData = histories.map((h: any, i: number) => ({
                name: `T${histories.length - i}`,
                Skor: h.skor
           })).reverse();
           
           setStats({
               akurasi: Math.round(avgAkurasi * 100),
               rataWaktu: avgWaktu.toFixed(1),
               totalDimainkan: histories.length,
               insight: "Bermain lebih rajin meningkatkan performa",
               chartData
           });
       } else {
           setStats({ akurasi: 0, rataWaktu: 0, totalDimainkan: 0, insight: "Ayo mulai tantangan pertamamu!", chartData: [] });
       }
       setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return (
     <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-white rounded-full animate-spin" />
     </div>
  );

  return (
    <div className="flex flex-col h-full p-5 bg-[#0f172a] text-[#f8fafc] pb-10">
        <h1 className="text-xl font-bold mb-6 m-0">Statistik</h1>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
            <StatsCard 
               icon={<Target strokeWidth={2.5} className="w-5 h-5 text-[#3b82f6]" />}
               title="Akurasi"
               value={`${stats?.akurasi ?? 0}%`}
               color="bg-[#3b82f6]/10"
            />
            <StatsCard 
               icon={<Clock strokeWidth={2.5} className="w-5 h-5 text-amber-500" />}
               title="Rata-rata Waktu"
               value={`${stats?.rataWaktu ?? 0}s`}
               color="bg-amber-500/10"
            />
            <StatsCard 
               icon={<Activity strokeWidth={2.5} className="w-5 h-5 text-emerald-500" />}
               title="Total Sesi"
               value={stats?.totalDimainkan ?? 0}
               color="bg-emerald-500/10"
            />
            <div className="card p-4 flex flex-col justify-center items-center text-center">
                 <TrendingUp className="text-[#3b82f6] w-6 h-6 mb-2" />
                 <span className="text-[0.7rem] font-medium text-[#94a3b8] leading-snug">{stats?.insight}</span>
            </div>
        </div>

        <h3 className="text-[0.9rem] font-bold text-white mb-3 m-0">Grafik Performa Terakhir</h3>
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-56 card p-4 pt-6 pb-2 pl-0"
        >
             {stats?.chartData && stats.chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                        />
                        <Line type="monotone" dataKey="Skor" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                 </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-[0.8rem] text-[#64748b] font-medium">Belum cukup data...</div>
             )}
        </motion.div>
    </div>
  );
}

function StatsCard({ icon, title, value, color }: any) {
    return (
        <motion.div 
           initial={{ scale: 0.95, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="card p-4 flex flex-col justify-between"
        >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <div>
              <div className="text-[0.7rem] font-bold text-[#94a3b8] mb-0.5">{title}</div>
              <div className="text-[1.25rem] font-bold text-[#f8fafc]">{value}</div>
            </div>
        </motion.div>
    )
}
