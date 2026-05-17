import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastReward = user.lastRewardDate ? new Date(user.lastRewardDate) : null;
    if (lastReward) lastReward.setHours(0, 0, 0, 0);

    if (lastReward && today.getTime() === lastReward.getTime()) {
      return NextResponse.json({ error: "Reward sudah diklaim hari ini" }, { status: 400 });
    }

    const xpEarned = 50;
    const newXp = user.xp + xpEarned;
    const newLevel = Math.floor(newXp / 100) + 1;

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        xp: newXp,
        level: newLevel,
        lastRewardDate: new Date(),
      }
    });

    await prisma.reward.create({
      data: {
        userId: session.userId,
        tipeReward: "Daily Login",
        deskripsi: "Bonus XP masuk harian",
      }
    });

    return NextResponse.json({ success: true, xpEarned, newLevel });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
