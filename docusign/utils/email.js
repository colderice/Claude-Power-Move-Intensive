const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const org = () => process.env.ORG_NAME || '3rd Power Outlet';
const fromAddr = () => process.env.EMAIL_FROM || `"${org()}" <${process.env.SMTP_USER}>`;

function emailWrapper(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:20px}
  .card{background:#fff;border-radius:12px;max-width:580px;margin:0 auto;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:#1e293b;padding:28px 36px;color:#fff}
  .header h1{margin:0;font-size:20px;font-weight:600}
  .header p{margin:4px 0 0;color:#94a3b8;font-size:13px}
  .body{padding:32px 36px}
  .body p{color:#374151;line-height:1.6;margin:0 0 16px}
  .btn{display:inline-block;background:#3b82f6;color:#fff!important;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin:8px 0 20px}
  .btn:hover{background:#2563eb}
  .note{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:13px;color:#64748b;margin-top:20px}
  .footer{border-top:1px solid #e2e8f0;padding:20px 36px;font-size:12px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>${org()}</h1>
    <p>Document Signing</p>
  </div>
  <div class="body">
    <h2 style="margin:0 0 20px;color:#1e293b;font-size:22px">${title}</h2>
    ${bodyHtml}
  </div>
  <div class="footer">&copy; ${new Date().getFullYear()} ${org()}. This is an automated message.</div>
</div>
</body>
</html>`;
}

async function sendClientInvite({ client_name, client_email, template_title, signing_url, client_message, is_reminder = false }) {
  const subject = is_reminder
    ? `Reminder: Please sign your "${template_title}" agreement`
    : `Please review and sign: ${template_title}`;

  const personalNote = client_message
    ? `<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;margin-bottom:20px;color:#1e40af;font-style:italic">"${client_message}"</div>`
    : '';

  const html = emailWrapper(
    is_reminder ? `Reminder: Action Required` : `You have a document to sign`,
    `<p>Hi ${client_name},</p>
    ${is_reminder ? '<p>This is a friendly reminder that you have a document awaiting your signature.</p>' : `<p>${org()} has sent you a document for your review and signature.</p>`}
    ${personalNote}
    <p><strong>Document:</strong> ${template_title}</p>
    <p>Please click the button below to review the agreement and add your signature. This link is unique to you and should not be shared.</p>
    <a href="${signing_url}" class="btn">Review &amp; Sign Document</a>
    <div class="note">
      <strong>Note:</strong> By signing this document electronically, you agree that your electronic signature is legally binding. This link will only work once.
      <br><br>If you have questions, reply to this email or contact us at ${process.env.ORG_EMAIL || process.env.SMTP_USER}.
    </div>`
  );

  const transporter = getTransporter();
  await transporter.sendMail({
    from: fromAddr(),
    to: `${client_name} <${client_email}>`,
    subject,
    html,
  });
}

async function sendAdminNotification({ admin_name, admin_email, client_name, template_title, review_url }) {
  const html = emailWrapper(
    `Document signed — action required`,
    `<p>Hi ${admin_name},</p>
    <p><strong>${client_name}</strong> has reviewed and signed the <strong>${template_title}</strong> agreement.</p>
    <p>Please review their submission and add your countersignature to complete the agreement.</p>
    <a href="${review_url}" class="btn">Review &amp; Countersign</a>
    <div class="note">Once you countersign, a completed copy will automatically be emailed to both you and ${client_name}.</div>`
  );

  const transporter = getTransporter();
  await transporter.sendMail({
    from: fromAddr(),
    to: `${admin_name} <${admin_email}>`,
    subject: `Action required: ${client_name} signed "${template_title}"`,
    html,
  });
}

async function sendCompletedCopies({ client_name, client_email, admin_name, admin_email, template_title, pdf_path, instance_id }) {
  const fs = require('fs');
  const pdfBuffer = fs.readFileSync(pdf_path);
  const attachment = {
    filename: `${template_title.replace(/[^a-z0-9]/gi, '-')}-signed.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  };

  const transporter = getTransporter();

  // To client
  const clientHtml = emailWrapper(
    `Your signed agreement is ready`,
    `<p>Hi ${client_name},</p>
    <p>Your <strong>${template_title}</strong> agreement has been fully executed. Both parties have signed.</p>
    <p>A copy of the fully signed agreement is attached to this email for your records.</p>
    <div class="note">
      <strong>Document ID:</strong> ${instance_id}<br>
      Please save this email and the attached PDF for your records. If you have questions, contact us at ${process.env.ORG_EMAIL || process.env.SMTP_USER}.
    </div>`
  );
  await transporter.sendMail({
    from: fromAddr(),
    to: `${client_name} <${client_email}>`,
    subject: `Signed agreement: ${template_title}`,
    html: clientHtml,
    attachments: [attachment],
  });

  // To admin
  const adminHtml = emailWrapper(
    `Agreement fully executed`,
    `<p>Hi ${admin_name},</p>
    <p>The <strong>${template_title}</strong> agreement with <strong>${client_name}</strong> has been fully executed.</p>
    <p>A copy of the signed agreement is attached for your records.</p>
    <div class="note"><strong>Document ID:</strong> ${instance_id}</div>`
  );
  await transporter.sendMail({
    from: fromAddr(),
    to: `${admin_name} <${admin_email}>`,
    subject: `Completed: ${template_title} (signed by ${client_name})`,
    html: adminHtml,
    attachments: [attachment],
  });
}

module.exports = { sendClientInvite, sendAdminNotification, sendCompletedCopies };
