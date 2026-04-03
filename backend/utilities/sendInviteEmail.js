import { sendEmail } from "./sendEmail.js";

const sendInviteEmail = async (email, link, invitedName, inviterCompany) => {
  await sendEmail(
    email,
    "Team Invitation - TaskIQ",
    `
      <h2>You are invited to join ${inviterCompany || "a TaskIQ workspace"}</h2>
      <p>Hi ${invitedName},</p>
      <p>Click the link below to complete your registration.</p>
      <a href="${link}">Join Team</a>
      <p>If you did not expect this invite, you can ignore this email.</p>
    `,
  );
};
export default sendInviteEmail;

