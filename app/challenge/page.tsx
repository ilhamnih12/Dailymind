"use client";
import { GoogleGenAI, Type } from "@google/genai";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Trophy, Target, Zap, Brain, Eye, Calculator, Grid, TrendingUp, Infinity, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";

// Initialize Gemini on the client. Note: Exposing API keys on the client is insecure 
// and only done here at the user's explicit request for Capacitor compatibility.
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyCWQ4FKmWhHqmCeEsbIFX1f5EiWtPX_Glo",
});

const CHALLENGE_TYPES = [
  { id: "logika", title: "Logika Flash", desc: "5 Soal Cepat", icon: <Brain />, mode: "waktu", limit: 5, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" },
  { id: "stroop", title: "Stroop Match", desc: "Endless (Waktu)", icon: <Eye />, mode: "waktu", limit: "infinity", color: "text-[#ec4899]", bg: "bg-[#ec4899]/10" },
  { id: "math", title: "Quick Math", desc: "Endless (Nyawa)", icon: <Calculator />, mode: "nyawa", limit: "infinity", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
  { id: "memory", title: "Visual Memory", desc: "10 Level (Nyawa)", icon: <Grid />, mode: "nyawa", limit: 10, color: "text-[#eab308]", bg: "bg-[#eab308]/10" },
  { id: "pattern", title: "Pola Angka", desc: "5 Soal Angka", icon: <TrendingUp />, mode: "waktu", limit: 5, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" }
];

export default function ChallengePage() {
  const [selectedGame, setSelectedGame] = useState<any>(null);

  if (!selectedGame) {
      return (
          <div className="flex flex-col h-full p-5 bg-[#0f172a] text-[#f8fafc]">
              <h1 className="text-xl font-bold mb-2 tracking-tight">Pilih Mini Game</h1>
              <p className="text-[0.85rem] text-[#94a3b8] mb-6">Latih berbagai area otakmu dengan 5 pilihan game berikut.</p>
              
              <div className="flex flex-col gap-3">
                  {CHALLENGE_TYPES.map(ct => (
                      <button 
                         key={ct.id}
                         onClick={() => setSelectedGame(ct)}
                         className="flex items-center text-left p-4 rounded-2xl bg-[#1e293b] border border-[rgba(255,255,255,0.05)] transition-all hover:bg-[#334155] active:scale-[0.98]"
                      >
                         <div className={`w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center mr-4 ${ct.bg} ${ct.color}`}>
                             {ct.icon}
                         </div>
                         <div className="flex-1">
                             <h3 className="font-bold text-[0.95rem] m-0 mb-0.5">{ct.title}</h3>
                             <p className="text-[#64748b] text-[0.75rem] font-medium m-0">{ct.desc}</p>
                         </div>
                         <div className="flex flex-col gap-1 items-end">
                             {ct.limit === 'infinity' ? 
                                <div className="text-[10px] font-bold text-[#64748b] flex items-center gap-0.5 bg-[#0f172a] px-2 py-1 rounded-md">
                                    <Infinity size={10} /> Endless
                                </div>
                              : <div className="text-[10px] font-bold text-[#64748b] bg-[#0f172a] px-2 py-1 rounded-md">{ct.limit} Lv</div>}
                             
                             <div className={`text-[10px] font-bold flex items-center gap-0.5 bg-[#0f172a] px-2 py-1 rounded-md ${ct.mode === 'waktu' ? 'text-amber-500' : 'text-red-500'}`}>
                                 {ct.mode === 'waktu' ? <Clock size={10} /> : <Heart size={10} />}
                                 {ct.mode === 'waktu' ? 'Waktu' : '3 Nyawa'}
                             </div>
                         </div>
                      </button>
                  ))}
              </div>
          </div>
      )
  }

  return <GameSession gameConfig={selectedGame} onBack={() => setSelectedGame(null)} />;
}

function GameSession({ gameConfig, onBack }: { gameConfig: any, onBack: () => void }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ id: string, benar: boolean, waktu: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(gameConfig.mode === 'waktu' ? 15 : 0);
  const [health, setHealth] = useState(gameConfig.mode === 'nyawa' ? 3 : 0);
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    initGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, []);

  const initGame = async () => {
      setLoading(true);
      const data = await fetchQuestions(0);
      if (data.error || !Array.isArray(data)) {
          onBack();
          return;
      }
      setQuestions(data);
      setLoading(false);
      startLevelTimer(0);
  };

  const fetchQuestions = async (offset: number) => {
      try {
          const type = gameConfig.id;
          const count = gameConfig.limit;
          const currentDifficulty = "sedang";
          const numAiQuestions = count === "infinity" ? 5 : (count || 5);
          const levelMulti = offset || 0; 
          
          let promptDetail = "";
          let schemaProperties: Record<string, any> = {
              id: { type: Type.STRING },
              tipeData: { type: Type.STRING },
              tipe: { type: Type.STRING },
              pertanyaan: { type: Type.STRING },
          };
          let requiredFields = ["id", "tipeData", "tipe", "pertanyaan"];

          if (type === "math") {
              promptDetail = `Buatkan ${numAiQuestions} soal Quick Math (matematika cepat). Semakin tinggi level (sekarang offset ${levelMulti}), semakin sulit kombinasinya (bisa pakai perkalian, pembagian, campuran).
      Tipe data harus "math", tipe "Quick Math". Harus ada "opsi" (4 string) dan "jawabanBenar". Sertakan "penjelasan".`;
              schemaProperties.opsi = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.jawabanBenar = { type: Type.STRING };
              schemaProperties.penjelasan = { type: Type.STRING };
              requiredFields.push("opsi", "jawabanBenar", "penjelasan");
          } else if (type === "stroop") {
              promptDetail = `Buatkan ${numAiQuestions} soal Stroop Match. 
      Soal Stroop Match adalah menebak warna 'TINTA' asli dari sebuah kata, di mana katanya merupakan nama warna lain. 
      Misal: teks kata adalah "Kuning", tapi warna hex teks (tinta) adalah merah "#ef4444". Jawaban yang benar adalah "Merah".
      Gunakan warna-warna bervariasi.
      Tipe data "stroop", tipe "Stroop Match". Harus ada "teks" (kata), "warnaTeks" (hex bebas atau rgb bebas), "opsi" (4 nama warna), "jawabanBenar" (nama warna sesuai warnaTeks).`;
              schemaProperties.teks = { type: Type.STRING };
              schemaProperties.warnaTeks = { type: Type.STRING };
              schemaProperties.opsi = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.jawabanBenar = { type: Type.STRING };
              requiredFields.push("teks", "warnaTeks", "opsi", "jawabanBenar");
          } else if (type === "memory") {
              promptDetail = `Buatkan ${numAiQuestions} soal Visual Memory.
      Grid berukuran 9 kotak (0 sampai 8). Tentukan array angka unik sebagai index kotak biru (misal [1,4,7]). Jumlah kotak biru bergantung offset ${levelMulti} (misal rata-rata ${Math.min(3 + levelMulti, 8)} kotak).
      Tipe data "memory_grid", tipe "Visual Memory". Harus ada "gridSize" (integer, isi 9), "activeIndexes" (array of integer), "jawabanBenar" (string gabungan array angka berurutan dipisah koma).`;
              schemaProperties.gridSize = { type: Type.INTEGER };
              schemaProperties.activeIndexes = { type: Type.ARRAY, items: { type: Type.INTEGER } };
              schemaProperties.jawabanBenar = { type: Type.STRING };
              requiredFields.push("gridSize", "activeIndexes", "jawabanBenar");
          } else if (type === "pattern") {
              promptDetail = `Buatkan ${numAiQuestions} soal Pola Angka atau Deret. Kesulitan: ${currentDifficulty}.
      Tipe data "pattern", tipe "Pola Angka". Harus ada "opsi" (4 pilihan, string), dan "jawabanBenar" (string), serta "penjelasan".`;
              schemaProperties.opsi = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.jawabanBenar = { type: Type.STRING };
              schemaProperties.penjelasan = { type: Type.STRING };
              requiredFields.push("opsi", "jawabanBenar", "penjelasan");
          } else {
              promptDetail = `Buatkan ${numAiQuestions} soal Logika Analitik dan Teka-teki. Kesulitan: ${currentDifficulty}.
      Tipe data "logika", tipe "Logika Flash". Harus ada "opsi" (4 pilihan, string), dan "jawabanBenar" (string), serta "penjelasan".`;
              schemaProperties.opsi = { type: Type.ARRAY, items: { type: Type.STRING } };
              schemaProperties.jawabanBenar = { type: Type.STRING };
              schemaProperties.penjelasan = { type: Type.STRING };
              requiredFields.push("opsi", "jawabanBenar", "penjelasan");
          }

          let response;
          let maxRetries = 2;

          for (let i = 0; i <= maxRetries; i++) {
             try {
                response = await ai.models.generateContent({
                   model: i === 0 ? "gemini-3-flash-preview" : "gemini-2.5-flash",
                   contents: promptDetail,
                   config: {
                      responseMimeType: "application/json",
                      responseSchema: {
                         type: Type.ARRAY,
                         items: {
                            type: Type.OBJECT,
                            properties: schemaProperties,
                            required: requiredFields,
                         }
                      }
                   }
                });
                break;
             } catch (err: any) {
                if (i === maxRetries) throw err;
                await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1))); 
             }
          }

          if (!response || !response.text) throw new Error("Gagal menggenerate respon");
          return JSON.parse(response.text);
      } catch (err) {
          console.error("Generate error:", err);
          return { error: true };
      }
  };

  const startLevelTimer = (idx: number) => {
    if (gameConfig.mode === 'waktu') {
       setTimeLeft(Math.max(15 - Math.floor(idx / 2), 3));
    }
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (gameConfig.mode === 'waktu') {
       timerRef.current = setInterval(() => {
         setTimeLeft((prev) => {
           if (prev <= 1) {
             clearInterval(timerRef.current!);
             handleTimeout();
             return 0;
           }
           return prev - 1;
         });
       }, 1000);
    }
  };

  const handleTimeout = () => {
     handleAnswer(""); 
  };

  const handleAnswer = (jawaban: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const currentQ = questions[currentIndex];
    
    // Safety check in case questions array isn't populated
    if (!currentQ) return;

    const isBenar = jawaban === currentQ.jawabanBenar;
    
    const newAnswers = [...answers, { id: currentQ.id || Date.now().toString(), benar: isBenar, waktu: timeTaken }];
    setAnswers(newAnswers);

    let currentHealth = health;
    if (gameConfig.mode === 'nyawa' && !isBenar) {
        currentHealth -= 1;
        setHealth(currentHealth);
    }

    const limitConfig = gameConfig.limit;
    const isLimitReached = limitConfig !== 'infinity' && (currentIndex + 1) >= limitConfig;
    const isDead = gameConfig.mode === 'nyawa' && currentHealth <= 0;
    const isEndlessTimeFail = gameConfig.mode === 'waktu' && limitConfig === 'infinity' && !isBenar;

    if (isLimitReached || isDead || isEndlessTimeFail) {
        finishChallenge(newAnswers);
    } else {
        if (limitConfig === 'infinity' || currentIndex < questions.length - 1) {
            const nextIndex = currentIndex + 1;
            
            if (limitConfig === 'infinity' && nextIndex >= questions.length - 2) {
                // Fetch more questions in background
                fetchQuestions(Math.floor(nextIndex/5) + 1).then(more => {
                   if(Array.isArray(more)) setQuestions(prev => [...prev, ...more]);
                });
            }

            // Only proceed if next question is ready, otherwise we might need a small intermediate loading
            // But since we fetch at length - 2, we usually have it ready. 
            // In case we don't (very fast answer), it will just wait since we don't have next question.
            // Let's implement a safe next loop:
            if (questions[nextIndex]) {
                setCurrentIndex(nextIndex);
                startLevelTimer(nextIndex);
            } else {
                 // Force wait (rare edge case if AI is slower than 3 questions)
                 setLoading(true);
                 fetchQuestions(Math.floor(nextIndex/5) + 1).then(more => {
                     setLoading(false);
                     if(Array.isArray(more) && more.length > 0) {
                         setQuestions(prev => [...prev, ...more]);
                         setCurrentIndex(nextIndex);
                         startLevelTimer(nextIndex);
                     } else {
                         finishChallenge(newAnswers);
                     }
                 });
            }
        } else {
            finishChallenge(newAnswers);
        }
    }
  };

  const finishChallenge = async (finalAnswers: any[]) => {
    setIsFinished(true);
    setSubmitting(true);
    
    const totalBenar = finalAnswers.filter(a => a.benar).length;
    let akurasi = 0;
    if (finalAnswers.length > 0) {
       akurasi = totalBenar / finalAnswers.length;
    }
    
    let rataWaktu = 0;
    if (finalAnswers.length > 0) {
       rataWaktu = finalAnswers.reduce((a,b) => a + b.waktu, 0) / finalAnswers.length;
    }

    let skor = Math.round(akurasi * 100);
    if (gameConfig.limit === 'infinity') {
       skor = totalBenar * 10;
       akurasi = 1;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           const { data: profile } = await supabase.from('profiles').select('xp, level, brainscore, streak, lastchallengedate').eq('id', session.user.id).single();
           
           if (profile) {
              const newXp = profile.xp + (totalBenar * 10);
              const newBrainScore = profile.brainscore + Math.floor(akurasi * 5);
              const newLevel = Math.floor(newXp / 100) + 1;
              
              let newStreak = profile.streak || 0;
              const now = new Date();
              if (profile.lastchallengedate) {
                  const lastDate = new Date(profile.lastchallengedate);
                  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
                  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  const diffTime = currentDay.getTime() - lastDay.getTime();
                  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
                  
                  if (diffDays === 1) {
                      newStreak += 1;
                  } else if (diffDays > 1) {
                      newStreak = 1;
                  }
              } else {
                  newStreak = 1;
              }
              
              await supabase.from('profiles').update({
                  xp: newXp,
                  level: newLevel,
                  brainscore: newBrainScore,
                  streak: newStreak,
                  lastchallengedate: now.toISOString()
              }).eq('id', session.user.id);
              
              await supabase.from('challenge_history').insert([{
                 user_id: session.user.id,
                 tipe: gameConfig.id,
                 skor: skor,
                 akurasi: akurasi,
                 waktu: rataWaktu
              }]);
           }
        }
        
        setResultData({ skor, akurasi, totalBenar, totalSoal: finalAnswers.length, xpEarned: totalBenar * 10 });
        
        if (totalBenar >= 3 || (gameConfig.limit === 'infinity' && totalBenar > 0)) {
           confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    } catch(e) {
        console.error(e);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex h-full flex-col items-center justify-center text-center space-y-4 bg-[#0f172a]">
        <div className="w-10 h-10 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[0.85rem] text-[#94a3b8] font-medium animate-pulse">Menyiapkan mini game...</p>
    </div>
  );

  if (isFinished) {
    return (
        <div className="flex flex-col h-full p-5 items-center justify-center text-center bg-[#0f172a]">
            {submitting ? (
                <div className="w-10 h-10 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="card p-6 w-full relative overflow-hidden bg-[#1e293b] border border-[rgba(255,255,255,0.05)] rounded-2xl"
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"></div>
                    <div className="mx-auto w-16 h-16 bg-[#3b82f6]/10 text-[#3b82f6] rounded-full flex items-center justify-center mb-4">
                        <Trophy size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 m-0">Permainan Selesai</h2>
                    <p className="text-[0.85rem] text-[#94a3b8] font-medium mb-6 m-0">Skor dicatat untuk {gameConfig.title}!</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#334155]">
                             <Target className="w-5 h-5 text-[#3b82f6] mx-auto mb-2" />
                             <div className="text-xl font-bold text-white mb-1">
                                {gameConfig.limit === 'infinity' ? resultData?.totalBenar : `${resultData?.totalBenar}/${resultData?.totalSoal}`}
                             </div>
                             <div className="text-[0.65rem] uppercase tracking-wider text-[#64748b] font-bold">Benar</div>
                        </div>
                        <div className="bg-[#0f172a] rounded-2xl p-4 border border-[#334155]">
                             <Zap className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                             <div className="text-xl font-bold text-white mb-1">+{resultData?.xpEarned || 0}</div>
                             <div className="text-[0.65rem] uppercase tracking-wider text-[#64748b] font-bold">XP</div>
                        </div>
                    </div>

                    <button 
                        onClick={() => router.push("/")}
                        className="btn-primary mb-2 w-full"
                    >
                        Kembali ke Home
                    </button>
                    <button 
                        onClick={onBack}
                        className="w-full py-3 text-sm text-[#94a3b8] hover:text-white transition-colors"
                    >
                        Ganti Game
                    </button>
                </motion.div>
            )}
        </div>
    )
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col h-full p-5 pb-10 bg-[#0f172a]">
        <header className="flex flex-col gap-4 mb-8">
             <div className="flex justify-between items-center w-full">
               <span className="text-[0.75rem] font-bold tracking-wider text-[#94a3b8] uppercase">
                 {gameConfig.limit === 'infinity' ? `Level ${currentIndex + 1}` : `Soal ${currentIndex + 1}/${gameConfig.limit}`}
               </span>
               <div className="flex items-center gap-1.5 bg-[#1e293b] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.05)] text-[#f8fafc] text-sm font-bold">
                   {gameConfig.mode === 'waktu' ? (
                       <>
                           <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500' : 'text-amber-500'}`} />
                           <span className={timeLeft <= 5 ? 'text-red-500' : ''}>00:{timeLeft.toString().padStart(2, '0')}</span>
                       </>
                   ) : (
                       <div className="flex gap-1 text-red-500 items-center">
                           {Array.from({ length: 3 }).map((_, i) => (
                               <Heart key={i} size={14} fill={i < health ? "currentColor" : "transparent"} />
                           ))}
                       </div>
                   )}
               </div>
             </div>
             
             {gameConfig.limit !== 'infinity' && (
                <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                   <div className="h-full bg-[#3b82f6] transition-all duration-300" style={{ width: `${((currentIndex) / gameConfig.limit) * 100}%` }}></div>
                </div>
             )}
        </header>

        <AnimatePresence mode="wait">
             <motion.div 
                 key={currentIndex}
                 initial={{ x: 20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: -20, opacity: 0 }}
                 className="flex-1 flex flex-col"
             >
                 <div className="inline-block px-2.5 py-1 bg-[#3b82f6]/10 text-[#3b82f6] font-bold text-[0.7rem] rounded-md uppercase tracking-wider mb-4 w-max">
                     {currentQ?.tipe}
                 </div>
                 <h2 className="text-[1.25rem] font-bold text-white mb-8 leading-snug">
                     {currentQ?.pertanyaan}
                 </h2>
                 
                 {currentQ?.tipeData === 'stroop' && (
                     <div className="flex-1 flex items-center justify-center mb-8 bg-[#1e293b] rounded-2xl py-8 border border-[rgba(255,255,255,0.05)]">
                         <div 
                            className="text-5xl font-black uppercase tracking-widest"
                            style={{ color: currentQ.warnaTeks }}
                         >
                            {currentQ.teks}
                         </div>
                     </div>
                 )}

                 {currentQ?.tipeData === 'memory_grid' ? (
                     <MemoryGridGame q={currentQ} onComplete={handleAnswer} />
                 ) : (
                     <div className="space-y-3 mt-auto">
                         {currentQ?.opsi?.map((opsi: string, i: number) => (
                             <button
                                 key={i}
                                 onClick={() => handleAnswer(opsi)}
                                 className="w-full text-left p-4 rounded-[16px] bg-[#1e293b] hover:bg-[#334155] border border-[rgba(255,255,255,0.05)] text-[#f8fafc] font-medium transition-colors text-[0.95rem] flex items-center"
                             >
                                 <div className="w-6 h-6 rounded-md bg-[#0f172a] text-[#64748b] flex items-center justify-center text-[0.7rem] font-bold mr-3 shrink-0">
                                   {String.fromCharCode(65 + i)}
                                 </div>
                                 {opsi}
                             </button>
                         ))}
                     </div>
                 )}
             </motion.div>
        </AnimatePresence>
    </div>
  );
}

function MemoryGridGame({ q, onComplete }: { q: any, onComplete: (ans: string) => void }) {
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
     setPhase('memorize');
     setSelected([]);
     const t = setTimeout(() => {
        setPhase('recall');
     }, 3000);
     return () => clearTimeout(t);
  }, [q]);

  const handleTileClick = (idx: number) => {
      if (phase !== 'recall') return;
      
      const newSelected = selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx];
      setSelected(newSelected);

      if (newSelected.length === q.activeIndexes.length) {
          onComplete(newSelected.sort((a,b)=>a-b).join(','));
      }
  };

  return (
      <div className="mt-auto flex flex-col items-center">
          <div className="mb-4 text-sm font-bold text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl">
              {phase === 'memorize' ? 'Hafalkan pola ini!' : `Pilih ${q.activeIndexes.length} kotak`}
          </div>
          <div className="grid grid-cols-3 gap-2 w-full max-w-[250px] mx-auto aspect-square">
             {Array.from({ length: q.gridSize }).map((_, i) => {
                 const isTarget = q.activeIndexes.includes(i);
                 const isSelected = selected.includes(i);
                 
                 let bg = "bg-[#1e293b] border-[#334155]";
                 if (phase === 'memorize' && isTarget) bg = "bg-[#3b82f6] border-[#2563eb]";
                 if (phase === 'recall' && isSelected) bg = "bg-amber-500 border-amber-600";

                 return (
                     <button
                        key={i}
                        onClick={() => handleTileClick(i)}
                        className={`w-full h-full rounded-xl border-b-4 transition-all ${bg}`}
                     />
                 )
             })}
          </div>
      </div>
  );
}
