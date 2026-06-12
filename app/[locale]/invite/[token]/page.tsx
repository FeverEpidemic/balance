import { acceptWalletInvitation } from "@/app/actions/wallets";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { localizePath, resolveLocale, getTranslator, translate } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";

type InviteRecord = {
  id: string;
  wallet_id: string;
  role: "owner" | "editor" | "viewer";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
};

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { locale: localeParam, token } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const query = await searchParams;
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let invitation: InviteRecord | null = null;
  let walletName = t("invite.walletFallback");

  if (admin) {
    const { data } = await admin
      .from("wallet_invitations")
      .select("id, wallet_id, role, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    invitation = (data as InviteRecord | null) ?? null;

    if (invitation) {
      const { data: wallet } = await admin.from("wallets").select("name").eq("id", invitation.wallet_id).maybeSingle();
      walletName = wallet?.name ?? walletName;
    }
  }

  const nextHref = encodeURIComponent(localizePath(locale, `/invite/${token}`));
  const isExpired = invitation ? new Date(invitation.expires_at).getTime() < Date.now() : false;

  return (
    <main className="page-wrap section-gap">
      <ToastFeedback error={query.error} message={query.message} />
      <div className="mx-auto max-w-2xl card">
        <Badge>{t("invite.badge")}</Badge>
        <h1 className="headline-lg mt-4">{t("invite.title")}</h1>

        {!admin ? (
          <div className="mt-4">
            <Notice tone="error">{t("invite.adminMissing")}</Notice>
          </div>
        ) : !invitation ? (
          <div className="mt-4">
            <Notice tone="error">{t("invite.notFound")}</Notice>
          </div>
        ) : (
          <>
            <p className="mt-4 text-muted-foreground">
              {t("invite.description", {
                walletName,
                role: translate(locale, `members.role${invitation.role.charAt(0).toUpperCase()}${invitation.role.slice(1)}`)
              })}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("invite.expiresAt", {
                date: formatDateTime(invitation.expires_at, locale, {
                  dateStyle: "medium",
                  timeStyle: "short"
                })
              })}
            </p>
          </>
        )}

        <div className="mt-8 grid min-w-0 gap-3">
          {!invitation || !admin ? null : invitation.status === "accepted" ? (
            <Notice tone="success">{t("invite.accepted")}</Notice>
          ) : invitation.status === "revoked" ? (
            <Notice tone="error">{t("invite.revoked")}</Notice>
          ) : isExpired || invitation.status === "expired" ? (
            <Notice tone="error">{t("invite.expired")}</Notice>
          ) : !user ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Button href={`${localizePath(locale, "/login")}?next=${nextHref}`}>{t("invite.loginButton")}</Button>
              <Button href={`${localizePath(locale, "/register")}?next=${nextHref}`} variant="ghost">{t("invite.registerButton")}</Button>
            </div>
          ) : (
            <form action={acceptWalletInvitation}>
              <input type="hidden" name="token" value={token} />
              <SubmitButton className="w-full" pendingText={t("invite.acceptPending")}>{t("invite.acceptButton")}</SubmitButton>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
