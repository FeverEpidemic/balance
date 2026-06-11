export type ChangelogFeature = {
  icon: string;
  text: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  features: ChangelogFeature[];
};

export const changelogs: ChangelogEntry[] = [
  {
    version: "1.6.7",
    date: "2026-06-17",
    title: "AI lebih tangguh: retry otomatis, fallback cerdas, dan validasi ketat",
    description: "Asisten AI kini lebih andal menghadapi gangguan koneksi, limit server eksternal, dan timeout. Jawaban tetap muncul meski upstream sedang sibuk, dan pencatatan transaksi via AI tervalidasi lebih ketat.",
    features: [
      { icon: "🔄", text: "Panggilan AI otomatis retry hingga 3x dengan jeda bertahap saat upstream error atau timeout." },
      { icon: "⏱️", text: "Setiap panggilan AI kini punya batas waktu: 30 detik untuk analisis, 60 detik untuk streaming jawaban." },
      { icon: "🛡️", text: "Saat server AI eksternal sibuk (429), asisten tetap menjawab pakai data lokal tanpa menampilkan error mentah." },
      { icon: "✂️", text: "Jika streaming jawaban terpotong karena timeout, teks yang sudah diterima tetap ditampilkan dengan indikator." },
      { icon: "✅", text: "Pencatatan transaksi via AI kini divalidasi lebih awal: jumlah harus positif, jenis harus tepat, wallet wajib diisi." }
    ]
  },
  {
    version: "1.6.6",
    date: "2026-06-14",
    title: "Peningkatan keamanan dan perlindungan data",
    description: "Balance kini lebih aman dengan 7 perbaikan keamanan: perlindungan RPC, pembatasan akses token undangan, pencegahan kebocoran error database, dan lainnya.",
    features: [
      { icon: "🔒", text: "RPC penyesuaian saldo kini hanya bisa dipanggil oleh owner/editor wallet." },
      { icon: "🔑", text: "Token undangan hanya bisa dibaca oleh owner wallet — anggota lain tidak bisa melihatnya." },
      { icon: "📋", text: "Hanya pembuat wallet yang bisa menambah diri sebagai owner saat membuat wallet." },
      { icon: "📉", text: "Route API transaksi kini mematuhi batas free tier dan rate limit." },
      { icon: "🔗", text: "URL konfirmasi signup menggunakan alamat server yang dikonfigurasi, bukan dari header request." },
      { icon: "📄", text: "Ekspor Excel terlindungi dari penyisipan formula berbahaya." },
      { icon: "🛡️", text: "Pesan error database tidak lagi bocor ke pengguna — semua error dibungkus dengan teks aman." }
    ]
  },
  {
    version: "1.6.5",
    date: "2026-06-12",
    title: "Reset riwayat AI Chat",
    description: "Halaman AI chat kini punya tombol untuk menghapus seluruh riwayat percakapan dengan satu klik.",
    features: [
      { icon: "🗑️", text: "Tombol reset di pojok kanan atas card chat untuk menghapus seluruh percakapan." },
      { icon: "🛡️", text: "Konfirmasi dua langkah mencegah penghapusan riwayat secara tidak sengaja." }
    ]
  },
  {
    version: "1.6.4",
    date: "2026-06-10",
    title: "AI chat bisa bantu catat transaksi",
    description: "Asisten AI sekarang tidak hanya membaca data, tetapi juga bisa membantu mencatat pemasukan dan pengeluaran baru dengan flow yang lebih aman.",
    features: [
      { icon: "🧾", text: "AI chat kini bisa mencatat transaksi baru langsung ke wallet setelah kamu memberi detail dan konfirmasi yang jelas." },
      { icon: "🏷️", text: "Asisten bisa membaca daftar kategori per wallet agar pemilihan kategori transaksi terasa lebih tepat." },
      { icon: "🛡️", text: "Pencatatan lewat AI tetap mengikuti batas plan free, rate limit, akses wallet, dan invalidasi cache yang sama seperti input manual." }
    ]
  },
  {
    version: "1.6.3",
    date: "2026-06-10",
    title: "AI chat lebih nyaman di mobile",
    description: "Halaman AI chat sekarang lebih rapi di layar kecil, dan input pesan mendukung Enter untuk baris baru.",
    features: [
      { icon: "📱", text: "Card riwayat chat dan bubble pesan kini lebih aman dari layout melebar di layar mobile." },
      { icon: "↩️", text: "Enter sekarang membuat baris baru agar kamu bisa menulis pesan panjang dengan lebih nyaman." },
      { icon: "⌨️", text: "Kirim pesan kini didukung lewat Ctrl+Enter atau Cmd+Enter, selain tombol Kirim." }
    ]
  },
  {
    version: "1.6.2",
    date: "2026-06-10",
    title: "Chat recap lebih stabil",
    description: "Rekap AI sekarang lebih konsisten menampilkan ringkasan yang benar, dan riwayat percakapan tidak hilang saat kamu berpindah tab.",
    features: [
      { icon: "🗓️", text: "Chip rekap harian, mingguan, dan bulanan kini selalu memakai periode yang sesuai." },
      { icon: "🧾", text: "Permintaan rekap langsung menghasilkan ringkasan data Balance yang lebih deterministik." },
      { icon: "💬", text: "Riwayat chat, wallet aktif, dan periode pilihan kini dipulihkan saat kamu kembali ke halaman chat." },
      { icon: "🧠", text: "Pertanyaan chat bebas tidak lagi sering dijawab dengan penutup generik yang sama." },
      { icon: "📌", text: "Jawaban AI kini lebih dipaksa menyebut fakta konkret seperti angka, kategori, atau wallet aktif." },
      { icon: "🏷️", text: "Saat kamu menyebut kategori seperti cicilan atau makan, chat sekarang lebih fokus ke kategori itu." },
      { icon: "📊", text: "Kategori yang kamu sebut kini bisa langsung dibaca bersama status anggaran bulan berjalannya." },
      { icon: "↔️", text: "Kategori yang sama kini bisa dibandingkan dengan periode sebelumnya yang setara." }
    ]
  },
  {
    version: "1.6.1",
    date: "2026-06-10",
    title: "Safer AI chat and fair-use limits",
    description: "Balance now protects AI chat and free-plan transaction usage with clearer safety checks and calmer guard rails.",
    features: [
      { icon: "🛡️", text: "AI chat now rejects unsafe prompts, obvious off-topic requests, and overly long messages before they reach the model." },
      { icon: "⏱️", text: "AI chat requests now use per-user rate limits with friendlier retry guidance." },
      { icon: "📉", text: "Free plans now enforce a monthly transaction cap so usage stays predictable and fair." }
    ]
  },
  {
    version: "1.6.0",
    date: "2026-06-10",
    title: "AI insight and finance chat",
    description: "Balance now includes a dedicated AI assistant page and a lightweight dashboard insight card to explain your finances in friendlier language.",
    features: [
      { icon: "🤖", text: "Open a dedicated AI assistant page to ask for daily, weekly, or monthly financial recaps." },
      { icon: "💡", text: "See a short AI-generated dashboard insight without leaving the main overview." },
      { icon: "🧾", text: "AI answers can pull deeper recap, transaction, and budget context when needed." }
    ]
  },
  {
    version: "1.5.0",
    date: "2026-06-09",
    title: "Fitur What's New",
    description: "Pengguna sekarang dapat melihat pembaruan terbaru melalui fitur 'What's New' yang menampilkan perubahan dan penambahan fitur utama di setiap versi.",
    features: [
      { icon: "📄", text: "Export the active month of transaction history to Excel." },
      { icon: "📊", text: "Generate a monthly report PDF with income, expense, trend, and category breakdowns." },
      { icon: "🧭", text: "History pagination now resets or clamps safely when filters shrink the dataset." },
      { icon: "🛡️", text: "Invalid transaction dates now render a safe fallback instead of crashing the page." }
    ]
  },
  {
    version: "1.4.0",
    date: "2026-06-09",
    title: "Cleaner transaction history and exports",
    description: "Transaction history is more stable when filtering, and monthly data is easier to take outside Balance.",
    features: [
      { icon: "📄", text: "Export the active month of transaction history to Excel." },
      { icon: "📊", text: "Generate a monthly report PDF with income, expense, trend, and category breakdowns." },
      { icon: "🧭", text: "History pagination now resets or clamps safely when filters shrink the dataset." },
      { icon: "🛡️", text: "Invalid transaction dates now render a safe fallback instead of crashing the page." }
    ]
  },
  {
    version: "1.3.0",
    date: "2026-06-08",
    title: "Theme-aware polish across the app",
    description: "Balance now treats light mode and dark mode as first-class surfaces across charts, navigation, and auth panels.",
    features: [
      { icon: "🌗", text: "Dashboard charts, wallet navigation, and active states now use theme-aware tokens." },
      { icon: "✨", text: "Auth panels and wallet cards received calmer Serene Capital visual refinements." },
      { icon: "🧩", text: "Agent and design documentation now explicitly cover both rendered theme modes." }
    ]
  },
  {
    version: "1.2.0",
    date: "2026-06-06",
    title: "Recurring transactions and savings",
    description: "Wallets can now automate routine financial activity and track savings as part of the main balance flow.",
    features: [
      { icon: "🔁", text: "Create daily, weekly, or monthly recurring transactions." },
      { icon: "⏱️", text: "Run recurring generation through the scheduler outside the web request path." },
      { icon: "🎯", text: "Track savings goals and connect deposits or withdrawals to wallet balances." }
    ]
  },
  {
    version: "1.1.0",
    date: "2026-06-05",
    title: "Bilingual product surfaces",
    description: "The main app experience now follows the active Indonesian or English locale more consistently.",
    features: [
      { icon: "🌐", text: "Dashboard, wallet details, auth, invite, and public pages read from shared dictionaries." },
      { icon: "💬", text: "Server action feedback now follows the active locale." },
      { icon: "🔐", text: "A bilingual public privacy policy is available from the landing page." }
    ]
  },
  {
    version: "1.0",
    date: "2026-05-15",
    title: "Initial release",
    description: "Aplikasi ini baru rilis",
    features: [
      { icon: "🌐", text: "New Release" },
    ]
  }
];

export function getLatestVersion() {
  return changelogs[0]?.version ?? "0.0.0";
}

export function getUnreadEntries(seenVersion: string | null | undefined) {
  if (!seenVersion) {
    return changelogs;
  }

  return changelogs.filter((entry) => compareVersions(entry.version, seenVersion) > 0);
}

function compareVersions(a: string, b: string) {
  const aParts = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const bParts = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aPart = aParts[index] ?? 0;
    const bPart = bParts[index] ?? 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}
