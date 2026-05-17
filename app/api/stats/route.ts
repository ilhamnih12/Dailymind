export const dynamic = "force-static";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const histories = await prisma.challengeHistory.findMany({
        where: { userId: session.userId },
        orderBy: { tanggal: 'desc' },
    });

    if (histories.length === 0) {
        return NextResponse.json({
            akurasi: 0,
            rataWaktu: 0,
            totalDimainkan: 0,
            histories: [],
            insight: "Belum ada data. Mulai mainkan tantangan harian!"
        });
    }

    const totalAkurasi = histories.reduce((a, b) => a + b.akurasi, 0);
    const avgAkurasi = totalAkurasi / histories.length;
    const totalWaktu = histories.reduce((a, b) => a + b.rataWaktu, 0);
    const avgWaktu = totalWaktu / histories.length;

    let insight = "Performa stabil, terus pertahankan!";
    if (avgAkurasi > 0.8) insight = "Luar biasa! Tingkat akurasimu sangat tinggi.";
    else if (avgWaktu > 20) insight = "Kamu akurat tapi butuh kecepatan lebih.";
    else if (avgAkurasi < 0.5) insight = "Kemampuan logikamu akan meningkat jika berlatih.";

    return NextResponse.json({
        akurasi: Math.round(avgAkurasi * 100),
        rataWaktu: Math.round(avgWaktu),
        totalDimainkan: histories.length,
        insight,
        histories: histories.slice(0, 10)
    });
  } catch (e) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
