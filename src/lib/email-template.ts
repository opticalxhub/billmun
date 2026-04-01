/**
 * BILLMUN branded email template system.
 * All emails sent by the system use this template.
 */

const BRAND_COLOR = "#ffffff";
const BG_COLOR = "#0a0a0a";
const CARD_BG = "#111111";
const BORDER_COLOR = "#222222";
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "#999999";
const TEXT_MUTED = "#666666";
const LOGO_URL = "https://billmun.gomarai.com/billmun.png";
const SITE_URL = "https://billmun.gomarai.com";
const INSTAGRAM_URL = "https://www.instagram.com/billmun.sa";
const CONTACT_EMAIL = "pr@billmun.gomarai.com";

function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text: string): string {
  const sanitized = sanitizeText(text);
  return sanitized
    .split(/\n\n+/)
    .map((para) => {
      const lines = para.split(/\n/).join("<br/>");
      return `<p style="margin:0 0 16px 0;line-height:1.7;color:${TEXT_PRIMARY};font-size:15px;">${lines}</p>`;
    })
    .join("");
}

export function generateEmailHTML(
  subject: string,
  bodyText: string,
  recipientName?: string
): string {
  const greeting = recipientName
    ? `<p style="margin:0 0 16px 0;line-height:1.7;color:${TEXT_PRIMARY};font-size:15px;">Dear ${sanitizeText(recipientName)},</p>`
    : "";

  const bodyHtml = textToHtml(bodyText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${sanitizeText(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Logo -->
<tr><td align="center" style="padding:0 0 24px 0;">
<img src="${LOGO_URL}" alt="BILLMUN" width="120" height="auto" style="display:block;max-width:120px;height:auto;filter:invert(1);"/>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 0 32px 0;">
<div style="height:1px;background-color:${BORDER_COLOR};"></div>
</td></tr>

<!-- Subject -->
<tr><td style="padding:0 0 24px 0;">
<h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT_PRIMARY};letter-spacing:0.02em;">
${sanitizeText(subject)}
</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:0 0 32px 0;">
${greeting}
${bodyHtml}
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 0 24px 0;">
<div style="height:1px;background-color:${BORDER_COLOR};"></div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:0;">
<p style="margin:0 0 8px 0;font-size:12px;color:${TEXT_MUTED};text-align:center;">
&copy; 2026 BILLMUN. All rights reserved.
</p>
<p style="margin:0 0 8px 0;font-size:12px;color:${TEXT_MUTED};text-align:center;">
<a href="${INSTAGRAM_URL}" style="color:${TEXT_SECONDARY};text-decoration:underline;">Instagram</a>
&nbsp;&middot;&nbsp;
<a href="${SITE_URL}" style="color:${TEXT_SECONDARY};text-decoration:underline;">billmun.sa</a>
</p>
<p style="margin:0;font-size:11px;color:${TEXT_MUTED};text-align:center;line-height:1.5;">
This email was sent because you registered for BILLMUN.<br/>
If you believe this was a mistake, contact <a href="mailto:${CONTACT_EMAIL}" style="color:${TEXT_SECONDARY};">${CONTACT_EMAIL}</a>.
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function generateEmailPlainText(
  subject: string,
  bodyText: string,
  recipientName?: string
): string {
  const greeting = recipientName ? `Dear ${recipientName},\n\n` : "";
  return `${subject}\n\n${greeting}${bodyText}\n\n---\n© 2026 BILLMUN. All rights reserved.\nInstagram: ${INSTAGRAM_URL}\nWebsite: ${SITE_URL}\n\nThis email was sent because you registered for BILLMUN.\nIf you believe this was a mistake, contact ${CONTACT_EMAIL}.`;
}
