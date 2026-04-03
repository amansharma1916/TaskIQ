import sgMail from "@sendgrid/mail";

let sendgridInitialized = false;

const ensureSendgridConfigured = () => {
  if (sendgridInitialized) {
    return;
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("Email transport is not configured. Set SENDGRID_API_KEY.");
  }
  sgMail.setApiKey(apiKey);
  sendgridInitialized = true;
  
};

const resolveFromEmail = () => {
  const from = process.env.SENDGRID_EMAIL || process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("Email transport is not configured. Set SENDGRID_EMAIL (or EMAIL_FROM).");
  }

  return from;
};

export const sendEmail = async (to, subject, html) => {
  ensureSendgridConfigured();

  const msg = {
    to,
    from: resolveFromEmail(),
    subject,
    html,
  };

  try {
    const [response] = await sgMail.send(msg);
    const messageId = response?.headers?.["x-message-id"] || response?.headers?.["X-Message-Id"];

    if (process.env.EMAIL_DEBUG_SEND === "true") {
      console.log("[email] accepted by provider", {
        to,
        subject,
        statusCode: response?.statusCode,
        messageId: messageId || null,
      });
    }

    return {
      statusCode: response?.statusCode,
      messageId: messageId || null,
    };
  } catch (error) {
    const statusCode = error?.response?.statusCode ? ` status=${error.response.statusCode}` : "";
    const details = Array.isArray(error?.response?.body?.errors)
      ? ` details=${error.response.body.errors.map((item) => item.message).filter(Boolean).join("; ")}`
      : "";
    throw new Error(`Email delivery failed.${statusCode}${details} ${error.message || "Unknown error"}`.trim());
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = "Reset your TaskIQ password";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Password reset request</h2>
      <p style="margin: 0 0 10px;">Hi ${name || "there"},</p>
      <p style="margin: 0 0 14px;">We received a request to reset your TaskIQ password. Use the button below to set a new password.</p>
      <p style="margin: 0 0 20px;">
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #0ea5e9; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px;"
        >
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 10px;">This link expires soon and can only be used once.</p>
      <p style="margin: 0; color: #6b7280; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};
