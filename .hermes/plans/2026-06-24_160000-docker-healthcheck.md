# Docker Healthcheck — Balance App

> **For Hermes:** Execute task-by-task, commit after each. Minimal code, zero abstractions.

**Goal:** Docker bisa deteksi kalo Next.js app sehat atau nge-hang via `HEALTHCHECK`, dan Caddy proxy gak mulai sebelum app siap via `depends_on: condition: service_healthy`.

**Tech Stack:** Docker Compose v3 · Next.js 16.2.9 (standalone) · node:22-alpine · Caddy 2.9 · Supabase client

## Health Check Flow

```
┌─────────────┐     wget --spider      ┌──────────────────┐
│   Docker     │ ─── /api/health ─────→ │  Next.js App      │
│  HEALTHCHECK │ ←── HTTP 200 ────────  │  :3000            │
└──────┬──────┘                        └──────┬───────────┘
       │                                      │
       │  status: healthy                     │  GET /api/health
       │  (interval: 30s)                     │    │
       │                                      │    ├─ Supabase ping
       │                                      │    │  SELECT wallets LIMIT 1
       │                                      │    │    ├─ OK  → 200 healthy
       │                                      │    │    ├─ err → 503 degraded
       │                                      │    │    └─ net → try-catch → 503
       │                                      │    └─ Admin client null
       │                                      │       └─ 200 healthy
       │                                      │
       ▼                                      ▼
┌─────────────┐  depends_on              ┌──────────────────┐
│   Caddy      │ ← service_healthy ───── │  App harus sehat   │
│   proxy      │    (startup gate)       │  dulu, baru proxy  │
│   :80/:443   │                         │  start             │
└─────────────┘                         └──────────────────┘

Scheduler ── independent, tidak nunggu app
```

---

## Task 1: Create `/api/health` endpoint

**Objective:** Route handler di `GET /api/health` — return 200 kalo app hidup + Supabase reachable, 503 kalo degraded. Ringan, gak bikin beban di DB.

**Files:**
- Create: `app/api/health/route.ts`

### Step 1.1: Write the route handler

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;

  const admin = createAdminClient();

  if (admin) {
    // Ping Supabase — lightweight HEAD query, no rows returned
    try {
      const { error } = await admin
        .from("wallets")
        .select("id", { head: true, count: "exact" })
        .limit(1);
      dbOk = !error;
    } catch {
      // Network error / timeout — Supabase unreachable
      dbOk = false;
    }
  }

  // Tanpa admin client (SERVICE_ROLE_KEY ga diset) → anggap healthy
  // karena app sendiri jalan, cuma Supabase integration unavailable
  const healthy = dbOk || !admin;
  const statusCode = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      database: dbOk ? "connected" : "unreachable",
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
```

**Design decisions:**
- `head: true` — query cuma return count, gak ada row data. Paling ringan.
- `count: "exact"` — trigger `COUNT(*)` internal tapi hanya 1 row limit. Overhead minimal.
- `try-catch` — Supabase client bisa throw pada network failure (DNS, timeout, connection refused). Tanpa ini, unhandled rejection → 500 → Docker anggap unhealthy. Dengan catch, kita return 503 dengan graceful JSON.
- `!admin` fallback — kalo `SERVICE_ROLE_KEY` ga diset (misal self-hosted tanpa Supabase), endpoint tetap return 200. Docker healthcheck jangan bikin app kelihatan broken hanya karena config.
- Response body `database: "connected"|"unreachable"` — berguna buat `docker inspect` debugging, bukan buat healthcheck automation (Docker cuma peduli status code).

### Step 1.2: Verify

```bash
npm run typecheck   # must pass
npm run build       # verify /api/health appears in build output
```

**Expected:** `○ /api/health` di build output (static route, force-dynamic).

**Commit:**
```bash
git add app/api/health/route.ts
git commit -m "feat: add /api/health endpoint with Supabase ping"
```

---

## Task 2: Add HEALTHCHECK to Dockerfile

**Objective:** Tambah `HEALTHCHECK` instruction di stage `runner` Dockerfile, sebelum `CMD`.

**Files:**
- Modify: `Dockerfile` (line 51, before `CMD`)

### Step 2.1: Insert HEALTHCHECK instruction

Insert these 2 lines right before line 52 `CMD ["node", "server.js"]`:

```dockerfile
# Healthcheck — wget /api/health tiap 30s, 3 retries, 20s grace period
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1
```

Final Dockerfile lines 50-54 (after insert):

```dockerfile
EXPOSE 3000

# Healthcheck — wget /api/health tiap 30s, 3 retries, 20s grace period
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["node", "server.js"]
```

**Design decisions:**

| Parameter | Value | Kenapa |
|-----------|-------|--------|
| `--interval` | 30s | Cukup frequent buat deteksi, gak spam CPU |
| `--timeout` | 5s | Supabase ping bisa 1-3s di network lambat. 5s safe margin. |
| `--start-period` | 20s | Next.js standalone cold start ~8-15s. 20s grace biar gak false-unhealthy. |
| `--retries` | 3 | 3x gagal berturut-turut (= 90s degradasi) baru `unhealthy`. Mengurangi false positive dari network glitch. |

| Tool choice | Kenapa |
|-------------|--------|
| `wget` | Sudah include di `node:22-alpine` (busybox wget). No extra `apk add`. |
| `--spider` | Cuma cek HTTP status + headers. Gak download body. Lebih ringan. |
| `--tries=1` | Gak retry internal wget. Biar Docker healthcheck yang handle retries (`--retries=3`). |
| `--no-verbose` | Output minimal di log. |
| `${PORT:-3000}` | Shell variable expansion. Ikutin `ENV PORT=3000` di Dockerfile atau override runtime. |

**What busybox wget supports (verified):**
- `--spider` ✅
- `--tries=N` ✅
- `--no-verbose` ✅
- `-q` (quiet) — bisa dipake kalo `--no-verbose` masih terlalu noisy. Alternatif: `wget -q --spider ... || exit 1`

### Step 2.2: Verify

```bash
docker compose build --no-cache app
```

**Expected:**
- Build sukses, no error
- `docker compose config` gak komplain

**Commit:**
```bash
git add Dockerfile
git commit -m "feat: add Docker HEALTHCHECK via wget /api/health"
```

---

## Task 3: Update docker-compose.yml — `depends_on condition: service_healthy`

**Objective:** Proxy (Caddy) jangan mulai sebelum app bener-bener sehat. Hindarin 502 Bad Gateway pas startup.

**Files:**
- Modify: `docker-compose.yml` (line 55-56)

### Step 3.1: Change `depends_on` from simple to conditional

**Before (line 55-56):**
```yaml
  proxy:
    ...
    depends_on:
      - app
```

**After:**
```yaml
  proxy:
    image: caddy:2.9-alpine
    platform: ${DOCKER_PLATFORM:-linux/arm64}
    restart: unless-stopped
    depends_on:
      app:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      ...
```

### Step 3.2: Verify

```bash
docker compose config   # parse YAML, must succeed
```

**Expected:** Output menampilkan `condition: service_healthy` di bawah `depends_on: app:`.

**Commit:**
```bash
git add docker-compose.yml
git commit -m "feat: proxy depends_on app service_healthy startup gate"
```

---

## Task 4: (Optional) Add HEALTHCHECK to self-hosted compose

**Objective:** `docker-compose.self-hosted.yml` juga dapet HEALTHCHECK treatment.

**Files:**
- Modify: `docker-compose.self-hosted.yml`

**Step 4.1:** Baca file, cari service `app`, tambahin `healthcheck` dan update `depends_on` proxy (kalau ada).

> **Skip kalo** self-hosted compose gak punya service `proxy` atau strukturnya beda. Cek dulu isinya.

**Verification:**
```bash
docker compose -f docker-compose.self-hosted.yml config
```

---

## Verification End-to-End

### Local Docker

```bash
# Build ulang image
docker compose build --no-cache app

# Start stack, watch health status
docker compose up -d
sleep 25  # tunggu start-period (20s) + healthcheck pertama
docker ps --filter "name=balance-app" --format "table {{.Names}}\t{{.Status}}"
```

**Expected output:**
```
NAMES               STATUS
balance-app-1       Up 30 seconds (healthy)
```

### Healthcheck detail inspection

```bash
# Inspect health check history
docker inspect balance-app-1 --format '{{json .State.Health}}' | python3 -m json.tool
```

**Expected fields:**
```json
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2026-06-24T...",
      "End": "2026-06-24T...",
      "ExitCode": 0,
      "Output": "Connecting to localhost:3000 ... connected.\nHTTP request sent, awaiting response... 200 OK\n"
    }
  ]
}
```

### Degraded scenario test

1. Matikan Supabase (atau set `SUPABASE_SERVICE_ROLE_KEY` ke invalid di `.env`)
2. Restart app: `docker compose restart app`
3. Tunggu 30 detik lebih
4. Cek: `docker ps` — app tetap `(healthy)` karena fallback `!admin` logic. Status code tetap 200, cuma `database: "unreachable"` di response body.

> **Catatan:** Kalo Supabase mati di production, healthcheck TETAP return 200 (anggap healthy) kalo admin client tersedia tapi unreachable — karena `try-catch` fallback `dbOk = false` tapi `!admin` = `false` (admin client ada), jadi `healthy = false` → 503. Tapi kalo admin client-nya null dari awal (no SERVICE_ROLE_KEY), return 200. Dua skenario ini dibedakan secara sengaja: "config missing" vs "service down."

---

## Rollback / Fallback

Kalo healthcheck bikin restart loop (misal: Supabase lambat pas startup bikin false unhealthy 3x berturut-turut):

```bash
# Opsi 1: Matiin healthcheck di docker-compose.yml
# Tambahin ke service app:
#   healthcheck:
#     disable: true

# Opsi 2: Paksa restart tanpa healthcheck
docker compose stop app
docker compose up -d --no-deps app  # skip depends_on check
```

Atau override interval lebih generous di docker-compose.yml (tanpa rebuild image):
```yaml
  app:
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:3000/api/health || exit 1"]
      interval: 60s    # lebih jarang
      start-period: 40s  # grace lebih lama
```

---

## File Summary

| File | Action | Lines |
|------|--------|-------|
| `app/api/health/route.ts` | Create | +37 |
| `Dockerfile` | Modify — add 2 lines before CMD | +2 |
| `docker-compose.yml` | Modify — `depends_on` → `condition: service_healthy` | ~3 |

### Yang TIDAK Berubah

| Scope | Kenapa |
|-------|--------|
| `app/actions/*` | Gak ada kaitannya |
| `lib/supabase/server.ts` | Gak disentuh — admin client udah ada |
| `lib/supabase/admin.ts` | Gak disentuh — `createAdminClient()` return null pattern udah solid |
| `infra/Caddyfile` | Caddy config gak berubah |
| Scheduler service | Independent, gak nunggu app |
| `.env.example` | Gak ada env var baru |

---

## Open Questions

- **Self-hosted compose** — perlu cek `docker-compose.self-hosted.yml` apakah struktur `proxy` service-nya sama. Task 4.
- **Multi-replica?** — Kalo nanti app di-scale >1 replica, healthcheck per-replica ini tetap jalan. Tapi `depends_on` proxy cuma nunggu replica pertama sehat — yang lain bisa aja masih starting. Acceptable untuk MVP single-replica.
