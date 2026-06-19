# Self-Hosted Guide — Balance

> Bawa Balance jalan di server lo sendiri, full kontrol, tanpa biaya langganan.

---

## 📋 Prasyarat

| Kebutuhan | Minimal | Recommended |
|-----------|---------|-------------|
| **Server** | 1 vCPU, 1GB RAM | 2 vCPU, 2GB RAM |
| **OS** | Linux (Ubuntu 22.04+) | Linux (Debian 12 / Ubuntu 24.04) |
| **Docker** | Docker Engine 24+ | Docker + Docker Compose plugin |
| **Domain** | Opsional | Disarankan untuk HTTPS |
| **Waktu** | 15-30 menit | — |

---

## 🚀 Instalasi (3 Langkah)

### 1. Clone & Setup

```bash
git clone https://github.com/FeverEpidemic/balance.git
cd balance
cp .env.example .env
```

### 2. Konfigurasi `.env`

Buka `.env` dengan editor, isi minimal ini:

```env
# ── Wajib ────────────────────────────────────────────

# URL aplikasi (ganti dengan domain lo kalo udah punya)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
APP_SITE_URL=http://localhost:3000

# Supabase — pilih salah satu:
#
# Opsi A: Self-hosted Supabase (via docker-compose.self-hosted.yml)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
#
# Opsi B: Supabase Cloud (gratis tier cukup)
# NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
# SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIs...

# ── Opsional ─────────────────────────────────────────

# AI Chat (isi kalo mau pake, kalo gak diisi fiturnya cuma unavailable)
# DEEPSEEK_API_KEY=sk-xxx
# DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Redis cache (opsional, bisa dikosongin)
# REDIS_URL=redis://redis:6379
# REDIS_ENABLED=false

# Mode self-hosted (default otomatis true saat Midtrans gak dikonfigurasi)
# SELF_HOSTED_MODE=true
```

### 3. Jalanin

**Pake Supabase Cloud:**
```bash
docker compose up --build -d
```

**Pake Supabase self-hosted (lengkap dengan Supabase + Redis):**
```bash
docker compose -f docker-compose.self-hosted.yml up --build -d
```

Aplikasi bakal jalan di `http://localhost:3000`.

---

## 🏠 Self-Hosted Mode

Balance otomatis mendeteksi mode:

1. **Cek env var** — kalo `SELF_HOSTED_MODE=true` atau `false` diset, pake itu.
2. **Auto-detect** — kalo `MIDTRANS_SERVER_KEY` gak dikonfigurasi, otomatis jadi self-hosted.
3. **Self-hosted = semua fitur unlock.** Gak ada batasan AI Chat, shared wallet, atau premium features.

| Mode | Fitur | Billing |
|------|-------|---------|
| Self-hosted | ✅ Semua unlock | ❌ Gak perlu |
| SaaS (mybalance.my.id) | 🔒 Free terbatas, Premium bayar | ✅ Midtrans |

---

## 🧩 Setup Supabase

### Opsi A: Supabase Cloud (Recommended)

1. Daftar di [supabase.com](https://supabase.com) — free tier 500MB database, 50K users.
2. Buat project baru.
3. Di dashboard, buka **SQL Editor**.
4. Copy paste isi `supabase/init.sql` dan jalanin.
5. Dapatkan `Project URL` dan `anon public key` dari **Project Settings > API**.
6. Isi di `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJ...
   SUPABASE_SECRET_KEY=eyJhbGciOiJ...
   SCHEDULER_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   ```

### Opsi B: Supabase Self-Hosted

Pake `docker-compose.self-hosted.yml` yang udah include:
- Supabase Studio (dashboard lokal di port 8000)
- Postgres + Kong + GoTrue (auth)
- Redis
- Mailpit (email testing di port 8025)

```bash
docker compose -f docker-compose.self-hosted.yml up --build -d
```

---

## 🤖 AI Chat (Optional)

Balance pake API OpenAI-compatible (default: DeepSeek). Lo perlu API key sendiri:

**DeepSeek:**
```env
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
AI_CHAT_MODEL=deepseek-v4-flash
```

**Atau OpenRouter (1 key buat banyak model):**
```env
DEEPSEEK_API_KEY=sk-or-v1-your-openrouter-key
DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1
AI_CHAT_MODEL=openai/gpt-4o
```

Kalo gak diisi, AI Chat bakal nampilin "tidak tersedia" — aplikasi tetap jalan normal.

---

## 🐳 Docker Commands

```bash
# Build & start
docker compose up --build -d

# Stop
docker compose down

# Restart
docker compose restart

# Update dengan pull latest code
git pull
docker compose up --build -d

# Monitor logs
docker compose logs -f

# Jalankan Supabase self-hosted + Balance
docker compose -f docker-compose.self-hosted.yml up --build -d
```

---

## 🌐 Reverse Proxy & HTTPS

Recommended: **Caddy** (udah include di `docker-compose.yml`).

1. Edit `infra/Caddyfile`:
```caddyfile
balance.domainmu.com {
    reverse_proxy app:3000
}
```
2. Set `NEXT_PUBLIC_SITE_URL=https://balance.domainmu.com` di `.env`
3. Restart: `docker compose restart`

Caddy otomatis handle SSL via Let's Encrypt — gak perlu setup sertifikat manual.

**Atau pake Nginx:**
```nginx
server {
    listen 80;
    server_name balance.domainmu.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name balance.domainmu.com;

    ssl_certificate /etc/letsencrypt/live/balance.domainmu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/balance.domainmu.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔄 Update

```bash
cd balance
git pull
docker compose up --build -d
```

Kalo ada migration database baru, jalanin juga:
```bash
# Buka supabase/migrations/, cari file .sql terbaru
# Copy paste ke Supabase SQL Editor
```

---

## ⚠️ Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL` | `.env` gak lengkap | Copy `.env.example` ke `.env` lagi |
| Build gagal di CI | Kurang `build-args` | Kalo `docker build` manual, pake `docker compose up --build` |
| AI Chat "tidak tersedia" | `DEEPSEEK_API_KEY` gak diisi | Isi key atau biarin aja — fitur lain tetap jalan |
| Login gagal | Supabase Auth belum setup | Cek di Supabase dashboard > Authentication > Settings > confirm email |
| Email verifikasi gak masuk | SMTP gak dikonfigurasi | Kalo self-hosted Supabase, Mailpit di port 8025 buat testing |
| Redis connection error | `REDIS_URL` salah atau Redis gak jalan | Set `REDIS_ENABLED=false` kalo gak pake Redis |

---

## 💡 Tips

- **Backup database** — kalo pake Supabase Cloud, mereka auto backup. Kalo self-hosted, backup `docker volume` Postgres.
- **Resource** — Balance cukup ringan (~150MB RAM idle). Bisa barengan di server 2GB.
- **Domain** — Recommended pake domain biar dapet HTTPS. Caddy auto-handle.
- **Monitor** — `docker compose logs -f --tail 50` buat liat log realtime.
- **Auto-restart** — Docker compose `restart: unless-stopped` udah di-set, jadi server restart otomatis nyala lagi.

---

## ❓ Butuh Bantuan?

- **GitHub Issues:** [github.com/FeverEpidemic/balance/issues](https://github.com/FeverEpidemic/balance/issues)
- **Self-hosted questions:** Buka issue dengan label `self-hosted`
- **Security issues:** Lihat [SECURITY.md](../SECURITY.md) untuk reporting

---

> Balance is open source under **AGPL-3.0**. Fork, modify, and self-host freely.
> Untuk versi SaaS tanpa ribet: [mybalance.my.id](https://mybalance.my.id)
