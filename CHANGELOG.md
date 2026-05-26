# Changelog

## [Unreleased] — 2026-05-26

### Added — Kolaborasi Wallet & Undangan Email SMTP

#### Fitur Baru
- **Undang anggota wallet via email:** Pemilik wallet dapat mengundang anggota baru melalui form di halaman anggota wallet (`/wallets/[walletId]/members`). Pemilik memilih email dan peran (Editor / Peninjau), sistem membuat token undangan dan mengirim email melalui SMTP.
- **Halaman penerimaan undangan interaktif:** Halaman `/invite/[token]` kini menangani 5 state: token tidak valid, kedaluwarsa/dibatalkan, pengguna belum login, email tidak cocok, dan siap terima. Pengguna dapat menerima undangan langsung dari halaman tersebut.
- **Batalkan undangan:** Pemilik wallet dapat membatalkan undangan yang masih pending dari halaman anggota.
- **Template email undangan HTML:** Email undangan dalam Bahasa Indonesia dengan desain yang selaras dengan DESIGN.md (warna sage, tipografi Hanken Grotesk/Inter).

#### File Baru
| File | Deskripsi |
|---|---|
| `lib/email.ts` | Utility pengiriman email via SMTP menggunakan nodemailer. Fungsi `sendInviteEmail()` dengan template HTML undangan wallet. |
| `app/actions/invitations.ts` | Server actions: `createInvitation`, `acceptInvitation`, `revokeInvitation` |

#### File Diubah
| File | Perubahan |
|---|---|
| `lib/data.ts` | Tambah tipe `InvitationRow`, fungsi `queryInvitations()`, dan field `invitations` pada `WalletBundle`. `getWalletBundle()` sekarang juga mengambil data invitation. |
| `app/wallets/[walletId]/members/page.tsx` | Ganti notice placeholder SMTP dengan form undang anggota (input email + dropdown role), daftar undangan pending dengan tombol batalkan, dan notifikasi error/success dari query params. |
| `app/invite/[token]/page.tsx` | Full rewrite dari placeholder statis menjadi halaman interaktif yang menangani semua state undangan dan form penerimaan. |
| `components/ui/button.tsx` | Tambah props `type` (submit/button/reset) dan `size` (sm/md) pada komponen Button. |
| `package.json` | Tambah dependensi `nodemailer` dan `@types/nodemailer`. |

#### Dependensi Baru
- `nodemailer` — library pengiriman email SMTP
- `@types/nodemailer` — type definitions untuk TypeScript

#### Konfigurasi
Tidak ada perubahan konfigurasi. Environment variables SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) sudah ada di `docker-compose.self-hosted.yml` untuk GoTrue Supabase dan digunakan kembali oleh `lib/email.ts`.

#### Database
Tidak ada perubahan skema. Tabel `wallet_invitations` dan RLS policies sudah lengkap dari migration `0001_balance_mvp.sql`.