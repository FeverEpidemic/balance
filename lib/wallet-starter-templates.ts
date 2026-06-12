type WalletKind = "personal" | "shared";
type TransactionKind = "income" | "expense";
type SplitType = "equal" | "custom" | null;
export type WalletSetupPreset = "minimal" | "standard" | "family";
export type BudgetPreset = "none" | "light" | "balanced" | "ambitious";
export const SAVING_EXPENSE_CATEGORY_NAME = "Tabungan";
export const SAVING_WITHDRAWAL_CATEGORY_NAME = "Pencairan Tabungan";

type StarterCategory = {
  key: string;
  name: string;
  kind: TransactionKind;
  color: string;
  budgetable: boolean;
};

type StarterTemplate = {
  name: string;
  kind: TransactionKind;
  categoryKey: string;
  note: string | null;
  defaultAmount: number | null;
  splitType: SplitType;
};

type BudgetWeight = {
  categoryKey: string;
  weight: number;
};

type BudgetPlan = {
  defaultTotal: number;
  weights: BudgetWeight[];
};

const STARTER_CATEGORIES: StarterCategory[] = [
  { key: "salary", name: "Gaji", kind: "income", color: "#2f7d5c", budgetable: false },
  { key: "bonus", name: "Bonus", kind: "income", color: "#4c956c", budgetable: false },
  { key: "freelance", name: "Freelance", kind: "income", color: "#5fa87a", budgetable: false },
  { key: "business", name: "Usaha", kind: "income", color: "#79b890", budgetable: false },
  { key: "investment_income", name: "Investasi", kind: "income", color: "#94c8a7", budgetable: false },
  { key: "food", name: "Makanan", kind: "expense", color: "#6b705c", budgetable: true },
  { key: "groceries", name: "Belanja Harian", kind: "expense", color: "#7c7f65", budgetable: true },
  { key: "transport", name: "Transport", kind: "expense", color: "#5f6d5b", budgetable: true },
  { key: "fuel", name: "Bensin", kind: "expense", color: "#52624d", budgetable: true },
  { key: "utilities", name: "Listrik & Air", kind: "expense", color: "#7b6d52", budgetable: true },
  { key: "internet", name: "Internet", kind: "expense", color: "#8c7b5a", budgetable: true },
  { key: "housing", name: "Sewa/KPR", kind: "expense", color: "#8b6f61", budgetable: true },
  { key: "health", name: "Kesehatan", kind: "expense", color: "#8d5a5a", budgetable: true },
  { key: "education", name: "Pendidikan", kind: "expense", color: "#6e5b7b", budgetable: true },
  { key: "shopping", name: "Belanja", kind: "expense", color: "#85736d", budgetable: true },
  { key: "entertainment", name: "Hiburan", kind: "expense", color: "#6a6f7d", budgetable: true },
  { key: "coffee", name: "Kopi & Nongkrong", kind: "expense", color: "#8a7a70", budgetable: true },
  { key: "subscription", name: "Langganan", kind: "expense", color: "#5a6d7d", budgetable: true },
  { key: "family", name: "Keluarga", kind: "expense", color: "#8a5f73", budgetable: true },
  { key: "charity", name: "Donasi/Zakat", kind: "expense", color: "#66806a", budgetable: true },
  { key: "debt", name: "Cicilan", kind: "expense", color: "#7b5f5f", budgetable: true },
  { key: "saving", name: SAVING_EXPENSE_CATEGORY_NAME, kind: "expense", color: "#5d7a74", budgetable: true },
  { key: "saving_withdrawal", name: SAVING_WITHDRAWAL_CATEGORY_NAME, kind: "income", color: "#7a9d8f", budgetable: false },
  { key: "emergency", name: "Dana Darurat", kind: "expense", color: "#4f6a64", budgetable: true },
  { key: "admin", name: "Biaya Admin", kind: "expense", color: "#717171", budgetable: true }
];

const MINIMAL_TEMPLATES: StarterTemplate[] = [
  { name: "Gaji Bulanan", kind: "income", categoryKey: "salary", note: "Pemasukan gaji rutin", defaultAmount: null, splitType: null },
  { name: "Makan Siang", kind: "expense", categoryKey: "food", note: "Pengeluaran makan siang", defaultAmount: 25000, splitType: null },
  { name: "Transport Harian", kind: "expense", categoryKey: "transport", note: "Ojek, parkir, tol, atau bus", defaultAmount: 30000, splitType: null },
  { name: "Transfer Tabungan", kind: "expense", categoryKey: "saving", note: "Sisihkan dana ke tabungan", defaultAmount: null, splitType: null }
];

const STANDARD_TEMPLATES: StarterTemplate[] = [
  ...MINIMAL_TEMPLATES,
  { name: "Bonus", kind: "income", categoryKey: "bonus", note: "Bonus atau insentif", defaultAmount: null, splitType: null },
  { name: "Belanja Mingguan", kind: "expense", categoryKey: "groceries", note: "Belanja kebutuhan rumah", defaultAmount: 300000, splitType: null },
  { name: "Bensin", kind: "expense", categoryKey: "fuel", note: "Isi bahan bakar", defaultAmount: 100000, splitType: null },
  { name: "Tagihan Internet", kind: "expense", categoryKey: "internet", note: "Bayar internet bulanan", defaultAmount: 350000, splitType: null },
  { name: "Tagihan Listrik & Air", kind: "expense", categoryKey: "utilities", note: "Bayar utilitas rumah", defaultAmount: 500000, splitType: null },
  { name: "Langganan Digital", kind: "expense", categoryKey: "subscription", note: "Streaming, cloud, atau aplikasi", defaultAmount: 99000, splitType: null }
];

const FAMILY_TEMPLATES: StarterTemplate[] = [
  ...STANDARD_TEMPLATES,
  { name: "Sewa atau Cicilan Rumah", kind: "expense", categoryKey: "housing", note: "Biaya tempat tinggal bulanan", defaultAmount: 2500000, splitType: null },
  { name: "Belanja Rumah Tangga", kind: "expense", categoryKey: "groceries", note: "Belanja bulanan keluarga", defaultAmount: 750000, splitType: null },
  { name: "Biaya Sekolah", kind: "expense", categoryKey: "education", note: "Keperluan pendidikan anak", defaultAmount: 500000, splitType: null },
  { name: "Kebutuhan Keluarga", kind: "expense", categoryKey: "family", note: "Pengeluaran keluarga lain", defaultAmount: 400000, splitType: null }
];

const SHARED_EXTRA_TEMPLATES: StarterTemplate[] = [
  { name: "Patungan Makan", kind: "expense", categoryKey: "food", note: "Makan bersama dan dibagi rata", defaultAmount: 150000, splitType: "equal" },
  { name: "Belanja Rumah Bersama", kind: "expense", categoryKey: "groceries", note: "Kebutuhan rumah tangga bersama", defaultAmount: 500000, splitType: "equal" },
  { name: "Kas Bulanan", kind: "income", categoryKey: "business", note: "Iuran atau kas masuk dari anggota", defaultAmount: null, splitType: null }
];

const TEMPLATE_PRESETS: Record<WalletSetupPreset, StarterTemplate[]> = {
  minimal: MINIMAL_TEMPLATES,
  standard: STANDARD_TEMPLATES,
  family: FAMILY_TEMPLATES
};

const BUDGET_PRESETS: Record<Exclude<BudgetPreset, "none">, BudgetPlan> = {
  light: {
    defaultTotal: 3000000,
    weights: [
      { categoryKey: "food", weight: 0.12 },
      { categoryKey: "groceries", weight: 0.14 },
      { categoryKey: "transport", weight: 0.09 },
      { categoryKey: "fuel", weight: 0.08 },
      { categoryKey: "utilities", weight: 0.12 },
      { categoryKey: "internet", weight: 0.07 },
      { categoryKey: "housing", weight: 0.18 },
      { categoryKey: "health", weight: 0.05 },
      { categoryKey: "shopping", weight: 0.05 },
      { categoryKey: "subscription", weight: 0.03 },
      { categoryKey: "saving", weight: 0.05 },
      { categoryKey: "admin", weight: 0.02 }
    ]
  },
  balanced: {
    defaultTotal: 5000000,
    weights: [
      { categoryKey: "food", weight: 0.12 },
      { categoryKey: "groceries", weight: 0.14 },
      { categoryKey: "transport", weight: 0.08 },
      { categoryKey: "fuel", weight: 0.08 },
      { categoryKey: "utilities", weight: 0.1 },
      { categoryKey: "internet", weight: 0.05 },
      { categoryKey: "housing", weight: 0.2 },
      { categoryKey: "health", weight: 0.05 },
      { categoryKey: "shopping", weight: 0.05 },
      { categoryKey: "entertainment", weight: 0.03 },
      { categoryKey: "subscription", weight: 0.03 },
      { categoryKey: "family", weight: 0.03 },
      { categoryKey: "debt", weight: 0.02 },
      { categoryKey: "saving", weight: 0.06 },
      { categoryKey: "emergency", weight: 0.04 }
    ]
  },
  ambitious: {
    defaultTotal: 7500000,
    weights: [
      { categoryKey: "food", weight: 0.11 },
      { categoryKey: "groceries", weight: 0.14 },
      { categoryKey: "transport", weight: 0.07 },
      { categoryKey: "fuel", weight: 0.07 },
      { categoryKey: "utilities", weight: 0.09 },
      { categoryKey: "internet", weight: 0.04 },
      { categoryKey: "housing", weight: 0.18 },
      { categoryKey: "health", weight: 0.05 },
      { categoryKey: "education", weight: 0.05 },
      { categoryKey: "shopping", weight: 0.04 },
      { categoryKey: "entertainment", weight: 0.03 },
      { categoryKey: "subscription", weight: 0.03 },
      { categoryKey: "family", weight: 0.03 },
      { categoryKey: "charity", weight: 0.02 },
      { categoryKey: "debt", weight: 0.02 },
      { categoryKey: "saving", weight: 0.08 },
      { categoryKey: "emergency", weight: 0.05 }
    ]
  }
};

export function getStarterCategories() {
  return STARTER_CATEGORIES;
}

export function getStarterTemplates(walletKind: WalletKind, setupPreset: WalletSetupPreset) {
  const baseTemplates = TEMPLATE_PRESETS[setupPreset];
  return walletKind === "shared" ? [...baseTemplates, ...SHARED_EXTRA_TEMPLATES] : baseTemplates;
}

export function getBudgetPresetRows(args: {
  budgetPreset: BudgetPreset;
  categoryIdsByKey: Map<string, string | null>;
  monthStart: string;
}) {
  if (args.budgetPreset === "none") {
    return [];
  }

  const plan = BUDGET_PRESETS[args.budgetPreset];
  return plan.weights
    .map((item) => {
      const categoryId = args.categoryIdsByKey.get(item.categoryKey);

      if (!categoryId) {
        return null;
      }

      return {
        category_id: categoryId,
        month_start: args.monthStart,
        amount: Math.round(plan.defaultTotal * item.weight / 1000) * 1000
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}
