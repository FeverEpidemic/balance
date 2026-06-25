# AI Chat Balance: Ngobrol Sama Aplikasi Keuangan Kamu

**Deep dive fitur AI Chat. Dari nanya saldo, catat transaksi, sampai minta rekap — semua lewat chat biasa.**

---

Bayangin kamu lagi rebahan, malem-malem, tiba-tiba kepikiran: "Duit gue bulan ini sisa berapa ya?"

Biasanya sih kamu harus buka app, scroll dashboard, liat saldo, itung-itung sendiri. Atau lebih parah lagi: buka mobile banking, cek mutasi, itung manual di kalkulator.

Di Balance? Kamu tinggal chat.

Dan bukan cuma nanya saldo. Kamu bisa ngobrol sama aplikasi kamu kayak lagi chat sama temen. AI Chat Balance dibangun pakai DeepSeek, ngerti bahasa sehari-hari, dan langsung nyambung ke data keuangan kamu.

---

## Gimana Cara Mulainya?

Pertama kali kamu buka halaman Chat di Balance, bakal muncul pop-up compliance gate. Intinya: Balance minta izin kamu buat akses data keuangan biar AI-nya bisa jawab pertanyaan. Gak akan ada data yang diproses sebelum kamu klik setuju.

Setelah opt-in, kamu langsung bisa ngobrol. Di bagian atas halaman chat ada panduan singkat — contoh pertanyaan yang bisa kamu coba.

**[SCREENSHOT 1: Halaman AI Chat Balance]**
*Tampilan halaman chat dengan panduan cepat di header dan kolom input di bagian bawah.*

---

## Contoh 1: Nanya Rekap Keuangan

Ini use case paling umum. Kamu pengen tau ringkasan keuangan tanpa harus buka dashboard.

**Kamu:** "Rekap pengeluaran gue bulan ini"

**AI:** "Berikut rekap pengeluaran kamu bulan Juni 2026: Total pengeluaran Rp 3.250.000, dari 28 transaksi. Kategori terbesar: Makanan (Rp 1.200.000), Transport (Rp 650.000), Entertainment (Rp 400.000). Sisa saldo kamu saat ini Rp 2.750.000."

Gak perlu klik kanan-kiri. Satu pertanyaan, satu jawaban lengkap.

Dan kamu bisa spesifik juga:

**Kamu:** "Rekap pengeluaran minggu ini aja"

**AI:** "Minggu ini (16-22 Juni) pengeluaran kamu Rp 780.000. Ini lebih rendah dibanding minggu lalu yang Rp 950.000. Good job!"

---

## Contoh 2: Catat Transaksi Lewat Chat

Nah, ini fitur yang paling sering gue pake. Gak perlu isi form transaksi manual.

**Kamu:** "Catat pengeluaran 45rb buat beli bensin"

**AI:** "Tercatat: Pengeluaran Rp 45.000 untuk Transport (Bensin). Mau ditambahin catatan lain?"

**Kamu:** "Gak perlu"

**AI:** "Oke, transaksi udah tersimpan. Saldo kamu sekarang Rp 2.705.000."

Proses di belakang layarnya: AI deteksi intent kamu (mau catat transaksi), ekstrak nominal (45rb), kategori (Transportasi), dan sumbernya. Kalau AI-nya confident, langsung simpan. Kalau ragu, dia bakal konfirmasi dulu ke kamu.

**[SCREENSHOT 2: Contoh percakapan catat transaksi]**
*Tampilan chat saat user minta catat transaksi — AI konfirmasi detail sebelum simpan.*

---

## Contoh 3: Pantau Budget

Bukan cuma transaksi, AI Chat juga ngerti budget.

**Kamu:** "Budget makanan gue masih berapa?"

**AI:** "Budget Makanan bulan ini: Rp 1.500.000. Udah terpakai Rp 1.200.000 (80%). Sisa Rp 300.000 buat 8 hari ke depan. Hati-hati ya, budgetnya udah menipis."

**Kamu:** "Bikinin budget baru buat entertainment 500rb"

**AI:** "Budget Entertainment Rp 500.000/bulan udah dibuat. Mau langsung aktif mulai bulan ini?"

---

## Contoh 4: Insight Spontan

Kadang AI Chat juga bisa kasih insight yang gak kamu minta. Di dashboard, ada kartu insight yang muncul otomatis:

**[SCREENSHOT 3: Kartu AI Insight di dashboard]**
*Kartu insight di dashboard Balance yang menampilkan observasi AI, misalnya: "Pengeluaran makanan kamu naik 25% dibanding bulan lalu."*

Insight kayak gini bikin kamu sadar pola yang mungkin gak ke-notice.

---

## Privacy: Gimana Data Kamu?

Gue tau sebagian orang mikir: "AI akses data keuangan gue? Aman gak tuh?"

Beberapa hal yang perlu kamu tau:

- **Opt-in dulu.** Data gak bakal dikirim ke AI sebelum kamu klik setuju.
- **Token budgeting.** Balance ngirim data seperlunya aja ke AI. Bukan seluruh history kamu dari awal daftar. Cuma data yang relevan buat jawab pertanyaan.
- **Pakai DeepSeek.** Provider AI eksternal, tapi Balance pake API yang udah comply sama standar keamanan.
- **Chat history lokal.** Riwayat percakapan kamu disimpan di browser lokal, bukan di server.

Jadi simpelnya: data kamu tetap di bawah kontrol kamu.

---

## Free vs Premium: Bedanya Apa?

AI Chat bisa dipakai di plan Free maupun Premium. Bedanya:

| Fitur | Free | Premium |
|-------|------|---------|
| AI Chat | ✅ (daily limit) | ✅ (unlimited) |
| Catat transaksi via AI | ✅ | ✅ |
| Rekap via AI | ✅ | ✅ |
| Insight AI dashboard | ✅ | ✅ |
| Budget via AI | ✅ | ✅ |

Free user dapet free trial 7 hari Premium buat nyobain akses unlimited. Setelah itu balik ke daily limit, tapi semua fitur tetap bisa dipake.

---

## Tips Biar AI Chat Makin Jago

- **Spesifik lebih baik.** "Rekap pengeluaran minggu ini" lebih jelas daripada "gimana keuangan gue".
- **Bahasa natural aja.** Gak perlu kayak ngasih perintah robot. Ngomong aja kayak biasa.
- **Manfaatin buat transaksi receh.** Males buka form? Chat aja. Paling cepet buat transaksi kecil-kayak parkir, jajan, atau gofood.
- **Cek insight rutin.** Kadang insight AI ngingetin hal yang kamu gak sadar.

---

## Penutup

AI Chat di Balance bukan gimmick yang cuma bisa jawab "halo". Dia beneran ngerti konteks keuangan kamu dan bisa bantu hal-hal praktis: catat transaksi, cek budget, bikin rekap.

Buat kamu yang udah pakai Balance tapi belum coba fitur ini, buka halaman Chat sekarang juga. Opt-in, dan mulai ngobrol. 

Kalau belum punya akun, daftar di [mybalance.my.id](https://mybalance.my.id) — free trial Premium 7 hari udah nunggu.

---

*Artikel ini bagian dari seri Fitur & Tutorial Balance. Besok: Cerita Dibalik Layar — Stack Teknologi Balance.*
