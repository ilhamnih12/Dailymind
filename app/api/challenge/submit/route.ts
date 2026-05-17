import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { akurasi, rataWaktu, skor } = await req.json();
    const userId = session.userId;

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { _count: { select: { histories: true } } }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const historyCount = user._count.histories;
    const xpEarned = Math.round(skor / 2 + (akurasi * 50) + (Math.max(0, 30 - rataWaktu) * 2));
    
    let newDifficulty = "sedang";
    if (akurasi > 0.8 && rataWaktu < 15) newDifficulty = "sulit";
    else if (akurasi < 0.4) newDifficulty = "mudah";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastChallenge = user.lastChallengeDate ? new Date(user.lastChallengeDate) : null;
    if (lastChallenge) lastChallenge.setHours(0, 0, 0, 0);

    let newStreak = user.streak;
    let gotMysteryBox = false;

    if (!lastChallenge || today.getTime() > lastChallenge.getTime()) {
      if (lastChallenge && today.getTime() - lastChallenge.getTime() === 86400000) {
        newStreak += 1;
      } else if (!lastChallenge) {
         newStreak = 1;
      } else {
        newStreak = 1;
      }

      if (newStreak > 0 && newStreak % 3 === 0) {
        gotMysteryBox = true;
        await prisma.reward.create({
            data: {
                userId,
                tipeReward: "Mystery Box",
                deskripsi: `Bonus kotak misteri hari ke-${newStreak}`
            }
        });
      }
    }

    const newXp = user.xp + xpEarned;
    const newLevel = Math.floor(newXp / 100) + 1;
    let newBrainScore = user.brainScore;
    if (user.brainScore === 0) {
       newBrainScore = Math.round(akurasi * 100);
    } else {
       newBrainScore = Math.min(100, Math.round(((user.brainScore * historyCount) + (akurasi * 100)) / (historyCount + 1)));
    }

    await prisma.challengeHistory.create({
      data: { userId, skor, akurasi, rataWaktu, difficulty: newDifficulty, xpEarned }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel, streak: newStreak, brainScore: newBrainScore, lastChallengeDate: new Date() }
    });

    return NextResponse.json({ xpEarned, newLevel, newStreak, gotMysteryBox });
  } catch (error: any) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
