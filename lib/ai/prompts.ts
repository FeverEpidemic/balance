import "server-only";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AiFinancialRecap, AiWalletOption } from "@/lib/ai/data";
import type { RekapPeriod } from "@/lib/chat-auth";
import { formatCurrency } from "@/lib/utils";

export function buildAiSystemPrompt(input: {
  recap: AiFinancialRecap;
  wallets: AiWalletOption[];
  period: RekapPeriod;
}) {
  const walletList = input.wallets.map((wallet) => `- ${wallet.name} (${wallet.kind})`).join("\n") || "- Tidak ada wallet";
  const categories =
    input.recap.topExpenseCategories.map((item) => `- ${item.categoryName}: ${formatCurrency(item.total)}`).join("\n") || "- Belum ada kategori pengeluaran dominan";
  const perWallet =
    input.recap.perWallet
      .map(
        (item) =>
          `- ${item.walletName}: pemasukan ${formatCurrency(item.totalIncome)}, pengeluaran ${formatCurrency(item.totalExpense)}, net ${formatCurrency(item.net)}, ${item.transactionCount} transaksi`
      )
      .join("\n") || "- Belum ada aktivitas wallet";

  return `
Kamu adalah asisten keuangan pribadi untuk Balance.

Aturan utama:
- Selalu jawab dalam Bahasa Indonesia yang ramah, ringkas, dan mudah dipahami.
- Fokus pada insight praktis, bukan jargon teknis.
- Jangan mengarang data di luar konteks yang diberikan atau hasil tool.
- Kalau data belum cukup detail, pakai tool yang tersedia.
- Saat ada angka penting, tampilkan dalam format Rupiah.
- Jangan menyuruh user membuka data mentah jika jawaban bisa kamu simpulkan dari konteks saat ini.

Konteks wallet yang bisa diakses user:
${walletList}

Rekap aktif:
- Periode: ${input.period}
- Cakupan wallet: ${input.recap.walletLabel}
- Rentang UTC: ${input.recap.range.start} sampai ${input.recap.range.end}
- Total pemasukan: ${formatCurrency(input.recap.totalIncome)}
- Total pengeluaran: ${formatCurrency(input.recap.totalExpense)}
- Net: ${formatCurrency(input.recap.net)}
- Jumlah transaksi: ${input.recap.transactionCount}

Kategori pengeluaran teratas:
${categories}

Ringkasan per wallet:
${perWallet}

Gaya jawaban:
- Jika user minta rekap, beri 2-4 poin insight singkat atau paragraf pendek.
- Jika ada warning anggaran atau pola pengeluaran besar, sebutkan dengan nada suportif.
- Jika data kosong, jelaskan dengan tenang dan beri saran langkah berikutnya.
`.trim();
}

export function buildChatMessages(systemPrompt: string, messages: Array<{ role: "user" | "assistant"; content: string }>): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content
    }))
  ];
}
