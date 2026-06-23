# Changelog

## [Unreleased]

### Changed
- **Halaman Transaksi disederhanakan** — Tab "Quick Input" dihapus. Transaksi Terbaru jadi tampilan default penuh. Form input transaksi bisa diakses via tombol "Tambah Transaksi" di header atau FAB "+".
- **Sesuaikan Saldo dipindah ke Ringkasan Wallet** — Form balance adjustment sekarang ada di halaman Ringkasan Wallet sebagai section collapsible di bawah kartu saldo. Lebih intuitif karena terkait langsung dengan saldo wallet.

### Added
- **Sitemap XML untuk SEO** — Menambahkan sitemap.xml otomatis via Next.js App Router (`app/sitemap.ts`) yang mendaftarkan semua halaman publik (landing, login, register, privacy, terms, refund-policy) dalam dua bahasa (id/en) untuk membantu Google Search Console mengindeks konten Balance. Juga mengecualikan `/sitemap.xml` dari middleware redirect biar bisa di-crawl dengan benar.
- **Budget Carry-Over** — Sisa budget yang tidak terpakai dari bulan sebelumnya bisa dibawa ke bulan berikutnya. Fitur ini bersifat opsional per kategori (toggle "Bawa sisa budget"). Perhitungan carry-over bersifat rekursif dan memoized, mendukung rantai carry-over berbulan-bulan. Carry-over amount ditampilkan sebagai informasi tambahan di daftar budget.
- **Batch Transaction Input** — Input banyak transaksi sekaligus dalam satu form. Klik "Tambah baris" untuk menambahkan baris transaksi baru, isi semua field, dan submit sekali untuk semua baris. Insert bersifat atomic (all-or-nothing) dengan rate limit 1 token untuk seluruh batch.
- **Debt Tracker (Utang-Piutang)** — Fitur baru untuk mencatat utang/piutang informal dengan siapapun (nama text bebas, tidak perlu terdaftar di Balance). Mendukung cicilan (partial payment) dengan trigger database yang auto-update status (unpaid → partially_paid → settled). Bisa dihubungkan ke saldo wallet untuk auto-create transaksi. Ringkasan total utang, piutang, dan selisih ditampilkan di halaman Utang-Piutang per wallet.


## [1.17.0] - 2026-06-20

### Added
- **Sistem Pengingat Harian (Daily Reminder)** — Sistem pengingat harian berbasis Web Push Notification (PWA). Sekarang pengguna dapat mengaktifkan reminder dan mengatur jam pengingat harian (misal: setiap jam 8 malam / 20:00) yang menyesuaikan dengan zona waktu lokal user secara dinamis.
- **Skrip Pembangkit Kunci VAPID** — Menambahkan skrip utilitas `scripts/generate-vapid-keys.mjs` yang otomatis men-generate pasangan kunci VAPID dan menulisnya ke file `.env` jika belum terkonfigurasi.
- **Pengiriman Notifikasi via Scheduler** — Mengintegrasikan library `web-push` ke background scheduler `run-recurring-scheduler.mjs` untuk memicu notifikasi push secara berkala ke browser, serta otomatis mendeteksi dan menghapus endpoint subscription yang kedaluwarsa (404/410) demi menjaga kebersihan database.

## [1.16.1] - 2026-06-20

### Changed
- **Pembaruan Desain Logo & Tagline Header** — Mengganti ikon lama di header dan wordmark dengan logo representatif baru (dua sosok figur hijau & biru membentuk kontur hati dengan dompet bergaris tepi putih di tengah). Selain itu, tagline di bawah logo "Balance" kini dinamis mengikuti lokalisasi bahasa (Bahasa Indonesia: "KEUANGAN YANG LEBIH TENANG", English: "CALMER HOUSEHOLD FINANCE") dengan font Geist Monospace yang disesuaikan ukuran dan letter-spacing agar terbaca tajam dan rapi di semua ukuran layar (tanpa terpotong/menumpuk).

### Fixed
- **Perbaikan Bug Gradient Dompet** — Memperbaiki bug SVG `url(--walletGrad)` menjadi referensi gradien yang valid `url(#walletGrad)` sehingga dompet tidak lagi berwarna hitam solid dan gradien warna dapat ter-render dengan sempurna.

## [1.16.0] - 2026-06-20

### Added
- **Landing Page Scroll Observer** — Komponen klien baru untuk mengaktifkan animasi scroll reveal fade-in-up otomatis pada setiap bagian landing page menggunakan IntersectionObserver.

### Changed
- **Revamp Landing Page dengan Desain Premium** — Tata letak grid di bagian Features dan Cara Kerja disempurnakan dengan visual card yang lebih bersih dan hover micro-interactions (hover scale & border glow).
- **Mockup Browser 3D yang Mengambang** — Sasis mockup browser di Hero dipercantik dengan efek bayangan ambient 3D, border glassmorphic, dan glowing background untuk memperkuat kesan modern dan premium.
- **Section Pricing Glassmorphism** — Layout kartu paket Free dan Premium didesain ulang dengan gaya glassmorphic, memberikan diferensiasi visual yang tebal dan menonjolkan fitur Premium secara elegan.
- **Penerapan Kelas CSS Kustom** — Menambahkan kelas `.fade-in-section`, `.card-interactive-glow`, dan `.glass-pricing-card` di globals.css untuk konsistensi token Serene Capital.

## [Unreleased-Older]

### Changed

- **Spacing footer legal link dirapikan** — Footer landing sekarang punya jarak yang lebih seimbang untuk tautan `Privacy Policy`, `Terms of Service`, dan `Refund Policy`, dengan wrap mobile yang lebih rapi dan kelompok link yang tidak terlalu melebar di desktop.
- **Asisten AI kini punya modal tips di header chat** — Halaman `/chat` sekarang menampilkan tombol `?` di header yang membuka panduan penggunaan Asisten AI. User bisa melihat kemampuan utama, contoh prompt, tips agar hasil lebih akurat, dan catatan review AI tanpa harus menebak flow terbaik.
- **Bottom nav mobile kini auto-compact saat scroll** — Navigasi bawah di mobile sekarang otomatis masuk mode compact saat user scroll turun: label disembunyikan, bar ikut memendek dalam tinggi dan lebar, dan ikon compact dibuat sedikit lebih menonjol. Saat user scroll naik atau berinteraksi dengan nav, bentuk penuh kembali dengan transisi halus tanpa mengorbankan kejelasan active state.
- **Performa navigasi antar tab dioptimasi** — Tiga sumber degradasi utama diperbaiki: (1) `getWalletBundle` (digunakan halaman Members, Settlements, Templates, Reports) kini di-cache Redis TTL 120s, menghilangkan 13 query per navigasi. (2) `getShellData` di-cache Redis TTL 300s, menghilangkan 4+ query redundant per halaman. (3) Pengecekan profil di `ensureProfileForUser` tidak lagi berjalan di setiap navigasi — profil di-lazy-create di data layer hanya saat pertama kali. (4) `getMessages()` i18n di-cache dengan module-level Map agar `deepMerge` hanya berjalan sekali per locale.
- **Tambah transaksi kini bisa lewat popup** — Tombol `Tambah transaksi` di dashboard dan header halaman transaksi sekarang membuka modal form reusable, jadi user bisa mencatat pemasukan/pengeluaran tanpa redirect atau self-refresh halaman. Quick input inline di halaman transaksi tetap dipertahankan.
- **Field kategori transaksi dirapikan** — Komposisi `Select` untuk kategori dibenahi agar ikon tetap sejajar di trigger dan dropdown list, sekaligus memastikan reset form mengembalikan pilihan kategori dengan benar setelah submit berhasil.

### Added

- **Integrasi Midtrans Payment Gateway** — Sekarang kamu bisa langsung berlangganan Premium dari halaman Pengaturan! Pilih paket Bulanan (Rp 29.000/bln) atau Tahunan (Rp 250.000/thn, hemat 28%) dan bayar via Midtrans Snap. Pembayaran diproses aman lewat GoPay, Bank Transfer, QRIS, dan metode lainnya. Verifikasi signature SHA512, webhook handler, dan scheduler otomatis untuk manajemen masa berlaku subscription.
- **Halaman Refund Policy publik** — Balance sekarang punya halaman `Refund Policy` baru di `/[locale]/refund-policy` untuk kebutuhan compliance Midtrans. Footer landing juga sekarang menautkan `Privacy Policy`, `Terms of Service`, dan `Refund Policy`, sementara middleware mengizinkan route refund policy dibuka tanpa login.
- **Compliance gate untuk AI Chat DeepSeek** — AI Chat sekarang memerlukan persetujuan eksplisit sebelum bisa dipakai. User mendapat disclosure yang jelas tentang pengiriman pertanyaan, konteks wallet relevan, dan riwayat chat ke DeepSeek, lalu bisa mematikan AI Chat kapan saja dari halaman Settings.
- **Toggle light/dark di landing page** — Pengunjung landing sekarang bisa langsung mengganti tampilan terang atau gelap dari header tanpa masuk ke aplikasi. Toggle ini memakai mekanisme theme yang sama dengan Balance, jadi preferensinya tetap konsisten di halaman publik lain.
- **Search & sort lengkap di Riwayat Transaksi** — Halaman Riwayat Lengkap kini memakai pencarian dan pengurutan berbasis server untuk seluruh transaksi pada bulan aktif. User bisa mencari berdasarkan catatan, kategori, atau jenis transaksi, lalu mengurutkan berdasarkan tanggal, nominal, kategori, dan jenis tanpa membuat halaman stuck saat mengetik.
- **Onboarding dashboard diperbarui — alur setup 4 langkah** — Checklist onboarding di dashboard kini mengikuti alur produk saat ini: buat wallet, catat transaksi, rapikan kategori/anggaran, dan mulai menabung. CTA mengarah ke halaman yang relevan di wallet utama (mis. `/wallets/{id}/categories`, `/wallets/{id}/budgets`, `/wallets/{id}/savings`).
- **Free Trial 7 Hari** — Setiap akun baru otomatis mendapat akses Premium selama 7 hari. Status trial ditampilkan di Settings. Setelah trial habis, akun kembali ke Free secara otomatis.
- **Landing FAQ, badge repositioning & legal pages** — Landing page now has a FAQ accordion section before the CTA. Hero badges moved to above the features grid, with two new badges (Dark mode, AI Assistant). Footer links to both Privacy Policy and Terms of Service.
- **Kebijakan Privasi diperbarui** — Privacy policy expanded with dedicated sections on AI processing (DeepSeek), shared wallet data visibility, PWA behavior, and cookies. All existing sections refreshed to reflect current app behavior.
- **Halaman Ketentuan Layanan** — New public Terms of Service page at /[locale]/terms with 10 sections covering eligibility, acceptable use, AI disclaimer, pricing, and more. Follows the same layout as the privacy page.
- **Landing hero mockup interaktif** — Hero visual kanan kini berupa mockup jendela browser yang auto-slide melalui 3 tampilan kode: dashboard ringan, daftar transaksi, dan dashboard mode gelap. Transisi halus dengan pause saat hover dan dukungan reduced-motion.

### Changed

- **Card `Available Budget` ditambahkan ke dashboard** — Tepat di bawah hero dashboard sekarang ada kartu ringkasan baru untuk menunjukkan sisa anggaran aktif bulan ini. Nilainya dihitung dari total budget berjalan dikurangi pengeluaran bulan ini, jadi terpisah jelas dari saldo tersedia dan saldo tabungan.
- **Hero dashboard kini fokus ke saldo tersedia** — Angka utama di hero dashboard sekarang memakai `Saldo tersedia` dari seluruh wallet tanpa menambahkan tabungan. Kartu statistik yang sama di bawah hero dihapus supaya ringkasan tidak mengulang angka yang identik.
- **Header wallet mobile dibuat lebih tenang** — Shortcut pill wallet di hero app kini dihapus dari dashboard dan semua halaman wallet. Akses `Overview`, `Transaksi`, `Tabungan`, `Anggaran`, `Laporan`, dan halaman wallet lain tetap tersedia lewat sidebar/drawer, sementara ringkasan `Wallet / Anggaran / Anggota` di dashboard dipindah ke bagian paling bawah halaman agar alur scroll terasa lebih rapi.
- **Dashboard hero sekarang menonjolkan total saldo** — Dashboard tidak lagi dibagi pill navigation `Ringkasan / Dompet / Aktivitas`. Total saldo kini tampil langsung di hero utama, sementara ringkasan `Wallet / Anggaran / Anggota` dipindah ke strip di bawah hero agar halaman terasa lebih fokus dan bisa discroll dalam satu alur.
- **Penyesuaian saldo kini otomatis menentukan tambah/kurang** — Form penyesuaian saldo sekarang meminta saldo aktual wallet, lalu Balance menghitung selisih dengan saldo tercatat dan otomatis membuat penyesuaian masuk atau keluar sesuai kebutuhan.
- **Landing dark mode khusus halaman publik dibuat lebih hangat** — Dark mode di landing page kini memakai forest background yang lebih hangat, ambient gradient sage-amber yang lebih terlihat, kartu dengan kontras lebih jelas, dan mockup hero yang terasa lebih inviting. Dashboard dan halaman internal tetap memakai dark mode fokus yang lama.
- **OG metadata diperjelas & redirect locale publik jadi permanen** — Metadata `openGraph` kini memakai URL produksi (`https://mybalance.my.id`), judul/deskripsi Bahasa Indonesia yang lebih sesuai brand, dan detail image lengkap (`type`, `alt`). Redirect canonical publik di middleware (root `/` dan path tanpa locale) sekarang menggunakan status `301` agar crawler memahami hirarki URL permanen. Redirect berbasis auth/sesi tetap `307` (temporary).

- **Kartu transaksi dibuat lebih ringkas dan konsisten** — Daftar transaksi terbaru di dashboard, daftar transaksi di halaman transaksi, dan Riwayat Lengkap kini punya density yang lebih ringan. Ikon kategori diperkecil, metadata diringkas jadi satu baris utama, badge status hanya muncul saat penting, dan area aksi edit/hapus tidak lagi membuat kartu terasa gemuk.
- **Landing header dipoles agar lebih premium** — Header publik kini memakai panel glass yang lebih rapi dan mengambang, hirarki brand/navigation lebih jelas, CTA login/daftar lebih seimbang, dan drawer mobile lebih terstruktur tanpa mengubah isi menu.
- **Pricing & Premium repositioning** — Free AI chat quota lowered to 5/day. Premium at Rp29.000/bulan with unlimited AI, 12-month report history, and PDF export. Landing page redesigned with 2-card pricing comparison and hero emphasizing AI chat-to-transaction flow.

### Fixed

- **Highlight bahasa di Settings kini langsung sinkron setelah ganti locale** — Halaman Settings sekarang membaca locale, theme, timezone, dan default currency langsung dari profile terbaru, sementara cache `shell` dan turunan terkait ikut diinvalidasi saat preference disimpan. Akibatnya kartu bahasa aktif langsung pindah ke pilihan baru tanpa menunggu cache lama habis.
- **Penyesuaian saldo tidak lagi macet saat kategori sistem belum siap** — Saat form penyesuaian saldo perlu membuat kategori sistem `Penyesuaian Saldo Masuk/Keluar`, aplikasi sekarang punya fallback langsung ke tabel kategori. Alur sync saldo jadi tetap berhasil meski RPC kategori sedang belum sinkron atau gagal disiapkan.
- **Console warning duplicate key di navigasi loading** — Skeleton dashboard/sidebar dan nav mobile tidak lagi memakai `href` saja sebagai React key saat wallet aktif belum ada. Item fallback yang sama-sama menuju `/dashboard` kini punya key stabil sendiri, jadi warning duplicate key di console hilang dan render nav tetap konsisten.
- **AI Chat lebih tegas soal kategori, nominal lokal, dan tanggal kasual** — Pencatatan transaksi via AI kini tidak lagi diam-diam menyimpan transaksi tanpa kategori saat `categoryName` tidak ditemukan. Confidence nominal juga sudah memahami format Indonesia seperti `45rb`, `1,5jt`, dan `2 juta`, typo kasual seperti `catet` kini tetap masuk jalur mutasi, serta pembacaan kategori/tanggal relatif lebih peka untuk prompt seperti `kmrn`, `2 hari lalu`, atau kategori income di luar top expense.
- **AI Chat tidak lagi mempercayai jawaban final saat tool gagal** — Setelah tool loop selesai, route kini memeriksa semua payload `role: "tool"` dan menghentikan final streaming biasa bila ada error terstruktur seperti `CONFIDENCE_TOO_LOW`, `DUPLICATE_DETECTED`, `DAILY_SPENDING_CAP_EXCEEDED`, atau `VALIDATION_FAILED`. `NEEDS_CONFIRMATION` tetap memunculkan preview transaksi seperti sebelumnya, sementara error tool non-konfirmasi sekarang dibalas dengan pesan aman deterministic dari server.
- **Halaman Ketentuan Layanan kini benar-benar publik** — Middleware sekarang mengizinkan `/[locale]/terms` diakses tanpa login, sehingga tautan footer landing tidak lagi terlempar ke halaman masuk.
- **Terjemahan kartu Available Budget di dashboard diperbaiki** — Label dan detail `availableBudget` kini menampilkan teks yang benar dalam Bahasa Indonesia ("Sisa Anggaran Bulan Ini") dan Inggris ("This Month's Remaining Budget") alih-alih menampilkan raw key.

## [1.10.0] - 2026-06-17

### Added

- **Landing header & pricing section** — Sticky glass header with smooth-scroll navigation to Features, How It Works, and Pricing sections. New pricing section with an honest free-tier card. Mobile hamburger menu for landing navigation.

## [1.9.0] - 2026-06-14

### Added

- **Free vs Premium — Paket Langganan** — Kartu "Paket Langganan" di Settings menampilkan status plan dan batas AI Chat harian. Free: AI Chat terbatas (default 20 pesan/hari). Premium: AI Chat tanpa batas. Transaksi manual tidak terbatas untuk semua plan. API Key & integrasi AI: selalu gratis tanpa batas plan.

### Changed

- **Modul plan sentral** — Logika penentuan plan (Free/Premium) dipindahkan ke `lib/plan.ts` sebagai sumber kebenaran tunggal. Semua batas pemakaian dibaca dari modul ini.

## [1.8.0] - 2026-06-13

### Fixed

- **AI Chat lebih akurat saat membaca transaksi per hari** — Pertanyaan seperti "transaksi kemarin berapa" kini tidak lagi terlalu sering dijawab dari rekap ringkas saja. AI akan memaksa pembacaan daftar transaksi saat user meminta jumlah/daftar transaksi atau menyebut tanggal relatif seperti kemarin/hari ini, lalu hasil tool juga membawa `totalMatched` agar jumlah transaksi yang disebut lebih konsisten.

## [1.7.0] - 2026-06-12

### Changed

- **AI Chat lebih responsif — loading data diringankan** — Asisten AI kini memuat data dengan strategi lebih ringan: rekap keuangan otomatis di-cache 30 detik, data wallet hanya dimuat lengkap saat perlu pemilih wallet, dan data kategori hanya diambil jika prompt menyebut nama kategori. Alur chat umum non-mutasi langsung menuju streaming tanpa melalui tool-call loop, sehingga token pertama muncul lebih cepat. Untuk prompt mutasi (catat transaksi, kelola anggaran), tool loop tetap berjalan dengan maksimal 3 iterasi.

- **Logging durasi per tahap di AI Chat** — Setiap request chat kini mencatat durasi terstruktur per tahap (auth+limit, preload data, tool loop, stream create, first token, total request) dengan prefix `[AI][timing]` untuk memudahkan debugging performa di production. Tidak ada data sensitif yang tercatat — userId di-hash (8 karakter pertama).

### Added

- **Multi-mata uang (multi-currency)** — Wallet kini memiliki mata uang sendiri (default IDR). Pengaturan default currency bisa diubah di halaman Settings dan diterapkan ke wallet baru. Wallet yang sudah ada tetap menggunakan mata uang yang ditetapkan saat pembuatan. Form pembuatan wallet baru dilengkapi pemilih mata uang.

- **Input jam pada transaksi & tabungan** — Semua form transaksi, penyesuaian saldo, dan entry tabungan kini punya field jam terpisah dari tanggal. Waktu default mengikuti jam sekarang. Jam ditampilkan di semua daftar transaksi, history table, mobile card, entry tabungan, dan export Excel.

- **Timezone otomatis auto-detect** — Timezone user terdeteksi otomatis dari browser (Intl API) dan disimpan ke cookie untuk konsistensi SSR. Display waktu dan tanggal di semua komponen menggunakan timezone user secara eksplisit. Mendukung WIB (Asia/Jakarta), WITA (Asia/Makassar), WIT (Asia/Jayapura), dan timezone IANA lainnya. Fallback ke Asia/Jakarta.
  
- **Multi-turn chat lebih kontekstual** — Tiap pesan user kini otomatis disisipkan pengingat peran AI (system prompt reinforcement) sehingga asisten tetap fokus sebagai asisten keuangan di percakapan panjang. Ditambah klasifikasi intent otomatis (insight/record/edit/general) di client untuk membantu routing yang lebih tepat.
  
- **Running summary finansial** — Ringkasan kompak data keuangan dari tiap percakapan disimpan dan dikirim ulang di turn berikutnya, sehingga AI tetap kontekstual tanpa perlu mengulang seluruh history. Ringkasan diperbarui otomatis setelah setiap respons AI.

- **AI Chat kini bisa mengelola anggaran** — Asisten AI dapat membuat, mengubah, dan menghapus anggaran bulanan per kategori lewat percakapan alami. Cukup minta "set budget makan 500rb" atau "naikin budget transport jadi 1 juta".

- **OG Image card untuk link preview** — Balance kini punya kartu Open Graph 1200×630px yang tampil saat link dibagikan ke Telegram, WhatsApp, Twitter, atau Discord. Desain warm minimalist: krem #fbf9f3, headline sage #595f3d, dan kurva pertumbuhan di sisi kanan.

### Fixed

- **Ikon kategori duplikat di dropdown teratasi** — Ikon kategori tidak lagi muncul ganda di trigger `SelectTrigger` saat kategori dipilih. Kini hanya teks kategori yang terbaca oleh Radix `SelectItemText`, sementara ikon tetap sebagai dekorasi visual di daftar dropdown saja.

- **Dropdown kategori bisa di-scroll** — Konten dropdown kategori kini memiliki tinggi maksimum (`max-h-60`) sehingga daftar kategori yang panjang bisa di-scroll secara alami di mobile dan desktop, tanpa terpotong setinggi satu baris trigger.

- **Edit transaksi dari History tidak lagi crash** — Modal edit History untuk transaksi tanpa kategori sebelumnya error karena Radix Select menolak `value=""`. Kini menggunakan sentinel internal sehingga modal tetap terbuka normal dan server tetap menerima `""` untuk kategori kosong.

### Changed

- **Kontrol mobile diperkecil lagi** — Mengunci `text-size-adjust` browser mobile dan menurunkan ukuran chip, tab, select context, subtitle hero, serta metrik Dashboard/Chat yang masih tampak terlalu besar di perangkat Android.

- **Tipografi Dashboard & Asisten AI lebih proporsional** — Judul hero Dashboard dan Chat/Asisten AI kini diperkecil agar lebih nyaman di mobile. Angka saldo utama, StatCard, kartu wallet, dan heading kosong/sidebar Asisten AI juga diturunkan satu tingkat supaya layar terasa lebih ringan.

- **Mobile nav lebih intentional** — Sidebar desktop collapsed tetap tidak lagi ikut ter-render di mobile. Bottom navigation kembali fokus ke tujuan utama, sementara drawer sekarang dibuka dari tombol floating hamburger di kiri atas agar akses menu sekunder tetap cepat tanpa membebani bottom nav. Loading skeleton ikut diselaraskan supaya state loading dan halaman utama tetap konsisten.

- **Mobile sidebar cleanup** — Fixed sidebar kini hanya muncul di layar `lg`+ (`hidden lg:flex`). Bottom navigation bar (`glass-nav`) dihapus sepenuhnya. Tombol menu mobile dipindah ke kiri sebagai ikon hamburger saja (tanpa teks "Menu"). Padding bottom `pb-24` yang hanya diperlukan untuk bottom nav juga dihapus. Saat drawer ditutup, sidebar hilang total tanpa menyisakan ikon apapun.

- **Sidebar fixed full-height left panel + card sections** — Sidebar desktop sekarang menempel di tepi kiri layar (fixed, full-height) dengan panel solid. Navigasi terbagi jadi dua section: "Navigasi Utama" dan "Aktif Wallet" dengan card-style links yang konsisten antara desktop dan mobile. Layout menggunakan flex dengan sidebar spacer — konten utama otomatis bergeser saat sidebar collapse/expand. Loading skeleton juga diselaraskan dengan layout baru.

### Added

- **Sidebar collapsible + unified mobile drawer** — Sidebar desktop sekarang bisa diciutkan jadi icons-only (lebar 72px) via tombol toggle. State collapse disimpan di localStorage. Di mobile, sidebar berubah jadi overlay drawer menggantikan Sheet sebelumnya, dengan navigasi penuh + shortcut wallet + tombol logout.
- **Dashboard tab-based** — Dashboard kini dibagi menjadi 3 tab horizontal (Ringkasan, Dompet, Aktivitas). Konten terkelompok sehingga pengguna langsung melihat napas keuangan tanpa perlu scroll panjang.
- **Ringkasan finansial Dashboard** — Kolom kanan ringkasan finansial sekarang menampilkan **Pemasukan bulan ini** (`monthIncome`) sebagai pengganti duplikasi `availableBalance` dan `savingBalance` yang sudah ada di kolom kiri. Data pemasukan hanya mencakup transaksi income bulan berjalan.
- **Form buat wallet lebih rapi** — Form pembuatan wallet kini disembunyikan di balik tombol "Buat wallet baru" untuk pengguna yang sudah punya wallet. Pengguna baru (0 wallet) tetap melihat form langsung terbuka. Form bisa ditutup kembali dengan tombol "Batal".

## [1.6.0] - 2026-06-11

### Changed

- **shadcn/ui migration** — 13 komponen inti diadopsi (Button, Dialog, Sheet, Select, Input, Label, Badge, Table, Alert, AlertDialog, RadioGroup, Collapsible, Sonner). Semua visual Serene Capital tetap identik; aksesibilitas meningkat. Tidak ada perubahan UI yang terlihat pengguna.

### Changed - Dependency Upgrades (Major)

- **Next.js 16** (`^16.2.9`) — Partial prerendering matang, Turbopack improvements, server actions lebih stabil. Konvensi `middleware.ts` diganti `proxy.ts` (non-blocking deprecation).
- **ESLint 10** (`^10.4.1`) — Flat config (`eslint.config.mjs`), `.eslintrc.json` dihapus.
- **Tailwind CSS v4** (`^4.3.0`) — `tailwind.config.ts` dihapus, migrasi ke CSS-first config lewat `@import "tailwindcss"` + `@theme`. Build 3-5x lebih cepat.
- **vitest 4** (`^4.1.8`) — Dukungan Vite 6, `expect` API stabil, fake timers built-in.
- **redis 6** (`^6.0.0`) — Type safety lebih baik, `scanIterator` yields `string[]`.
- **@supabase/ssr** (`^0.12.0`), **@supabase/supabase-js** (`^2.108.1`) — Auth helpers lebih stabil.
- **React & React DOM** (`^19.2.7`) — Patch bump.
- **@tailwindcss/postcss** (`^4.3.0`) — Plugin baru sebagai pengganti `tailwindcss` + `autoprefixer` di PostCSS.

### Added - Indikator Kuota Rate Limit & Daily Chat Limit

- **Daily limit AI Chat** (`lib/env.ts`, `lib/rate-limit.ts`, `app/api/ai/chat/route.ts`): Limit chat per hari default 20/hari (konfigurabel via `AI_CHAT_DAILY_LIMIT_MAX`). Dicek sebelum per-minute rate limit. Kalau habis, user dapat pesan "Kuota chat hari ini sudah habis."
- **Indikator dua baris di sidebar** (`components/features/chat/chat-rate-limit-indicator.tsx`): Sekarang nampilin dua progress bar — kuota per menit (X-RateLimit) dan kuota harian (X-DailyLimit). Untuk daily limit, textnya "Reset besok" tanpa countdown.
- **Header daily limit di tiap response** (`app/api/ai/chat/route.ts`, `components/features/chat/chat-page-content.tsx`): Server kirim `X-DailyLimit-Limit`, `X-DailyLimit-Remaining`, `X-DailyLimit-Reset` di setiap response chat. Client baca dan update state.
- **Indikator kuota per menit di sidebar chat**: Menampilkan sisa pakai AI Chat (misal "15 dari 20") dengan progress bar tipis. Saat kuota habis, muncul countdown mundur "Reset 42dtk" yang update tiap detik.
- **Client baca header rate limit**: Setiap response chat (termasuk 429) kini dibaca header `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `X-RateLimit-Reset` untuk update indikator real-time.
- **String kuota bilingual**: Label "Kuota AI", sisa pakai, status "Habis", dan format countdown dalam Bahasa Indonesia dan Inggris.

### Changed - Insight AI Dashboard Kini Lebih Sigap

- **Cache insight AI kini memakai stale-while-revalidate** (`lib/redis.ts`, `app/api/ai/insight/route.ts`): Redis menyimpan pasangan key fresh 45 menit dan stale 4 jam. Saat fresh habis tapi stale masih ada, dashboard langsung menerima insight lama sambil refresh AI berjalan di background.
- **Miss cache total tidak lagi menunggu panggilan AI** (`app/api/ai/insight/route.ts`, `lib/ai/recap.ts`): Kunjungan pertama atau setelah Redis flush sekarang langsung mengembalikan insight deterministik berbasis rekap, lalu narasi AI dipanaskan di background untuk request berikutnya.
- **Invalidasi insight cache saat transaksi berubah** (`lib/data/cache.ts`, `app/actions/transactions.ts`, `lib/ai/data.ts`): Mutasi transaksi manual maupun lewat AI kini ikut membersihkan cache insight semua anggota wallet terkait, sehingga refresh berikutnya mengambil konteks terbaru.
- **Fetch client insight diringankan** (`components/features/dashboard/dashboard-ai-insight.tsx`): Request client tidak lagi memaksa `no-store`, sehingga browser boleh ikut membantu caching ringan tanpa mengubah UX kartu.

### Changed - AI Chat Budgeting Lebih Cerdas

- **Prompt AI kini adaptif terhadap periode** (`lib/ai/prompts.ts`): Konteks untuk periode `day` otomatis jauh lebih ringkas, `week` jadi versi menengah, dan `month` tetap detail penuh. Saat compact mode aktif, detail periode makin dipangkas tanpa kehilangan angka inti.
- **Estimasi token lebih realistis** (`lib/ai/token-budget.ts`): Heuristic baru kini memperhitungkan kata, angka, tanda baca, framing per message, dan overhead definisi tool sehingga pre-flight budgeting lebih mendekati payload DeepSeek/OpenAI-compatible yang sebenarnya.
- **Trim riwayat chat server-side kini mempertimbangkan relevance score** (`lib/chat-session.ts`, `app/api/ai/chat/route.ts`): Client mengirim skor relevance ringan untuk tiap message terpilih, lalu server membuang konteks lama yang paling rendah nilainya lebih dulu saat token budget mepet.
- **Pre-flight guard sebelum ambil data AI** (`lib/ai/chat-budget.ts`, `app/api/ai/chat/route.ts`): Jika bahkan jalur compact paling minimal pun jelas tidak akan muat dalam budget token, request dihentikan lebih awal dengan respons ramah, sehingga menghindari fetch data dan panggilan AI yang sia-sia.
- **Batas ukuran hasil tool selama tool loop** (`lib/ai/chat-budget.ts`, `app/api/ai/chat/route.ts`): Saat total output tool sudah memakan porsi besar budget, route berhenti memanggil tool tambahan dan langsung lanjut ke jawaban akhir dengan konteks yang sudah ada.
- **Test coverage budgeting AI diperluas** (`tests/unit/{ai-chat-budget,ai-prompts,ai-token-budget,chat-session}.test.ts`): Menambah pengujian untuk compression berbasis periode, trimming relevance-aware, pre-flight guard, serialization aman ke model, dan tool-result budget guard.

### Changed - Simplifikasi Navigasi & UX

- **Transaksi & Histori digabung** (`app/[locale]/(app)/wallets/[walletId]/transactions/page.tsx`): Halaman transaksi kini punya toggle "Input Cepat" | "Riwayat Lengkap" — tidak perlu pindah halaman untuk melihat histori penuh. Route `/transactions/history` otomatis redirect ke `/transactions?view=history`.
- **Daftar Wallet masuk Dashboard** (`app/[locale]/(app)/dashboard/page.tsx`): Form buat wallet baru dan kartu wallet kini ada di Dashboard. Halaman `/wallets` redirect ke `/dashboard`. Navigasi "Wallet" di sidebar/bottom nav sekarang langsung ke wallet utama.
- **Wallet Tabs disederhanakan** (`components/wallet-tabs.tsx`): Tab Members, Settlements, Templates, dan Recurring dikelompokkan dalam dropdown "Pengaturan". Tab utama kini: Overview, Transaksi, Tabungan, Anggaran, Laporan, Pengaturan.
- **Bottom nav mobile 5 item** (`components/app-shell.tsx`): Dashboard, Wallet, Transaksi, Chat AI, Pengaturan — lebih ringkas untuk layar kecil. Reports dan Changelogs tetap ada di sidebar desktop dan drawer mobile.

## [1.5.0] - 2026-06-10

### Added - Kelola Kategori Sendiri

- **Halaman kategori wallet baru** (`app/[locale]/(app)/wallets/[walletId]/categories/page.tsx`, `components/features/categories/categories-page-content.tsx`): User owner/editor sekarang bisa membuka halaman khusus untuk melihat semua kategori transaksi per wallet, lengkap dengan badge jenis dan penanda kategori sistem.
- **Server actions kategori** (`app/actions/categories.ts`): Tambah `createCategory`, `updateCategory`, dan `deleteCategory` dengan validasi nama/jenis/warna, pengecekan duplikat per wallet, proteksi kategori sistem, invalidasi cache granular, dan revalidasi halaman terkait.
- **Color palette picker Serene Capital** (`components/ui/color-palette.tsx`, `lib/categories.ts`): Form tambah/edit kategori kini memakai pilihan warna hex yang konsisten dengan tone sage, forest, dan warm neutrals aplikasi.
- **Navigasi dan i18n kategori** (`components/{app-shell,ui/page-loading-skeleton,ui/app-icon}.tsx`, `messages/{id,en}.json`): Sidebar, mobile navigation, shortcut wallet aktif, ikon, dan copy bilingual kini mencakup tujuan baru `Kategori`.
- **Cache dan data loader kategori** (`lib/data/{cache,index,mappers,types}.ts`): Tambah cache key/target untuk halaman kategori dan page data mapper khusus agar perubahan kategori ikut menyegarkan transaksi, anggaran, recurring, template, dan ringkasan wallet.
- **Test coverage tambahan** (`tests/unit/{categories,data-mappers,redis-cache}.test.ts`): Tambah pengujian helper kategori, mapper page data kategori, dan key/pattern cache baru.

### Added - Smart Token Budgeting & History Windowing

- **Token budget estimation** (`lib/ai/token-budget.ts`): Conservative heuristic-based token counter (chars ÷ 3.5) for mixed Indonesian/English text. Computes total token consumption of conversation messages before sending to the AI model.
- **Pre-flight budget check**: Before every AI call, the chat route estimates token usage. If over budget, it first switches the system prompt to compact mode, then trims older messages as a last resort. Logs a warning so operators can tune `AI_CHAT_TOKEN_BUDGET`.
- **Configurable token budget**: New env var `AI_CHAT_TOKEN_BUDGET` (default `8192`) controls the maximum tokens allowed per AI call.
- **Compact system prompt mode** (`buildAiSystemPrompt`): When token budget is tight, per-wallet breakdown collapses to a single summary, top categories limit to 3, and less-critical details (previous period comparison for "day", recent notes when >2 wallets) are omitted.
- **Tool result compression** (`executeAiToolCall`): Financial recap results now strip range fields, limit perWallet to top 3, and limit categories to top 3. Transaction lists limit to 5 items and drop `id`/`walletId` fields.
- **Sliding-window chat history** (`buildWindowedChatMessages`): Always includes the last 5 exchanges, then picks the 3 most relevant older exchanges by keyword overlap with the current message. Capped at 24 total messages.

### Changed

- `buildChatRequestMessages` now delegates to the new `buildWindowedChatMessages` for smarter history selection.

### Added - Confidence-based Transaction Recording & Duplicate Prevention

- **Confidence scoring engine** (`lib/ai/confidence.ts`): AI now evaluates transaction confidence before inserting — checks amount cross-validation, category resolution, wallet mention, intent clarity, and date clarity. Returns `high` (auto-save), `medium` (needs confirmation), or `low` (rejected) tiers.
- **User confirmation card**: When AI confidence is medium, users see an inline confirmation card in chat with transaction details and "Ya, Catat" / "Batal" buttons before the transaction is saved.
- **Duplicate transaction detection**: Automatically detects if an identical transaction (same wallet, kind, amount ±10%) was created within the last 5 minutes and prevents duplicate entries.
- **Daily spending cap** (opt-in): New environment variables `DAILY_SPENDING_CAP_ENABLED` and `DAILY_SPENDING_CAP_AMOUNT`. When enabled, AI blocks new expenses that would exceed the daily limit.
- **`confirmTransaction` AI tool**: New tool allows the AI to finalize transactions that were flagged for confirmation after user approval.
- **`/api/ai/confirm-transaction` endpoint**: REST endpoint for the confirmation card to save pre-validated transactions bypassing the confidence engine.
- **System prompt updates**: AI now knows how to handle `NEEDS_CONFIRMATION`, `CONFIDENCE_TOO_LOW`, `DUPLICATE_DETECTED`, and `DAILY_SPENDING_CAP_EXCEEDED` responses.

### Added - AI Resilience & Upstream Handling

- **Retry logic dengan exponential backoff:** Panggilan ke DeepSeek/OpenRouter kini dibungkus dengan `createAiChatCompletion()` yang otomatis retry hingga 2x (total 3 attempt) dengan backoff 1s/2s untuk error retryable (429, 5xx, network/timeout). Non-streaming call juga menaikkan temperature +0.1 per retry.
- **Handling 429 upstream:** `RateLimitError` dari upstream diparse `Retry-After` header-nya; jika masih gagal setelah retry, AI fallback ke jawaban lokal berbasis data (bukan error mentah `prepareFailed`).
- **Timeout eksplisit per request:** 30s untuk non-streaming, 60s untuk streaming via `AbortSignal.timeout()` — mencegah hanging request.
- **Streaming timeout & partial response:** Server mengirim SSE event `streamTimeout` jika stream read melebihi 60s. Client menampilkan partial response yang sudah diterima bersama indikator timeout.
- **Validasi output AI diperketat:** Tool `createTransaction` kini punya pre-validation di `executeAiToolCall` — `walletId` wajib non-empty, `amount` harus > 0, `kind` harus `income`/`expense`. Error terstruktur dikembalikan ke model supaya bisa koreksi diri di loop berikutnya.

### Changed - Security Hardening (7 Fixes)

#### Perbaikan Keamanan

- **RPC `ensure_balance_adjustment_category` diamankan:** Parameter `actor_user_id` dihapus; fungsi sekarang menggunakan `auth.uid()` dan memeriksa role `owner`/`editor` via `private.has_wallet_role()`.
- **API-key transaction route kini mematuhi limit free tier & rate limit:** Route `/api/chat/transaction` sekarang memanggil `checkFreeTransactionLimit`, `consumeTransactionRateLimit`, dan `incrementTransactionCount` — sejalan dengan flow manual.
- **Token undangan hanya bisa dibaca oleh owner:** Kebijakan RLS `wallet_invitations` diubah menjadi owner-only; non-owner tidak lagi bisa melihat token undangan melalui query biasa. Halaman members menggunakan admin client untuk mengambil token saat user adalah owner.
- **Insert anggota wallet dibatasi:** Kebijakan `wallet_members_insert_owner` kini hanya mengizinkan pembuat wallet menambahkan dirinya sebagai owner saat pembuatan wallet.
- **URL konfirmasi signup menggunakan origin yang dikonfigurasi:** Mengganti `headers().get("origin")` dengan `getSiteUrl()` untuk mencegah serangan terbuka melalui header `Origin`.
- **Ekspor Excel terlindung dari formula injection:** Sel yang diawali `=`, `+`, `-`, `@`, tab, atau CR diberi prefix `'` untuk memaksa format teks.
- **Pesan error database tidak lagi bocor ke pengguna:** Semua `error.message` yang sebelumnya dikembalikan langsung ke pengguna kini dipetakan melalui `safeDbError()` atau pesan aman yang sudah diterjemahkan. Berlaku di actions: budgets, settlements, transactions, wallets, api-keys, recurring-transactions, templates, theme, savings. Berlaku juga di endpoint API: `/api/chat/transaction` dan `/api/chat/rekap`.

#### File Diubah
| File | Perubahan |
|---|---|
| `supabase/migrations/0011_security_fixes.sql` | Migrasi baru: RPC diamankan, RLS invites owner-only, insert wallet_members dibatasi. |
| `app/actions/_shared.ts` | Tambah helper `safeDbError()`. |
| `app/actions/transactions.ts` | Hapus parameter userId RPC, tambah safeDbError. |
| `app/actions/budgets.ts` | Ganti error.message dengan safeDbError. |
| `app/actions/settlements.ts` | Ganti error.message dengan pesan aman. |
| `app/actions/wallets.ts` | Ganti error.message dengan pesan aman (12 titik). |
| `app/actions/api-keys.ts` | Ganti error.message dengan safeDbError. |
| `app/actions/recurring-transactions.ts` | Ganti error.message dengan safeDbError. |
| `app/actions/savings.ts` | Ganti error.message dengan safeDbError di fallback mapSavingError. |
| `app/actions/templates.ts` | Ganti error.message dengan pesan aman. |
| `app/actions/theme.ts` | Ganti error.message dengan translate. |
| `app/actions/auth.ts` | Ganti `headers().get("origin")` dengan `getSiteUrl()`. |
| `app/api/chat/transaction/route.ts` | Tambah free tier / rate limit; sembunyikan insertError.message. |
| `app/api/chat/rekap/route.ts` | Sembunyikan txError.message. |
| `lib/data/queries.ts` | Pisah queryInvitations jadi safe (tanpa token) + admin-client token query. |
| `lib/data/types.ts` | Tambah `InvitationRowSafe`. |
| `lib/data/index.ts` | Export `queryInvitationTokens`. |
| `lib/wallet-capacity.ts` | Update parameter type ke InvitationRowSafe. |
| `components/features/transactions/export-excel-button.tsx` | Tambah sanitasi formula injection. |
| `messages/{id,en}.json` | Tambah key `duplicateEntry`, `referenceNotFound`, `unexpectedError`. |
| `app/[locale]/(app)/wallets/[walletId]/members/page.tsx` | Token undangan diambil via admin client. |

### Added - Reset Riwayat AI Chat

#### Peningkatan Kontrol Percakapan
- **Halaman AI chat kini punya tombol reset di pojok kanan atas:** Setelah diklik, muncul konfirmasi dua langkah yang mencegah penghapusan riwayat chat secara tidak sengaja.
- **Konfirmasi sebelum menghapus:** Tombol "Reset" berubah menjadi pertanyaan konfirmasi dengan opsi "Ya, Hapus" dan "Batal".
- **Semua state di-reset bersih:** Pesan, periode, wallet aktif, dan input kembali ke kondisi awal tanpa perlu reload halaman.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/chat-session.ts` | Tambah fungsi `clearChatHistory()` untuk menghapus localStorage. |
| `components/features/chat/chat-page-content.tsx`, `messages/{id,en}.json` | Tambah tombol reset dengan konfirmasi dua langkah dan terjemahan baru. |

### Added - AI Chat Bisa Mencatat Transaksi

#### Peningkatan Asisten Finansial
- **AI chat kini bisa membantu mencatat transaksi baru langsung dari percakapan:** Setelah user memberi instruksi yang jelas, asisten dapat membuat pemasukan atau pengeluaran baru lewat tool call server-side yang tetap memakai akses user asli.
- **Daftar kategori kini tersedia untuk tool AI:** Asisten bisa membaca kategori per wallet, lalu memilih atau menawarkan kategori yang paling relevan sebelum mencatat transaksi.
- **Flow pencatatan AI tetap mengikuti guard rail transaksi utama:** Limit plan free, rate limit transaksi, validasi tanggal/nominal, pemeriksaan role wallet, cache invalidation, dan revalidasi halaman tetap selaras dengan flow input manual.
- **Halaman chat kini lebih eksplisit soal kemampuan baru ini:** Copy bantuan dan suggestion chip diperbarui agar user tahu asisten bisa membantu mencatat transaksi, bukan hanya menganalisis data.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/ai/{data,tools,prompts}.ts` | Tambah helper kategori, create transaction via AI berbasis RLS user, tool definition/execution baru, dan instruksi prompt untuk flow pencatatan transaksi. |
| `components/features/chat/chat-page-content.tsx`, `messages/{id,en}.json` | Tambah affordance UI/copy agar kemampuan pencatatan transaksi lebih terlihat di halaman chat. |
| `tests/unit/{ai-tools,ai-prompts}.test.ts`, `lib/changelogs.ts` | Tambah safety net untuk tool/prompt AI dan entry What's New baru. |

### Fixed - Mobile Layout dan Shortcut Input AI Chat

#### Perbaikan Kenyamanan AI Chat
- **Card chat history dan input message kini lebih aman di layar kecil:** Bubble pesan, kata panjang tanpa spasi, dan konten AI yang panjang tidak lagi mudah mendorong layout melebar ke samping.
- **Composer AI chat kini lebih nyaman untuk pesan multi-baris:** `Enter` sekarang membuat baris baru, sementara `Ctrl+Enter` atau `Cmd+Enter` dipakai untuk kirim cepat selain tombol `Kirim`.
- **Footer input lebih fleksibel di mobile:** Hint shortcut dan tombol kirim kini tetap rapi saat ruang horizontal terbatas.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/chat/{chat-message,chat-page-content,chat-input}.tsx` | Rapikan batas lebar bubble, cegah overflow horizontal, dan ubah shortcut submit agar `Enter` membuat newline. |
| `tests/unit/chat-input-shortcuts.test.ts`, `messages/{id,en}.json`, `lib/changelogs.ts` | Tambah test shortcut keyboard, perbarui hint bilingual, dan tambah entry What's New baru. |

### Fixed - AI Chat Rekap dan Riwayat Percakapan

#### Perbaikan Stabilitas Asisten AI
- **Chip `Rekap hari ini`, `Rekap minggu ini`, dan `Rekap bulan ini` kini selalu memakai periode yang benar:** Suggestion tidak lagi diam-diam tetap mengirim konteks bulanan saat user memilih rekap harian atau mingguan.
- **Permintaan rekap eksplisit kini dijawab langsung dari data Balance secara deterministik:** User tetap menerima ringkasan pemasukan, pengeluaran, net, jumlah transaksi, dan sorotan utama meski model AI/provider sedang tidak konsisten.
- **Riwayat chat sekarang tetap tersimpan saat user pindah tab atau kembali ke halaman chat:** State percakapan, wallet terpilih, dan periode aktif dipersist ke storage client lalu dipulihkan saat halaman dibuka lagi.
- **Pertanyaan chat bebas tidak lagi sering jatuh ke penutup generik yang sama:** Route AI kini memakai jawaban final pertama saat model sudah selesai, alih-alih meminta jawaban kedua tanpa turn user baru.
- **Jawaban AI bebas kini dipaksa lebih berbobot:** Prompt sistem sekarang menuntut fakta konkret dari data, dan fallback server-side mengambil alih bila respons model terlalu generik.
- **Penyebutan kategori seperti `cicilan`, `makan`, atau `transport` kini lebih nyambung dengan data user:** Route chat mendeteksi kategori dari pertanyaan user lalu menambah konteks kategori spesifik ke prompt dan fallback jawaban.
- **Kategori yang disebut user kini ikut dibaca bersama status anggaran bulan berjalan:** Saat ada anggaran aktif, chat bisa memberi sinyal apakah kategori itu masih aman, mulai mepet, atau sudah lewat batas.
- **Kategori kini bisa dibandingkan dengan periode sebelumnya yang setara:** Pertanyaan seperti `cicilan bulan ini vs bulan lalu` atau `makan minggu ini dibanding minggu lalu` kini punya konteks delta nominal dan persentase.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/api/ai/chat/route.ts`, `lib/ai/{data,recap-message,chat-response,fallback-response}.ts`, `lib/ai/prompts.ts`, `lib/chat-auth.ts` | Tambah deteksi kategori dari prompt user, status anggaran kategori, pembanding periode sebelumnya, fallback jawaban substantif, dan instruksi agar AI wajib menjawab dengan fakta konkret. |
| `components/features/chat/chat-page-content.tsx`, `lib/chat-session.ts` | Sinkronkan chip rekap dengan periode aktif yang benar dan persist session chat ke `localStorage`. |
| `tests/unit/{ai-recap-message,ai-chat-response,ai-fallback-response,ai-category-focus,chat-session}.test.ts`, `lib/changelogs.ts` | Tambah test helper rekap/session/response/fallback/category-focus dan entry What's New baru. |

### Added - Guard Rail AI Chat dan Limit Fair Use

#### Peningkatan Keamanan dan Batas Penggunaan
- **User free kini dibatasi maksimal 20 transaksi per bulan:** Counter bulanan tersimpan di profil user dan otomatis reset saat bulan UTC berganti.
- **Aksi transaksi sekarang punya rate limit per user:** Permintaan create transaksi dan penyesuaian saldo dibatasi agar spam singkat tidak membanjiri insert.
- **AI chat kini punya rate limit dan filter input statis:** Prompt injection, topik jelas non-keuangan, dan pesan di atas 500 karakter ditolak lebih awal dengan fallback SSE yang tetap ramah.
- **Prompt sistem AI diperkeras untuk tetap fokus di domain finansial:** Asisten diarahkan mengabaikan upaya override instruksi, permintaan kode, dan topik exploit.

#### File Diubah
| File | Perubahan |
|---|---|
| `supabase/migrations/0015_user_plan_tier.sql`, `.env.example`, `lib/env.ts` | Tambah kolom plan/counter bulanan dan knob env baru untuk kuota transaksi serta rate limit. |
| `lib/{transaction-limits,rate-limit}.ts`, `app/actions/transactions.ts` | Tambah pengecekan plan free, reset/increment counter bulanan, dan limiter transaksi per user. |
| `app/api/ai/chat/route.ts`, `lib/ai/{guard,prompts}.ts`, `components/features/chat/chat-input.tsx` | Tambah validasi pesan AI, limiter chat, header rate limit, hardening prompt, dan batas 500 karakter di client. |
| `tests/unit/{transaction-limits,ai-chat-guard,rate-limit}.test.ts`, `messages/{id,en}.json`, `lib/changelogs.ts` | Tambah cakupan test, copy bilingual baru, dan entry What's New terbaru. |

### Added - AI Chatbot Insight dan Rekap Keuangan

#### Peningkatan Asisten Finansial
- **Balance kini punya halaman `/chat` khusus Asisten AI:** User bisa bertanya dengan bahasa natural untuk melihat rekap harian, mingguan, atau bulanan, lengkap dengan opsi fokus ke wallet tertentu.
- **Dashboard sekarang menampilkan panel "Insight AI":** Kartu naratif singkat dirender terpisah dari stat card agar user cepat memahami kondisi keuangan tanpa membuka halaman lain.
- **Integrasi DeepSeek memakai endpoint OpenAI-compatible di sisi server:** Konteks rekap utama di-inject ke prompt, lalu AI tetap bisa meminta detail transaksi atau status anggaran melalui tool call server-side saat memang perlu.
- **Fallback tetap ramah saat AI dimatikan atau provider bermasalah:** Dashboard insight diam-diam menghilang bila gagal, sementara halaman chat memberi pesan yang tenang alih-alih merusak flow utama aplikasi.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/api/ai/{chat,insight}/route.ts`, `lib/ai/*`, `.env.example`, `package*.json` | Tambah infrastruktur AI DeepSeek-compatible, prompt/tooling server-side, insight JSON endpoint, dan streaming chat SSE. |
| `app/[locale]/(app)/chat/page.tsx`, `components/features/chat/*` | Tambah halaman chat khusus Asisten AI dengan suggestion chips, selector periode/wallet, streaming bubble, dan panel bantuan. |
| `components/features/dashboard/dashboard-{content,ai-insight}.tsx`, `components/{app-shell,ui/app-icon}.tsx`, `messages/{id,en}.json`, `lib/changelogs.ts` | Sisipkan panel insight di dashboard, tambah item navigasi baru, ikon chat, copy bilingual, dan entry What's New. |

## [1.4.0] - 2026-06-09

### Added - Halaman Changelog dan Popup Pembaruan

#### Peningkatan Komunikasi Produk
- **Balance kini punya halaman `/changelogs` untuk ringkasan pembaruan fitur:** User bisa melihat timeline versi, tanggal rilis, deskripsi, dan daftar fitur utama tanpa membaca changelog teknis repo.
- **Popup "Yang Baru" otomatis muncul saat ada versi fitur yang belum dibaca:** Dialog client-side membandingkan versi terakhir yang dilihat di `localStorage` dan hanya menampilkan entry yang lebih baru.
- **Navigasi changelog tersedia di sidebar desktop dan drawer mobile:** Bottom navigation tetap ringkas dengan lima item utama, sementara changelog bisa diakses dari menu lengkap.
- **Instruksi agent kini mengingatkan update changelog produk otomatis:** Perubahan fitur user-facing berikutnya harus ikut memperbarui `lib/changelogs.ts` agar halaman dan popup tetap relevan.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/changelogs.ts`, `components/features/changelogs/*`, `app/[locale]/(app)/changelogs/page.tsx` | Tambah data changelog statis, halaman timeline, dan popup unread berbasis localStorage. |
| `components/{app-shell,ui/app-icon}.tsx`, `messages/{id,en}.json` | Tambah item navigasi, ikon changelog, dan copy bilingual untuk halaman/dialog. |

### Fixed - Crash Pagination Riwayat Transaksi

#### Perbaikan Stabilitas History Transaksi
- **Pagination histori transaksi kini memakai state terkontrol:** Tombol `Berikutnya` dan `Sebelumnya` tidak lagi bergantung pada state internal tabel yang bisa menjadi tidak sinkron saat hasil filter berubah.
- **Perpindahan halaman kini otomatis direset atau di-clamp saat dataset menyusut:** Pencarian dan perubahan hasil tidak lagi meninggalkan `pageIndex` di halaman yang sudah tidak valid.
- **Render tanggal dan jam transaksi kini tahan terhadap data buruk:** Formatter tanggal/jam mengembalikan fallback aman alih-alih melempar error ketika menemukan nilai `happenedAt` yang invalid.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/transactions/transaction-history-page-content.tsx` | Ubah pagination history menjadi controlled state, reset/clamp page index, dan render jam transaksi memakai formatter aman. |
| `lib/{utils,transaction-history-pagination}.ts` | Kuatkan formatter tanggal/jam dengan fallback aman dan tambah helper pagination murni untuk logic clamp/slice. |
| `tests/unit/{utils,transaction-history-pagination}.test.ts` | Tambah cakupan test untuk fallback tanggal invalid, halaman 2, dan reset/clamp pagination. |

### Added - Export Excel Transaksi dan Export PDF Laporan

#### Peningkatan Export dan Pelaporan
- **Histori transaksi kini bisa diunduh sebagai file Excel per bulan aktif:** Tombol export baru mengambil seluruh transaksi bulan terpilih, bukan hanya hasil pencarian atau pagination yang sedang terlihat.
- **Halaman laporan kini bisa menghasilkan PDF bulanan yang lebih rapi untuk dibagikan:** File PDF dirender di server dengan ringkasan income, expense, net, tabel tren bulanan, dan breakdown kategori pengeluaran.
- **Locale dan copy export ikut menyesuaikan bahasa aktif:** Label tombol, nama kolom, dan isi laporan PDF memakai dictionary `id/en` yang sama dengan surface aplikasi.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/{transactions/export-excel-button,reports/export-pdf-button}.tsx` | Tambah tombol export client-side untuk Excel dan trigger download PDF dari API. |
| `app/api/reports/[walletId]/pdf/route.ts`, `lib/pdf/*` | Tambah pipeline data + dokumen PDF server-side dengan auth dan membership check. |
| `components/features/transactions/transaction-history-page-content.tsx`, `app/[locale]/(app)/wallets/[walletId]/reports/page.tsx` | Pasang tombol export ke halaman histori transaksi dan reports. |
| `components/ui/app-icon.tsx`, `messages/{id,en}.json`, `lib/utils.ts` | Tambah ikon download, copy i18n export, dan helper nama file aman. |

## [1.3.0] - 2026-06-08

### Changed - Dokumentasi Theme Modes di AGENTS

#### Peningkatan Dokumentasi Agent
- **`AGENTS.md` kini ikut menegaskan bahwa semua perubahan UI harus aman di dua tema render:** Light Mode dan Dark Mode.
- **Instruksi implementasi dibuat lebih operasional untuk agent coding:** Prefer semantic theme tokens dan shared classes dibanding warna hardcoded agar hover, overlay, chart, dan focus state tetap benar di kedua theme.

#### File Diubah
| File | Perubahan |
|---|---|
| `AGENTS.md` | Tambah panduan eksplisit soal dua theme render dan anjuran memakai token theme-aware untuk semua perubahan UI. |

### Changed - Dokumentasi Theme Modes di DESIGN

#### Peningkatan Dokumentasi Agent
- **`DESIGN.md` kini menjelaskan secara eksplisit bahwa Balance selalu dirender dalam dua mode visual:** Light Mode dan Dark Mode, walaupun preferensi user juga bisa memakai opsi `system`.
- **Arah visual dark mode kini terdokumentasi lebih jelas:** Agent lain tidak lagi perlu menebak apakah palet Serene Capital hanya berlaku untuk light mode atau juga untuk surface gelap.
- **Sumber token tema runtime ikut diperjelas:** Dokumentasi sekarang mengarahkan implementasi konkret light/dark ke `app/globals.css` agar perubahan UI berikutnya tetap memakai semantic tokens.

#### File Diubah
| File | Perubahan |
|---|---|
| `DESIGN.md` | Tambah section khusus theme modes, jelaskan relasi `light`/`dark`/`system`, dan pertegas panduan token lintas theme. |

### Fixed - Kontras Chart Dashboard dan Navigasi Wallet di Dua Theme

#### Perbaikan UI
- **Chart pengeluaran harian kini lebih aman di light mode dan dark mode:** Surface chart, garis grid, batang aktif, serta ring highlight hari ini sekarang memakai token warna berbasis tema sehingga tetap terbaca tanpa glare di light mode atau tenggelam di dark mode.
- **State aktif tab dan shortcut wallet kini konsisten lintas theme:** Teks aktif tidak lagi memakai putih hardcoded di atas `bg-primary`, jadi label wallet tetap jelas saat dark mode menggunakan `on-primary` yang lebih gelap.
- **Hover wallet di mobile tidak lagi terasa "terlalu putih" pada dark mode:** Shortcut wallet nonaktif sekarang memakai hover berbasis token muted/primary-soft, bukan `hover:bg-white`, supaya tetap harmonis dengan surface gelap.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/dashboard/dashboard-daily-expense-chart.tsx` | Samakan surface, grid, batang, dan highlight chart ke token warna theme-aware. |
| `components/{app-shell,wallet-tabs}.tsx` | Rapikan warna state aktif dan hover wallet agar kontras tetap aman di light/dark mode. |

### Fixed - Warna Card Panel Login/Register Lebih Selaras

#### Perbaikan UI
- **Panel brand auth kini terasa lebih menyatu dengan palet Serene Capital:** Kartu highlight dan panel ritme tidak lagi memakai blok sage gelap yang terlalu berat di atas surface terang.
- **Hierarchy teks dibuat lebih tenang dan terbaca:** Judul, eyebrow, subtitle, dan label internal kini memakai tone forest/sage yang lebih konsisten dengan card utama.
- **Kontras tetap terjaga tanpa terasa keras:** Panel kecil sekarang memakai cream translucent dengan border dan shadow lembut agar masih terpisah jelas tetapi tidak tampak "nempel asing".
- **Dark mode kini ikut aman dibaca:** Treatment panel auth dipisah menjadi surface khusus per theme sehingga versi gelap tetap hangat, berlapis, dan tidak tenggelam ke background.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/auth/auth-brand-panel.tsx` | Samakan warna teks, tile highlight, dan panel ritme pada surface auth brand agar lebih harmonis di login/register. |

### Fixed - Visual Chart Dashboard Lebih Tenang dan Mudah Dibaca

#### Perbaikan UI
- **Chart pengeluaran harian tidak lagi terasa seperti deretan batang sempit yang padat:** Visual dashboard kini memakai area/line chart yang lebih halus sehingga pola belanja bulanan lebih cepat terbaca.
- **Penekanan data penting dibuat lebih jelas tanpa terasa ramai:** Hari ini dan titik pengeluaran puncak sekarang ditandai langsung di chart, sementara grid dan sumbu bawah dibuat tipis agar tetap mengikuti nuansa Serene Capital.
- **Scroll horizontal di mobile tetap aman tetapi lebih natural:** Chart mempertahankan ruang baca minimum untuk bulan penuh tanpa membuat isi kartu terasa sesak.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/dashboard/dashboard-daily-expense-chart.tsx` | Ganti chart batang menjadi SVG area/line chart yang lebih halus, tambah grid lembut, marker highlight, dan ringkasan sumbu sederhana. |

### Fixed - Proporsi Card Wallet di Dashboard dan Halaman Wallet

#### Perbaikan UI
- **Card wallet kini tidak lagi dipaksa terlalu sempit di viewport tanggung:** Grid wallet aktif di dashboard dan daftar wallet sekarang memakai pola auto-fit dengan lebar minimum, sehingga card turun baris lebih natural daripada memadat aneh.
- **Hierarchy isi card dibuat lebih tenang dan seimbang:** Saldo utama dipisahkan lebih jelas dari detail saldo turunan, area anggota/anggaran diringkas ke panel bawah, dan CTA buka wallet tetap mudah ditemukan.
- **Loading skeleton, micro-interaction, dan status anggaran ikut disesuaikan:** Struktur skeleton dashboard dan halaman wallet kini mengikuti komposisi card baru, kartu wallet aktif mendapat hover serta animasi masuk ringan yang tetap menghormati `prefers-reduced-motion`, dan wallet dengan anggaran yang mulai mepet kini punya tone visual yang lebih mudah dipindai tanpa terasa agresif.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/{dashboard/dashboard-content,wallets/wallets-page-content}.tsx` | Rapikan layout card wallet, CTA, progress anggaran, dan susunan detail saldo. |
| `components/ui/page-loading-skeleton.tsx`, `app/globals.css` | Ubah grid wallet ke auto-fit dan samakan skeleton dengan komposisi card baru. |

### Changed - Polish Ikon, Dashboard, dan Kartu Transaksi

#### Peningkatan UI Serene Capital
- **Navigasi app kini memakai set ikon inline SVG yang konsisten:** Sidebar desktop, drawer mobile, shortcut wallet, bottom nav, dan loading skeleton sekarang memakai ikon stroke rounded yang mengikuti tone warna desain.
- **Form kategori transaksi tetap native tetapi lebih jelas:** Select kategori kini dibungkus leading icon berdasarkan kategori aktif tanpa mengganti aksesibilitas native select atau menambah dependency baru.
- **Kartu transaksi terbaru dibuat lebih ringkas dan lebih informatif:** Item transaksi sekarang menampilkan ikon kategori, metadata pendek, nominal, tanggal, chip editable untuk owner/editor, serta affordance edit yang hanya dibuka saat dibutuhkan.
- **Dashboard mendapat hierarchy yang lebih tegas:** Ringkasan saldo total, kategori pengeluaran terbesar, transaksi terbaru, dan CTA tambah transaksi tampil lebih fokus tanpa perubahan loader utama atau migrasi database.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/{app-shell,ui/page-loading-skeleton,ui/app-icon,ui/category-select}.tsx` | Tambah helper ikon reusable dan pakai ikon konsisten di nav, shortcut, drawer, bottom nav, dan skeleton. |
| `components/features/{dashboard/dashboard-content,transactions/transactions-page-content,transactions/transaction-history-page-content}.tsx` | Polish hierarchy dashboard, wrapper select kategori berikon, serta kartu transaksi ringkas dengan affordance edit yang lebih jelas. |
| `lib/data/{types,mappers}.ts`, `tests/unit/data-mappers.test.ts` | Tambah `categoryColor` non-persisten untuk recent transaction dan transaction list item, lalu update test mapper. |
| `messages/{id,en}.json` | Rapikan copy dashboard dan transaksi agar sesuai surface baru yang lebih ringkas. |

### Changed - Chart Pengeluaran Harian di Dashboard

#### Peningkatan Visualisasi Dashboard
- **Kartu pengeluaran harian kini menjadi chart batang bulanan:** Section Dashboard tidak lagi menampilkan daftar nominal sparse, tetapi chart harian penuh untuk seluruh tanggal pada bulan berjalan.
- **Hari tanpa transaksi tetap terlihat sebagai nol:** Agregasi harian dashboard sekarang mengisi seluruh tanggal bulan aktif agar tren pengeluaran lebih mudah dibaca tanpa lompatan tanggal.
- **Visual tetap ringan tanpa library chart baru:** Implementasi mengikuti pola HTML/CSS sederhana seperti halaman laporan, lengkap dengan ringkasan hari puncak dan jumlah hari aktif.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/dashboard/{dashboard-content,dashboard-daily-expense-chart}.tsx` | Ganti daftar pengeluaran harian dengan chart batang server-side dan ringkasan pendamping. |
| `lib/data/{types,mappers}.ts` | Ubah `dailyExpenses` menjadi series bulanan penuh dengan label hari dan metadata tampilan. |
| `messages/{id,en}.json`, `tests/unit/data-mappers.test.ts` | Tambah copy caption chart dan update test agar mencakup zero-filled daily series. |

## [Unreleased] — 2026-06-07

### Added — Kartu Pengeluaran Harian di Dashboard

#### Peningkatan Ringkasan Dashboard
- **Dashboard kini menampilkan rincian pengeluaran harian bulan berjalan:** Setelah total pengeluaran bulanan, user bisa langsung melihat daftar nominal per hari yang benar-benar punya transaksi expense tanpa perlu membuka histori.
- **Tampilan mengikuti pola list yang sudah ada:** Section baru memakai `card`, `stack-list`, dan `list-card` yang konsisten dengan visual Serene Capital serta empty state bawaan saat bulan ini belum ada pengeluaran.
- **Data dashboard diperluas dengan agregasi harian yang reusable:** Mapper dashboard sekarang mengelompokkan transaksi expense per tanggal sehingga UI tetap tipis dan logika perhitungan bisa ikut diuji.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/data/{types,mappers}.ts` | Tambah model `DailyExpenseItem`, agregasi `buildDailyExpenses`, dan expose `dailyExpenses` pada `DashboardData`. |
| `components/features/dashboard/dashboard-content.tsx` | Sisipkan kartu rincian pengeluaran harian di antara stat cards dan section wallet/kategori. |
| `messages/{id,en}.json`, `tests/unit/data-mappers.test.ts` | Tambah copy bilingual untuk section baru dan test agregasi pengeluaran per hari. |

### Fixed — Kontras Warna Public/Auth Surface di Dark Mode

#### Perbaikan UI
- **Panel hero, auth showcase, dan CTA publik kini punya pairing warna yang konsisten lintas theme:** Surface sage yang menjadi terang di dark mode tidak lagi memakai teks putih hardcoded, sehingga judul, deskripsi, badge status, dan tombol tetap terbaca jelas.
- **Panel brand di halaman login/register kini mengikuti treatment showcase khusus:** Overlay terang yang sebelumnya membuat teks pucat di dark mode diganti dengan surface showcase yang menyesuaikan theme tanpa keluar dari arah visual Serene Capital.
- **State aktif berbasis `bg-primary` kini lebih aman di seluruh app shell:** Tab wallet, shortcut aktif, dialog konfirmasi, dan beberapa tombol/pill lain sekarang memakai token teks `on-primary` yang benar, bukan asumsi putih tetap.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/globals.css` | Tambah token dan utility baru untuk `spotlight`/`showcase` surface agar kontras warna menyesuaikan theme. |
| `app/[locale]/page.tsx`, `components/auth/auth-brand-panel.tsx` | Ganti hero summary, CTA, dan panel brand auth ke utility surface baru dengan teks dan tombol yang lebih terbaca. |
| `components/{app-shell,wallet-tabs,features/dashboard/dashboard-onboarding-card,ui/confirm-dialog,ui/inline-edit-panel}.tsx` | Ganti state aktif `bg-primary text-white` menjadi token teks yang mengikuti theme. |

### Added — Halaman Privacy Policy Publik Bilingual

#### Peningkatan Legal dan Akses Publik
- **Balance kini punya halaman Kebijakan Privasi publik di dua bahasa:** Route `/{locale}/privacy` menampilkan penjelasan tentang data yang dikumpulkan, penggunaan data, penyimpanan di Supabase, cookie, hak pengguna, dan kontak placeholder dalam Bahasa Indonesia serta Inggris.
- **Landing page sekarang menautkan ke Privacy Policy:** Footer minimalis ditambahkan di halaman publik utama agar user bisa menemukan dokumen legal tanpa harus login.
- **Middleware mengizinkan akses privacy tanpa autentikasi:** Route privacy masuk daftar public path sehingga bisa dibuka langsung, termasuk dari incognito.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/[locale]/privacy/page.tsx` | Tambah halaman privacy policy locale-aware dengan tanggal pembaruan dan section legal berbasis dictionary. |
| `app/[locale]/page.tsx`, `middleware.ts` | Tambah footer link privacy di landing page dan izinkan route privacy lewat tanpa login. |
| `messages/{id,en}.json` | Tambah `common.privacy` dan seluruh copy privacy policy bilingual. |

### Changed — Penyelesaian Surface Full i18n Upgrade

#### Penutupan Surface Public, Wallet Detail, dan Action Feedback
- **Landing page, halaman invite, dan halaman wallet detail kini mengikuti locale aktif end-to-end:** Copy marketing, CTA auth, invite acceptance, members, reports, settlements, dan templates sekarang membaca dictionary `id/en` tanpa string inline yang tertinggal.
- **Server action feedback kini tidak lagi bocor ke Bahasa Indonesia saat locale Inggris aktif:** Pesan sukses/error untuk wallet, invitation, budget, savings, transaction, recurring, template, settlement, dan API key sekarang dibentuk dari helper translasi berbasis locale action.
- **Loading state dan skeleton app ikut terlokalisasi:** Judul section loading, label navigasi skeleton, dan shortcut wallet pada loading route sekarang menyesuaikan locale aktif sehingga transisi antar halaman tetap konsisten.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/[locale]/{page,invite/[token]/page.tsx}` | Lokalkan seluruh copy landing dan invite, termasuk CTA, redirect locale-aware, dan label role undangan. |
| `app/[locale]/(app)/wallets/[walletId]/{members,reports,settlements,templates}/page.tsx` | Ganti string inline ke dictionary untuk halaman wallet detail yang sebelumnya masih campur Bahasa Indonesia statis. |
| `app/actions/{wallets,budgets,savings,transactions,recurring-transactions,templates,settlements,api-keys}.ts`, `lib/{wallet-capacity,balance-adjustments}.ts` | Lokalkan pesan validasi, sukses, dan error redirect/action berdasarkan locale aktif. |
| `components/{features/wallets/*,features/transactions/transactions-page-content,ui/page-loading-skeleton}.tsx`, `app/[locale]/(app)/**/loading.tsx` | Tambah locale-aware client/server loading copy, perbaiki wallet client markers, dan rapikan sisa copy inline di komponen transaksi. |
| `messages/{id,en}.json`, `lib/data/{index,mappers}.ts` | Tambah key lanjutan untuk reports, members, action feedback, fallback template/transaction copy, dan rapikan fallback locale di mapper/index. |

### Changed — Batch Utama Full i18n Upgrade

#### Peningkatan Locale-aware UI
- **Surface auth, dashboard, drawer navigasi, offline, dan histori transaksi kini benar-benar membaca dictionary locale:** Copy yang sebelumnya masih bercampur string inline dan branch `locale === "en"` sekarang lewat key translasi `id/en`.
- **Mapper data kini ikut mengerti locale aktif:** Label transaksi, onboarding dashboard, progress tabungan, frekuensi recurring, dan format nama bulan/tanggal tidak lagi terkunci ke Bahasa Indonesia.
- **Route auth dan feedback theme kini konsisten lintas bahasa:** Error callback Google, konfirmasi email, pesan signup, validasi tema, dan CTA auth sekarang mengikuti locale aktif dari cookie atau URL.

#### File Diubah
| File | Perubahan |
|---|---|
| `messages/{id,en}.json` | Tambah batch key baru untuk auth, app shell, dashboard, offline, transaksi/history, recurring, dan savings. |
| `app/actions/{auth,theme}.ts`, `app/auth/{callback,confirm}/route.ts` | Ganti pesan inline ke helper `translate(...)` agar redirect/auth feedback konsisten per locale. |
| `app/[locale]/{login,register,offline}/page.tsx`, `components/auth/{auth-brand-panel,google-sign-in-button}.tsx`, `components/app-shell.tsx` | Lokalkan copy utama auth/public shell dan hilangkan branch `locale === "en"`. |
| `lib/data/{mappers,index}.ts`, `components/features/dashboard/*`, `components/features/transactions/transaction-history-page-content.tsx` | Propagasi locale ke mapper, lokalkan label turunan data, ganti formatter `id-ID` statis, dan rapikan copy dashboard/history. |
| `app/[locale]/(app)/**/{dashboard,wallets,transactions/history,reports,members}/page.tsx`, `tests/unit/i18n.test.ts` | Teruskan locale dari route params ke loader/report formatter dan rapikan test env assignment agar typecheck lolos. |

### Fixed — Preferensi Bahasa dan Pesan Signup Kini Konsisten per Locale

#### Perbaikan i18n
- **Ganti bahasa dari Pengaturan kini langsung terasa:** Setelah user menyimpan preferensi bahasa, app sekarang merevalidasi cache terkait lalu langsung redirect ke halaman `Pengaturan` pada locale baru agar copy UI ikut berubah tanpa perlu navigasi manual berikutnya.
- **Pesan signup tidak lagi bocor ke Bahasa Indonesia saat locale Inggris aktif:** Default redirect setelah signup dan pesan verifikasi email kini mengikuti locale aktif, sehingga user `en` menerima copy onboarding dan auth message dalam bahasa yang tepat.
- **Redirect auth error dan fallback locale kini lebih tahan edge case:** Route callback/confirm tidak lagi menyusun query error dengan `.replace()` yang rapuh, parser `Accept-Language` lebih ketat saat memilih English, dan key translasi yang salah bentuk kini memunculkan warning saat development.
- **Middleware kini lebih hemat pada route publik:** Client Supabase tidak lagi dibuat untuk semua request publik yang memang tidak butuh auth check, sehingga route locale publik bisa lewat dengan kerja middleware yang lebih ringan.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/actions/theme.ts` | Validasi locale kini memakai helper shared `isLocale`, lalu update preferensi bahasa langsung redirect ke route `/{locale}/settings` setelah invalidasi cache dan revalidation. |
| `app/actions/auth.ts` | Lokalkan pesan default signup dan verifikasi email berdasarkan locale aktif agar flow registrasi konsisten untuk user `id` dan `en`. |
| `app/auth/{callback,confirm}/route.ts`, `lib/auth-flow.ts` | Ganti penyusunan query auth error ke helper `URLSearchParams` yang aman tanpa manipulasi string path. |
| `middleware.ts`, `lib/i18n.ts`, `app/[locale]/auth/error/page.tsx`, `messages/{id,en}.json`, `tests/unit/i18n.test.ts` | Ringankan auth check middleware di route publik, rapikan fallback i18n, pindahkan copy auth error ke message dictionary, dan tambahkan cakupan test untuk parser locale serta dev warning translasi. |

### Added — i18n Fondasi `id` dan `en`

#### Peningkatan Routing dan Preferensi Bahasa
- **Route utama kini siap memakai prefix locale:** Struktur halaman publik dan app area dipindah ke pola `/{locale}/...` agar URL, redirect auth, dan deep-link bahasa lebih konsisten.
- **Preferensi bahasa kini tersimpan per akun dan tetap diingat lintas device:** Locale aktif mengikuti URL, disalin ke cookie untuk render cepat, dan disimpan ke `profiles.preferred_locale` supaya user kembali ke bahasa yang sama saat login lagi.
- **Deteksi awal locale kini mendukung browser fallback:** Akses ke root `/` akan diarahkan ke locale hasil deteksi browser, lalu fallback aman ke Bahasa Indonesia bila tidak ada sinyal yang jelas.

#### Peningkatan UX dan SEO Dasar
- **`html lang`, metadata utama, dan beberapa surface publik kini locale-aware:** Root render, auth flow, settings, dan link navigasi utama mulai membaca locale aktif untuk title, redirect, serta copy penting lintas bahasa.
- **Halaman Pengaturan kini punya pemilih bahasa:** User bisa mengganti bahasa aplikasi langsung dari surface pengaturan dengan persistensi akun dan cookie yang sinkron.
- **Formatter angka/tanggal kini siap menerima locale aktif:** Helper currency/date, auth redirect helper, dan util routing mulai menghapus asumsi `id-ID` statis agar migrasi copy berikutnya lebih aman.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/[locale]/**`, `app/layout.tsx`, `middleware.ts` | Tambah route prefix locale, provider locale, redirect root berbasis browser detection, dan sinkronisasi cookie locale. |
| `lib/{i18n,auth,auth-flow,utils,profile}.ts` | Tambah helper locale, localize path, fallback message, persistensi locale, dan formatter locale-aware. |
| `app/actions/{_shared,auth,theme,api-keys,wallets,templates,settlements,onboarding,transactions,budgets,savings,recurring-transactions}.ts` | Sambungkan redirect, revalidate, dan update preferensi bahasa ke path locale-aware. |
| `components/{app-shell,wallet-tabs,auth/google-sign-in-button,ui/button}.tsx`, `components/features/settings/settings-page-content.tsx` | Baca locale dari provider untuk link utama, auth UI, dan pengaturan bahasa/tema. |
| `messages/{id,en}.json`, `supabase/migrations/0014_profile_preferred_locale.sql` | Tambah dictionary dasar dua bahasa dan kolom `preferred_locale` di tabel `profiles`. |
| `tests/unit/{auth-flow,utils,i18n}.test.ts` | Tambah cakupan test untuk helper locale, redirect auth, dan formatter lintas bahasa. |

### Added — Dark Mode dengan 3 Pilihan Tema

#### Peningkatan Tampilan
- **Balance kini mendukung `Terang`, `Gelap`, dan `Ikuti sistem`:** User bisa memilih tema dari halaman `Pengaturan` sesuai kenyamanan visual masing-masing.
- **Preferensi tema tersimpan per akun dan tetap nyaman saat render awal:** Nilai tema disimpan di tabel `profiles`, lalu dicerminkan ke cookie ringan agar SSR dan route publik lebih cepat mengikuti pilihan terakhir.
- **Palet dark tetap menjaga arah visual Serene Capital:** Surface utama, drawer, dialog, toast, dan panel navigasi kini ikut menyesuaikan tanpa kehilangan nuansa krem, sage, dan forest yang tenang.

#### File Diubah
| File | Perubahan |
|---|---|
| `supabase/migrations/0013_profile_theme_preference.sql` | Tambah kolom `theme_preference` di `profiles`, default `system`, dan constraint nilai tema. |
| `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `lib/theme.ts` | Tambah runtime tema global, bootstrap script anti-flash, token light/dark, dan helper resolusi tema. |
| `app/actions/theme.ts`, `lib/data/{types,queries,index}.ts` | Simpan preferensi tema per akun, mirror cookie, dan expose state tema ke halaman `Pengaturan`. |
| `components/features/settings/settings-page-content.tsx` | Tambah UI pemilih tema 3 opsi di halaman `Pengaturan`. |
| `components/{app-shell,auth,features,ui}/**`, `app/{page,offline}/**` | Rapikan surface utama agar tetap terbaca dan konsisten di dark mode. |
| `tests/unit/{theme,theme-actions}.test.ts` | Tambah cakupan test untuk helper resolusi tema dan server action update tema. |

### Added — Onboarding Checklist untuk User Baru

#### Peningkatan UX
- **User baru kini dibantu lewat checklist awal di dashboard:** Setelah akun baru masuk, dashboard menampilkan panel onboarding singkat untuk membuat wallet pertama, mencatat transaksi pertama, lalu memahami ringkasan utama.
- **Status onboarding tersimpan per user di database:** Checklist bisa dilewati, selesai otomatis saat langkah inti beres, dan tetap konsisten lintas device karena state disimpan di tabel `profiles`.
- **User lama tidak ikut terganggu saat fitur dirilis:** Profil yang sudah ada dibackfill sebagai onboarding selesai, jadi panel ini fokus ke akun baru setelah migration diterapkan.

#### File Diubah
| File | Perubahan |
|---|---|
| `supabase/migrations/0012_user_onboarding.sql` | Tambah kolom state onboarding di `profiles`, validasi nilai, dan backfill user lama sebagai selesai. |
| `lib/data/{types,queries,index,mappers}.ts` | Perluas model profil/dashboard dan hitung checklist onboarding langsung dari data wallet serta transaksi yang sudah ada. |
| `app/actions/onboarding.ts` | Tambah server action untuk skip dan menyelesaikan onboarding dengan invalidation dashboard yang relevan. |
| `components/features/dashboard/{dashboard-content,dashboard-onboarding-card}.tsx` | Tampilkan panel onboarding baru di atas ringkasan dashboard dan rapikan auto-hide setelah langkah selesai. |
| `tests/unit/{data-mappers,onboarding-actions}.test.ts` | Tambah cakupan test untuk state checklist dan invalidation action onboarding. |

## [Released] — 2026-06-06

### Added — Rate Limiting untuk Chat API

#### Peningkatan Keamanan API
- **Endpoint `/api/chat/*` kini dibatasi per API key:** Request ke `GET /api/chat/rekap` dan `POST /api/chat/transaction` sekarang berbagi kuota default `60` request per `60` detik untuk setiap `user_api_keys.id`.
- **Client kini mendapat header kuota yang konsisten:** Response sukses menampilkan `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `X-RateLimit-Reset`, sementara request yang melewati batas mengembalikan `429` dengan body `{ "error": "rate_limited" }` serta `Retry-After`.
- **Limiter tetap mengikuti prinsip Redis best-effort repo:** Counter memakai Redis fixed window, tetapi request valid tetap dilayani bila Redis tidak tersedia atau limiter dimatikan lewat env.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/{env,redis,rate-limit}.ts` | Tambah konfigurasi env chat API, primitive counter Redis, dan helper fixed-window limiter + header response. |
| `app/api/chat/{rekap,transaction}/route.ts` | Pasang rate limiting setelah verifikasi Bearer key dan kirim header kuota pada response sukses maupun `429`. |
| `.env.example`, `README.md` | Dokumentasikan env limiter chat API dan perilaku fail-open saat Redis tidak tersedia. |
| `tests/unit/{redis-cache,rate-limit,chat-api-rate-limit}.test.ts` | Tambah cakupan unit untuk counter Redis, helper limiter, dan behavior route chat saat unauthorized, success, serta over-limit. |

### Fixed — API Chat Tidak Lagi Tertangkap Redirect Login

#### Perbaikan Integrasi
- **Endpoint API chat kini bisa diakses lewat Bearer key tanpa dipaksa login browser:** Middleware auth tidak lagi menangkap `/api/chat` dan turunannya sebagai halaman privat berbasis session.
- **Route handler API sekarang benar-benar sempat memverifikasi key:** Request ke `/api/chat/rekap` dan `/api/chat/transaction` tidak lagi mental ke `/login?next=...` sebelum auth gateway berjalan.
- **Verifikasi API key server-side kini lebih lurus:** Lookup key tidak lagi bergantung pada RPC khusus, tetapi langsung membaca tabel `user_api_keys` lewat admin client agar jalur auth Hermes lebih stabil di runtime.

#### File Diubah
| File | Perubahan |
|---|---|
| `middleware.ts` | Tandai `/api/chat` dan sub-route-nya sebagai path publik agar memakai auth API key, bukan auth session web. |

### Added — API Gateway v1 untuk Hermes/AI dengan User API Keys

#### Fitur Baru
- **API key user-scoped untuk akses programatik:** User kini bisa membuat, mencabut, dan menghapus API key dari halaman Pengaturan (`/settings`). Setiap key mewakili user penuh di semua wallet tempat ia menjadi member.
- **Endpoint `POST /api/chat/transaction`:** Agent AI atau Hermes bisa membuat transaksi baru via API dengan autentikasi `Authorization: Bearer <key>`. Body minimal: `wallet_id`, `amount`, `kind`. Validasi membership, tolak role `viewer`, dan insert dengan audit fields `created_by`, `updated_by`, `source: "manual"`.
- **Endpoint `GET /api/chat/rekap`:** Membaca ringkasan keuangan dengan parameter `period` (`day`/`week`/`month`, default `month`) dan `wallet_id` opsional. Response mencakup total income/expense/net, jumlah transaksi, breakdown kategori expense, dan breakdown per wallet.
- **Halaman Pengaturan (`/settings`):** Halaman top-level baru di AppShell (desktop sidebar + mobile drawer/bottom nav) untuk membuat dan mengelola API key. Raw key hanya ditampilkan sekali saat sukses create dengan instruksi salin yang jelas.
- **Keamanan key:** Hanya SHA-256 hash dan prefix `bal_` yang disimpan di database. Verifikasi via admin client lookup dengan RLS yang membatasi akses user hanya ke key miliknya sendiri.

#### File Baru
| File | Deskripsi |
|---|---|
| `supabase/migrations/0011_user_api_keys.sql` | Tabel `user_api_keys`, index, RLS, dan fungsi admin `lookup_api_key` + `touch_api_key`. |
| `lib/chat-auth.ts` | Generate key dengan prefix `bal_`, hash SHA-256, dan verifikasi `Authorization: Bearer` header. |
| `app/actions/api-keys.ts` | Server actions untuk create, revoke, dan delete API key dengan cache invalidation. |
| `app/(app)/settings/page.tsx` | Route halaman pengaturan. |
| `components/features/settings/settings-page-content.tsx` | UI client-side untuk form buat key, daftar key aktif/revoked, dan tampilkan raw key sekali. |
| `app/api/chat/transaction/route.ts` | Route handler POST untuk insert transaksi via API key. |
| `app/api/chat/rekap/route.ts` | Route handler GET untuk ringkasan keuangan via API key. |

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/data/types.ts` | Tambah `UserApiKeyRow`, `SettingsApiKeyItem`, `SettingsData`. |
| `lib/data/cache.ts` | Tambah cache key dan invalidation untuk settings. |
| `lib/data/queries.ts` | Tambah `queryUserApiKeys(userId)`. |
| `lib/data/index.ts` | Tambah loader `getSettingsData(userId)` dengan Redis cache. |
| `components/app-shell.tsx` | Tambah nav item "Pengaturan" di desktop sidebar dan mobile drawer/bottom nav. |

### Added — Loading Skeleton untuk Route Publik

#### Peningkatan UX
- **Route publik kini menampilkan skeleton saat data atau auth check masih dimuat:** Landing page, login, register, invite, offline, dan auth error tidak lagi berisiko tampil kosong saat transisi atau render async berjalan.
- **Skeleton dibuat konsisten dengan visual Serene Capital:** Surface loading baru mengikuti ritme card, spacing, dan layout publik yang sudah ada supaya perpindahan terasa halus, bukan seperti fallback generik.
- **Komponen loading reusable ditambah untuk mencegah duplikasi:** Skeleton publik sekarang berbagi primitive yang sama sehingga lebih mudah dipakai lagi saat route publik baru ditambahkan.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/ui/page-loading-skeleton.tsx` | Tambah skeleton reusable untuk landing, auth, invite, dan halaman pesan sederhana. |
| `app/{loading,login/loading,register/loading,offline/loading}.tsx`, `app/invite/[token]/loading.tsx`, `app/auth/error/loading.tsx` | Tambah file `loading.tsx` pada route publik yang sebelumnya belum punya loading state. |

## [Unreleased] — 2026-06-06

### Changed — Rapikan Layout Kartu Dashboard di Desktop Tanggung

#### Perbaikan UI
- **Bagian wallet aktif kini lebih lega di viewport desktop menengah:** Panel wallet dan komposisi kategori tidak lagi dipaksa berdampingan terlalu dini, sehingga kartu wallet punya lebar yang cukup dan isi tidak terlihat bertumpuk.
- **Grid wallet dashboard dibuat lebih stabil:** Susunan kartu wallet sekarang tetap rapi di layar lebar biasa dan baru memadat ke tiga kolom di layar ekstra lebar.
- **Tampilan mobile tetap dipertahankan:** Perubahan hanya menyasar breakpoint dashboard yang bermasalah, jadi layout iPhone dan Android tidak ikut berubah.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/features/dashboard/dashboard-content.tsx`, `components/ui/page-loading-skeleton.tsx` | Geser breakpoint layout dashboard agar kartu wallet lebih lega di desktop tanggung dan samakan skeleton dengan struktur baru. |

## [Unreleased] — 2026-06-02

### Changed — Tegaskan Versi Node Lokal

#### Perubahan Dokumentasi
- **Workflow lokal kini lebih selaras dengan requirement runtime repo:** Tambah `.nvmrc` agar developer lokal bisa langsung memakai Node.js `20.9.0`, sesuai `package.json`.
- **README kini menegaskan baseline Node lokal:** Setup lokal sekarang secara eksplisit meminta Node.js `20.9.0` atau lebih baru dan menjelaskan bahwa Docker production tetap berjalan di Node 22.

#### File Diubah
| File | Perubahan |
|---|---|
| `.nvmrc`, `README.md` | Tambah penanda versi Node lokal dan dokumentasi setup agar warning Node 18 tidak jadi kebingungan berulang. |

### Added — Halaman History Transaksi dan Drawer Navigasi Mobile

#### Peningkatan UX
- **Riwayat transaksi penuh kini punya halaman khusus:** Halaman transaksi utama sekarang tetap fokus pada input cepat dan ringkasan terbaru, sementara histori lengkap pindah ke route `/wallets/[walletId]/transactions/history`.
- **History transaksi kini lebih kuat di desktop:** Riwayat penuh memakai data table dengan sorting tanggal/jumlah, pencarian client-side, dan pagination dalam konteks bulan terpilih.
- **Mobile tetap nyaman dipakai:** History page tidak memaksa tabel desktop ke layar kecil, tetapi menampilkan kartu transaksi yang tetap bisa dibaca dan dikelola.
- **Navigasi mobile kini punya drawer tambahan:** `AppShell` sekarang menyediakan drawer berbasis `Sheet` untuk akses tujuan wallet yang lebih lengkap, tanpa menghapus bottom navigation utama.
- **Loader transaksi dipersempit untuk surface yang tepat:** Halaman input transaksi kini hanya mengambil ringkasan transaksi bulan terpilih, sementara history page memakai loader khusus agar tidak mengirim seluruh histori lintas bulan ke client.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/data/{queries,types,mappers,index,cache}.ts` | Tambah query transaksi per bulan, type/history page data, mapper history, loader khusus history, dan key cache terpisah untuk payload history. |
| `components/ui/{dialog,sheet,table,button}.tsx`, `components/app-shell.tsx` | Tambah primitive UI baru untuk dialog/sheet/table, dukungan `disabled` di button shared, dan drawer navigasi mobile berbasis sheet. |
| `components/features/transactions/{transactions-page-content,transaction-history-page-content}.tsx`, `app/(app)/wallets/[walletId]/transactions/history/*` | Ringankan halaman transaksi utama, tambah CTA ke history penuh, dan implementasikan route history transaksi lengkap dengan loading state. |

### Changed — Rapikan Dokumen Plan Upgrade

#### Perubahan Dokumentasi
- **`PLAN_UPGRADE.md` kini selaras dengan kondisi repo saat ini:** Dokumen upgrade tidak lagi memakai asumsi project masih MVP frontend generik, tetapi sudah mengacu ke App Router, `lib/data/`, action state wallet forms, serta workflow `npm`.
- **Arah upgrade frontend dibuat lebih tegas:** Plan sekarang mengunci fokus pada UI polish transaksi, migrasi bertahap ke `shadcn/ui`, route history transaksi terpisah, dan penggunaan `date-fns` hanya bila benar-benar dibutuhkan.
- **Instruksi ambigu dihapus dari plan:** Dokumen tidak lagi menyisakan pilihan implementasi yang menggantung, penggunaan `pnpm`, atau referensi struktur repo yang tidak sesuai.
- **Plan kini lebih aman untuk dieksekusi:** Keputusan tentang ringkasan histori di halaman transaksi utama, strategi loading history per bulan, CTA ke route history, dan batas migrasi primitive ke `shadcn/ui` sekarang sudah dikunci agar mengurangi risiko rework saat implementasi.
- **Kontrak implementasi plan makin tegas:** Scope primitive `shadcn/ui` iterasi pertama, peran `Sheet` mobile terhadap bottom nav existing, dan kebutuhan loader khusus history transaksi kini dijelaskan lebih eksplisit.

#### File Diubah
| File | Perubahan |
|---|---|
| `PLAN_UPGRADE.md` | Tulis ulang plan upgrade agar decision-complete, repo-aware, dan siap dipakai sebagai panduan implementasi frontend berikutnya. |

### Changed — Granular Redis Cache Invalidation

#### Peningkatan Performa
- **Invalidasi cache wallet kini lebih presisi:** Mutation tidak lagi membuang seluruh namespace cache wallet, melainkan hanya key section yang benar-benar terdampak seperti dashboard, overview, transaksi, budget, recurring, atau tabungan.
- **Dashboard shared tidak lagi memicu flush global:** Saat data wallet memengaruhi ringkasan lintas anggota, sistem sekarang menghapus cache dashboard milik member wallet terkait saja.
- **Mutation yang tidak mengubah saldo kini lebih hemat:** Aksi recurring, undangan wallet, dan settlement tidak lagi memaksa invalidasi cache read yang tidak relevan.

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/{redis.ts,data/cache.ts}` | Tambah invalidation berbasis pattern glob untuk Redis dan ganti helper cache wallet menjadi target-based per section. |
| `app/actions/{_shared,transactions,budgets,recurring-transactions,savings,templates,settlements,wallets}.ts` | Petakan ulang invalidation setiap mutation agar hanya menghapus cache section dan dashboard user yang terdampak. |
| `tests/unit/redis-cache.test.ts` | Tambah cakupan test untuk delete by pattern, helper invalidation granular, dan dashboard scoped deletion. |

### Changed — Client-side Wallet Form Actions

#### Peningkatan UX
- **Submit form wallet kini tidak lagi mengandalkan redirect penuh:** Form transaksi, anggaran, recurring, dan tabungan sekarang memakai alur client-side action state sehingga feedback sukses atau error muncul tanpa reload halaman penuh.
- **Data server tetap segar setelah submit:** Setelah action berhasil, halaman memicu refresh ringan App Router sehingga list, saldo, progress, dan status terbaru masuk kembali lewat merge RSC tanpa transisi kasar.
- **Toast sukses/error kini datang langsung dari hasil server action:** Feedback tidak lagi harus lewat query `message` atau `error` di URL untuk surface wallet yang sudah dimigrasikan.
- **Panel edit inline kini menutup dari state sukses lokal:** Editor transaksi, anggaran, dan recurring tidak lagi bergantung pada perubahan search params untuk collapse setelah submit.
- **Reset form create dibuat lebih rapi untuk input nominal:** Form create utama dan mutasi tabungan bisa kembali ke state awal setelah sukses, termasuk field Rupiah yang sebelumnya controlled di client.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/actions/{_shared,transactions,budgets,recurring-transactions,savings}.ts` | Tambah kontrak `ActionResult`, ubah mutation wallet utama ke pola `useActionState`, dan pertahankan invalidasi cache serta `revalidatePath` setelah sukses. |
| `components/ui/{action-form,inline-edit-panel,currency-input}.tsx` | Tambah wrapper form client-side dengan toast + `router.refresh()`, ubah kontrol auto-close editor jadi berbasis state lokal, dan sinkronkan reset untuk input nominal terformat. |
| `components/features/{transactions,budgets,recurring,savings}/**`, `app/(app)/wallets/[walletId]/{transactions,budgets,recurring,savings}/page.tsx` | Migrasikan form wallet utama ke submit client-side tanpa redirect penuh dan pecah halaman saving ke client content khusus. |
| `tests/unit/action-results.test.ts` | Tambah cakupan test untuk helper hasil action state. |

### Added — Loading Skeleton Antar Page

#### Peningkatan UX
- **Navigasi area utama kini punya loading skeleton yang lebih halus:** Saat berpindah antar dashboard dan halaman wallet, user sekarang melihat placeholder yang mengikuti struktur halaman tujuan sambil data server dimuat.
- **Skeleton dibuat kontekstual per area:** Dashboard, daftar wallet, ringkasan wallet, halaman form-plus-list, dan halaman detail wallet masing-masing punya pola loading ringan sendiri agar transisi terasa lebih natural.
- **Halaman publik tetap tidak berubah:** Login, register, invite, dan route publik lain tidak ikut memakai boundary loading baru ini.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/(app)/**/loading.tsx`, `app/(app)/layout.tsx` | Tambah route group area utama dan boundary loading App Router untuk dashboard serta seluruh route wallet tanpa mengubah URL publik. |
| `components/ui/page-loading-skeleton.tsx`, `app/globals.css` | Tambah skeleton primitives, komposisi shell/konten loading, dan animasi shimmer lembut yang sesuai visual Serene Capital. |

### Changed — Dashboard Quick Add Shortcut

#### Peningkatan UI
- **Dashboard kini punya tombol `+` di header:** User bisa langsung lompat ke halaman input transaksi wallet default tanpa harus turun ke section aktivitas terbaru.
- **Aksi transaksi di dashboard dibuat lebih rapi:** CTA pada kartu `Transaksi terbaru` kini berubah menjadi `Lihat semua` supaya tidak ada dua tombol utama untuk aksi yang sama.
- **Perilaku fallback tetap aman:** Jika user belum punya wallet, shortcut `+` tetap tampil dan diarahkan ke halaman wallet terlebih dahulu.
- **Quick add sekarang tampil lebih ringkas sebagai ikon saja:** Header dashboard tidak lagi menampilkan teks tambahan pada tombol aksi, jadi tampilannya lebih bersih terutama di mobile.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/app-shell.tsx`, `components/features/dashboard/dashboard-content.tsx` | Tambah slot action opsional di header shell, tampilkan tombol quick add `+` di dashboard, dan ubah CTA section transaksi menjadi `Lihat semua`. |

### Added — Penyesuaian Saldo Wallet

#### Fitur Baru
- **Penyesuaian saldo kini punya jalur khusus di tab transaksi:** User `owner` dan `editor` sekarang bisa menambah koreksi saldo naik atau turun tanpa mencampurkannya dengan form transaksi reguler.
- **Koreksi saldo tetap transparan di histori dan laporan:** Penyesuaian disimpan sebagai transaksi nyata, muncul dengan badge `Penyesuaian`, dan ikut memengaruhi dashboard, saldo wallet, serta laporan bulanan.
- **Kategori sistem penyesuaian dibuat otomatis:** Wallet akan menyiapkan kategori `Penyesuaian Saldo Masuk` dan `Penyesuaian Saldo Keluar` agar koreksi saldo mudah dibedakan dari aktivitas biasa.
- **Jejak koreksi dibuat lebih rapi:** Catatan alasan penyesuaian kini wajib diisi, dan transaksi penyesuaian yang diedit akan tetap menjaga kategori sistemnya sesuai arah pemasukan atau pengeluaran.

#### File Diubah
| File | Perubahan |
|---|---|
| `supabase/migrations/0010_transaction_balance_adjustments.sql` | Tambah sumber transaksi (`manual`, `saving_adjustment`, `balance_adjustment`), backfill transaksi lama, helper kategori sistem penyesuaian saldo, dan update trigger transaksi dari saving agar memberi source yang benar. |
| `app/actions/transactions.ts`, `lib/balance-adjustments.ts` | Tambah server action khusus penyesuaian saldo, helper validasi/alur arah penyesuaian, dan sinkronisasi kategori sistem saat transaksi penyesuaian diubah. |
| `lib/data/{types,queries,mappers}.ts` | Tambah field `source`, flag UI transaksi penyesuaian, fallback title baru, dan filter kategori agar budget/form biasa tidak menawarkan kategori penyesuaian saldo. |
| `components/features/transactions/transactions-page-content.tsx` | Tambah form `Penyesuaian Saldo` di tab transaksi, badge histori, dan editor inline yang menjaga kategori sistem penyesuaian tetap otomatis. |
| `tests/unit/{data-mappers,balance-adjustments}.test.ts`, `README.md` | Tambah cakupan test untuk mapper/validasi penyesuaian saldo dan dokumentasi migration baru. |

### Added — Page Transition & Success Motion

#### Peningkatan UI
- **Perpindahan halaman kini terasa lebih halus:** App Router sekarang punya page-enter transition yang lembut dan sweep indicator tipis saat route berubah, jadi navigasi terasa lebih hidup tanpa terasa berat.
- **Aksi sukses kini punya animasi yang lebih terasa selesai:** Toast sukses sekarang menampilkan animasi check, ring burst, dan progress bar dismiss agar feedback berhasil terasa lebih meyakinkan.
- **Motion tetap ramah aksesibilitas:** Animasi dimatikan otomatis untuk user yang mengaktifkan `prefers-reduced-motion`.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/template.tsx`, `components/ui/route-transition.tsx` | Tambah mount transition per halaman dan route sweep indicator saat navigasi. |
| `components/ui/toast-provider.tsx`, `app/globals.css` | Tambah success animation untuk toast, progress bar auto-dismiss, serta keyframes global untuk motion system. |

### Added — Toast Notification System

#### Peningkatan UI
- **Feedback redirect kini tampil sebagai toast global:** Pesan sukses dan error dari server action sekarang muncul sebagai toast di kanan atas, auto-dismiss dalam 5 detik, dan bisa ditutup manual dengan klik.
- **URL feedback dibersihkan otomatis setelah toast tampil:** Query `message` dan `error` tidak lagi tertinggal di address bar setelah notifikasi muncul, jadi refresh halaman tidak memunculkan toast lama berulang-ulang.
- **Sistem toast reusable sudah tersedia untuk surface client lain:** Provider global dan hook toast kini bisa dipakai lagi untuk feedback interaktif tanpa harus bergantung pada `Notice` inline.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/ui/{toast-provider,toast-feedback}.tsx` | Tambah provider toast global, viewport toast, auto-dismiss 5 detik, dismiss via click, dan bridge dari query feedback ke toast. |
| `app/layout.tsx` | Pasang `ToastProvider` di root layout agar toast bisa dipanggil dari seluruh app. |
| `app/{login,register}/page.tsx`, `app/invite/[token]/page.tsx`, `app/wallets/[walletId]/{members,savings,settlements,templates}/page.tsx`, `components/features/{wallets,transactions,budgets,recurring}/*` | Ganti feedback sukses/error hasil redirect dari `Notice` inline menjadi toast global. |

### Changed — Inline Editor Transactions & Budgets

#### Peningkatan UX
- **Edit inline kini lebih jelas dan lebih ringkas:** Kartu transaksi dan anggaran sekarang punya cue visual bahwa item bisa diubah, lengkap dengan CTA edit yang lebih terlihat dibanding `summary` polos.
- **Buka-tutup editor dibuat lebih halus:** Panel edit sekarang memakai animasi transisi lembut saat membuka dan menutup, sekaligus auto-focus ke field pertama saat editor dibuka.
- **Editor otomatis menutup setelah submit/redirect:** Saat query URL berubah setelah server action selesai, panel edit akan collapse lagi sehingga daftar terasa kembali rapi.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/ui/inline-edit-panel.tsx` | Tambah panel edit reusable dengan CTA visual, auto-focus field pertama, animasi buka-tutup, dan auto-collapse saat search params berubah. |
| `components/features/{transactions,budgets}/**` | Ganti pola `details/summary` menjadi panel edit interaktif yang lebih jelas dan lebih singkat flow-nya. |

### Changed — Register Auth First Impression

#### Peningkatan UX
- **Halaman daftar kini setara dengan login secara visual:** Register tidak lagi tampil sebagai card tunggal yang polos, tetapi memakai layout dua kolom dengan panel branding yang sama kuatnya dengan halaman login.
- **First impression untuk user baru dibuat lebih meyakinkan:** Section branding pada register sekarang menjelaskan manfaat produk dan memberi rasa produk yang lebih matang sebelum user mengisi form.
- **Login dan register kini konsisten sebagai pasangan auth:** Kedua halaman memakai pola layout, hierarchy, dan ritme visual yang serupa agar perpindahan antar-auth screen terasa satu keluarga.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/auth/auth-brand-panel.tsx` | Tambah panel branding reusable untuk halaman auth dengan highlight, atmosfer Serene Capital, dan konten yang bisa disesuaikan per page. |
| `app/{login,register}/page.tsx` | Samakan struktur visual auth menjadi dua kolom desktop dan tambah branding yang lebih meyakinkan pada halaman register. |

### Added — Confirm Dialog Modal

#### Peningkatan UI
- **Konfirmasi aksi kini tampil sebagai modal yang konsisten dengan design system:** Hapus data dan aksi destruktif lain tidak lagi memakai `window.confirm`, melainkan dialog cream dengan aksen sage, radius besar, shadow lembut, dan CTA yang lebih jelas.
- **Komponen reusable untuk konfirmasi:** Tambah `ConfirmDialog` shared agar pola modal konfirmasi bisa dipakai ulang di surface lain tanpa mengulang styling atau behavior dasar seperti overlay click dan tombol escape.
- **`ConfirmSubmitButton` ikut di-upgrade tanpa ubah call site lama:** Semua pemakaian tombol konfirmasi existing langsung mendapatkan modal baru, sambil tetap kompatibel dengan flow form submit server action saat ini.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/ui/confirm-dialog.tsx` | Tambah komponen modal konfirmasi reusable dengan visual Serene Capital, overlay, dan action button terstruktur. |
| `components/ui/confirm-submit-button.tsx` | Ganti `window.confirm` menjadi modal konfirmasi reusable yang tetap memicu submit form setelah user menyetujui aksi. |

## [Unreleased] — 2026-06-01

### Fixed — Safari iPhone Form dan Button Hardening

#### Perbaikan UI Mobile
- **Form utama lebih stabil di Safari iPhone:** Input, select, date, dan month kini memakai guard iOS agar tidak memicu zoom tak diinginkan, overflow horizontal, atau ukuran native yang merusak layout card.
- **Button shared dibuat lebih konsisten:** CTA utama, submit button, confirm button, dan tombol Google login kini punya tinggi minimum, radius, focus ring, serta wrapping teks yang lebih stabil di viewport sempit.
- **Layout form mobile diperketat:** Halaman login, register, invite, transaksi, anggaran, dan recurring kini memakai pola `min-w-0`, stack mobile-first, serta tombol full-width agar tidak meluber saat kontrol Safari lebih lebar dari browser lain.
- **Navigasi mobile ikut dipoles:** Shortcut wallet dan bottom navigation kini lebih aman untuk scroll horizontal Safari tanpa memotong radius dan spacing.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/globals.css` | Tambah hardening Safari/iOS untuk overflow horizontal, input/select/date/month, touch scrolling, dan perilaku kontrol form native. |
| `components/ui/{button,submit-button,confirm-submit-button}.tsx`, `components/auth/google-sign-in-button.tsx` | Standarkan dimensi, wrapping, focus state, dan interaction state tombol reusable. |
| `app/{login,register}/page.tsx`, `app/invite/[token]/page.tsx` | Rapikan container auth dan CTA supaya tetap utuh di mobile Safari. |
| `components/features/{transactions,budgets,recurring}/**`, `components/app-shell.tsx` | Perkuat layout form, action row, shortcut chips, dan bottom nav agar lebih tahan terhadap ukuran intrinsik Safari. |

### Added — Client-side Rupiah Masking

#### Peningkatan Form Nominal
- **Input nominal kini langsung terformat Rupiah:** Field uang utama sekarang menampilkan format `Rp` dengan pemisah ribuan saat user mengetik, sehingga nominal lebih mudah dibaca tanpa menunggu submit.
- **Parsing backend tetap kompatibel:** Server action tetap menerima string terformat karena normalisasi angka di backend tidak diubah, jadi masking baru tidak mengubah kontrak form.
- **Cakupan nominal dibuat konsisten:** Form transaksi, budget, recurring, settlement, template, dan saving kini memakai komponen input Rupiah yang sama.

#### File Diubah
| File | Perubahan |
|---|---|
| `components/ui/currency-input.tsx`, `lib/utils.ts` | Tambah komponen input Rupiah client-side dan helper format/sanitasi berbasis `Intl.NumberFormat("id-ID")`. |
| `components/features/{transactions,budgets,recurring}/**`, `app/wallets/[walletId]/{settlements,templates,savings}/page.tsx` | Ganti input nominal polos menjadi input Rupiah terformat yang reusable. |
| `tests/unit/utils.test.ts` | Tambah test unit untuk sanitasi dan formatting display value Rupiah. |

### Changed — Rapikan Konsistensi UI dan Card Layout

#### Perubahan UI
- **Copy antarmuka dibuat lebih konsisten:** Label utama, tab wallet, metadata brand, dan beberapa CTA kini lebih rapi dan lebih dominan berbahasa Indonesia agar tone produk terasa satu suara.
- **Header aplikasi diperhalus:** Shell header kini punya copy pendukung yang utuh, ringkasan metrik yang lebih stabil, dan panel yang lebih menyatu dengan gaya `Serene Capital`.
- **Navigasi mobile dibuat lebih fleksibel:** Bottom navigation tidak lagi terkunci ke grid 4 item, sehingga item utama tetap bisa diakses tanpa terasa terpotong di layar kecil.
- **Card lebih rapi di mobile dan desktop:** Padding, radius, border, dan struktur tile info distandardkan lewat komponen shared supaya kartu-kartu kecil tidak terasa sesak atau pecah di breakpoint menengah.
- **Halaman wallet, dashboard, tabungan, transaksi, dan recurring ikut dirapikan:** Tile saldo, ringkasan aktivitas, serta kartu daftar kini lebih konsisten secara spacing dan label.
- **Polish visual lanjutan untuk hierarchy dan density:** Badge, notice, stat card, empty state, serta list data-heavy kini punya hierarchy visual yang lebih jelas dan ritme baca yang lebih enak di mobile maupun desktop.
- **Navigasi mobile dibuat lebih kontekstual:** Active state sidebar kini lebih akurat untuk subpage wallet, bottom nav difokuskan ke destinasi inti, dan shortcut wallet penting muncul langsung di header mobile agar perpindahan halaman terasa lebih ringan.
- **Bar tengah wallet dihapus:** Navigasi subhalaman wallet tidak lagi muncul sebagai lapisan terpisah di tengah halaman; desktop cukup memakai sidebar kiri, sementara mobile memakai shortcut kontekstual di header agar layout terasa lebih ringan dan tidak redundant.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/globals.css` | Standarkan gaya `card` dan tambah helper tile/panel untuk layout konten yang lebih stabil di berbagai ukuran layar. |
| `components/app-shell.tsx`, `components/wallet-tabs.tsx` | Rapikan copy shell, ringkasan header, label navigasi, sederhanakan struktur nav wallet, dan polish perilaku bottom navigation mobile. |
| `components/features/{dashboard,wallets,transactions,recurring}/**`, `components/features/wallets/wallet-overview-content.tsx` | Rapikan label, struktur card, dan microcopy pada halaman inti aplikasi. |
| `app/wallets/[walletId]/savings/page.tsx`, `components/features/budgets/budgets-page-content.tsx` | Rapikan judul, label, dan kartu ringkasan agar lebih konsisten dan responsif. |
| `components/ui/{badge,notice,empty-state,stat-card}.tsx`, `app/wallets/[walletId]/{reports,members,templates,settlements}/page.tsx` | Tambah polish visual untuk hierarchy, empty state, badge status, chart mobile, dan density list data-heavy. |
| `app/{layout,page}.tsx` | Perbarui brand line dan copy landing page agar lebih natural dan sesuai tone produk. |

### Added — PWA Installability v1

#### Fitur Baru
- **Balance kini bisa di-install sebagai app:** Tambah manifest, icon PWA, metadata mobile web app, dan service worker ringan agar browser modern mengenali Balance sebagai installable PWA.
- **Prompt install halus di landing page:** Homepage publik sekarang bisa menampilkan ajakan install yang ringan, hanya pada browser yang mendukung dan bisa disembunyikan per perangkat.
- **Fallback offline lebih rapi:** Saat navigasi gagal karena tidak ada koneksi, user akan diarahkan ke halaman offline sederhana berbahasa Indonesia tanpa mencoba menyimpan data wallet secara offline.
- **PWA bisa diuji di localhost:** Registrasi service worker kini juga aktif di `localhost` agar flow install bisa dites saat development, bukan hanya setelah deploy production.
- **Asset inti PWA tidak lagi tertahan auth middleware:** `sw.js`, `manifest.webmanifest`, dan halaman offline sekarang bisa diakses publik agar browser dapat mengenali installability dengan benar.
- **Asset `public/` kini ikut masuk ke image production:** File seperti `sw.js`, icon PWA, dan favicon sekarang dicopy ke stage runtime Docker agar tidak `404` setelah deploy ke VPS.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/layout.tsx`, `app/manifest.ts` | Tambah metadata PWA, manifest native Next, dan registrasi service worker yang aman untuk production. |
| `app/page.tsx`, `components/pwa/*`, `components/ui/button.tsx` | Tambah prompt install di landing page dan dukungan event click pada button shared. |
| `app/offline/page.tsx`, `public/sw.js`, `public/*` | Tambah halaman fallback offline, service worker kustom, dan icon/icon favicon PWA dasar. |
| `Dockerfile`, `middleware.ts` | Pastikan asset PWA publik lolos auth middleware dan ikut tersalin ke image runtime production. |

### Changed — Homepage Jadi Landing Page

#### Perubahan UX
- **Homepage publik kini lebih menjelaskan produk:** Halaman `/` diubah dari splash singkat menjadi landing page yang lebih meyakinkan untuk membantu calon user cepat paham fungsi Balance.
- **Bahasa dibuat lebih santai dan dekat:** Copy homepage kini memakai nada yang ringan dan rapi, dengan fokus pada rasa lebih tenang saat mengatur uang.
- **CTA lebih diarahkan ke signup:** Hero dan penutup homepage kini mendorong user baru ke `Daftar gratis`, sambil tetap menyediakan akses cepat ke halaman login.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/page.tsx` | Susun ulang homepage menjadi landing page multi-section dengan hero, manfaat utama, cara kerja singkat, use case, dan closing CTA. |

### Fixed — Docker Build Env for Client Auth

#### Perbaikan Deploy
- **Env publik Supabase kini ikut masuk ke stage build Docker:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `NEXT_PUBLIC_SITE_URL` sekarang dipass sebagai build args agar bundle client tidak crash saat membuat Supabase browser client.
- **Contoh deploy diperjelas:** Dokumentasi `docker build` dan `docker buildx build` kini menyertakan `--build-arg` yang wajib untuk fitur auth client seperti login Google.

#### File Diubah
| File | Perubahan |
|---|---|
| `Dockerfile` | Tambah `ARG` dan `ENV` untuk `NEXT_PUBLIC_*` di stage builder dan runner. |
| `docker-compose.yml` | Teruskan env publik Supabase ke build args service `app` dan `scheduler`. |
| `README.md` | Tambah contoh `docker build`/`buildx` yang menyertakan build args env publik. |

### Added — Google Sign-In via Supabase OAuth

#### Fitur Baru
- **Login dan daftar dengan Google:** Halaman login dan register sekarang menyediakan tombol Google OAuth sebagai alternatif email/password.
- **Redirect aman untuk deep-link auth:** Flow Google dan verifikasi email kini mempertahankan query `next` hanya untuk path internal, sehingga invite token dan deep-link auth lain tetap aman dari open redirect.
- **Sinkronisasi nama profil OAuth:** Profil pengguna kini mengambil fallback nama dari metadata `name` bila provider OAuth tidak mengirim `full_name`.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/auth/callback/route.ts` | Tambah callback OAuth Supabase untuk exchange code ke session server-side, sinkronisasi profil, dan redirect aman ke path internal. |
| `app/{login,register}/page.tsx` | Tambah tombol Google sign-in/sign-up dan pembatas visual sebelum form email/password. |
| `components/auth/google-sign-in-button.tsx` | Tambah komponen client untuk memulai login Google via `signInWithOAuth()`. |
| `app/actions/auth.ts`, `app/auth/{confirm,error}/...`, `lib/auth-flow.ts` | Rapikan helper redirect auth, pertahankan `next` yang aman saat error/sukses, dan lokalkan pesan callback. |
| `lib/{auth,profile}.ts`, `supabase/migrations/0009_google_oauth_profile_name_fallback.sql` | Tambah fallback nama profil dari metadata OAuth `name`. |
| `.env.example`, `docker-compose.self-hosted.yml`, `README.md` | Dokumentasikan dan aktifkan konfigurasi Google OAuth untuk setup hosted maupun self-hosted. |
| `tests/unit/auth-flow.test.ts` | Tambah test unit untuk sanitasi redirect auth dan query `next`. |

### Changed — Nama Website

#### Perubahan Branding
- **Judul website diperbarui:** Metadata judul global aplikasi kini memakai nama `Balance | Healthy Financial Healthy Mind` agar tampil konsisten di tab browser.
- **Logo browser ditambahkan:** Icon website di browser kini memakai logo Balance baru melalui file `app/icon.png`.
- **Nama brand di homepage diperpanjang:** Teks brand pada hero homepage kini menampilkan `Balance | Healthy Financial Healthy Mind`.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/layout.tsx` | Ganti metadata `title` global aplikasi menjadi `Balance | Healthy Financial Healthy Mind`. |
| `app/icon.png` | Tambahkan logo Balance baru sebagai icon browser/favicon aplikasi. |
| `app/page.tsx` | Ganti teks brand pada hero homepage menjadi `Balance | Healthy Financial Healthy Mind`. |

### Fixed — Layout Halaman Saving

#### Perbaikan UI
- **Kartu aksi saving lebih responsif:** Form setor, tarik, dan kelola saving kini tidak lagi saling menekan pada lebar desktop menengah atau layar sempit.
- **Header kartu saving lebih lentur:** Nama bucket, target, dan saldo sekarang turun baris dengan rapi saat ruang horizontal terbatas.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/wallets/[walletId]/savings/page.tsx` | Rapikan grid dan flex layout halaman Saving agar kartu aksi, tombol, dan header bucket tetap terbaca di berbagai ukuran layar. |

### Added — Sinkronisasi Saving ke Transaksi Wallet

#### Fitur Baru
- **Mutasi saving otomatis tercatat sebagai transaksi wallet:** Setor saving kini membuat transaksi `expense` kategori `Tabungan`, sedangkan tarik saving membuat transaksi `income` kategori `Pencairan Tabungan`.
- **Riwayat transaksi linked saving tampil read-only:** Transaksi yang berasal dari mutasi saving muncul di tab transaksi, diberi penanda `Saving`, dan tidak bisa diedit atau dihapus dari sana.
- **Backfill histori saving lama:** Saving entry yang sudah ada sebelum perubahan ini akan otomatis dipasangkan dengan transaksi wallet agar saldo, laporan, dan budget tetap konsisten.

#### File Diubah
| File | Perubahan |
|---|---|
| `supabase/migrations/0008_saving_entry_transactions.sql` | Tambah relasi `transactions.saving_entry_id`, kategori sistem income saving, trigger pembuat transaksi saving, proteksi mutasi transaksi linked saving, backfill histori, dan RPC atomik untuk membuat saving entry. |
| `app/actions/savings.ts` | Ganti insert langsung `saving_entries` menjadi RPC atomik `create_saving_entry_with_transaction()` dan perluas revalidation ke transaksi, budget, dan laporan. |
| `app/actions/transactions.ts` | Blok update/hapus transaksi yang terhubung ke saving dan tampilkan pesan yang mengarahkan user ke tab Saving. |
| `components/features/transactions/transactions-page-content.tsx` | Tampilkan badge `Saving` dan sembunyikan kontrol edit/hapus untuk transaksi linked saving. |
| `lib/data/{types,queries,mappers}.ts` | Tambah field `saving_entry_id`, flag UI transaksi linked saving, dan ubah kalkulasi available balance agar tidak double-count flow saving. |
| `lib/wallet-starter-templates.ts` | Tambah kategori starter income `Pencairan Tabungan` untuk wallet baru. |
| `tests/unit/data-mappers.test.ts` | Tambah fixture dan assertion untuk transaksi hasil saving, saldo wallet baru, dan laporan bulanan yang ikut menghitung mutasi saving. |

### Changed — Limit Kapasitas Wallet

#### Perubahan Perilaku
- **Batas anggota wallet:** Setiap wallet kini dibatasi maksimal 5 slot terpakai.
- **Owner ikut dihitung:** Slot terpakai menghitung owner sebagai anggota aktif.
- **Undangan pending ikut mengunci slot:** Invitation berstatus `pending` kini memakan slot sampai diterima, dibatalkan, atau kedaluwarsa.
- **Proteksi berlapis:** Limit divalidasi di UI, server action, dan trigger database agar tidak lolos saat request berbarengan.

#### File Diubah
| File | Perubahan |
|---|---|
| `app/actions/wallets.ts` | Tambah validasi kapasitas sebelum membuat invite dan gunakan accept invitation atomik saat menerima undangan. |
| `app/wallets/[walletId]/members/page.tsx` | Tampilkan counter kapasitas wallet dan sembunyikan form undangan saat slot penuh. |
| `supabase/migrations/0005_wallet_member_capacity.sql` | Tambah helper, trigger, dan function atomik DB untuk menjaga batas 5 slot per wallet. |
| `tests/unit/wallet-capacity.test.ts` | Tambah test unit untuk perhitungan slot, pending invite, dan pesan kapasitas penuh. |

### Added — Kolaborasi Wallet & Undangan Token

#### Fitur Baru
- **Undang anggota wallet via token:** Pemilik wallet dapat membuat tautan undangan baru dari halaman anggota wallet (`/wallets/[walletId]/members`). Pemilik memilih peran (Editor / Viewer), lalu sistem membuat token one-time-use yang siap dibagikan.
- **Halaman penerimaan undangan interaktif:** Halaman `/invite/[token]` kini menangani 4 state: token tidak valid, kedaluwarsa/dibatalkan, pengguna belum login, dan siap terima. Pengguna yang sedang login dapat menerima undangan langsung dari halaman tersebut.
- **Batalkan undangan:** Pemilik wallet dapat membatalkan undangan yang masih pending dari halaman anggota.

#### File Baru
| File | Deskripsi |
|---|---|
| `components/invitation-share-actions.tsx` | Aksi client-side untuk salin dan bagikan tautan undangan token dari halaman anggota wallet. |

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/data.ts` | Re-export ke modul `lib/data/*`; data invitation tetap tersedia lewat `queryInvitations()` dan field `invitations` pada `WalletBundle`. |
| `app/actions/wallets.ts` | `createWalletInvitation()` kini membuat token-only invitation tanpa email target, dan `acceptWalletInvitation()` menerima undangan berdasarkan token, status, expiry, dan membership. |
| `app/wallets/[walletId]/members/page.tsx` | Form undangan kini hanya memilih role, CTA berubah menjadi pembuatan tautan, dan daftar undangan aktif tidak lagi menampilkan email target. |
| `app/invite/[token]/page.tsx` | Halaman undangan tidak lagi memeriksa kecocokan email; akun yang sedang login dapat join langsung selama token valid. |
| `components/ui/button.tsx` | Tambah props `type` (submit/button/reset) dan `size` (sm/md) pada komponen Button. |
| `package.json` | Hapus dependensi `nodemailer` dan `@types/nodemailer` karena invitation email sudah tidak dipakai. |

#### Konfigurasi
Tidak ada perubahan konfigurasi untuk invitation. SMTP tetap dipakai untuk email Auth Supabase, tetapi tidak lagi digunakan oleh flow undangan wallet.

#### Database
Tambah migration `0004_wallet_invites_token_only.sql` untuk menghapus kolom `invited_email`, mengganti index invitation aktif, dan menyederhanakan RLS agar flow invitation benar-benar token-only.
