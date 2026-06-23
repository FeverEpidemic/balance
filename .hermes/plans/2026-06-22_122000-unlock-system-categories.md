# Kategori Sistem Bisa Diedit/Dihapus User — Implementation Plan

> **For Hermes:** Execute task-by-task, commit per task.

**Goal:** User bisa mengedit dan menghapus kategori bawaan sistem (is_system=true) lewat UI yang sudah ada, tanpa pembatasan.

**Architecture:** Hapus guard `isSystemManagedCategory()` dari server actions (`updateCategory`, `deleteCategory`) dan guard `!category.is_system` dari UI component. Kolom `is_system` tetap ada di DB untuk backward compatibility tapi gak dipakai sebagai pemblokir. `isBalanceAdjustmentCategory()` di-refactor untuk identifikasi lewat nama saja (bukan `is_system`).

**Tech Stack:** TypeScript, Next.js server actions, Supabase RLS, React Server Components

---

## Context / Current State

Saat ini kategori dengan `is_system=true` di-lock dari edit/delete di 3 layer:

| Layer | File | Guard |
|-------|------|-------|
| Server Action (update) | `app/actions/categories.ts:184` | `isSystemManagedCategory()` → error |
| Server Action (delete) | `app/actions/categories.ts:237` | `isSystemManagedCategory()` → error |
| UI (edit/delete button) | `components/features/categories/categories-page-content.tsx:51` | `!category.is_system` → hide buttons |
| UI (badge + message) | `categories-page-content.tsx:68,75` | `category.is_system` → "Sistem" badge + readonly text |

Satu-satunya tempat lain yang pakai `is_system` untuk logic:

| File | Penggunaan | Perlu ubah? |
|------|-----------|-------------|
| `lib/categories.ts:37` | `isSystemManagedCategory()` | Hapus fungsinya |
| `lib/balance-adjustments.ts:57` | `isBalanceAdjustmentCategory()` cek `is_system && name` | Ubah ke name-only |
| `lib/data/mappers.ts:392` | `hasCustomCategory` = `!category.is_system` | Ubah logic |
| `lib/ai/data.ts:332` | `isSystem: category.is_system` | Aman (read-only data AI) |

Kategori sistem yang ada di DB dibuat oleh:
- `private.ensure_saving_system_category()` — "Tabungan" + "Pencairan Tabungan" (migrasi 0008)
- `public.ensure_balance_adjustment_category()` — "Penyesuaian Saldo Masuk" + "Penyesuaian Saldo Keluar" (migrasi 0010)

RLS gak punya guard `is_system` — jadi dari sisi DB, owner/editor udah bisa mutasi semua kategori.

FK `transactions.category_id` pakai `ON DELETE SET NULL` — aman kalau kategori dihapus.

---

## Step-by-Step Plan

### Task 1: Hapus guard `is_system` dari server action `updateCategory`

**Files:**
- Modify: `app/actions/categories.ts:184-186`

**Step 1: Hapus blok guard**

Hapus baris 184-186:
```typescript
if (isSystemManagedCategory(existingCategory)) {
  return errorResult(t("actionErrors.categoryDeleteSystemWarning"));
}
```

**Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add app/actions/categories.ts
git commit -m "feat: allow editing system categories in updateCategory"
```

---

### Task 2: Hapus guard `is_system` dari server action `deleteCategory`

**Files:**
- Modify: `app/actions/categories.ts:237-239`

**Step 1: Hapus blok guard**

Hapus baris 237-239:
```typescript
if (isSystemManagedCategory(existingCategory)) {
  return errorResult(t("actionErrors.categoryDeleteSystemWarning"));
}
```

**Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add app/actions/categories.ts
git commit -m "feat: allow deleting system categories in deleteCategory"
```

---

### Task 3: Hapus guard `is_system` dari UI component

**Files:**
- Modify: `components/features/categories/categories-page-content.tsx:51`
- Modify: `components/features/categories/categories-page-content.tsx:68`
- Modify: `components/features/categories/categories-page-content.tsx:75`

**Step 1: Ubah `isEditable` — hapus `!category.is_system`**

Line 51, ubah dari:
```typescript
const isEditable = canMutate && !category.is_system;
```
Jadi:
```typescript
const isEditable = canMutate;
```

**Step 2: Hapus badge "Sistem" dan readonly message**

Line 68 — hapus baris ini:
```typescript
{category.is_system ? <Badge>{t("categories.systemBadge")}</Badge> : null}
```

Line 75 — ubah dari:
```typescript
{!isEditable ? <span>{category.is_system ? t("categories.systemReadonly") : t("common.readOnly")}</span> : null}
```
Jadi:
```typescript
{!isEditable ? <span>{t("common.readOnly")}</span> : null}
```

**Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 4: Commit**

```bash
git add components/features/categories/categories-page-content.tsx
git commit -m "feat: remove is_system guard from categories UI"
```

---

### Task 4: Bersihin import `isSystemManagedCategory` yang udah gak dipakai

**Files:**
- Modify: `app/actions/categories.ts:4`

**Step 1: Hapus import**

Line 4, ubah dari:
```typescript
import { DEFAULT_CATEGORY_COLOR, isSystemManagedCategory, isValidCategoryColor, isValidCategoryKind, normalizeCategoryName } from "@/lib/categories";
```
Jadi:
```typescript
import { DEFAULT_CATEGORY_COLOR, isValidCategoryColor, isValidCategoryKind, normalizeCategoryName } from "@/lib/categories";
```

**Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add app/actions/categories.ts
git commit -m "chore: remove unused isSystemManagedCategory import"
```

---

### Task 5: Hapus fungsi `isSystemManagedCategory` dan update test

**Files:**
- Modify: `lib/categories.ts:37-39`
- Modify: `tests/unit/categories.test.ts`

**Step 1: Hapus fungsi dari `lib/categories.ts`**

Hapus baris 37-39:
```typescript
export function isSystemManagedCategory(category: Pick<CategoryRow, "is_system">) {
  return category.is_system;
}
```

**Step 2: Hapus test terkait dari `tests/unit/categories.test.ts`**

Hapus test case `isSystemManagedCategory` (line 21-26):
```typescript
it("mengenali kategori sistem", () => {
  expect(isSystemManagedCategory({ is_system: true })).toBe(true);
  expect(isSystemManagedCategory({ is_system: false })).toBe(false);
});
```

Dan hapus import `isSystemManagedCategory` dari test file.

**Step 3: Jalankan unit test**

```bash
npm run test
```

Expected: PASS

**Step 4: Commit**

```bash
git add lib/categories.ts tests/unit/categories.test.ts
git commit -m "chore: remove isSystemManagedCategory function and test"
```

---

### Task 6: Refactor `isBalanceAdjustmentCategory` ke name-only

**Files:**
- Modify: `lib/balance-adjustments.ts:57-59`

**Step 1: Ubah logic**

Line 57-59, ubah dari:
```typescript
export function isBalanceAdjustmentCategory(category: Pick<CategoryRow, "kind" | "name" | "is_system">) {
  return category.is_system && category.name === BALANCE_ADJUSTMENT_CATEGORY_NAMES[category.kind];
}
```
Jadi:
```typescript
export function isBalanceAdjustmentCategory(category: Pick<CategoryRow, "kind" | "name">) {
  return category.name === BALANCE_ADJUSTMENT_CATEGORY_NAMES[category.kind];
}
```

**Step 2: Update test**

Di `tests/unit/balance-adjustments.test.ts`, hapus `is_system: true` dari fixture dan pastikan test tetap assertion yang sama:

```typescript
// Sebelum
{ id: "adj-in", wallet_id: "w1", name: "Penyesuaian Saldo Masuk", kind: "income", color: "#6f8f78", is_system: true }
// Sesudah
{ id: "adj-in", wallet_id: "w1", name: "Penyesuaian Saldo Masuk", kind: "income", color: "#6f8f78", is_system: false }
```

Juga pastiin test kasus `is_system: false` dengan nama adjustment tetap terdeteksi.

**Step 3: Jalankan unit test**

```bash
npm run test
```

Expected: PASS

**Step 4: Commit**

```bash
git add lib/balance-adjustments.ts tests/unit/balance-adjustments.test.ts
git commit -m "refactor: isBalanceAdjustmentCategory uses name-only, not is_system"
```

---

### Task 7: Update `hasCustomCategory` logic di mappers

**Files:**
- Modify: `lib/data/mappers.ts:392`

**Step 1: Ubah logic**

`hasCustomCategory` sebelumnya pakai `!category.is_system` buat nentuin apakah user udah bikin kategori kustom (buat onboarding flow). Sekarang `is_system` udah gak relevan, logic diubah jadi cek apakah ada kategori selain 4 kategori default bawaan:

Ubah line 392 dari:
```typescript
const hasCustomCategory = categories.some((category) => !category.is_system);
```
Jadi:
```typescript
const SYSTEM_CATEGORY_NAMES = new Set(["Tabungan", "Pencairan Tabungan", "Penyesuaian Saldo Masuk", "Penyesuaian Saldo Keluar"]);
const hasCustomCategory = categories.some((category) => !SYSTEM_CATEGORY_NAMES.has(category.name));
```

Atau, lebih simpel — karena sekarang user bisa edit/delete sistem, konsep "kustom" jadi kurang relevan. Tapi biar onboarding flow gak broken:

```typescript
const hasCustomCategory = categories.some((category) => !SYSTEM_CATEGORY_NAMES.has(category.name));
```

**Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/data/mappers.ts
git commit -m "refactor: hasCustomCategory checks name instead of is_system"
```

---

### Task 8: Update i18n messages (opsional)

**Files:**
- Modify: `messages/id.json` lines 757-758, 1133
- Modify: `messages/en.json` lines 757-758, 1133

Kalau mau rapi, hapus key yang udah gak dipakai:
- `categories.systemBadge`
- `categories.systemReadonly`
- `actionErrors.categoryDeleteSystemWarning`

Atau keep aja dulu (gak ada side effect kalau key orphan).

**Step 1: (skip kalau mau keep)** Kalau hapus, pastiin gak ada referensi lain via grep.

**Verification:** Typecheck + build

---

### Task 9: Build dan full verification

**Step 1: Build production**

```bash
npm run build
```

Expected: No errors

**Step 2: Jalankan semua test**

```bash
npm run test
```

Expected: All pass

**Step 3: Commit final**

```bash
git add -A
git commit -m "chore: final verification after system category unlock"
```

---

## Risks & Tradeoffs

| Risk | Mitigasi |
|------|----------|
| User hapus "Tabungan" lalu fitur saving entry bikin ulang | Trigger `ensure_saving_system_category` akan recreate otomatis — gak masalah |
| User rename "Penyesuaian Saldo Masuk" | `isBalanceAdjustmentCategory` skrg cek nama, jadi kalau user rename, kategori adjustment gak kedeteksi lagi. Acceptable — user sengaja rename berarti emang udah gak mau itu jadi adjustment category |
| `hasCustomCategory` di onboarding flow | Di-fix di Task 7 dengan cek nama hardcoded |
| User ubah `kind` dari income→expense atau sebaliknya | `updateCategory` udah support ganti kind, harusnya aman. Tapi perlu dipastiin transaksi existing yg pakai kategori itu gak break (FK tetap valid, cuma kind-nya mungkin gak matching secara semantik) |

## Open Questions

1. Masih perlu kolom `is_system` di DB? — Keep aja, backward compatible. Kalo suatu saat butuh lagi udah ada.
2. Badge "Sistem" dihilangkan total atau diubah jadi "Default"? — Plan ini hilangkan total. Kalau mau soft, bisa ubah jadi "Default" tapi gak blocking.
