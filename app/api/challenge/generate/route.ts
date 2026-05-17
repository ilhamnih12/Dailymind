import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { difficulty, type, count, offset } = await req.json();

    const currentDifficulty = difficulty || "sedang";
    // For infinity modes, process in batches of 5
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
    const aiGames = JSON.parse(response.text);
    
    return NextResponse.json(aiGames);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Gagal membuat pertanyaan" }, { status: 500 });
  }
}
