import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
         id: true, email: true, xp: true, level: true, streak: true, brainScore: true, createdAt: true, lastRewardDate: true,
         rewards: { orderBy: { tanggalDidapat: 'desc' }, take: 5 },
         histories: { orderBy: { tanggal: 'desc' }, take: 10 }
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
