export type ChangelogFeature = {
  icon: string;
  text: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  features: ChangelogFeature[];
};

export const changelogs: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "2026-06-09",
    title: "Fitur What's New",
    description: "Pengguna sekarang dapat melihat pembaruan terbaru melalui fitur 'What's New' yang menampilkan perubahan dan penambahan fitur utama di setiap versi.",
    features: [
      { icon: "📄", text: "Export the active month of transaction history to Excel." },
      { icon: "📊", text: "Generate a monthly report PDF with income, expense, trend, and category breakdowns." },
      { icon: "🧭", text: "History pagination now resets or clamps safely when filters shrink the dataset." },
      { icon: "🛡️", text: "Invalid transaction dates now render a safe fallback instead of crashing the page." }
    ]
  },
  {
    version: "1.4.0",
    date: "2026-06-09",
    title: "Cleaner transaction history and exports",
    description: "Transaction history is more stable when filtering, and monthly data is easier to take outside Balance.",
    features: [
      { icon: "📄", text: "Export the active month of transaction history to Excel." },
      { icon: "📊", text: "Generate a monthly report PDF with income, expense, trend, and category breakdowns." },
      { icon: "🧭", text: "History pagination now resets or clamps safely when filters shrink the dataset." },
      { icon: "🛡️", text: "Invalid transaction dates now render a safe fallback instead of crashing the page." }
    ]
  },
  {
    version: "1.3.0",
    date: "2026-06-08",
    title: "Theme-aware polish across the app",
    description: "Balance now treats light mode and dark mode as first-class surfaces across charts, navigation, and auth panels.",
    features: [
      { icon: "🌗", text: "Dashboard charts, wallet navigation, and active states now use theme-aware tokens." },
      { icon: "✨", text: "Auth panels and wallet cards received calmer Serene Capital visual refinements." },
      { icon: "🧩", text: "Agent and design documentation now explicitly cover both rendered theme modes." }
    ]
  },
  {
    version: "1.2.0",
    date: "2026-06-06",
    title: "Recurring transactions and savings",
    description: "Wallets can now automate routine financial activity and track savings as part of the main balance flow.",
    features: [
      { icon: "🔁", text: "Create daily, weekly, or monthly recurring transactions." },
      { icon: "⏱️", text: "Run recurring generation through the scheduler outside the web request path." },
      { icon: "🎯", text: "Track savings goals and connect deposits or withdrawals to wallet balances." }
    ]
  },
  {
    version: "1.1.0",
    date: "2026-06-05",
    title: "Bilingual product surfaces",
    description: "The main app experience now follows the active Indonesian or English locale more consistently.",
    features: [
      { icon: "🌐", text: "Dashboard, wallet details, auth, invite, and public pages read from shared dictionaries." },
      { icon: "💬", text: "Server action feedback now follows the active locale." },
      { icon: "🔐", text: "A bilingual public privacy policy is available from the landing page." }
    ]
  },
  {
    version: "1.0",
    date: "2026-05-15",
    title: "Initial release",
    description: "Aplikasi ini baru rilis",
    features: [
      { icon: "🌐", text: "New Release" },
    ]
  }
];

export function getLatestVersion() {
  return changelogs[0]?.version ?? "0.0.0";
}

export function getUnreadEntries(seenVersion: string | null | undefined) {
  if (!seenVersion) {
    return changelogs;
  }

  return changelogs.filter((entry) => compareVersions(entry.version, seenVersion) > 0);
}

function compareVersions(a: string, b: string) {
  const aParts = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const bParts = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aPart = aParts[index] ?? 0;
    const bPart = bParts[index] ?? 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}
