import nodemailer from "nodemailer";
import { logger } from "./logger";

// ── Lazy SMTP transport ───────────────────────────────────────────────────────
// Configure via environment variables:
//   SMTP_HOST   — e.g. smtp.gmail.com
//   SMTP_PORT   — e.g. 587 (TLS) or 465 (SSL)
//   SMTP_USER   — your email address / SMTP login
//   SMTP_PASS   — your email app password
//   SMTP_FROM   — display name + address, e.g. "SmartZim <noreply@smartzim.co.zw>"
//
// If these are not set the functions log a warning and return without crashing.

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? "587");
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return _transporter;
}

const FROM = () =>
  process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "SmartZim <noreply@smartzim.co.zw>";

const SITE = () => process.env.SITE_ORIGIN ?? "https://smartzim.co.zw";

// ── Shared HTML wrapper ───────────────────────────────────────────────────────
function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#fdf6ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c2b22}
  .shell{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #e2ede8;overflow:hidden;box-shadow:0 2px 16px rgba(26,107,60,.07)}
  .hd{background:#1a6b3c;padding:28px 32px;display:flex;align-items:center;gap:12px}
  .hd-logo{width:36px;height:36px}
  .hd-name{color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px}
  .body{padding:32px}
  h2{margin:0 0 12px;font-size:20px;font-weight:700}
  p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a4d40}
  .tip{background:#e8f5ee;border-radius:10px;padding:14px 18px;font-size:14px;color:#1a6b3c;margin:20px 0}
  .cta{display:inline-block;background:#d97706;color:#fff;font-size:15px;font-weight:600;border-radius:10px;padding:13px 28px;text-decoration:none;margin:8px 0}
  .reason{background:#fff8f0;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;font-size:14px;color:#92400e;margin:16px 0}
  .ft{padding:20px 32px;border-top:1px solid #e2ede8;font-size:12px;color:#6b7c72;text-align:center}
  .ft a{color:#1a6b3c;text-decoration:none}
</style>
</head>
<body>
<div class="shell">
  <div class="hd">
    <div class="hd-name">SmartZim</div>
  </div>
  <div class="body">${body}</div>
  <div class="ft">SmartZim · ZIMSEC &amp; Cambridge Exam Prep · <a href="${SITE()}">${SITE().replace(/^https?:\/\//, "")}</a></div>
</div>
</body>
</html>`;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export async function sendApprovalEmail(to: string, name: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.warn({ to }, "SMTP not configured — skipping approval email");
    return;
  }
  const site = SITE();
  await t.sendMail({
    from: FROM(),
    to,
    subject: "🎉 Your SmartZim account is approved!",
    html: wrap(`
      <h2>Welcome to SmartZim, ${name}! 🎉</h2>
      <p>Great news — your account has been <strong>approved</strong>. Your 7-day free trial starts right now.</p>
      <div class="tip">
        <strong>What you can do straight away:</strong><br/>
        ✅ Access past papers &amp; study notes<br/>
        ✅ Chat with ZimTutor, your AI study coach<br/>
        ✅ Take daily quizzes and track your progress<br/>
        ✅ Generate a personalised weekly study plan
      </div>
      <a class="cta" href="${site}/app">Start Learning Now →</a>
      <p style="font-size:13px;color:#6b7c72;margin-top:20px">If you have any questions, reply to this email or contact us at support@smartzim.co.zw.</p>
    `),
  });
}

export async function sendRejectionEmail(to: string, name: string, reason: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.warn({ to }, "SMTP not configured — skipping rejection email");
    return;
  }
  await t.sendMail({
    from: FROM(),
    to,
    subject: "Your SmartZim registration update",
    html: wrap(`
      <h2>Hi ${name},</h2>
      <p>Thank you for registering on SmartZim. Unfortunately your account could not be approved at this time.</p>
      ${reason && reason !== "No reason provided" ? `<div class="reason"><strong>Reason given:</strong><br/>${reason}</div>` : ""}
      <p>If you believe this is a mistake or you'd like to provide more information, please reach out to us:</p>
      <p><a href="mailto:support@smartzim.co.zw" style="color:#1a6b3c">support@smartzim.co.zw</a></p>
      <p style="font-size:13px;color:#6b7c72">You're welcome to register again with updated details.</p>
    `),
  });
}

export async function sendWelcomeEmail(to: string, name: string, role: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.warn({ to }, "SMTP not configured — skipping welcome email");
    return;
  }
  const site = SITE();
  const isStudent = role === "student";
  await t.sendMail({
    from: FROM(),
    to,
    subject: "🎓 Welcome to SmartZim — your account is ready!",
    html: wrap(`
      <h2>Welcome to SmartZim, ${name}! 🎉</h2>
      <p>Your account has been created and your <strong>7-day free trial</strong> starts right now.</p>
      ${isStudent ? `
      <div class="tip">
        <strong>Get started straight away:</strong><br/>
        ✅ Access past papers &amp; study notes<br/>
        ✅ Chat with ZimTutor, your AI study coach<br/>
        ✅ Take daily quizzes and track your progress<br/>
        ✅ Generate a personalised weekly study plan
      </div>
      ` : `
      <div class="tip">
        <strong>As a teacher you can:</strong><br/>
        ✅ Upload notes &amp; study materials for students<br/>
        ✅ Create and grade assignments<br/>
        ✅ Manage your class channels<br/>
        ✅ Build your teacher profile
      </div>
      `}
      <a class="cta" href="${site}/app">Go to Dashboard →</a>
      <p style="font-size:13px;color:#6b7c72;margin-top:20px">Questions? Contact us at <a href="mailto:support@smartzim.co.zw" style="color:#1a6b3c">support@smartzim.co.zw</a></p>
    `),
  });
}

export async function sendSubscriptionEmail(to: string, name: string, plan: string, expiry: Date): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.warn({ to }, "SMTP not configured — skipping subscription email");
    return;
  }
  const site = SITE();
  const expiryStr = expiry.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  await t.sendMail({
    from: FROM(),
    to,
    subject: "✅ Your SmartZim subscription is active",
    html: wrap(`
      <h2>Subscription activated, ${name}!</h2>
      <p>Your <strong>${plan}</strong> plan is now active until <strong>${expiryStr}</strong>.</p>
      <div class="tip">You now have full access to all SmartZim features — past papers, AI tutor, mock exams, and more.</div>
      <a class="cta" href="${site}/app">Go to Dashboard →</a>
    `),
  });
}
