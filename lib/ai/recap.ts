import "server-only";
import { createAiChatCompletion, getAiClient, getAiModel } from "@/lib/ai/client";
import type { AiFinancialRecap } from "@/lib/ai/data";
import { formatCurrency } from "@/lib/utils";

export function buildDeterministicInsight(recap: AiFinancialRecap) {
  const category = recap.topExpenseCategories[0];
  const direction = recap.net >= 0 ? "masih positif" : "sedang tertekan";
  const base = `Bulan ini arus kas kamu ${direction}: pemasukan ${formatCurrency(recap.totalIncome)} dan pengeluaran ${formatCurrency(recap.totalExpense)}, jadi net ${formatCurrency(recap.net)}.`;

  if (!category) {
    return `${base} Aktivitas tercatat ${recap.transactionCount} transaksi, jadi kamu sudah punya fondasi yang cukup untuk mulai membaca pola harian.`;
  }

  return `${base} Pengeluaran terbesar saat ini ada di kategori ${category.categoryName} sebesar ${formatCurrency(category.total)}, jadi area itu paling layak dipantau lebih dekat beberapa hari ke depan.`;
}

export async function generateRecapNarrative(recap: AiFinancialRecap) {
  const client = getAiClient();

  if (!client) {
    return buildDeterministicInsight(recap);
  }

  try {
    const completion = await createAiChatCompletion(client, {
      model: getAiModel(),
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Kamu menulis insight keuangan sangat singkat dalam Bahasa Indonesia. Tulis 2-3 kalimat, konkret, suportif, tanpa bullet, tanpa membuka dengan sapaan."
        },
        {
          role: "user",
          content: JSON.stringify(recap)
        }
      ]
    });

    const content = (completion as { choices: Array<{ message?: { content?: string | null } }> }).choices[0]?.message?.content?.trim();
    return content || buildDeterministicInsight(recap);
  } catch {
    return buildDeterministicInsight(recap);
  }
}
