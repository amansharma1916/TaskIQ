import nodemailer from "nodemailer";

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const createTransport = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = parseBoolean(process.env.EMAIL_SECURE, port === 465);

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }

  const service = process.env.EMAIL_SERVICE || "gmail";
  return nodemailer.createTransport({
    service,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
};

const transporter = createTransport();
let transporterVerified = false;

const ensureTransporter = async () => {
  if (transporterVerified) {
    return;
  }

  await transporter.verify();
  transporterVerified = true;
};

const sendInviteEmail = async (email, link, invitedName, inviterCompany) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email transport is not configured. Set EMAIL_USER and EMAIL_PASS.");
  }

  await ensureTransporter();

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: "Team Invitation - TaskIQ",
      html: `
        <h2>You are invited to join ${inviterCompany || "a TaskIQ workspace"}</h2>
        <p>Hi ${invitedName},</p>
        <p>Click the link below to complete your registration.</p>
        <a href="${link}">Join Team</a>
        <p>If you did not expect this invite, you can ignore this email.</p>
      `,
    });
  } catch (error) {
    const smtpCode = error?.code ? ` code=${error.code}` : "";
    const smtpResponse = error?.responseCode ? ` responseCode=${error.responseCode}` : "";
    throw new Error(`Email delivery failed.${smtpCode}${smtpResponse} ${error.message}`.trim());
  }
};

export default sendInviteEmail;