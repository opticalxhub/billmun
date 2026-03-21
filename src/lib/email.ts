import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRegistrationConfirmation(email: string, name: string) {
  return resend.emails.send({
    from: "BILLMUN <noreply@billmun.sa>",
    to: email,
    subject: "Registration Received - BILLMUN 2026",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; background: #080808; color: #F0EDE6; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { font-size: 32px; font-weight: bold; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
            .content { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .button { background: #F0EDE6; color: #080808; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .footer { border-top: 1px solid #222222; margin-top: 40px; padding-top: 20px; font-size: 12px; color: #666666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">BILLMUN</div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for registering for BILLMUN 2026! We've received your application and our Executive Board will review it shortly.</p>
              <p>You will receive a notification email once a decision has been made on your registration status.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Your Portal</a>
            </div>
            <div class="footer">
              <p>BILLMUN Conference 2026 • Bilkent University, Ankara, Turkey</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendApprovalEmail(email: string, name: string) {
  return resend.emails.send({
    from: "BILLMUN <noreply@billmun.sa>",
    to: email,
    subject: "Application Approved - BILLMUN 2026",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; background: #080808; color: #F0EDE6; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { font-size: 32px; font-weight: bold; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
            .content { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .button { background: #F0EDE6; color: #080808; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .footer { border-top: 1px solid #222222; margin-top: 40px; padding-top: 20px; font-size: 12px; color: #666666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">BILLMUN</div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Congratulations! Your registration for BILLMUN 2026 has been approved.</p>
              <p>You now have full access to the attendees portal. Here you can view committees, submit documents, and get AI-powered feedback on your work.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Sign In Now</a>
            </div>
            <div class="footer">
              <p>BILLMUN Conference 2026 • Bilkent University, Ankara, Turkey</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendRejectionEmail(email: string, name: string, reason?: string) {
  return resend.emails.send({
    from: "BILLMUN <noreply@billmun.sa>",
    to: email,
    subject: "Registration Update - BILLMUN 2026",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; background: #080808; color: #F0EDE6; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { font-size: 32px; font-weight: bold; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
            .content { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .footer { border-top: 1px solid #222222; margin-top: 40px; padding-top: 20px; font-size: 12px; color: #666666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">BILLMUN</div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for your interest in BILLMUN 2026. Unfortunately, your registration was not approved for this conference cycle.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>For inquiries, please contact us at <a href="mailto:support@billmun.sa">support@billmun.sa</a></p>
            </div>
            <div class="footer">
              <p>BILLMUN Conference 2026 • Bilkent University, Ankara, Turkey</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}