import express from "express";
import crypto from "crypto";
import Invite from "../database/Schemas/Invite.js";
import Company from "../database/Schemas/Company.js";
import sendInviteEmail from "../utilities/sendInviteEmail.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/invite", authenticateJWT, authorizeRoles("CEO"), async (req, res) => {
  try {
    const { email, name, role } = req.body;
    const companyId = req.user?.companyId;

    if (!email || !name) {
      return res.status(400).json({ message: "email and name are required" });
    }

    if (!companyId) {
      return res.status(400).json({ message: "Authenticated user is not linked to a company" });
    }

    if (role && !["Manager", "Employee"].includes(role)) {
      return res.status(400).json({ message: "role must be Manager or Employee" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingPendingInvite = await Invite.findOne({
      email: normalizedEmail,
      companyId,
      used: false,
    });

    if (existingPendingInvite) {
      return res.status(409).json({ message: "A pending invite already exists for this email" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await Invite.create({
      email: normalizedEmail,
      name,
      role: role ?? "Employee",
      companyId,
      token,
    });

    const registerBase = process.env.INVITE_LINK_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${registerBase}/register/invite?token=${token}`;

    try {
      await sendInviteEmail(normalizedEmail, link, name, company.companyName);
    } catch (emailError) {
      await Invite.findByIdAndDelete(invite._id).catch(() => null);
      throw emailError;
    }

    return res.json({ message: "Invite sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/validate/:token", async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token }).populate("companyId");

    if (!invite || invite.used) {
      return res.status(400).json({ message: "Invalid invite" });
    }

    return res.json({
      email: invite.email,
      name: invite.name,
      role: invite.role,
      companyId: invite.companyId?._id ?? null,
      companyName: invite.companyId?.companyName ?? null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;