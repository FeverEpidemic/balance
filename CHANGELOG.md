# Changelog

## [Unreleased] — 2026-06-02

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
