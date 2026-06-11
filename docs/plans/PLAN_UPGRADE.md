# Rencana Upgrade Frontend `balance`

Dokumen ini adalah rencana upgrade frontend untuk repo `balance` di `/home/ilham827/project/Balance/balance`.
Fokusnya bukan memulai ulang UI dari nol, tetapi memodernisasi pengalaman transaksi secara bertahap dengan tetap menghormati arsitektur App Router, design language `Serene Capital`, server actions yang sudah ada, serta workflow `npm` yang dipakai repo ini.

## Summary

Tujuan upgrade:
- Memoles UI dan UX transaksi tanpa merusak flow aplikasi yang sudah stabil.
- Memulai migrasi bertahap ke `shadcn/ui` untuk area baru atau area yang memang disentuh.
- Memisahkan riwayat transaksi penuh ke halaman khusus agar halaman transaksi utama tetap ringan dan mobile-friendly.
- Menambah dependency hanya bila benar-benar memberi nilai implementasi yang jelas.
- Menjaga util tanggal existing, kecuali implementasi riwayat baru memang membutuhkan helper yang lebih konsisten.

Prinsip implementasi:
- Gunakan `npm`, bukan `pnpm`.
- Pertahankan design token dan tone visual dari `DESIGN.md`.
- Jangan mengubah kontrak server actions, redirect helper, cache invalidation, atau format currency yang sudah dipakai aplikasi.
- Jangan mengubah pola create/update/delete transaksi yang sekarang sudah dibangun di atas `ActionForm`, `SubmitButton`, `ConfirmSubmitButton`, dan `CurrencyInput`.
- Jadikan dokumen ini decision-complete supaya bisa langsung dipakai untuk implementasi.

## Baseline Project Saat Ini

Kondisi repo yang menjadi titik awal plan ini:
- Stack utama: Next.js App Router, React, TypeScript strict, Tailwind CSS, Supabase Auth/Postgres/RLS.
- Struktur utama mengikuti `app/`, `components/`, `lib/`, dan `lib/data/` sebagai read-model layer.
- Komponen UI shared saat ini berada di `components/ui/` dan sudah dipakai luas di seluruh aplikasi.
- Form wallet utama seperti transaksi, budget, recurring, dan savings sudah memakai pola client-side action state + refresh ringan App Router.
- Dashboard dan halaman wallet sudah punya loading skeleton, toast feedback, serta pola invalidasi cache yang lebih granular.
- Fitur transaksi saat ini masih menggabungkan input dan histori dalam satu surface utama, dengan filter bulan berbasis URL yang perlu dipertahankan.
- Loader transaksi saat ini mengambil data dari `getTransactionsPageData()` di `lib/data/` dan pada akhirnya memakai query transaksi yang diurutkan terbaru lebih dulu.
- Repo sudah mendukung hosted maupun self-hosted Supabase, jadi plan ini tidak boleh menambah asumsi deployment baru.

## Scope Upgrade

Masuk scope:
- Setup `shadcn/ui` yang kompatibel dengan styling repo.
- Modernisasi surface transaksi dan riwayat transaksi.
- Penambahan halaman history transaksi khusus.
- Penambahan data table desktop dengan fallback mobile yang tetap card-first.
- Peningkatan animasi ringan bila diperlukan untuk komponen baru.
- Evaluasi terbatas penggunaan `date-fns` hanya pada surface history transaksi.
- Penyesuaian loader transaksi bila diperlukan agar history page tidak memuat dataset yang tidak proporsional.

Di luar scope:
- Rewrite total semua komponen `components/ui/`.
- Perubahan database, migration Supabase, atau kontrak RLS.
- Perubahan arsitektur server actions, auth flow, recurring scheduler, savings flow, atau cache layer.
- Penggantian helper `formatCurrency` atau perubahan bahasa UI dari Bahasa Indonesia.
- Migrasi global seluruh helper tanggal di luar surface transaksi/history.

## Dependency Policy

Dependency yang boleh dipakai dalam implementasi plan ini:
- `shadcn/ui`
- `@tanstack/react-table`
- `tailwindcss-animate` bila memang dibutuhkan oleh komponen shadcn atau motion baru
- `date-fns` hanya bila fase history transaksi membutuhkan helper tanggal yang lebih konsisten dari util sekarang

Dependency tidak boleh ditambahkan hanya karena preferensi tooling. Setiap dependency baru harus punya peran langsung terhadap hasil akhir di surface yang disentuh.

## Fase Implementasi

### Fase 1: Fondasi `shadcn/ui` yang Kompatibel

Tujuan:
- Menyiapkan `shadcn/ui` sebagai basis bertahap untuk komponen baru tanpa memutus komponen shared existing secara mendadak.

Langkah:
1. Inisialisasi `shadcn/ui` dengan konfigurasi yang cocok untuk Tailwind CSS v3 dan CSS variables.
2. Arahkan output komponen ke `components/ui/` agar tetap selaras dengan struktur repo.
3. Pasang hanya primitive yang memang dibutuhkan untuk upgrade transaksi/history:
   - `sheet`
   - `dialog`
   - `table`
4. Selaraskan token `shadcn/ui` dengan variabel yang sudah ada di `app/globals.css`, terutama area:
   - `--background`
   - `--foreground`
   - `--card`
   - `--border`
   - `--primary`
   - `--muted`
5. Pastikan hasil integrasi tetap mengikuti nuansa `Serene Capital`, bukan visual default shadcn.

Keputusan penting:
- Komponen shared existing tetap menjadi default untuk area yang tidak disentuh.
- Area baru atau area yang sedang di-upgrade boleh memakai primitive shadcn.
- Jangan memelihara duplikasi primitive lebih lama dari yang perlu; untuk surface baru, pilih satu primitive final per use case.
- Iterasi pertama hanya mengizinkan `shadcn/ui` untuk `Sheet`, `Dialog`, dan `Table` pada surface transaksi/history.
- Komponen berikut tetap dipertahankan pada iterasi pertama: `CurrencyInput`, `SubmitButton`, `ConfirmSubmitButton`, `ActionForm`, `Badge`, dan helper button/link existing bila belum ada kebutuhan jelas untuk menggantinya.

### Fase 2: Migrasi Surface Interaksi yang Paling Bernilai

Tujuan:
- Menerapkan primitive baru pada area yang paling terasa manfaatnya tanpa memicu refactor menyeluruh.

Langkah:
1. Tambahkan mobile navigation drawer berbasis `Sheet` di `components/app-shell.tsx` untuk akses navigasi wallet yang lebih rapi pada layar kecil.
2. Pertahankan bottom nav existing sebagai navigasi utama mobile; `Sheet` dipakai sebagai akses navigasi sekunder atau daftar tujuan wallet yang lebih lengkap.
3. Evaluasi surface edit transaksi/history agar tidak lagi bergantung pada pola UI yang terlalu padat jika dialog/sheet baru memberi UX yang lebih bersih.
4. Pertahankan flow submit yang sudah ada:
   - server actions tetap dipakai
   - action state tetap dipakai
   - refresh data tetap lewat pola App Router yang sekarang

Keputusan penting:
- Fokus fase ini adalah kualitas interaksi, bukan mengubah business logic.
- Jika ada komponen existing yang sudah memadai, tidak perlu dimigrasikan hanya demi konsistensi library.
- `InlineEditPanel` pada halaman transaksi utama boleh tetap dipakai pada iterasi pertama bila migrasi edit ke `Dialog` membuat scope membesar.
- Penambahan `Sheet` mobile tidak boleh menghapus bottom nav existing pada iterasi pertama.
- Upgrade navigasi mobile tidak boleh mengubah struktur navigasi desktop atau jalur logout yang sudah ada.

### Fase 3: Halaman Riwayat Transaksi Terpisah

Tujuan:
- Memindahkan histori penuh ke route terpisah agar halaman transaksi utama kembali fokus ke input dan ringkasan singkat.

Route baru:
- `/wallets/[walletId]/transactions/history`

Perilaku yang harus dijaga:
- Filter bulan tetap berada di URL agar tetap bisa di-share dan di-bookmark.
- Halaman transaksi utama tetap mendukung entry transaksi seperti sekarang.
- Halaman history baru menerima konteks wallet dan bulan terpilih dari read-model baru yang spesifik untuk history page.

Keputusan penting:
- Tidak ada alternatif route lain dalam plan final ini.
- Halaman history baru adalah jalur utama untuk histori penuh.
- Halaman transaksi utama tidak lagi menampilkan histori penuh.
- Halaman transaksi utama hanya menampilkan ringkasan histori singkat berupa 5 sampai 10 transaksi terbaru pada bulan terpilih, lalu CTA yang jelas ke halaman history penuh.
- CTA ke history penuh harus tersedia di halaman transaksi utama dan tetap terlihat pada mobile.
- `AppShell` tidak perlu menambah item nav global baru; discoverability history cukup lewat CTA kontekstual dari surface transaksi.
- Tambahkan read-model baru khusus history, misalnya `getTransactionHistoryPageData(userId, walletId, selectedMonth)`, daripada memperluas tanggung jawab `getTransactionsPageData()` yang sekarang dipakai halaman transaksi utama.

### Fase 4: Data Table Riwayat Transaksi

Tujuan:
- Menyediakan pengalaman histori yang lebih kuat di desktop tanpa mengorbankan ergonomi mobile.

Langkah:
1. Tambah `@tanstack/react-table`.
2. Buat komponen history table khusus transaksi, dengan shared wrapper seperlunya di `components/ui/`.
3. Implementasikan loader khusus history transaksi, misalnya `getTransactionHistoryPageData(...)`, yang tetap memakai filter bulan di server sebelum data masuk ke client component.
4. Batasi dataset history awal ke transaksi pada wallet dan bulan terpilih saja; jangan kirim seluruh histori lintas bulan ke client.
5. Tampilkan fitur berikut pada desktop:
   - sort by tanggal
   - sort by jumlah
   - pagination client-side
   - search/filter client-side di dalam dataset bulan terpilih
   - sticky header bila layout memungkinkan
6. Gunakan kolom minimum:
   - tanggal
   - deskripsi/catatan
   - kategori
   - jenis transaksi
   - jumlah
   - aksi
7. Gunakan `formatCurrency` yang sudah ada untuk nominal.
8. Di mobile, jangan memaksa tabel desktop ke layar sempit; sediakan render card-first berbasis dataset yang sama.

Keputusan penting:
- Data table dipakai untuk desktop history page, bukan untuk menggantikan semua tampilan histori di seluruh app.
- Search, sorting, dan pagination dilakukan client-side dalam konteks bulan yang sudah dipilih di server.
- Jika volume transaksi per bulan masih terlalu besar untuk pengalaman yang nyaman, pagination dipindahkan ke server-side sebagai langkah lanjutan, tetapi itu bukan target iterasi pertama.
- Implementasi history tidak boleh bergantung pada query tanpa batas untuk seluruh histori wallet.

### Fase 5: Evaluasi Terbatas `date-fns`

Tujuan:
- Menentukan apakah surface history transaksi benar-benar butuh helper tanggal baru.

Aturan:
- `date-fns` hanya ditambahkan jika implementasi history membutuhkan formatting atau relative date yang tidak nyaman dipertahankan lewat util saat ini.
- Jika helper tanggal existing sudah cukup, fase ini boleh dilewati seluruhnya.

Jika `date-fns` dipakai:
- Batasi pemakaian awal ke history transaksi atau surface terkait langsung.
- Gunakan locale Indonesia.
- Jangan lakukan migrasi menyeluruh seluruh `lib/utils.ts` kecuali memang muncul kebutuhan lanjutan yang terpisah dari plan ini.
- Dashboard, savings, recurring, dan surface lain tetap memakai helper tanggal existing pada iterasi ini.

## Dampak Implementasi

Area yang diperkirakan disentuh:
- `docs/plans/PLAN_UPGRADE.md` sebagai referensi kerja
- `app/globals.css` untuk token compatibility bila perlu
- `tailwind.config.ts` bila perlu plugin animasi
- `components/app-shell.tsx`
- `components/ui/` untuk primitive/wrapper baru
- `components/features/transactions/`
- route transaksi existing dan route baru `/wallets/[walletId]/transactions/history`
- read-model transaksi di `lib/data/` dengan loader khusus history page
- `app/(app)/wallets/[walletId]/transactions/page.tsx` dan page baru untuk history transaksi

Batasan yang wajib dijaga:
- Jangan merusak visual cream/sage/forest dan ritme spacing `Serene Capital`.
- Jangan memutus pola `useActionState` dan refresh ringan yang sudah dipakai wallet forms.
- Jangan mengubah invalidasi cache wallet yang sudah granular.
- Jangan mengubah perilaku auth, invite, savings, recurring, settlement, atau report yang tidak terkait langsung.
- Jangan memperluas scope menjadi migrasi penuh semua primitive button/input/select yang sudah stabil di area lain.

## Acceptance Criteria

Dokumen implementasi dianggap selesai bila hasil akhirnya memenuhi ini:
- Halaman transaksi utama tetap fokus pada input dan ringkasan, tidak kembali menjadi surface histori yang berat.
- Halaman transaksi utama hanya menampilkan ringkasan transaksi terbaru dalam jumlah terbatas dan CTA ke history penuh.
- Tersedia halaman history transaksi penuh di `/wallets/[walletId]/transactions/history`.
- History desktop mendukung sorting, pagination, dan pencarian/filter client-side dalam bulan terpilih.
- History mobile tetap nyaman dipakai dengan layout card-first.
- Primitive baru tetap konsisten dengan token dan tone visual repo.
- Mobile navigation drawer baru, bila ditambahkan, melengkapi shortcut existing tanpa menghilangkan bottom nav utama.
- Filter bulan tetap tersimpan di URL dan tetap shareable.
- Submit transaksi tetap memakai server actions yang ada.
- Nominal tetap diformat dengan helper existing.
- Perubahan tidak merusak revalidation helper, redirect helper, action state flow, atau invalidasi cache.
- Bila `date-fns` dipakai, formatting tanggal Indonesia konsisten di surface baru tanpa memaksa migrasi global.
- Loader history tidak mengirim seluruh histori lintas bulan ke client pada iterasi pertama.
- History page memakai loader khusus yang terpisah dari loader halaman transaksi utama.

## Verifikasi

Command yang harus disebut dan dipakai saat implementasi nanti:
- `npm install`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Verifikasi minimum:
- route transaksi utama dan history berhasil dirender
- submit form transaksi tetap bekerja
- CTA dari halaman transaksi utama ke history penuh bekerja
- sorting jumlah dan tanggal bekerja di history desktop
- pagination bekerja
- mobile history tetap terbaca
- halaman transaksi utama tetap ringan dan tidak merender seluruh histori wallet
- tidak ada error TypeScript atau build regression

## Assumptions

- Dokumen ini hanya merevisi plan upgrade, bukan menjalankan implementasi kodenya.
- Migrasi ke `shadcn/ui` bersifat bertahap dan terfokus pada area baru atau area yang disentuh.
- `date-fns` bukan target wajib; hanya dipakai jika memberi manfaat langsung pada history transaksi.
- Engineer implementasi tidak perlu membuat keputusan arsitektural baru di luar yang sudah ditetapkan di dokumen ini.
- Iterasi pertama memprioritaskan keamanan integrasi dan scope yang terkendali di atas keseragaman total library UI.
