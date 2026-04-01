import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRegistrationConfirmation(email: string, name: string) {
  return resend.emails.send({
    from: "BILLMUN <billmun@gomarai.com>",
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
              <p>BILLMUN Conference 2026</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendApprovalEmail(email: string, name: string) {
  return resend.emails.send({
    from: "BILLMUN <billmun@gomarai.com>",
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
              <p>BILLMUN Conference 2026</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendRejectionEmail(email: string, name: string, reason?: string) {
  return resend.emails.send({
    from: "BILLMUN <billmun@gomarai.com>",
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
              <p>For inquiries, please contact us at <a href="mailto:support@billmun.gomarai.com">support@billmun.gomarai.com</a></p>
            </div>
            <div class="footer">
              <p>BILLMUN Conference 2026</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendReportEmail(reportData: any) {
  const { category, issue_type, description, user_details, metadata, timestamp, report_id } = reportData;
  
  let detailedContent = "";
  if (category === "PORTAL") {
    detailedContent = `
      <p><strong>Request Engineer In-Person:</strong> ${metadata.request_engineer ? "YES" : "No"}</p>
    `;
  } else if (category === "IN_PERSON") {
    detailedContent = `
      <p><strong>Person Responsible:</strong> ${metadata.person_responsible}</p>
      <p><strong>Location:</strong> ${metadata.location}</p>
      <p><strong>Time:</strong> ${metadata.time}</p>
      <p><strong>Witnesses:</strong> ${metadata.witnesses || "None"}</p>
    `;
  } else if (category === "MEDICAL") {
    detailedContent = `
      <p><strong>Patient Name:</strong> ${metadata.patient_name}</p>
      <p><strong>Exact Location:</strong> ${metadata.location}</p>
      <p><strong>Immediate Assistance Needed:</strong> ${metadata.immediate_assistance ? "YES" : "No"}</p>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
          .header { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
          .urgent { border-left: 4px solid #ef4444; background: #fef2f2; }
          .label { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; margin-top: 10px; }
          .value { font-size: 16px; margin-bottom: 10px; }
          .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container ${category === 'MEDICAL' ? 'urgent' : ''}">
          <div class="header">
            <h2 style="margin:0; color: ${category === 'MEDICAL' ? '#ef4444' : '#111'};">
              ${category === 'MEDICAL' ? '[URGENT] MEDICAL EMERGENCY' : '[ALERT] ISSUE REPORTED'}
            </h2>
            <p style="margin:5px 0 0 0; font-size: 14px;">Report ID: ${report_id}</p>
          </div>

          <div class="label">Category</div>
          <div class="value">${category}</div>

          <div class="label">Issue Type</div>
          <div class="value">${issue_type}</div>

          <div class="label">Description</div>
          <div class="value" style="white-space: pre-wrap;">${description}</div>

          ${detailedContent}

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

          <h3 style="margin-bottom: 10px;">User Details</h3>
          <p><strong>Name:</strong> ${user_details.full_name}</p>
          <p><strong>Role:</strong> ${user_details.role}</p>
          <p><strong>Grade:</strong> ${user_details.grade}</p>
          <p><strong>Committee:</strong> ${user_details.committee}</p>
          <p><strong>Email:</strong> ${user_details.email}</p>

          <div class="footer">
            <p>Sent via BILLMUN Portal &middot; ${new Date(timestamp).toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return resend.emails.send({
    from: "BILLMUN Reports <billmun@gomarai.com>",
    to: ["opticalxhub@gmail.com", "alaa2030abbadi@gmail.com"],
    subject: `${category === 'MEDICAL' ? '[URGENT] MEDICAL' : '[ALERT] ISSUE'}: ${issue_type} - ${user_details.full_name}`,
    html,
  });
}
