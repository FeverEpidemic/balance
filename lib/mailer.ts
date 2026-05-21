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

export async function sendWalletInvitationEmail(payload: WalletInviteEmailPayload) {
  const config = getSmtpConfig();

  if (!config) {
    throw new Error("SMTP belum dikonfigurasi. Isi SMTP_HOST, SMTP_PORT, dan SMTP_FROM untuk mengirim undangan.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });

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
