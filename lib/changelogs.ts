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
    version: "1.14.9",
    date: "2026-06-13",
    title: "Landing page sekarang punya toggle light dan dark",
    description: "Pengunjung landing kini bisa memilih mode terang atau gelap langsung dari header. Pilihannya memakai mekanisme theme yang sama dengan Balance supaya halaman publik tetap konsisten tanpa perlu login.",
    features: [
      { icon: "🌓", text: "Toggle light/dark baru tersedia langsung di header landing desktop dan menu mobile." },
      { icon: "🍪", text: "Pilihan tema disimpan lewat cookie yang sama dengan Balance, jadi preferensi tetap terbaca saat membuka halaman publik lain." },
      { icon: "🌲", text: "Jika mode gelap dipilih, landing tetap memakai versi warm forest yang lebih ramah dibaca." }
    ]
  },
  {
    version: "1.14.8",
    date: "2026-06-13",
    title: "Landing dark mode kini lebih hangat dan mengundang",
    description: "Dark mode di landing page sekarang terasa lebih ramah dibaca: background bergeser ke warm forest, gradient ambient lebih terlihat, dan mockup hero punya glow yang lebih hangat. Dashboard dan halaman app internal tidak berubah.",
    features: [
      { icon: "🌲", text: "Landing page dark mode kini memakai background forest yang sedikit lebih terang agar terasa hangat, bukan hitam pekat." },
      { icon: "✨", text: "Gradient body di landing dibuat lebih terlihat dengan campuran sage, soft green, dan amber glow yang halus." },
      { icon: "🪟", text: "Card, border, dan muted text di landing dark mode ditingkatkan kontrasnya supaya section lebih mudah dipindai." },
      { icon: "🖥️", text: "Mockup hero dark slide ikut dipoles dengan aksen glow hangat tanpa mengubah tema dark dashboard asli di dalam aplikasi." }
    ]
  },
  {
    version: "1.14.7",
    date: "2026-06-13",
    title: "Kartu transaksi kini lebih ringkas",
    description: "Daftar transaksi di Balance kini terasa lebih ringan dipindai. Kartu transaksi terbaru dan riwayat transaksi dirapikan supaya informasi inti tetap jelas tanpa tinggi kartu yang berlebihan.",
    features: [
      { icon: "🧾", text: "Kartu transaksi terbaru di dashboard dan halaman Transaksi kini memakai susunan yang lebih padat: judul, nominal, tanggal, dan satu baris meta utama." },
      { icon: "🏷️", text: "Badge status dipangkas agar hanya muncul saat memang penting, seperti transaksi otomatis, tabungan, atau penyesuaian saldo." },
      { icon: "📋", text: "Riwayat Lengkap di desktop tetap tabel, tapi row deskripsi dan aksi kini lebih hemat ruang dan tidak mengulang informasi berlebihan." },
      { icon: "📱", text: "Kartu history di mobile ikut disederhanakan supaya edit/hapus tetap mudah dijangkau tanpa membuat kartu terlalu tinggi." }
    ]
  },
  {
    version: "1.14.6",
    date: "2026-06-25",
    title: "AI Chat kini butuh persetujuan eksplisit",
    description: "Balance menambahkan lapisan kepatuhan baru untuk AI Chat DeepSeek: disclosure di Privacy Policy diperjelas, persetujuan diminta sebelum fitur dipakai, dan user bisa mematikan AI Chat kapan saja dari Settings.",
    features: [
      { icon: "🔐", text: "AI Chat sekarang ditahan dulu sampai kamu menyetujui pengiriman pertanyaan, konteks wallet relevan, dan riwayat chat ke DeepSeek." },
      { icon: "🧾", text: "Halaman Pengaturan punya kontrol baru untuk mengaktifkan atau mematikan AI Chat kapan saja, lengkap dengan ringkasan disclosure dan link ke Kebijakan Privasi." },
      { icon: "📜", text: "Kebijakan Privasi diperbarui agar secara eksplisit menyebut DeepSeek sebagai penyedia AI berbasis China dan jenis data AI Chat yang diproses." },
      { icon: "🛡️", text: "Route server AI Chat ikut memeriksa consent versi terbaru supaya request lama atau manual tidak bisa melewati gate compliance." }
    ]
  },
  {
    version: "1.14.5",
    date: "2026-06-13",
    title: "AI Chat lebih paham kategori dan format catatan lokal",
    description: "Asisten AI kini lebih aman saat mencatat transaksi: kategori yang tidak ditemukan tidak lagi lolos diam-diam, dan prompt kasual Indonesia seperti `45rb`, `1,5jt`, `catet`, atau `kmrn` lebih mudah dipahami.",
    features: [
      { icon: "🧾", text: "Jika AI menyebut nama kategori yang tidak tersedia, transaksi sekarang diblokir dulu agar tidak tersimpan tanpa kategori." },
      { icon: "💸", text: "Confidence nominal kini paham format Indonesia seperti `45rb`, `125 ribu`, `1jt`, `1,5jt`, dan `2 juta`." },
      { icon: "🗣️", text: "Typo kasual seperti `catet` tetap dikenali sebagai permintaan mencatat transaksi, bukan obrolan biasa." },
      { icon: "📂", text: "Fokus kategori kini bisa membaca kategori income maupun kategori non-top-expense, plus tanggal kasual seperti `kmrn`, `td mlm`, dan `2 hari lalu`." }
    ]
  },
  {
    version: "1.14.4",
    date: "2026-06-13",
    title: "AI Chat lebih aman saat tool mengembalikan error",
    description: "Asisten AI kini tidak lagi melanjutkan jawaban bebas ketika tool transaksi atau anggaran mengembalikan error terstruktur. Untuk konfirmasi transaksi, preview tetap muncul seperti biasa.",
    features: [
      { icon: "🛡️", text: "Hasil tool sekarang jadi sumber kebenaran akhir untuk alur mutasi, jadi error seperti duplikat atau confidence rendah tidak diteruskan ke stream AI biasa." },
      { icon: "📋", text: "Kode `NEEDS_CONFIRMATION` tetap menampilkan preview transaksi dan tombol konfirmasi, tanpa mengubah kontrak event yang sudah ada." },
      { icon: "🌐", text: "Pesan fallback untuk error tool penting kini punya copy yang konsisten di Indonesia dan English." }
    ]
  },
  {
    version: "1.14.3",
    date: "2026-06-13",
    title: "Riwayat transaksi kini lebih cepat dicari dan diurutkan",
    description: "Riwayat Lengkap sekarang memakai search dan sort berbasis server dalam bulan aktif, jadi pencarian terasa lebih stabil dan tidak bikin halaman macet.",
    features: [
      { icon: "🔎", text: "Cari transaksi bulan aktif berdasarkan catatan, kategori, atau jenis tanpa filter berat di browser." },
      { icon: "↕️", text: "Urutan baru di Riwayat Lengkap: tanggal terbaru/terlama, nominal terbesar/terkecil, kategori A-Z/Z-A, serta jenis pemasukan atau pengeluaran dulu." },
      { icon: "📄", text: "Pagination history sekarang menjaga state bulan, search, dan sort langsung dari URL agar hasil tetap konsisten saat pindah halaman." }
    ]
  },
  {
    version: "1.14.2",
    date: "2026-06-13",
    title: "Landing header lebih premium dan rapi",
    description: "Header landing kini terasa lebih tenang dan premium tanpa mengubah isi navigasinya. Brand, anchor section, CTA, dan drawer mobile disusun ulang agar lebih jelas dan ringan dipakai.",
    features: [
      { icon: "🪟", text: "Header sticky kini memakai panel glass yang lebih mengambang dengan radius, border, dan shadow yang lebih halus." },
      { icon: "🧭", text: "Navigasi desktop dirapikan ke pill navigation yang lebih konsisten, lengkap dengan state aktif, hover, dan focus yang theme-aware." },
      { icon: "✨", text: "CTA Login dan Daftar diseimbangkan ulang agar hirarki visual lebih jelas tanpa terasa padat." },
      { icon: "📱", text: "Drawer mobile kini lebih terstruktur sebagai panel penuh dengan ritme spacing yang lebih rapi dan menu otomatis tertutup setelah anchor dipilih." }
    ]
  },
  {
    version: "1.14.1",
    date: "2026-06-13",
    title: "Perbaikan akses halaman Ketentuan Layanan",
    description: "Halaman Terms of Service kini bisa dibuka langsung dari landing page tanpa harus login lebih dulu.",
    features: [
      { icon: "⚖️", text: "Route `/terms` sekarang diperlakukan sebagai halaman publik di middleware." },
      { icon: "🔓", text: "Pengunjung yang menekan tautan Ketentuan Layanan di footer landing tidak lagi diarahkan ke halaman login." },
      { icon: "🌐", text: "Perilaku ini konsisten untuk locale Indonesia maupun English melalui `/id/terms` dan `/en/terms`." }
    ]
  },
  {
    version: "1.14.0",
    date: "2026-06-13",
    title: "Onboarding dashboard — alur setup 4 langkah",
    description: "Checklist onboarding di dashboard kini mengikuti alur produk saat ini: buat wallet, catat transaksi, rapikan kategori/anggaran, dan mulai menabung. CTA mengarah ke halaman yang relevan di wallet utama.",
    features: [
      { icon: "🪜", text: "4 langkah onboarding: buat wallet, catat transaksi, rapikan kategori & anggaran, mulai menabung." },
      { icon: "🧭", text: "CTA onboarding mengarah ke halaman yang relevan (mis. /wallets/{id}/categories, /budgets, /savings) — bukan lagi ke halaman /wallets." },
      { icon: "✅", text: "Auto-complete tetap berjalan: langkah dianggap selesai berdasarkan aksi nyata (wallet ada, transaksi manual tercatat, kategori kustom atau anggaran dibuat, tabungan dibuat)." },
      { icon: "🎨", text: "Tata letak kartu onboarding mengikuti grid responsif baru agar tetap rapi dengan 4 langkah (2 kolom di tablet, 4 di desktop)." }
    ]
  },
  {
    version: "1.13.0",
    date: "2026-06-24",
    title: "FAQ Landing, Badge Baru & Halaman Legal",
    description: "Landing page kini punya FAQ dan tata letak badge yang lebih rapi. Kebijakan Privasi diperbarui dan Ketentuan Layanan ditambahkan sebagai halaman publik baru.",
    features: [
      { icon: "❓", text: "FAQ di landing page: pertanyaan umum seputar keamanan data, wallet bersama, biaya, dan akses mobile." },
      { icon: "🏷️", text: "Badge fitur dipindahkan ke atas grid fitur, dengan badge baru Dark mode dan AI Assistant." },
      { icon: "📜", text: "Kebijakan Privasi diperbarui mencakup AI chat, shared wallet, PWA, dan pemrosesan DeepSeek." },
      { icon: "⚖️", text: "Halaman Ketentuan Layanan baru tersedia di /terms dan ditautkan dari footer landing." },
    ]
  },
  {
    version: "1.12.0",
    date: "2026-06-20",
    title: "Free Trial 7 Hari",
    description: "Setiap akun baru otomatis mendapat akses Premium selama 7 hari. Status trial dan sisa waktu ditampilkan di halaman Settings. Setelah trial habis, akun kembali ke Free secara otomatis.",
    features: [
      { icon: "🎁", text: "Akun baru langsung dapat Premium Trial 7 hari — tanpa perlu kode atau konfirmasi." },
      { icon: "⏳", text: "Di halaman Settings, kamu bisa lihat sisa waktu trial dalam hari atau jam." },
      { icon: "🔄", text: "Saat trial habis, akun otomatis kembali ke Free tanpa mengubah data apapun." },
      { icon: "💎", text: "Selama trial aktif, semua fitur Premium bisa dinikmati: AI Chat tanpa batas, laporan 12 bulan, dan ekspor PDF." },
    ]
  },
  {
    version: "1.11.0",
    date: "2026-06-17",
    title: "Pricing & Premium — Free vs Premium yang lebih jelas",
    description: "Paket Free dan Premium kini punya posisi yang lebih jelas. AI Chat free 5/hari, Premium unlimited. Laporan 3 bulan untuk Free, 12 bulan untuk Premium. Ekspor PDF khusus Premium.",
    features: [
      { icon: "🤖", text: "AI Chat free: 5 pesan/hari (sebelumnya 20). Premium: tanpa batas." },
      { icon: "📊", text: "Riwayat laporan: 3 bulan terakhir untuk Free, 12 bulan untuk Premium." },
      { icon: "📄", text: "Ekspor PDF kini khusus Premium. Free melihat tombol terkunci dengan info upgrade." },
      { icon: "💎", text: "Premium Rp29.000/bulan. Opsi tahunan Rp250.000/tahun (info hemat di landing page)." },
      { icon: "🏠", text: "Landing page baru: hero menekankan chat → transaksi otomatis, section Harga dengan 2 kartu perbandingan." },
    ]
  },
  {
    version: "1.10.1",
    date: "2026-06-17",
    title: "Mockup hero landing interaktif",
    description: "Hero visual di landing page kini diganti mockup jendela browser animasi yang auto-slide melalui 3 tampilan dashboard Balance. Transisi halus, pause saat hover, dan ramah aksesibilitas.",
    features: [
      { icon: "🖥️", text: "Mockup jendela browser dengan 3 slide kode: dashboard ringan, transaksi terbaru, dan tampilan mode gelap." },
      { icon: "🎞️", text: "Auto-slide setiap 4 detik dengan transisi fade dan geser yang halus." },
      { icon: "⏸️", text: "Slide otomatis berhenti saat kursor di atas mockup — aman dihover tanpa kehilangan konteks." },
      { icon: "♿", text: "Dukungan prefers-reduced-motion: hanya slide pertama ditampilkan, tanpa animasi." },
    ]
  },
  {
    version: "1.10.0",
    date: "2026-06-17",
    title: "Navigasi landing & section Harga",
    description: "Header landing baru dengan sticky glass effect, navigasi anchor scroll ke Fitur, Cara Kerja, dan Harga. Section Harga baru dengan kartu gratis yang jujur.",
    features: [
      { icon: "🧭", text: "Header sticky dengan glass effect — navigasi section selalu terlihat saat scroll." },
      { icon: "📱", text: "Menu hamburger mobile untuk akses cepat ke semua section landing." },
      { icon: "💰", text: "Section Harga baru dengan informasi paket gratis dan tanpa biaya tersembunyi." },
    ]
  },
  {
    version: "1.8.13",
    date: "2026-06-13",
    title: "Asisten AI lebih akurat membaca transaksi harian",
    description: "Pertanyaan seperti \"transaksi kemarin berapa\" kini lebih konsisten dijawab berdasarkan daftar transaksi yang benar-benar dibaca, bukan hanya ringkasan singkat.",
    features: [
      { icon: "📆", text: "AI sekarang lebih sadar konteks tanggal relatif seperti kemarin, hari ini, dan minggu ini saat membaca transaksi." },
      { icon: "📋", text: "Pertanyaan yang meminta jumlah atau daftar transaksi akan memicu pembacaan tool transaksi, jadi jawaban tidak mudah melewatkan item lain." },
      { icon: "🔢", text: "Hasil tool transaksi kini menyertakan total kecocokan (`totalMatched`) agar jumlah transaksi yang disebut AI lebih stabil." },
    ]
  },
  {
    version: "1.9.0",
    date: "2026-06-14",
    title: "Free vs Premium — paket langganan & batas pemakaian",
    description: "Balance kini membedakan pengguna Free dan Premium. Free memiliki batas AI Chat harian (default 20 pesan/hari), sementara Premium menawarkan AI Chat tanpa batas. Transaksi manual tidak terbatas untuk semua plan. API Key & integrasi AI selalu gratis tanpa batas.",
    features: [
      { icon: "🏷️", text: "Kartu \"Paket Langganan\" di halaman Settings — lihat status plan dan batas pemakaian." },
      { icon: "🤖", text: "Free: AI Chat terbatas per hari. Premium: AI Chat tanpa batas harian." },
      { icon: "📝", text: "Transaksi manual: tidak terbatas untuk semua plan (Free & Premium)." },
      { icon: "🔑", text: "API Key & integrasi AI: selalu gratis tanpa batas — tidak terpengaruh plan." },
    ]
  },
  {
    version: "1.8.12",
    date: "2026-06-13",
    title: "Asisten AI lebih responsif & ringan",
    description: "Asisten AI Balance kini lebih cepat dalam merespon — rekap keuangan di-cache, data kategori hanya dimuat saat dibutuhkan, dan chat umum non-mutasi langsung menuju streaming tanpa tool-call loop. Ditambah logging durasi per tahap untuk pemantauan performa.",
    features: [
      { icon: "⚡", text: "Chat umum non-mutasi lebih cepat: token pertama muncul lebih cepat karena tool-call loop dilewati untuk pertanyaan read-only." },
      { icon: "💾", text: "Cache rekap keuangan 30 detik — data tidak perlu diambil ulang dari database untuk setiap pesan." },
      { icon: "🎯", text: "Data kategori hanya dimuat jika prompt menyebut nama kategori — tidak diborong di awal percakapan." },
      { icon: "📊", text: "Logging durasi per tahap (auth, preload, tool loop, stream, first token) dengan prefix [AI][timing] untuk debugging performa." },
    ]
  },
  {
    version: "1.8.11",
    date: "2026-06-13",
    title: "Perbaikan dropdown kategori dan ikon duplikat",
    description: "Ikon kategori tidak lagi muncul ganda di trigger dropdown saat kategori dipilih. Dropdown kategori kini bisa di-scroll dengan nyaman di mobile dan desktop.",
    features: [
      { icon: "🎯", text: "Ikon kategori di trigger dropdown tidak lagi duplikat — hanya teks yang tampil di selected value." },
      { icon: "📜", text: "Dropdown kategori memiliki tinggi maksimum dan bisa di-scroll secara alami saat daftar panjang." },
    ]
  },
  {
    version: "1.8.10",
    date: "2026-06-13",
    title: "Perbaikan edit transaksi dari History",
    description: "Modal edit History untuk transaksi tanpa kategori sebelumnya error karena Radix Select menolak value kosong. Kini diperbaiki dengan sentinel internal sehingga modal terbuka normal dan server tetap menerima data kategori kosong.",
    features: [
      { icon: "🛠️", text: "Edit transaksi dari History tidak lagi crash saat transaksi tanpa kategori." },
    ]
  },
  {
    version: "1.8.9",
    date: "2026-06-13",
    title: "Multi-mata uang (multi-currency)",
    description: "Wallet kini memiliki mata uang sendiri. Pengaturan default currency di halaman Settings, pemilih mata uang saat pembuatan wallet baru, dan semua angka di dashboard/wallets/savings mengikuti mata uang masing-masing wallet.",
    features: [
      { icon: "💰", text: "Wallet memiliki field currency sendiri (default IDR) — tiap wallet bisa pakai mata uang berbeda." },
      { icon: "⚙️", text: "Halaman Settings kini punya pemilih default currency untuk wallet baru." },
      { icon: "➕", text: "Form pembuatan wallet baru dilengkapi dropdown mata uang." },
      { icon: "🏷️", text: "Semua angka di Dashboard, halaman Wallet, dan Tabungan menampilkan format mata uang yang sesuai." },
      { icon: "🌐", text: "Mendukung 15 mata uang: IDR, USD, SGD, MYR, EUR, GBP, JPY, AUD, CNY, SAR, INR, PHP, THB, KRW, BND." },
    ]
  },
  {
    version: "1.8.8",
    date: "2026-06-12",
    title: "Input jam pada transaksi & tabungan",
    description: "Semua form transaksi, penyesuaian saldo, dan entry tabungan kini punya field jam. Waktu default mengikuti jam sekarang dan ditampilkan di semua daftar transaksi, history, dan export Excel.",
    features: [
      { icon: "🕐", text: "Field jam terpisah di quick input, edit transaksi, penyesuaian saldo, history edit, dan form tabungan." },
      { icon: "⏰", text: "Waktu default otomatis mengikuti jam saat ini — tidak perlu isi manual." },
      { icon: "📊", text: "Jam tampil di kartu daftar transaksi, history table, mobile card, riwayat tabungan, dan export Excel." },
      { icon: "🌏", text: "Timezone auto-detect dari browser (WIB/WITA/WIT). Display konsisten antara server dan client via cookie." },
    ]
  },
  {
    version: "1.8.7",
    date: "2026-06-12",
    title: "OG Image card untuk link preview",
    description: "Balance kini punya kartu Open Graph 1200×630px yang tampil saat link dibagikan ke Telegram, WhatsApp, Twitter, atau Discord. Desain warm minimalist: krem, sage, dan kurva pertumbuhan.",
    features: [
      { icon: "🖼️", text: "OG image 1200×630px otomatis — tampil sebagai link preview di Telegram, WhatsApp, Twitter, dan Discord." },
      { icon: "🎨", text: "Desain warm minimalist: krem #fbf9f3, headline sage #595f3d, lengkap dengan kurva pertumbuhan." },
      { icon: "⚡", text: "Font Hanken Grotesk + Inter dari Google Fonts, di-render real-time via @vercel/og." },
    ]
  },
  {
    version: "1.8.6",
    date: "2026-06-12",
    title: "Multi-turn chat lebih kontekstual",
    description: "Asisten AI kini lebih terjaga perannya di percakapan panjang, percakapan tetap kontekstual dengan ringkasan finansial tiap turn, dan intent pesan kamu otomatis terdeteksi.",
    features: [
      { icon: "🧠", text: "System prompt reinforcement: tiap pesan user disisipkan pengingat peran AI agar tidak melenceng di percakapan panjang." },
      { icon: "📋", text: "Running summary finansial: ringkasan data keuangan dari tiap percakapan disimpan dan dikirim di turn berikutnya — AI tetap kontekstual." },
      { icon: "🎯", text: "Klasifikasi intent otomatis: insight, catat transaksi, edit, atau general chat — dikenali di client sebelum dikirim ke AI." },
    ]
  },
  {
    version: "1.8.5",
    date: "2026-06-12",
    title: "AI Chat bisa mengelola anggaran",
    description: "Sekarang kamu bisa membuat, mengubah, dan menghapus anggaran langsung dari percakapan dengan Asisten AI Balance — cukup bilang \"set budget makan 500rb\" atau \"naikin budget transport jadi 1 juta\".",
    features: [
      { icon: "💰", text: "Buat anggaran baru per kategori: cukup sebut nominal, kategori, dan wallet — AI akan membuatkannya dengan createBudget." },
      { icon: "📈", text: "Ubah anggaran yang sudah ada: minta \"naikin budget transport 1 juta\", AI cek dulu via getBudgetStatus lalu update." },
      { icon: "🗑️", text: "Hapus anggaran: AI akan konfirmasi dulu sebelum menghapus, jadi tidak ada yang kehapus tanpa sengaja." },
      { icon: "🧠", text: "AI otomatis pakai bulan berjalan jika kamu tidak menyebut bulan, dan bisa cek kategori via getCategories." }
    ]
  },
  {
    version: "1.8.4",
    date: "2026-06-12",
    title: "Tulisan mobile kini lebih kalem dan stabil",
    description: "Kami merapikan elemen mobile yang masih tampak terlalu besar, terutama di Android, agar chip, tab, dropdown, dan metrik lebih nyaman dibaca.",
    features: [
      { icon: "📱", text: "Browser text autosize di mobile kini dikunci agar ukuran font mengikuti desain dan tidak membesar sendiri." },
      { icon: "🏷️", text: "Chip rekap, tab periode, dan kontrol konteks Asisten AI diperkecil agar tidak terasa memenuhi layar." },
      { icon: "💸", text: "Subtitle hero serta angka ringkasan Dashboard diturunkan lagi supaya proporsinya lebih tenang di layar kecil." },
    ]
  },
  {
    version: "1.8.3",
    date: "2026-06-12",
    title: "Tipografi dashboard dan Asisten AI lebih tenang",
    description: "Ukuran judul dan angka utama kini lebih proporsional, terutama di mobile, agar Dashboard dan Asisten AI terasa lebih ringan dibaca.",
    features: [
      { icon: "📏", text: "Subtitle hero Dashboard dan Asisten AI diperkecil agar tidak terasa terlalu dominan di mobile." },
      { icon: "💰", text: "Angka saldo utama, StatCard, dan kartu wallet di Dashboard kini lebih seimbang tanpa kehilangan penekanan." },
      { icon: "💬", text: "Heading area kosong, sidebar info, dan gelembung chat Asisten AI dirapikan supaya ritme baca lebih nyaman di desktop maupun mobile." },
    ]
  },
  {
    version: "1.8.2",
    date: "2026-06-12",
    title: "Navigasi mobile lebih rapi dan fokus",
    description: "Navigasi mobile kini membagi peran dengan jelas: bottom nav untuk tujuan utama, tombol floating kiri atas untuk membuka drawer, dan sidebar desktop tetap tidak ikut muncul di layar kecil.",
    features: [
      { icon: "📱", text: "Sidebar desktop sekarang hanya di-mount pada viewport desktop, jadi tidak ada lagi panel kiri yang nyasar ke mobile." },
      { icon: "🧭", text: "Bottom navigation mobile kembali fokus ke tujuan utama: Dashboard, Wallet, Transaksi, Chat AI, dan Pengaturan." },
      { icon: "🍔", text: "Drawer menu sekunder kini dibuka dari tombol floating hamburger di kiri atas, jadi cepat dijangkau tanpa mengganggu bottom nav." },
      { icon: "🦴", text: "Loading skeleton ikut diselaraskan agar bottom nav muncul konsisten saat halaman masih memuat." },
    ]
  },
  {
    version: "1.8.1",
    date: "2026-06-12",
    title: "Sidebar mobile yang lebih bersih",
    description: "Navigasi mobile kini hanya punya satu sidebar — hamburger di kiri yang membuka overlay drawer penuh. Double navigasi mobile dihapus.",
    features: [
      { icon: "🍔", text: "Tombol menu hamburger ikon saja di pojok kiri — lebih minimal dan mengikuti standar mobile UX." },
      { icon: "🔄", text: "Drawer overlay kini satu-satunya navigasi mobile: hilang total saat ditutup tanpa menyisakan ikon atau bilah." },
      { icon: "✨", text: "Bottom navigation bar dihapus — tidak ada lagi dua navigasi bersaing di layar kecil." },
    ]
  },
  {
    version: "1.8.0",
    date: "2026-06-12",
    title: "Sidebar fixed full-height dengan card sections",
    description: "Sidebar desktop kini full-height, fixed di kiri layar dengan panel solid. Navigasi dibagi jadi 'Navigasi Utama' dan 'Aktif Wallet' dengan card-style links yang konsisten antara desktop dan mobile.",
    features: [
      { icon: "🖥️", text: "Sidebar desktop fixed full-height di kiri — seamless, modern, panel solid bg-card dengan border-right." },
      { icon: "📂", text: "Navigasi terbagi jadi dua section: Navigasi Utama (semua menu) dan Aktif Wallet (shortcuts wallet dengan card-style links)." },
      { icon: "📱", text: "Desktop dan mobile kini pakai komponen UnifiedSidebar yang sama — styling card sections identik." },
      { icon: "🔄", text: "Layout flex dengan sidebar spacer — konten bergeser otomatis saat sidebar collapsed/expanded tanpa inline style hydration mismatch." },
      { icon: "🦴", text: "Loading skeleton diselaraskan dengan layout fixed sidebar baru." }
    ]
  },
  {
    version: "1.7.9",
    date: "2026-06-12",
    title: "Sidebar collapsible + unified mobile drawer",
    description: "Sidebar desktop bisa diciutkan jadi icons-only (72px) dengan tombol toggle — state tersimpan di localStorage. Di mobile, navigasi digantikan overlay drawer yang seragam dengan sidebar desktop, termasuk shortcut wallet dan logout.",
    features: [
      { icon: "↔️", text: "Sidebar desktop collapsible: expanded (280px) ↔ collapsed (72px, icons only) dengan transisi halus." },
      { icon: "💾", text: "State collapse persisten via localStorage — tidak reset saat refresh." },
      { icon: "📱", text: "Mobile unified drawer: overlay full-height dari kiri menggantikan Sheet, dengan navigasi utama + shortcut wallet + logout." },
      { icon: "🔍", text: "Tooltip label saat hover di mode icons-only agar navigasi tetap jelas." },
      { icon: "🧹", text: "Sheet/shacdn drawer dihapus — kode lebih bersih dan konsisten di semua layar." }
    ]
  },
  {
    version: "1.7.8",
    date: "2026-06-12",
    title: "Dashboard tab-based: Ringkasan, Dompet, Aktivitas",
    description: "Dashboard kini menggunakan 3 tab horizontal agar pengguna tidak perlu scroll panjang. Setiap tab menampilkan informasi yang relevan: ringkasan keuangan, dompet & kategori, atau aktivitas transaksi.",
    features: [
      { icon: "📑", text: "Tab Ringkasan: total saldo (big number), pengeluaran & pemasukan bulan ini, AI Insight, dan sparkline chart." },
      { icon: "👛", text: "Tab Dompet: wallet cards dengan budget progress, form buat wallet baru (collapsible), dan breakdown kategori pengeluaran." },
      { icon: "📋", text: "Tab Aktivitas: transaksi terbaru dan daily expense chart — semua histori tanpa gangguan." }
    ]
  },
  {
    version: "1.7.7",
    date: "2026-06-12",
    title: "Form buat wallet tidak lagi selalu terbuka",
    description: "Form pembuatan wallet di Dashboard sekarang disembunyikan di balik tombol bagi pengguna yang sudah punya wallet. Dashboard jadi lebih bersih tanpa pengulangan form yang tidak perlu.",
    features: [
      { icon: "🧹", text: "Pengguna dengan minimal 1 wallet melihat tombol 'Buat wallet baru' — form hanya muncul saat diklik." },
      { icon: "👶", text: "Pengguna baru (0 wallet) tetap langsung melihat form terbuka seperti sebelumnya." },
      { icon: "🔙", text: "Form yang sudah dibuka bisa ditutup kembali dengan tombol 'Batal'." }
    ]
  },
  {
    version: "1.7.6",
    date: "2026-06-12",
    title: "Ringkasan finansial lebih informatif dengan pemasukan bulan ini",
    description: "Kolom ringkasan finansial di Dashboard sekarang menampilkan pemasukan bulan ini, menggantikan metrik saldo yang sudah terlihat di kolom utama. Informasi jadi lebih lengkap tanpa pengulangan.",
    features: [
      { icon: "📈", text: "StatCard baru 'Pemasukan bulan ini' menampilkan total income seluruh wallet di bulan berjalan." },
      { icon: "🧹", text: "Dua StatCard duplikat (Saldo Tersedia & Saldo Tabungan) dihapus — metrik ini sudah ada di kolom kiri ringkasan." },
      { icon: "🌐", text: "Label dan detail pemasukan bulan ini tersedia dalam Bahasa Indonesia dan Inggris." }
    ]
  },
  {
    version: "1.7.5",
    date: "2026-06-11",
    title: "Fundasi UI yang lebih kokoh dengan shadcn/ui",
    description: "Komponen UI Balance kini dibangun di atas shadcn/ui — pustaka komponen yang aksesibel, konsisten, dan siap dikembangkan. Tampilan dan nuansa Serene Capital tetap terjaga persis seperti sebelumnya.",
    features: [
      { icon: "🧩", text: "13 komponen shadcn/ui diadopsi: Button, Dialog, Sheet, Select, Input, Label, Badge, Table, Alert, AlertDialog, RadioGroup, Collapsible, dan Sonner untuk toast." },
      { icon: "🎨", text: "Semua visual Serene Capital (cream, sage, forest, rounded cards, soft shadows) tetap sama — migrasi transparan tanpa perubahan UI." },
      { icon: "🌗", text: "Light mode dan dark mode tetap menjadi first-class citizens dengan token warna yang konsisten di kedua tema." },
      { icon: "♿", text: "Komponen sekarang lebih aksesibel berkat Radix UI: keyboard navigation, focus trap, ARIA attributes bawaan." },
      { icon: "🔧", text: "Tailwind CSS v4 + tailwindcss-animate untuk animasi mulus. Semua kelas utility tetap utuh tanpa perubahan." }
    ]
  },
  {
    version: "1.7.4",
    date: "2026-06-11",
    title: "Daily chat limit & indikator kuota dua baris",
    description: "AI Chat sekarang punya batas harian (default 20/hari) dan sidebar menampilkan dua progress bar: kuota per menit dan kuota harian.",
    features: [
      { icon: "📅", text: "Daily limit AI Chat: maksimal 20 chat per hari (bisa diatur lewat env). Reset otomatis setiap hari." },
      { icon: "📊", text: "Sidebar sekarang nampilin dua baris: kuota per menit (real-time) dan kuota harian (statis, reset besok)." },
      { icon: "🚫", text: "Kalau kuota harian habis, chat langsung ditolak dengan pesan 'Kuota chat hari ini sudah habis'." },
      { icon: "🌐", text: "Semua teks indikator mendukung Bahasa Indonesia dan Inggris." }
    ]
  },
  {
    version: "1.7.3",
    date: "2026-06-11",
    title: "Indikator kuota AI Chat di sidebar",
    description: "Sekarang kamu bisa lihat sisa pakai AI Chat langsung dari sidebar — progress bar tipis dengan sisa kuota dan countdown mundur saat habis.",
    features: [
      { icon: "📊", text: "Progress bar kuota AI Chat di sidebar: tunjukkan sisa pakai dari batas yang ditentukan (misal \"15 dari 20\")." },
      { icon: "⏳", text: "Saat kuota habis, muncul countdown mundur (\"Reset 42dtk\") yang update tiap detik hingga window reset." },
      { icon: "🌐", text: "Indikator mendukung Bahasa Indonesia dan Inggris sesuai pengaturan bahasa aplikasi." }
    ]
  },
  {
    version: "1.7.2",
    date: "2026-06-11",
    title: "Insight AI dashboard terasa jauh lebih cepat",
    description: "Kartu Insight AI di Dashboard sekarang lebih sigap dibuka berkat cache stale-while-revalidate, fallback deterministik instan, dan penyegaran ulang otomatis setelah transaksi berubah.",
    features: [
      { icon: "⚡", text: "Insight Dashboard kini bisa langsung tampil dari cache fresh atau stale tanpa menunggu panggilan AI selesai." },
      { icon: "🪶", text: "Saat cache kosong total, kamu tetap langsung melihat insight ringkas berbasis data transaksi bulan ini." },
      { icon: "🔄", text: "Narasi AI yang lebih kaya dipanaskan di background dan otomatis menggantikan fallback saat sudah siap." },
      { icon: "🧹", text: "Setelah transaksi ditambah, diubah, atau dihapus, cache insight ikut dibersihkan agar pembacaan berikutnya tetap relevan." }
    ]
  },
  {
    version: "1.7.1",
    date: "2026-06-11",
    title: "AI chat lebih hemat konteks dan lebih sigap",
    description: "Asisten AI sekarang lebih pintar mengelola budget token: prompt disesuaikan dengan periode, riwayat lama dipilih berdasarkan relevansi, dan tool berhenti lebih cepat jika konteks sudah terlalu besar.",
    features: [
      { icon: "🪶", text: "Prompt AI untuk rekap harian kini jauh lebih ringkas, mingguan jadi versi menengah, dan bulanan tetap detail." },
      { icon: "🧠", text: "Saat konteks kepanjangan, server memprioritaskan pesan lama yang paling relevan dan membuang sisanya lebih dulu." },
      { icon: "📏", text: "Perkiraan token kini lebih realistis karena menghitung framing chat dan overhead tool, bukan hanya panjang teks mentah." },
      { icon: "🚦", text: "Request yang jelas tidak akan muat dalam budget token kini dihentikan lebih awal agar respons tetap cepat dan hemat biaya." },
      { icon: "🧰", text: "Jika hasil tool sudah terlalu besar, AI berhenti memanggil tool tambahan dan langsung menyusun jawaban dari konteks yang ada." }
    ]
  },
  {
    version: "1.7.0",
    date: "2026-06-11",
    title: "Navigasi & UX lebih sederhana",
    description: "Kami menyederhanakan navigasi aplikasi agar lebih mudah digunakan: transaksi dan histori digabung dalam satu halaman dengan toggle, daftar wallet pindah ke Dashboard, tab wallet dikelompokkan, dan bottom nav mobile kini hanya 5 item utama.",
    features: [
      { icon: "🔀", text: "Halaman Transaksi kini punya toggle Input Cepat | Riwayat Lengkap — tidak perlu pindah halaman lagi." },
      { icon: "📊", text: "Daftar dan buat wallet baru langsung dari Dashboard — satu tempat untuk semua ringkasan keuangan." },
      { icon: "📂", text: "Tab wallet dikelompokkan: Members, Settlements, Templates, dan Recurring masuk dropdown Pengaturan." },
      { icon: "📱", text: "Bottom nav mobile lebih ringkas: Dashboard, Wallet, Transaksi, Chat AI, Pengaturan." },
      { icon: "🧭", text: "Navigasi Wallet di sidebar dan bottom nav kini langsung menuju wallet utama kamu." }
    ]
  },
  {
    version: "1.6.10",
    date: "2026-06-11",
    title: "Kelola kategori sendiri",
    description: "Sekarang tiap wallet bisa menambah, mengubah, dan menghapus kategori transaksi sendiri tanpa meninggalkan aplikasi. Kategori sistem tetap aman dan ditandai jelas agar flow tabungan serta penyesuaian saldo tidak ikut rusak.",
    features: [
      { icon: "🏷️", text: "Halaman Kategori baru untuk melihat semua kategori pemasukan dan pengeluaran dalam satu tempat." },
      { icon: "🎨", text: "Buat atau edit kategori dengan pilihan warna Serene Capital yang konsisten di seluruh wallet." },
      { icon: "🛡️", text: "Kategori sistem diberi badge khusus dan tetap read-only agar fitur tabungan dan penyesuaian saldo tetap aman." },
      { icon: "🧾", text: "Menghapus kategori tidak menghapus transaksi lama; kategori lama pada transaksi akan dikosongkan otomatis." },
      { icon: "🔄", text: "Perubahan kategori langsung menyegarkan halaman transaksi, anggaran, template, recurring, dan ringkasan wallet terkait." }
    ]
  },
  {
    version: "1.6.9",
    date: "2026-06-19",
    title: "AI chat lebih hemat token & riwayat percakapan lebih pintar",
    description: "AI chat sekarang mengelola budget token dengan lebih cerdas: mengecilkan konteks saat diperlukan, memilih riwayat percakapan yang relevan, dan mengompres hasil tool supaya percakapan tetap cepat dan hemat biaya.",
    features: [
      { icon: "📐", text: "Budget token otomatis: AI mengecek dan mengecilkan konteks sebelum mengirim ke model." },
      { icon: "📝", text: "System prompt ringkas: saat budget token terbatas, ringkasan wallet dan kategori dirampingkan secara otomatis." },
      { icon: "🧠", text: "Riwayat pintar: percakapan lama yang paling relevan dengan pertanyaanmu tetap disertakan, sisanya dihemat." },
      { icon: "🗜️", text: "Hasil tool dikompres: data rekap dan transaksi dari tool dikirim lebih ringkas tanpa kehilangan informasi penting." },
      { icon: "⚙️", text: "Budget token bisa diatur lewat environment variable AI_CHAT_TOKEN_BUDGET." }
    ]
  },
  {
    version: "1.6.8",
    date: "2026-06-18",
    title: "Pencatatan transaksi AI yang lebih aman dengan verifikasi kepercayaan",
    description: "AI sekarang menilai tingkat kepercayaan sebelum mencatat transaksi. Jika kurang yakin, kamu bisa lihat preview dulu dan konfirmasi sebelum transaksi benar-benar tersimpan. Sistem juga mendeteksi duplikat transaksi dan batas pengeluaran harian.",
    features: [
      { icon: "🎯", text: "AI menilai tingkat kepercayaan transaksi: nominal, kategori, wallet, dan niat dari teks kamu." },
      { icon: "🛡️", text: "Transaksi duplikat dalam 5 menit terakhir otomatis terdeteksi dan dicegah." },
      { icon: "💬", text: "Konfirmasi interaktif: preview transaksi muncul di chat, kamu bisa setujui atau batalkan." },
      { icon: "📋", text: "Tombol 'Ya, Catat' dan 'Batal' untuk transaksi yang perlu konfirmasi — tidak perlu ngetik ulang." },
      { icon: "🔁", text: "Tool confirmTransaction baru untuk AI menyelesaikan transaksi yang butuh persetujuan." }
    ]
  },
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
