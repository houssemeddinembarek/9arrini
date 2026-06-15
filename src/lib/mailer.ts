import nodemailer from "nodemailer";

// Shared SMTP transport. Configure via env (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, SMTP_SECURE, EMAIL_FROM). For Gmail use an App Password.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({ from, ...opts });
}

// Branded email for the password-reset verification code.
export function passwordResetEmail(name: string, code: string): { subject: string; html: string } {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Telmidhi";
  return {
    subject: `${appName} — Code de réinitialisation`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Réinitialisation du mot de passe</h2>
        <p style="color:#555">Bonjour ${name || ""},</p>
        <p style="color:#555">Voici ton code de vérification. Il expire dans 15 minutes :</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;
                    background:#f4f4f5;border-radius:12px;padding:16px;margin:16px 0">${code}</div>
        <p style="color:#999;font-size:13px">Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
        <p style="color:#999;font-size:13px">— L'équipe ${appName}</p>
      </div>
    `,
  };
}
