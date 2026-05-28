import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/lib/env";

type WalletInviteEmailPayload = {
  inviteUrl: string;
  invitedEmail: string;
  inviterName: string;
  role: "owner" | "editor" | "viewer";
  walletName: string;
  expiresAt: string;
};

type DeliveryProvider = "smtp" | "mxroute_api";

function getDeliveryProvider(host: string) {
  const rawProvider = process.env.EMAIL_DELIVERY_PROVIDER?.trim().toLowerCase();

  if (rawProvider === "smtp" || rawProvider === "mxroute_api") {
    return rawProvider;
  }

  const normalizedHost = host.toLowerCase();
  if (
    normalizedHost.includes("mxroute") ||
    normalizedHost.includes("mxrouting") ||
    normalizedHost.includes("mxlogin")
  ) {
    return "mxroute_api";
  }

  return "smtp";
}

export async function sendWalletInvitationEmail(payload: WalletInviteEmailPayload) {
  const config = getSmtpConfig();

  if (!config) {
    throw new Error("SMTP belum dikonfigurasi. Isi SMTP_HOST, SMTP_PORT, dan SMTP_FROM untuk mengirim undangan.");
  }
  const provider: DeliveryProvider = getDeliveryProvider(config.host);
  const smtpApiUrl = process.env.MXROUTE_SMTP_API_URL?.trim() || "https://smtpapi.mxroute.com/";

  const expiresLabel = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(payload.expiresAt));

  const subject = `Undangan gabung wallet ${payload.walletName}`;
  const text = [
    `Halo ${payload.invitedEmail},`,
    "",
    `${payload.inviterName} mengundang Anda untuk bergabung ke wallet "${payload.walletName}" sebagai ${payload.role}.`,
    "",
    `Buka tautan ini untuk menerima undangan: ${payload.inviteUrl}`,
    "",
    `Undangan ini berlaku sampai ${expiresLabel}.`
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #23301f;">
      <p>Halo ${escapeHtml(payload.invitedEmail)},</p>
      <p><strong>${escapeHtml(payload.inviterName)}</strong> mengundang Anda untuk bergabung ke wallet <strong>${escapeHtml(payload.walletName)}</strong> sebagai <strong>${escapeHtml(payload.role)}</strong>.</p>
      <p>
        <a href="${escapeHtml(payload.inviteUrl)}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #595f3d; color: #ffffff; text-decoration: none; font-weight: 600;">
          Buka undangan
        </a>
      </p>
      <p>Jika tombol tidak bisa dibuka, gunakan tautan ini:</p>
      <p><a href="${escapeHtml(payload.inviteUrl)}">${escapeHtml(payload.inviteUrl)}</a></p>
      <p>Undangan ini berlaku sampai ${escapeHtml(expiresLabel)}.</p>
    </div>
  `;

  if (provider === "mxroute_api") {
    const username = config.auth?.user ?? config.from;
    const password = config.auth?.pass;

    if (!password) {
      throw new Error("MXroute API membutuhkan SMTP_USER dan SMTP_PASS yang valid.");
    }

    const response = await fetch(smtpApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        server: config.host,
        username,
        password,
        from: config.from,
        to: payload.invitedEmail,
        subject,
        body: html
      })
    });

    const rawBody = await response.text();
    let apiResult: { success?: boolean; message?: string } | null = null;

    try {
      apiResult = rawBody ? (JSON.parse(rawBody) as { success?: boolean; message?: string }) : null;
    } catch {
      apiResult = null;
    }

    if (!response.ok || apiResult?.success === false) {
      throw new Error(apiResult?.message || `MXroute API mengembalikan status ${response.status}.`);
    }

    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });

  await transporter.sendMail({
    from: config.from,
    to: payload.invitedEmail,
    subject,
    text,
    html
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
