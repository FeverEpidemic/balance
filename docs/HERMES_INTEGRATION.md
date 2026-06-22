---
title: Hubungkan Balance dengan Hermes Agent
version: 1.0.0
last_updated: 2026-06-22
audience: Balance users (no terminal experience required)
---

# Hubungkan Balance dengan Hermes Agent

Panduan lengkap buat nyambungin catatan keuangan Balance kamu ke Hermes — asisten AI yang bisa kamu tanya-tanya soal duit lewat terminal atau chat, langsung dari laptop kamu.

---

## 1. Hermes itu apa?

Hermes adalah **asisten AI open-source** yang jalan di laptop kamu sendiri. Dia bisa baca data dari aplikasi lain (termasuk Balance), ngobrol sama kamu, bahkan bikin reminder otomatis — semua gratis, gak perlu langganan.

Bayangin kayak ChatGPT, tapi:
- **Jalan di laptop kamu sendiri** — data kamu gak pernah dikirim ke server orang lain
- **Bisa otomatis** — misalnya: setiap Senin pagi, dia kasih rekap pengeluaran mingguan kamu
- **Bisa akses Balance** — setelah disambungin, dia bisa baca catatan keuangan & catat transaksi langsung

Intinya: Hermes itu partner AI yang bantu kamu ngelola duit di Balance tanpa harus buka HP terus-terusan.

---

## 2. Yang bisa kamu lakukan

Begitu Hermes nyambung ke Balance, kamu bisa ngobrol kayak gini:

> **"Berapa pengeluaranku bulan ini?"**
>
> Hermes: *Total pengeluaran Juni: Rp 947.369. Kategori terbesar: Belanja Harian (Rp 184.900).*

> **"Catat pengeluaran 25rb buat GoFood barusan."**
>
> Hermes: *Transaksi tercatat: Expense Rp 25.000 — "GoFood" di wallet Personal.*

> **"Bandingin pemasukan minggu ini sama minggu lalu."**
>
> Hermes: *Minggu ini: Rp 2.1jt (↑ 15% dari minggu lalu). Kenaikan dari freelance & THR.*

> **"Rekap semua wallet, bulan ini."**
>
> Hermes: *Personal: Rp 74rb net. Bersama: Rp 4.4jt net. Total: Rp 4.47jt net.*

Semua ini tinggal kamu ketik di terminal, dan Hermes langsung jawab dengan data real dari Balance kamu.

---

## 3. Sebelum mulai

Yang kamu butuhin:

| Butuh | Kenapa |
|-------|--------|
| **Akun Balance** di [mybalance.my.id](https://mybalance.my.id) | Jelas, data kamu ada di sini |
| **Laptop (Mac/Linux/Windows)** | Hermes jalan di laptop |
| **Akses internet** | Buat install & komunikasi sama Balance |
| **±10 menit waktu** | Setup-nya cepet kok |

Gak perlu ngerti coding, gak perlu ngerti terminal. Ikutin aja langkahnya.

---

## 4. Panduan Setup (dari nol)

### Langkah 1: Generate API Key di Balance

Ini kayak "password khusus" yang ngasih Hermes izin baca data Balance kamu.

1. **Buka [mybalance.my.id](https://mybalance.my.id)** di browser
2. **Login** ke akun kamu
3. Klik **Settings** (ikon gear di sidebar)
4. Scroll ke bagian **API Keys**
5. Klik tombol **"Generate New Key"**
6. **Langsung copy key-nya sekarang juga!** (key cuma muncul sekali — kalau ketutup, harus generate ulang)
7. Simpan di notepad / notes dulu buat dipakai nanti

Format key bakal kayak gini:
```
bal_rok6EEF_EdPofGfHV1m-6UIci-VUMyd2ub70SnAAgUk
```

> ⚠️ **PENTING:** Key ini cuma muncul sekali. Kalau hilang, kamu harus generate key baru dari Settings. Jangan share key ini ke siapa-siapa — ini setara dengan password kamu.

---

### Langkah 2: Install Hermes

Buka **Terminal** di laptop kamu. (Cara buka terminal: di Mac cari "Terminal" di Spotlight, di Windows cari "Command Prompt" atau "PowerShell", di Linux biasanya Ctrl+Alt+T.)

Copy-paste command ini, lalu tekan Enter:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

Tunggu ±1-2 menit sampai selesai. Kamu bakal lihat teks sukses di akhir — berarti Hermes udah terinstall.

Kalau setelah install terminal bilang `hermes: command not found`, **tutup dan buka lagi terminal kamu**, lalu lanjut.

---

### Langkah 3: Setting API Key

Sekarang kita masukin API Key Balance ke Hermes biar dia bisa akses data kamu.

Di terminal yang sama, jalankan:

```bash
mkdir -p ~/.hermes
```

Terus:

```bash
echo 'BALANCE_API_KEY=bal_xxx' >> ~/.hermes/.env
```

**Ganti `bal_xxx` dengan API key kamu yang asli** (yang tadi di-copy dari Settings Balance).

Contoh kalau key kamu `bal_rok6EEF_EdPofGfHV1m-6UIci-VUMyd2ub70SnAAgUk`:

```bash
echo 'BALANCE_API_KEY=bal_rok6EEF_EdPofGfHV1m-6UIci-VUMyd2ub70SnAAgUk' >> ~/.hermes/.env
```

> 💡 **Tips:** Kalau kamu gak nyaman ngetik key manual, kamu bisa buka file `.env` dengan text editor:
> - Mac/Linux: `nano ~/.hermes/.env`
> - Windows: buka Notepad, lalu File → Open → arahkan ke `C:\Users\[nama-kamu]\.hermes\.env`
>
> Isi file-nya 1 baris doang: `BALANCE_API_KEY=bal_xxx`

---

### Langkah 4: Install skill Balance API

Hermes punya sistem "skill" — kayak plugin yang ngasih dia kemampuan khusus. Kita perlu install skill `balance-api` biar Hermes ngerti cara ngobrol sama Balance.

Di terminal:

```bash
hermes skills install balance-api
```

Kalau command ini sukses, kamu akan lihat output konfirmasi. Skill ini udah termasuk semua kemampuan buat baca rekap, catat transaksi, dan chat AI Balance.

---

### Langkah 5: Test chat pertama

Sekarang saatnya nyobain! Di terminal, jalankan:

```bash
hermes chat -q "Berapa pengeluaranku bulan ini?" --skills balance-api
```

Kalau semuanya bener, Hermes bakal jawab dengan data pengeluaran real dari Balance kamu.

Kalau muncul error, jangan panik — cek bagian **Troubleshooting** di bawah.

---

## 5. Contoh Penggunaan

Setelah setup beres, ini command-command yang bisa kamu coba:

### Rekap keuangan

```bash
# Rekap hari ini
hermes chat -q "Rekap pengeluaranku hari ini" --skills balance-api

# Rekap minggu ini
hermes chat -q "Ringkasan keuangan minggu ini" --skills balance-api

# Rekap bulan ini
hermes chat -q "Total pemasukan dan pengeluaran bulan ini" --skills balance-api
```

### Catat transaksi

```bash
# Catat pemasukan
hermes chat -q "Catat pemasukan 500rb dari freelance" --skills balance-api

# Catat pengeluaran
hermes chat -q "Catat pengeluaran 25rb buat GoFood barusan" --skills balance-api
```

### Analisis & pertanyaan

```bash
# Bandingin periode
hermes chat -q "Bandingin pengeluaranku minggu ini vs minggu lalu" --skills balance-api

# Kategori terbesar
hermes chat -q "Kategori pengeluaran apa yang paling gede bulan ini?" --skills balance-api

# Saran
hermes chat -q "Berdasarkan data bulan ini, apa yang bisa aku hemat?" --skills balance-api
```

> 💡 **Tips:** Kamu bisa ngobrol natural kayak lagi chat sama temen. Hermes ngerti Bahasa Indonesia dan bakal berusaha jawab sebaik mungkin pakai data dari akun Balance kamu.

---

## 6. Cron Job / Reminder Otomatis (opsional)

Selain chat manual, Hermes bisa otomatis ngasih laporan keuangan secara berkala. Ini namanya **cron job**.

### Contoh: Rekap mingguan setiap Senin jam 8 pagi

```bash
hermes cronjob create \
  --name "Rekap Mingguan Balance" \
  --schedule "0 8 * * 1" \
  --prompt "Bikin rekap keuangan mingguan dari Balance: total pemasukan, pengeluaran, net, dan kategori terbesar. Bahasa Indonesia santai." \
  --skills balance-api
```

### Contoh: Reminder catat pengeluaran harian jam 9 malam

```bash
hermes cronjob create \
  --name "Reminder Catat Pengeluaran" \
  --schedule "0 21 * * *" \
  --prompt "Ingetin user buat catat pengeluaran hari ini ke Balance. Tanya dengan ramah, kasih tau kalau mereka bisa reply dan kamu akan catat transaksinya." \
  --skills balance-api
```

Setiap cron job akan otomatis ngirim notifikasi ke platform chat yang tersambung (Telegram, Discord, dll) sesuai jadwal yang kamu set.

---

## 7. Troubleshooting

### "hermes: command not found"

**Artinya:** Terminal belum ngenalin perintah `hermes`.

**Solusi:** Tutup terminal, buka lagi. Kalau masih error, restart laptop kamu. Installer Hermes udah auto-konfigurasi — cuma butuh sesi terminal baru.

---

### "Error: unauthorized (401)"

**Artinya:** API Key kamu salah atau udah kadaluarsa.

**Solusi:**
1. Cek lagi isi `~/.hermes/.env` — pastikan key lengkap (gak ada `...` di tengah)
2. Key harus diawali `bal_`
3. Coba generate key baru dari Settings Balance
4. Update file `.env` dengan key baru

---

### "Error: Cloudflare (403)"

**Artinya:** Cloudflare (pelindung website Balance) nge-block request dari Hermes.

**Solusi:** Kamu perlu bikin aturan khusus di dashboard Cloudflare. Kalau kamu yang pegang akses Cloudflare domain `mybalance.my.id`:

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pilih domain `mybalance.my.id`
3. Security → WAF → Custom Rules
4. Buat rule baru dengan setting:
   - **Name:** `Skip challenge for Balance API`
   - **Field:** `URI Path` → **starts with** → `/api/`
   - **Action:** **Skip** → centang **"Managed Challenge"**
5. Simpan di posisi paling atas (priority tertinggi)

Setelah rule aktif, coba lagi command Hermes kamu.

Kalau kamu gak punya akses Cloudflare, minta tolong ke admin domain buat nambahin rule ini. Detail lengkapnya ada di [docs/API_REFERENCE.md](./API_REFERENCE.md#9-%EF%B8%8F-cloudflare-setup).

---

### "Error: connection refused / timeout"

**Artinya:** Hermes gak bisa nyambung ke internet, atau server Balance lagi down.

**Solusi:**
1. Cek koneksi internet kamu
2. Coba buka [mybalance.my.id](https://mybalance.my.id) di browser — kalau gak bisa, berarti server Balance memang lagi maintenance
3. Tunggu beberapa menit dan coba lagi

---

### "Hermes jawab 'maaf, saya tidak bisa mengakses data'"

**Artinya:** Skill `balance-api` belum ke-load.

**Solusi:**
1. Pastikan kamu udah install skill: `hermes skills install balance-api`
2. Pastikan kamu nyertakan `--skills balance-api` di command
3. Cek lagi apakah API key sudah benar di `~/.hermes/.env`

---

## 8. Catatan Keamanan

### Data kamu tetap aman

- **Hermes jalan di laptop kamu sendiri.** Data gak pernah dikirim ke server pihak ketiga.
- **API Key cuma dipakai buat komunikasi Hermes ↔ Balance.** Gak ada yang bisa baca key kamu kecuali orang yang punya akses fisik ke laptop kamu.
- **Balance nyimpen key dalam bentuk hash (SHA256).** Bahkan admin Balance gak bisa lihat API key kamu setelah generate.

### Yang perlu kamu jaga

- **Jangan share API key kamu.** Simpan kayak password.
- **Jangan commit `.env` ke Git / repo publik.**
- **Kalau laptop hilang**, segera revoke API key dari database Balance. Saat ini revoke masih via SQL manual — hubungi admin kalau mendesak.
- **Generate key baru secara berkala**, misalnya 3 bulan sekali.

### Yang Hermes bisa akses

Dengan API key Balance, Hermes bisa:
- Baca rekap keuangan kamu (semua wallet yang kamu punya akses)
- Catat transaksi baru
- Akses AI Chat Balance (tergantung kuota plan kamu)

Hermes **gak bisa**:
- Hapus transaksi
- Edit data akun kamu
- Akses data user lain
- Ganti password atau setting akun

---

## Butuh bantuan?

Kalau ada masalah yang gak ketemu solusinya di sini:

- Buka [github.com/FeverEpidemic/balance](https://github.com/FeverEpidemic/balance) — cek Issues atau bikin baru
- Cek [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) untuk masalah umum Balance
- Cek [docs/API_REFERENCE.md](./API_REFERENCE.md) untuk dokumentasi teknis lengkap API

---

Happy tracking! 🎉
