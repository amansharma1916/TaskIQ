import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Invite from "../database/Schemas/Invite.js";
import Company from "../database/Schemas/Company.js";
import Teams from "../database/Schemas/Teams.js";
import sendInviteEmail from "../utilities/sendInviteEmail.js";
import { roleResolution } from "../middleware/roleResolution.js";
import { authorizeCapability } from "../middleware/authorizeCapability.js";
import { getManagerScopeTeamIds, isCeo } from "../middleware/scopeFilters.js";
import logActivity from "../utilities/logActivity.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

const parseTeamIds = (teamIds) => {
  if (!Array.isArray(teamIds)) {
    return [];
  }

  return teamIds
    .filter((value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));
};

router.post("/invite", authenticateJWT, roleResolution, authorizeRoles("CEO", "Manager"), authorizeCapability("invite:create"), async (req, res) => {
  try {
    const { email, name, role, scopeType, scopeTeamIds } = req.body;
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

    let inviteRole = role ?? "Employee";
    const requestedScopeType = scopeType === "company" ? "company" : "team";

    let resolvedScopeType = requestedScopeType;
    let resolvedScopeTeamIds = parseTeamIds(scopeTeamIds);

    if (!isCeo(req)) {
      resolvedScopeType = "team";

      if (req.authz?.managerScope === "team") {
        inviteRole = "Employee";
      }

      const managerTeamIds = getManagerScopeTeamIds(req);
      if (req.authz?.managerScope === "company") {
        resolvedScopeTeamIds = resolvedScopeTeamIds.length > 0 ? resolvedScopeTeamIds : [];
      } else {
        resolvedScopeTeamIds = managerTeamIds;
      }

      if (resolvedScopeTeamIds.length === 0) {
        return res.status(400).json({
          message: "Manager invites are team-scoped and require at least one target team",
        });
      }

      if (req.authz?.managerScope !== "company") {
        const scopedTeamIdSet = new Set(managerTeamIds.map((teamId) => String(teamId)));
        const hasOutOfScopeTeam = resolvedScopeTeamIds.some((teamId) => !scopedTeamIdSet.has(String(teamId)));
        if (hasOutOfScopeTeam) {
          return res.status(403).json({ message: "Cannot invite for teams outside your scope" });
        }
      }
    }

    if (isCeo(req) && resolvedScopeType === "company") {
      resolvedScopeTeamIds = [];
    }

    if (!isCeo(req) && resolvedScopeType === "team" && resolvedScopeTeamIds.length === 0) {
      return res.status(400).json({ message: "scopeTeamIds must include at least one valid team id for team scoped invite" });
    }

    if (resolvedScopeTeamIds.length > 0) {
      const teamsCount = await Teams.countDocuments({ _id: { $in: resolvedScopeTeamIds }, companyId });
      if (teamsCount !== resolvedScopeTeamIds.length) {
        return res.status(400).json({ message: "One or more scope teams do not belong to this company" });
      }
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
      role: inviteRole,
      scopeType: resolvedScopeType,
      scopeTeamIds: resolvedScopeTeamIds,
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

    await logActivity({
      req,
      action: "invite.create",
      targetType: "invite",
      targetId: invite._id,
      teamId: resolvedScopeType === "team" ? resolvedScopeTeamIds[0] : null,
      metadata: {
        inviteRole,
        scopeType: resolvedScopeType,
        scopeTeamIds: resolvedScopeTeamIds.map((teamId) => String(teamId)),
      },
    });

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
      scopeType: invite.scopeType,
      scopeTeamIds: invite.scopeTeamIds ?? [],
      companyId: invite.companyId?._id ?? null,
      companyName: invite.companyId?.companyName ?? null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;