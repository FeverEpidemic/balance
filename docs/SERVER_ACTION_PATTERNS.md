---
title: Balance — Server Action Patterns
version: 1.1.0
last_updated: 2026-06-17
---

# Balance — Server Action Patterns

> Panduan pola penulisan server action di Balance. Setiap mutasi database HARUS melalui server action.

---

## 1. Struktur Dasar Server Action

```typescript
"use server";

import { requireUser } from "@/lib/auth";
import {
  getTrimmedValue,
  getNumericValue,
  getNullableText,
  redirectToWalletSection,
  revalidateWalletPaths
} from "@/app/actions/_shared";

export async function createTransaction(formData: FormData) {
  // 1. Auth check
  const { supabase, user } = await requireUser();

  // 2. Parse form
  const walletId = getTrimmedValue(formData, "wallet_id");
  const amount = getNumericValue(formData, "amount");
  const note = getNullableText(formData, "note");
  const categoryId = getNullableText(formData, "category_id");

  // 3. Validasi
  if (!walletId) {
    return { error: "Wallet harus dipilih" };
  }
  if (!amount || amount <= 0) {
    return { error: "Jumlah harus lebih dari 0" };
  }

  // 4. Mutasi
  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    amount,
    kind: "expense",
    note,
    category_id: categoryId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) {
    return { error: "Gagal menyimpan transaksi" };
  }

  // 5. Cache invalidation + revalidation
  await revalidateWalletPaths(walletId, { includeDashboard: true });
  await redirectToWalletSection(walletId, "transactions", "message", "Transaksi berhasil ditambahkan");
}
```

---

## 2. Pola Return Value

Semua server action mengembalikan salah satu dari:

| Return | Kapan |
|--------|-------|
| `redirect(...)` | Sukses → redirect ke halaman dengan pesan sukses |
| `{ error: string }` | Gagal → form error ditampilkan di komponen |
| `{ data: T }` | Data return (jarang, prefer redirect pattern) |

### Action Result Types (dari `action-result.ts`)

```typescript
export type ActionResult = 
  | { success: true; error?: never }
  | { success: false; error: string };
```

---

## 3. Shared Helpers (`_shared.ts`)

### Form Parsing

| Helper | Fungsi |
|--------|--------|
| `getStringValue(formData, key)` | Nilai string mentah |
| `getTrimmedValue(formData, key)` | String + trim |
| `getNullableText(formData, key)` | String atau null jika kosong |
| `getNumericValue(formData, key)` | Parse ke number atau null |

### Navigasi & Revalidation

| Helper | Fungsi |
|--------|--------|
| `redirectWithMessage(path, type, msg)` | Redirect + pesan flash |
| `redirectToWalletSection(walletId, section, type, msg)` | Redirect ke tab wallet |
| `revalidateWalletPaths(walletId, options)` | Revalidate cache path |
| `walletSectionPath(walletId, section?)` | Generate path wallet |
| `getLocalizedPath(path)` | Path dengan locale prefix |

### Message Types

```typescript
type MessageType = "error" | "message";
```

### Wallet Sections

```typescript
type WalletSection = 
  | "transactions" 
  | "budgets" 
  | "members" 
  | "settlements" 
  | "templates" 
  | "reports" 
  | "recurring" 
  | "savings";
```

---

## 4. Pola Redirect dengan Pesan

```typescript
// Redirect ke wallet overview dengan pesan sukses
await redirectToWalletSection(
  walletId, 
  "transactions", 
  "message", 
  "Transaksi berhasil ditambahkan"
);

// Redirect ke dashboard dengan pesan error
await redirectWithMessage(
  "/dashboard", 
  "error", 
  "Gagal memuat data"
);
```

Server component di halaman tujuan membaca parameter URL:
```typescript
// Di page component
const searchParams = await props.searchParams;
const successMessage = searchParams?.message;
const errorMessage = searchParams?.error;
```

---

## 5. Pola Revalidation

```typescript
// Minimal — revalidate wallet overview saja
await revalidateWalletPaths(walletId);

// Lengkap — dashboard + overview + specific sections
await revalidateWalletPaths(walletId, {
  includeDashboard: true,
  includeOverview: true,
  sections: ["transactions", "budgets", "savings"]
});
```

---

## 6. Pola untuk Setiap Modul

### 6.1. Transaksi (`transactions.ts`)

```typescript
export async function createTransaction(formData: FormData) { ... }
export async function updateTransaction(formData: FormData) { ... }
export async function deleteTransaction(formData: FormData) { ... }
```

**Validasi:** wallet_id required, amount > 0, kind ∈ {income, expense}

### 6.2. Budget (`budgets.ts`)

```typescript
export async function createBudget(formData: FormData) { ... }
export async function updateBudget(formData: FormData) { ... }
export async function deleteBudget(formData: FormData) { ... }
```

**Validasi:** amount >= 0, month_start format YYYY-MM-DD

### 6.3. Tabungan (`savings.ts`)

```typescript
export async function createSaving(formData: FormData) { ... }
export async function depositToSaving(formData: FormData) { ... }
export async function withdrawFromSaving(formData: FormData) { ... }
```

**PENTING:** Deposit/withdraw panggil RPC `create_saving_entry_with_transaction` — bukan insert langsung ke `saving_entries`. RPC ini handle semua validasi balance + auto-create transaksi.

### 6.4. Transaksi Berulang (`recurring-transactions.ts`)

```typescript
export async function createRecurring(formData: FormData) { ... }
export async function updateRecurring(formData: FormData) { ... }
export async function deleteRecurring(formData: FormData) { ... }
export async function pauseRecurring(formData: FormData) { ... }
export async function resumeRecurring(formData: FormData) { ... }
```

### 6.5. Wallet (`wallets.ts`)

```typescript
export async function createWallet(formData: FormData) { ... }
export async function updateWallet(formData: FormData) { ... }
export async function archiveWallet(formData: FormData) { ... }
export async function updateMemberRole(formData: FormData) { ... }
```

### 6.6. Settlement (`settlements.ts`)

```typescript
export async function createSettlement(formData: FormData) { ... }
```

---

## 7. Pola Komponen Untuk Server Action

```tsx
"use client";

import { useActionState } from "react";
import { createTransaction } from "@/app/actions/transactions";

export function TransactionForm({ walletId }: { walletId: string }) {
  const [state, formAction, pending] = useActionState(createTransaction, null);

  return (
    <form action={formAction}>
      {state?.error && <Notice type="error">{state.error}</Notice>}
      {/* form fields */}
      <SubmitButton pending={pending}>Simpan</SubmitButton>
    </form>
  );
}
```

---

## 8. Error Handling Pattern

```typescript
// ❌ JANGAN: throw error — user experience jelek
throw new Error("Database error");

// ✅ LAKUKAN: return error — user bisa lihat pesan di form
return { error: "Gagal menyimpan, coba lagi" };

// ✅ Atau redirect dengan error message
await redirectWithMessage(`/wallets/${walletId}/transactions`, "error", "Transaksi gagal disimpan");
```

### Error dari Supabase

```typescript
const { error } = await supabase.from("transactions").insert({ ... });

if (error) {
  // Log untuk debugging
  console.error("[createTransaction]", error.message);
  
  // Return pesan user-friendly
  return { error: "Gagal menyimpan transaksi" };
}
```

---

## 9. Checklist Nambah Server Action Baru

- [ ] `"use server"` directive di atas
- [ ] `requireUser()` dipanggil
- [ ] Form parsing via `_shared.ts` helpers
- [ ] Validasi input (required fields, tipe, range)
- [ ] Supabase insert/update/delete
- [ ] Error handling (return error, jangan throw)
- [ ] Cache invalidation dengan `invalidateWalletReadCaches`
- [ ] Revalidate path dengan `revalidateWalletPaths`
- [ ] Redirect sukses dengan `redirectToWalletSection` atau `redirectWithMessage`
- [ ] Action di-export (bisa dipanggil dari form)
- [ ] Unit test untuk logic branching (opsional)
