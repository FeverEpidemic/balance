import { notFound } from "next/navigation";
import { archiveSaving, createSaving, createSavingDeposit, createSavingWithdrawal, updateSaving } from "@/app/actions/savings";
import { requireUser } from "@/lib/auth";
import { getSavingsPageData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrency, formatShortDate, getTodayDateString } from "@/lib/utils";

export default async function SavingsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const active = `/wallets/${walletId}/savings`;
  const { user } = await requireUser();
  const data = await getSavingsPageData(user.id, walletId);

  if (!data) {
    notFound();
  }

  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath={active}
      title="Tabungan"
      subtitle={`Pisahkan saldo dan target tabungan untuk ${data.walletName}`}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted-foreground">Saldo siap pakai</p>
          <p className="metric mt-2 text-2xl">{formatCurrency(data.walletSummary.availableBalance)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Saldo tabungan</p>
          <p className="metric mt-2 text-2xl">{formatCurrency(data.walletSummary.savingBalance)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="metric mt-2 text-2xl">{formatCurrency(data.walletSummary.totalBalance)}</p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)]">
        <div className="card min-w-0">
          <p className="eyebrow">Tabungan baru</p>
          <h3 className="headline-md mt-2">Buat pos tabungan terpisah</h3>
          <div className="mt-4 space-y-3">
            {query.error ? <Notice tone="error">{query.error}</Notice> : null}
            {query.message ? <Notice tone="success">{query.message}</Notice> : null}
            {!canMutate ? <Notice tone="info">Viewer hanya bisa melihat tabungan dan riwayat mutasinya.</Notice> : null}
          </div>
          {canMutate ? (
            <form action={createSaving} className="mt-6 grid gap-4">
              <input type="hidden" name="wallet_id" value={data.walletId} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Nama tabungan</span>
                <input name="name" placeholder="Dana darurat" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Target nominal</span>
                <input name="target_amount" placeholder="Opsional" inputMode="numeric" />
              </label>
              <SubmitButton pendingText="Menyimpan tabungan...">Buat tabungan</SubmitButton>
            </form>
          ) : null}
        </div>

        <div className="card min-w-0">
          <p className="eyebrow">Daftar tabungan</p>
          <h3 className="headline-md mt-2">Saldo tabungan per wallet</h3>
          <div className="mt-6 space-y-4">
            {data.savings.length === 0 ? (
              <EmptyState title="Belum ada tabungan" description="Buat tabungan pertama untuk mulai memisahkan saldo tujuan tertentu." />
            ) : null}
            {data.savings.map((saving) => (
              <article key={saving.id} className="rounded-2xl bg-muted p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-display text-xl">{saving.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {saving.isArchived ? "Tabungan diarsipkan" : saving.progressLabel}
                      {saving.targetAmount ? ` • target ${formatCurrency(saving.targetAmount)}` : ""}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="metric text-2xl">{formatCurrency(saving.currentBalance)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Saldo saat ini</p>
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${saving.targetAmount ? saving.progressRatio : 0}%` }} />
                </div>

                {canMutate && !saving.isArchived ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                    <form action={createSavingDeposit} className="min-w-0 rounded-xl bg-white/80 p-4">
                      <input type="hidden" name="wallet_id" value={data.walletId} />
                      <input type="hidden" name="saving_id" value={saving.id} />
                      <p className="font-medium">Setor</p>
                      <div className="mt-3 grid gap-3">
                        <input name="amount" placeholder="Nominal" inputMode="numeric" required />
                        {data.walletKind === "shared" ? (
                          <select name="member_user_id" defaultValue={data.memberOptions[0]?.userId ?? ""} required>
                            {data.memberOptions.map((member) => (
                              <option key={member.userId} value={member.userId}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <input name="note" placeholder="Catatan" />
                        <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                        <SubmitButton className="w-full" pendingText="Menyimpan...">
                          Simpan setor
                        </SubmitButton>
                      </div>
                    </form>

                    <form action={createSavingWithdrawal} className="min-w-0 rounded-xl bg-white/80 p-4">
                      <input type="hidden" name="wallet_id" value={data.walletId} />
                      <input type="hidden" name="saving_id" value={saving.id} />
                      <p className="font-medium">Tarik</p>
                      <div className="mt-3 grid gap-3">
                        <input name="amount" placeholder="Nominal" inputMode="numeric" required />
                        <input name="note" placeholder="Catatan" />
                        <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                        <SubmitButton className="w-full" pendingText="Menyimpan...">
                          Simpan tarik
                        </SubmitButton>
                      </div>
                    </form>

                    <div className="min-w-0 rounded-xl bg-white/80 p-4 lg:col-span-2 2xl:col-span-1">
                      <p className="font-medium">Kelola tabungan</p>
                      <form action={updateSaving} className="mt-3 grid gap-3">
                        <input type="hidden" name="wallet_id" value={data.walletId} />
                        <input type="hidden" name="saving_id" value={saving.id} />
                        <input name="name" defaultValue={saving.name} required />
                        <input name="target_amount" defaultValue={saving.targetAmount ?? ""} placeholder="Target opsional" inputMode="numeric" />
                        <SubmitButton className="w-full" pendingText="Menyimpan..." variant="soft">
                          Update tabungan
                        </SubmitButton>
                      </form>
                      <form action={archiveSaving} className="mt-3">
                        <input type="hidden" name="wallet_id" value={data.walletId} />
                        <input type="hidden" name="saving_id" value={saving.id} />
                        <ConfirmSubmitButton
                          className="w-full"
                          confirmMessage="Arsipkan saving ini?"
                          pendingText="Mengarsipkan..."
                          variant="ghost"
                        >
                          Arsipkan tabungan
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ) : null}

                {data.walletKind === "shared" ? (
                  <div className="mt-4 rounded-xl bg-white/80 p-4">
                    <p className="font-medium">Kontribusi anggota</p>
                    <div className="mt-3 space-y-2">
                      {saving.contributions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada kontribusi anggota yang tercatat.</p>
                      ) : (
                        saving.contributions.map((contribution) => (
                          <div key={contribution.memberUserId} className="flex items-center justify-between gap-3 text-sm">
                            <span>{contribution.memberName}</span>
                            <span className="metric">{formatCurrency(contribution.totalContributed)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl bg-white/80 p-4">
                  <p className="font-medium">Riwayat mutasi</p>
                  <div className="mt-3 space-y-3">
                    {saving.entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada mutasi pada tabungan ini.</p>
                    ) : (
                      saving.entries.map((entry) => (
                        <div key={entry.id} className="flex flex-col gap-2 rounded-xl bg-muted p-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">{entry.type === "deposit" ? "Setor" : "Tarik"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {entry.note || "Tanpa catatan"}
                              {entry.memberName ? ` • ${entry.memberName}` : ""}
                            </p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className={`metric ${entry.type === "deposit" ? "text-success" : "text-danger"}`}>
                              {formatCurrency(entry.type === "deposit" ? entry.amount : -entry.amount)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(entry.happenedAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
