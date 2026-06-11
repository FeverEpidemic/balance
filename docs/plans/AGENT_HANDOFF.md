# Agent Handoff

Dokumen ini merangkum percakapan, keputusan, implementasi, dan status repo agar agent lain bisa melanjutkan pekerjaan tanpa kehilangan konteks.

## Ringkasan Singkat

- Repo: `/home/ilham827/project/Balance/balance`
- Branch saat ini: `main`
- Commit implementasi terakhir: `a685318` (`Add transaction history page and align local Node version`)
- Status git saat handoff ini dibuat: bersih

Fokus percakapan dan pekerjaan:
- Review dan rapikan `docs/plans/PLAN_UPGRADE.md` agar aman diimplementasikan pada repo ini.
- Implementasikan fase awal plan upgrade transaksi.
- Selaraskan environment lokal ke Node 20+ agar sesuai `package.json` dan menghindari warning Supabase/Next tooling.

## Apa yang Dibahas dan Diputuskan

Awalnya `docs/plans/PLAN_UPGRADE.md` masih generik dan belum cukup grounded ke kondisi repo. Setelah beberapa putaran review, plan dikunci supaya:

- Fokus utama adalah polish UX transaksi, bukan rewrite UI seluruh app.
- Migrasi `shadcn/ui` dibatasi pada iterasi pertama untuk:
  - `Sheet`
  - `Dialog`
  - `Table`
- Komponen existing yang tetap dipertahankan pada iterasi pertama:
  - `ActionForm`
  - `SubmitButton`
  - `ConfirmSubmitButton`
  - `CurrencyInput`
  - `Badge`
  - button/link helper existing bila belum ada kebutuhan jelas untuk diganti
- Halaman transaksi utama harus tetap ringan:
  - fokus pada input transaksi
  - hanya menampilkan ringkasan transaksi terbaru dalam jumlah terbatas
  - punya CTA jelas ke history page
- History transaksi penuh dipindah ke route baru:
  - `/wallets/[walletId]/transactions/history`
- History page harus memakai loader khusus yang terpisah dari loader halaman transaksi utama.
- Dataset history tidak boleh mengirim seluruh histori lintas bulan ke client pada iterasi pertama.
- `date-fns` tidak wajib. Fase itu hanya dikerjakan jika benar-benar dibutuhkan.

## Status Implementasi terhadap `docs/plans/PLAN_UPGRADE.md`

### Sudah selesai

#### Fase 1
- Fondasi primitive untuk iterasi pertama sudah ditambahkan:
  - `components/ui/dialog.tsx`
  - `components/ui/sheet.tsx`
  - `components/ui/table.tsx`

#### Fase 2
- Mobile navigation drawer berbasis `Sheet` sudah ditambahkan ke `AppShell`.
- Bottom nav existing tetap dipertahankan.
- Logout flow existing tidak diubah.

#### Fase 3
- Route history transaksi terpisah sudah dibuat:
  - `app/(app)/wallets/[walletId]/transactions/history/page.tsx`
  - `app/(app)/wallets/[walletId]/transactions/history/loading.tsx`
- Halaman transaksi utama sudah diringankan:
  - tetap fokus ke input
  - hanya menampilkan ringkasan transaksi terbaru
  - punya CTA ke history page

#### Fase 4
- History page desktop sudah memakai `@tanstack/react-table`
- Fitur yang sudah ada:
  - sorting
  - pagination client-side
  - search client-side
  - mobile card view
- Loader history khusus sudah dipisahkan dari loader transaksi utama.
- Query history sudah dibatasi per bulan di server.

#### Environment alignment
- Ditambahkan `.nvmrc` berisi `20.9.0`
- README diperjelas agar local development memakai Node `20.9.0` atau lebih baru

### Belum dikerjakan

#### Fase 5
- Evaluasi `date-fns` belum dikerjakan.
- Repo masih memakai helper tanggal existing di `lib/utils.ts`.

#### Bagian opsional/lanjutan dari Fase 2
- Edit transaksi di halaman utama masih memakai `InlineEditPanel`.
- Belum ada migrasi menyeluruh ke `Dialog` untuk semua flow edit transaksi.

## File dan Area yang Diubah

### Plan dan dokumentasi
- `docs/plans/PLAN_UPGRADE.md`
- `README.md`
- `CHANGELOG.md`
- `.nvmrc`

### UI / App shell
- `components/app-shell.tsx`
- `components/ui/button.tsx`
- `components/ui/dialog.tsx`
- `components/ui/sheet.tsx`
- `components/ui/table.tsx`

### Surface transaksi
- `components/features/transactions/transactions-page-content.tsx`
- `components/features/transactions/transaction-history-page-content.tsx`
- `app/(app)/wallets/[walletId]/transactions/history/page.tsx`
- `app/(app)/wallets/[walletId]/transactions/history/loading.tsx`

### Data layer transaksi
- `lib/data/cache.ts`
- `lib/data/index.ts`
- `lib/data/mappers.ts`
- `lib/data/queries.ts`
- `lib/data/types.ts`

### Dependency
- `package.json`
- `package-lock.json`

## Detail Implementasi Penting

### 1. Halaman transaksi utama

Perubahan di `components/features/transactions/transactions-page-content.tsx`:
- transaksi yang ditampilkan sekarang hanya ringkasan terbatas
- ada CTA ke:
  - `/wallets/[walletId]/transactions/history?month=...`

Targetnya supaya halaman ini tetap menjadi surface input cepat, bukan history penuh.

### 2. History page baru

History page baru di:
- `app/(app)/wallets/[walletId]/transactions/history/page.tsx`

Komponen utama:
- `components/features/transactions/transaction-history-page-content.tsx`

Behavior:
- filter bulan tetap via URL
- desktop memakai data table
- mobile memakai card list
- edit memakai dialog
- delete tetap via action form + confirm button existing

### 3. Data loader khusus history

Loader baru:
- `getTransactionHistoryPageData(userId, walletId, selectedMonth)`

Alasan:
- memisahkan payload history dari payload halaman transaksi utama
- menghindari reuse cache key yang bisa menyebabkan data tertukar

Query baru:
- `queryTransactionsByMonth(walletIds, month, limit?)`

Cache key baru:
- `getTransactionHistoryCacheKey(userId, walletId, month)`

### 4. Navigasi mobile

Perubahan di `components/app-shell.tsx`:
- mobile sekarang punya tombol `Menu`
- membuka `Sheet` sebagai drawer navigasi tambahan
- bottom nav utama tetap ada

Ini sesuai keputusan plan:
- drawer melengkapi navigasi wallet
- bottom nav existing tidak dihapus pada iterasi pertama

## Verifikasi yang Sudah Dilakukan

Command yang sudah dijalankan:

```bash
npm run typecheck
npm run test
npm run build
```

Hasil:
- `typecheck`: pass
- `test`: pass, 45/45 test
- `build`: pass

Catatan build:
- Saat build dari environment agent, sempat muncul warning karena runtime lokal masih Node 18.
- Implementasi tetap build sukses.
- Setelah itu repo diselaraskan dengan `.nvmrc` dan dokumentasi Node lokal.

## Kondisi Repo Saat Ini

- Commit terakhir: `a685318`
- Working tree bersih saat handoff ini dibuat

## Hal yang Perlu Diperhatikan Agent Berikutnya

### Jika ingin lanjut ke fase berikutnya

Opsi pekerjaan paling logis berikutnya:
- lanjut ke Fase 5 dan evaluasi apakah `date-fns` memang dibutuhkan
- atau lanjut merapikan UX edit transaksi dengan `Dialog` di lebih banyak surface

### Batasan yang harus tetap dijaga

- jangan ubah kontrak server actions transaksi yang sudah stabil
- jangan ganti `CurrencyInput`, `SubmitButton`, `ConfirmSubmitButton`, atau `ActionForm` tanpa alasan kuat
- jangan ubah invalidasi cache granular yang sudah ada
- jangan ubah flow auth, recurring, savings, settlement, atau reports jika tidak relevan
- pertahankan tone visual `Serene Capital`

### Risiko yang sudah diketahui

- History page saat ini sudah aman untuk iterasi pertama, tetapi bila jumlah transaksi per bulan sangat besar, pagination server-side bisa jadi dibutuhkan di iterasi lanjutan.
- `date-fns` belum dipakai; jangan menambahkannya hanya karena preferensi, kecuali ada kebutuhan UX atau utilitas yang nyata.

## Rekomendasi Lanjutan

Jika agent berikutnya melanjutkan:
1. Baca `docs/plans/PLAN_UPGRADE.md` sebagai baseline keputusan.
2. Cek commit `a685318` sebagai titik awal implementasi.
3. Kalau lanjut ke fase berikutnya, jaga scope tetap sempit dan verifikasi minimal dengan:
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
