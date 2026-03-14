import express from "express";
import Members from "../database/Schemas/Members.js";
import Teams from "../database/Schemas/Teams.js";
import Users from "../database/Schemas/Users.js";
import { roleResolution } from "../middleware/roleResolution.js";
import { getManagerScopeTeamIds } from "../middleware/scopeFilters.js";
import logActivity from "../utilities/logActivity.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(roleResolution);

const applyMemberScopeFilter = (req, companyId) => {
  const role = req.authz?.effectiveRole;
  const scopedEnforcement = req.authz?.scopedEnforcement;

  if (!scopedEnforcement || role === "CEO") {
    return { companyId };
  }

  if (role === "Manager") {
    if (req.authz?.managerScope === "company") {
      return { companyId };
    }

    const teamIds = getManagerScopeTeamIds(req);
    return { companyId, memberTeam: { $in: teamIds.length > 0 ? teamIds : [] } };
  }

  return { companyId, userId: req.user?.userId };
};

const requireCompanyScope = (req, res) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ message: "Authenticated user is not linked to a company" });
    return null;
  }
  return companyId;
};

router.post("/add", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const { memberName, memberRole, teamId, userId } = req.body;
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    if (req.authz?.effectiveRole === "Manager" && req.authz?.scopedEnforcement && req.authz?.managerScope === "team") {
      return res.status(403).json({ message: "Team-scoped managers cannot create members directly. Send an invite instead." });
    }

    if (!memberName) {
      return res.status(400).json({ message: "memberName is required" });
    }

    if (req.authz?.effectiveRole === "Manager" && req.authz?.scopedEnforcement && req.authz?.managerScope !== "company" && teamId) {
      const managerTeamIdSet = new Set(getManagerScopeTeamIds(req).map((id) => String(id)));
      if (!managerTeamIdSet.has(String(teamId))) {
        return res.status(403).json({ message: "Cannot add members outside your team scope" });
      }
    }

    let resolvedCompanyId = companyId;
    if (teamId) {
      const team = await Teams.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.companyId && String(team.companyId) !== String(companyId)) {
        return res.status(403).json({ message: "Team not in this company" });
      }

      resolvedCompanyId = team?.companyId ?? null;
    }

    const member = await Members.create({
      memberName,
      memberRole,
      scopeType: memberRole === "Manager" ? "team" : "team",
      scopeTeamIds: teamId ? [teamId] : [],
      memberTeam: teamId || null,
      userId: userId || null,
      companyId: resolvedCompanyId,
    });

    if (teamId) {
      await Teams.findByIdAndUpdate(teamId, {
        $push: { teamMembers: member._id },
        $inc: { totalMembers: 1 }
      });
    }

    await logActivity({
      req,
      action: "member.create",
      targetType: "member",
      targetId: member._id,
      teamId: member.memberTeam,
      metadata: {
        memberRole: member.memberRole,
      },
    });

    res.status(201).json(member);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const members = await Members.find(applyMemberScopeFilter(req, companyId)).populate("memberTeam");

    res.json(members);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const member = await Members.findOne({ companyId, userId: req.user?.userId }).populate("memberTeam");

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    return res.json(member);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorizeRoles("CEO"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const member = await Members.findOne({ _id: req.params.id, companyId });

    if (!member) return res.status(404).json({ message: "Member not found" });

    if (member.memberTeam) {
      return res.status(409).json({ message: "Member is assigned to a team. Unassign from team before removing from company." });
    }

    await Members.findByIdAndDelete(member._id);

    if (member.memberTeam) {
      await Teams.findByIdAndUpdate(member.memberTeam, {
        $pull: { teamMembers: member._id },
        $inc: { totalMembers: -1 }
      });
    }

    await logActivity({
      req,
      action: "member.delete",
      targetType: "member",
      targetId: member._id,
      teamId: member.memberTeam,
      metadata: {
        memberRole: member.memberRole,
      },
    });

    res.json({ message: "Member removed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/promote", authorizeRoles("CEO"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const member = await Members.findOne({ _id: req.params.id, companyId });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.memberRole = "Manager";
    if (member.memberTeam) {
      member.scopeTeamIds = [member.memberTeam];
    }
    await member.save();

    if (member.userId) {
      await Users.findByIdAndUpdate(member.userId, {
        role: "Manager",
        managerScope: "team",
        managerTeamIds: member.memberTeam ? [member.memberTeam] : [],
      });
    }

    await logActivity({
      req,
      action: "member.promote",
      targetType: "member",
      targetId: member._id,
      teamId: member.memberTeam,
      metadata: {
        newRole: "Manager",
      },
    });

    return res.json(member);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/demote", authorizeRoles("CEO"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const member = await Members.findOne({ _id: req.params.id, companyId });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.memberRole = "Employee";
    member.scopeType = "team";
    member.scopeTeamIds = member.memberTeam ? [member.memberTeam] : [];
    await member.save();

    if (member.userId) {
      await Users.findByIdAndUpdate(member.userId, {
        role: "Employee",
        managerScope: "team",
        managerTeamIds: [],
      });
    }

    await logActivity({
      req,
      action: "member.demote",
      targetType: "member",
      targetId: member._id,
      teamId: member.memberTeam,
      metadata: {
        newRole: "Employee",
      },
    });

    return res.json(member);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;