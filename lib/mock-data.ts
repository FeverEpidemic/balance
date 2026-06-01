export type Role = "owner" | "editor" | "viewer";

export type WalletSummary = {
  id: string;
  name: string;
  kind: "personal" | "shared";
  balance: number;
  spent: number;
  budget: number;
  members: number;
  role: Role;
};

export const wallets: WalletSummary[] = [
  {
    id: "rumah-utama",
    name: "Rumah Utama",
    kind: "shared",
    balance: 12450000,
    spent: 6350000,
    budget: 9000000,
    members: 3,
    role: "owner"
  },
  {
    id: "pribadi-ilham",
    name: "Pribadi Ilham",
    kind: "personal",
    balance: 7840000,
    spent: 2150000,
    budget: 3500000,
    members: 1,
    role: "owner"
  },
  {
    id: "liburan-keluarga",
    name: "Liburan Keluarga",
    kind: "shared",
    balance: 3150000,
    spent: 1825000,
    budget: 5000000,
    members: 4,
    role: "editor"
  }
];

export const categorySpend = [
  { name: "Makanan", value: 1850000, tone: "bg-primary" },
  { name: "Transport", value: 720000, tone: "bg-[#555f4e]" },
  { name: "Tagihan", value: 1325000, tone: "bg-[#7d876d]" },
  { name: "Hiburan", value: 455000, tone: "bg-[#bec4a0]" }
];

export const recentTransactions = [
  {
    id: "trx-1",
    title: "Belanja bulanan",
    wallet: "Rumah Utama",
    category: "Makanan",
    amount: -845000,
    date: "2026-05-20",
    split: "Bagi rata 3 orang"
  },
  {
    id: "trx-2",
    title: "Gaji Mei",
    wallet: "Pribadi Ilham",
    category: "Pemasukan",
    amount: 12000000,
    date: "2026-05-18",
    split: "-"
  },
  {
    id: "trx-3",
    title: "Bensin",
    wallet: "Pribadi Ilham",
    category: "Transport",
    amount: -250000,
    date: "2026-05-17",
    split: "-"
  },
  {
    id: "trx-4",
    title: "Hotel muka",
    wallet: "Liburan Keluarga",
    category: "Travel",
    amount: -1500000,
    date: "2026-05-15",
    split: "Custom"
  }
];

export const monthlyReport = [
  { month: "Jan", income: 10500000, expense: 7200000 },
  { month: "Feb", income: 9800000, expense: 6950000 },
  { month: "Mar", income: 11600000, expense: 7600000 },
  { month: "Apr", income: 10900000, expense: 7350000 },
  { month: "Mei", income: 12000000, expense: 6350000 }
];

export const members = [
  { name: "Ilham", email: "ilham@example.com", role: "owner", status: "Aktif" },
  { name: "Alya", email: "alya@example.com", role: "editor", status: "Aktif" },
  { name: "Rian", email: "rian@example.com", role: "viewer", status: "Undangan" }
];

export const templates = [
  { name: "Belanja mingguan", category: "Makanan", amount: 500000 },
  { name: "Transfer listrik", category: "Tagihan", amount: 750000 },
  { name: "Bensin motor", category: "Transport", amount: 120000 }
];
