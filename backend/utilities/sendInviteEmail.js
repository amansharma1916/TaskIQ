import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInviteEmail = async (email, link, invitedName, inviterCompany) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

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
};

export default sendInviteEmail;