# Plan: Rename History Toggle + Hapus Back-to-Input Button

**Tanggal:** 2025-06-25
**Target:** Tab "Full History" — toggle rename + remove redundant button

---

## Ringkasan

Toggle "Input Cepat | Riwayat Lengkap" tetap dipertahankan dengan rename, tombol "Kembali ke input" dihapus (redundan).

---

## Perubahan

### 1. `components/features/transactions/transaction-history-page-content.tsx`

**Hapus Back-to-Input button (line 302-304)**

Before:
```tsx
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <ExportExcelButton transactions={data.transactions} walletName={data.walletName} selectedMonth={data.selectedMonth} />
              <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}`} variant="ghost" className="w-full sm:w-auto">
                {t("transactions.historyBackToInput")}
              </Button>
            </div>
```

After:
```tsx
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <ExportExcelButton transactions={data.transactions} walletName={data.walletName} selectedMonth={data.selectedMonth} />
            </div>
```

### 2. `messages/id.json`

- **Line 535:** `"quickInputTab": "Input Cepat"` → `"quickInputTab": "Transaksi Terakhir"`
- **Line 536:** `"fullHistoryTab": "Riwayat Lengkap"` → `"fullHistoryTab": "Transaksi Lengkap"`
- **Line 497:** Hapus `"historyBackToInput": "Kembali ke input",`

### 3. `messages/en.json`

- **Line 535:** `"quickInputTab": "Quick Input"` → `"quickInputTab": "Recent Transactions"`
- **Line 536:** `"fullHistoryTab": "Full History"` → `"fullHistoryTab": "Complete Transactions"`
- **Line 497:** Hapus `"historyBackToInput": "Back to input",`

---

## Verifikasi

- [ ] `npm run typecheck` — no errors
- [ ] `npm run build` — no errors
- [ ] Tidak ada reference tersisa ke `historyBackToInput` di codebase
- [ ] Toggle masih muncul dengan label baru "Catat Transaksi | Semua Transaksi"
- [ ] Tombol "Kembali ke input" hilang dari header card
