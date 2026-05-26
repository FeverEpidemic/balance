import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/env";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !from) {
    throw new Error("Konfigurasi SMTP belum lengkap. Periksa SMTP_HOST dan SMTP_FROM.");
  }

  if ((user && !pass) || (!user && pass)) {
    throw new Error("SMTP_USER dan SMTP_PASS harus diisi berpasangan.");
  }

  return { host, port, user, pass, from };
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const config = getSmtpConfig();

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user && config.pass
      ? {
          user: config.user,
          pass: config.pass
        }
      : undefined
  });

  return transporter;
}

export async function sendInviteEmail(params: {
  to: string;
  walletName: string;
  inviterName: string;
  role: string;
  token: string;
}) {
  const { to, walletName, inviterName, role, token } = params;
  const siteUrl = getSiteUrl();
  const inviteUrl = `${siteUrl}/invite/${token}`;
  const roleLabel = role === "editor" ? "Editor" : "Peninjau";
  const config = getSmtpConfig();

  console.log("sendInviteEmail:prepare", {
    to,
    walletName,
    inviterName,
    role,
    smtpHost: config.host,
    smtpPort: config.port,
    smtpUser: config.user ?? null,
    smtpFrom: config.from,
    inviteUrl
  });

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Undangan Wallet Balance</title>
</head>
<body style="font-family: Inter, system-ui, sans-serif; background-color: #fbf9f3; padding: 40px 16px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 20px -2px rgba(45, 54, 39, 0.05);">
    <h1 style="font-family: 'Hanken Grotesk', system-ui, sans-serif; font-size: 24px; font-weight: 600; color: #1b1c18; margin: 0 0 8px 0;">Undangan Wallet Balance</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #46483e; margin: 0 0 24px 0;">
      ${inviterName} mengundang Anda untuk bergabung di wallet <strong>${walletName}</strong> sebagai <strong>${roleLabel}</strong>.
    </p>

    <div style="background-color: #f5f4ed; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 14px; color: #77786d; margin: 0 0 4px 0;">Wallet</p>
      <p style="font-size: 16px; font-weight: 500; color: #1b1c18; margin: 0 0 12px 0;">${walletName}</p>
      <p style="font-size: 14px; color: #77786d; margin: 0 0 4px 0;">Peran</p>
      <p style="font-size: 16px; font-weight: 500; color: #1b1c18; margin: 0 0 12px 0;">${roleLabel}</p>
      <p style="font-size: 14px; color: #77786d; margin: 0 0 4px 0;">Dari</p>
      <p style="font-size: 16px; font-weight: 500; color: #1b1c18; margin: 0;">${inviterName}</p>
    </div>

    <a href="${inviteUrl}" style="display: block; background-color: #595f3d; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500; margin-bottom: 16px;">
      Terima Undangan
    </a>

    <p style="font-size: 14px; line-height: 1.5; color: #77786d; margin: 0 0 8px 0;">
      Atau salin tautan ini ke browser Anda:
    </p>
    <p style="font-size: 14px; line-height: 1.5; color: #595f3d; margin: 0 0 16px 0; word-break: break-all;">
      ${inviteUrl}
    </p>

    <p style="font-size: 13px; line-height: 1.5; color: #c7c7ba; margin: 0;">
      Undangan ini berlaku selama 7 hari. Jika Anda tidak mengenal pengirim ini, abaikan email ini.
    </p>
  </div>
</body>
</html>`.trim();

  const mailer = getTransporter();
  const info = await mailer.sendMail({
    from: `"balance" <${config.from}>`,
    to,
    subject: `${inviterName} mengundang Anda ke wallet "${walletName}" — Balance`,
    html
  });

  console.log("sendInviteEmail:sent", {
    to,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response
  });
}
