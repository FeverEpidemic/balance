import { notFound } from "next/navigation";
import { createWalletInvitation } from "@/app/actions/wallets";
import { requireUser } from "@/lib/auth";
import { getWalletBundle, queryInvitationTokens } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/notice";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { InvitationShareActions } from "@/components/invitation-share-actions";
import { getSiteUrl } from "@/lib/env";
import { getLocaleTag, getTranslator, resolveLocale } from "@/lib/i18n";
import { MAX_WALLET_MEMBERS, summarizeWalletCapacity } from "@/lib/wallet-capacity";

function getRoleLabel(role: "owner" | "editor" | "viewer", t: ReturnType<typeof getTranslator>) {
  if (role === "owner") return t("members.roleOwner");
  if (role === "editor") return t("members.roleEditor");
  return t("members.roleViewer");
}

export default async function MembersPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { locale: localeParam, walletId } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const query = await searchParams;
  const active = `/wallets/${walletId}/members`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  const pendingInvitations = bundle.invitations.filter((invite) => invite.status === "pending");
  const invitationTokens = bundle.wallet.role === "owner"
    ? await queryInvitationTokens(walletId)
    : new Map<string, string>();
  const capacity = summarizeWalletCapacity(bundle.members, bundle.invitations);
  const siteUrl = getSiteUrl();

  return (
    <AppShell
      currentPath={active}
      title={t("members.pageTitle")}
      subtitle={t("members.pageSubtitle", { walletName: bundle.wallet.name })}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <ToastFeedback error={query.error} message={query.message} />
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card">
          <p className="eyebrow">{t("members.inviteEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("members.inviteTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("members.inviteDescription")}</p>
          <div className="mt-4 info-tile">
            <p className="font-label text-sm text-muted-foreground">{t("members.capacityLabel")}</p>
            <p className="mt-2 metric text-2xl">
              {capacity.occupiedSlots}/{MAX_WALLET_MEMBERS}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t("members.capacitySummary", { memberCount: capacity.memberCount, pendingCount: capacity.pendingInvitationCount })}</p>
          </div>
          {bundle.wallet.role === "owner" ? (
            capacity.isFull ? (
              <div className="mt-6">
                <Notice>{t("members.walletFullNotice")}</Notice>
              </div>
            ) : (
              <form action={createWalletInvitation} className="mt-6 grid gap-4">
                <input type="hidden" name="wallet_id" value={walletId} />
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("members.accessLabel")}</span>
                  <select name="role" defaultValue="viewer">
                    <option value="viewer">{t("members.roleViewer")}</option>
                    <option value="editor">{t("members.roleEditor")}</option>
                  </select>
                </label>
                <SubmitButton pendingText={t("members.createPending")}>{t("members.createButton")}</SubmitButton>
              </form>
            )
          ) : (
            <div className="mt-6">
              <Notice>{t("members.ownerOnlyNotice")}</Notice>
            </div>
          )}

          <div className="mt-6 stack-list">
            <p className="font-label text-sm text-muted-foreground">{t("members.activeInvitationsLabel")}</p>
            {pendingInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("members.emptyInvitations")}</p>
            ) : (
              pendingInvitations.map((invite) => (
                <div key={invite.id} className="list-card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{t("members.invitationTitle", { role: getRoleLabel(invite.role, t) })}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("members.expiresAt", {
                          date: new Intl.DateTimeFormat(getLocaleTag(locale), {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(new Date(invite.expires_at))
                        })}
                      </p>
                    </div>
                    <Badge>{getRoleLabel(invite.role, t)}</Badge>
                  </div>
                  {bundle.wallet.role === "owner" ? (
                    <InvitationShareActions
                      inviteUrl={`${siteUrl}/invite/${invitationTokens.get(invite.id) ?? ""}`}
                      role={invite.role}
                      walletName={bundle.wallet.name}
                    />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">{t("members.listEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("members.listTitle")}</h3>
          <div className="mt-6 stack-list">
            {bundle.members.map((member) => {
              const profile = bundle.profileMap.get(member.user_id);
              return (
                <div key={member.user_id} className="list-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{profile?.full_name || profile?.email || member.user_id}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{profile?.email || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{getRoleLabel(member.role, t)}</Badge>
                    <Badge tone="success">{t("common.active")}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
