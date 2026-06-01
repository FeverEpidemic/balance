# Changelog

## [Unreleased] — 2026-06-01

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
