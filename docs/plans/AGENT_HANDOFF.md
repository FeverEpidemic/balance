---
title: Balance — Agent Handoff Protocol
version: 1.0.0
last_updated: 2026-06-17
---

# Agent Handoff Protocol

> Protokol standar saat transfer kerja antar AI agent di repo Balance.

---

## 1. Saat Menyerahkan ke Agent Lain

Tulis handoff message yang mencakup:

1. **Konteks** — Apa yang sudah dikerjakan, di file mana
2. **Status** — Sudah sampai mana (build? test? review?)
3. **Blocker** — Apa yang masih bikin stuck
4. **Next step** — Satu kalimat konkret apa yang harus dikerjakan
5. **Verifikasi** — Perintah untuk verifikasi (misal: `npm run typecheck && npm run test`)

Format:

```
[Handoff] <ringkasan>
- File diubah: path/file1, path/file2
- Status: <selesai / pending review / stuck>
- Verifikasi: <perintah>
- Next: <satu kalimat>
```

---

## 2. Saat Menerima dari Agent Lain

1. Baca `AGENTS.md` + `docs/AGENT_QUICKSTART.md`
2. Cek file yang disebut di handoff
3. Jalankan perintah verifikasi
4. Lanjutkan next step

---

## 3. Rules

- Jangan revert pekerjaan agent lain tanpa konfirmasi
- Jangan edit migration lama — migration baru aja
- Selalu `npm run typecheck && npm run test` sebelum claim selesai
