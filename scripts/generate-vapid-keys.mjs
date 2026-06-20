import fs from "fs";
import path from "path";
import webPush from "web-push";

const envPath = path.resolve(process.cwd(), ".env");

function main() {
  console.log("[vapid-generator] Checking VAPID configuration...");

  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  } else {
    console.log("[vapid-generator] .env file not found. Creating a new one from .env.example...");
    const examplePath = path.resolve(process.cwd(), ".env.example");
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, "utf-8");
    }
  }

  const hasPublicKey = envContent.includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY=");
  const hasPrivateKey = envContent.includes("VAPID_PRIVATE_KEY=");
  const hasSubject = envContent.includes("VAPID_SUBJECT=");

  if (hasPublicKey && hasPrivateKey && hasSubject) {
    console.log("[vapid-generator] VAPID keys are already configured in .env.");
    return;
  }

  console.log("[vapid-generator] Generating new VAPID keys...");
  const vapidKeys = webPush.generateVAPIDKeys();

  let newLines = [];
  
  if (!hasPublicKey) {
    newLines.push(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  }
  if (!hasPrivateKey) {
    newLines.push(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  }
  if (!hasSubject) {
    // Attempt to extract support email or default
    let supportEmail = "support@mybalance.my.id";
    const emailMatch = envContent.match(/SUPPORT_EMAIL=([^\r\n]+)/);
    if (emailMatch && emailMatch[1]) {
      supportEmail = emailMatch[1].trim();
    }
    newLines.push(`VAPID_SUBJECT=mailto:${supportEmail}`);
  }

  if (newLines.length > 0) {
    const divider = "\n\n# ── Web Push / VAPID Keys (Auto-generated) ────────────────────────────\n";
    fs.appendFileSync(envPath, divider + newLines.join("\n") + "\n");
    console.log("[vapid-generator] Successfully appended new VAPID keys to .env");
  }
}

main();
