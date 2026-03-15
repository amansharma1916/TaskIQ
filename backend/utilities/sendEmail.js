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
