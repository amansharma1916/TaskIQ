import express from "express";
import mongoose from "mongoose";
import Projects from "../database/Schemas/Project.js";
import Teams from "../database/Schemas/Teams.js";
import { roleResolution } from "../middleware/roleResolution.js";
import { authorizeCapability } from "../middleware/authorizeCapability.js";
import { applyProjectScopeFilter, isCeo, isTeamInManagerScope } from "../middleware/scopeFilters.js";
import logActivity from "../utilities/logActivity.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(roleResolution);

const requireCompanyScope = (req, res) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ message: "Authenticated user is not linked to a company" });
    return null;
  }
  return companyId;
};

const parseTeamIds = (teamIds) => {
  if (!Array.isArray(teamIds)) {
    return [];
  }

  return teamIds
    .filter((value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));
};

const parseDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const managerCanTouchAllTeams = (req, teamIds) => {
  if (isCeo(req) || !req.authz?.scopedEnforcement || req.authz?.managerScope === "company") {
    return true;
  }

  return teamIds.every((teamId) => isTeamInManagerScope(req, teamId));
};

router.post("/create", authorizeRoles("CEO", "Manager"), authorizeCapability("projects:create"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const {
      projectName,
      projectDescription,
      projectStatus,
      dueDate,
      progress,
      completedTasks,
      totalTasks,
      assignedTeams,
    } = req.body;

    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return res.status(400).json({ message: "projectName is required" });
    }

    const teamIds = parseTeamIds(assignedTeams);
    if (Array.isArray(assignedTeams) && assignedTeams.length !== teamIds.length) {
      return res.status(400).json({ message: "One or more team IDs are invalid" });
    }

    if (teamIds.length > 0) {
      const teamsCount = await Teams.countDocuments({ _id: { $in: teamIds }, companyId });
      if (teamsCount !== teamIds.length) {
        return res.status(400).json({ message: "One or more teams do not belong to this company" });
      }
    }

    if (!managerCanTouchAllTeams(req, teamIds)) {
      return res.status(403).json({ message: "Cannot assign project to teams outside your scope" });
    }

    const project = await Projects.create({
      projectName: projectName.trim(),
      projectDescription,
      projectStatus,
      dueDate: parseDateOrNull(dueDate),
      progress,
      completedTasks,
      totalTasks,
      companyId,
      assignedTeams: teamIds,
      owner: req.user?.userId ?? null,
    });

    const populated = await Projects.findById(project._id).populate("assignedTeams", "teamName teamDescription");

    await logActivity({
      req,
      action: "project.create",
      targetType: "project",
      targetId: project._id,
      metadata: {
        projectName: project.projectName,
        assignedTeams: teamIds.map((teamId) => String(teamId)),
      },
    });

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const projects = await Projects.find(applyProjectScopeFilter(req, { companyId }))
      .sort({ createdAt: -1 })
      .populate("assignedTeams", "teamName teamDescription");

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const project = await Projects.findOne(applyProjectScopeFilter(req, { _id: req.params.id, companyId })).populate(
      "assignedTeams",
      "teamName teamDescription totalMembers"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorizeRoles("CEO", "Manager"), authorizeCapability("projects:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const {
      projectName,
      projectDescription,
      projectStatus,
      dueDate,
      progress,
      completedTasks,
      totalTasks,
      assignedTeams,
    } = req.body;

    const updates = {};

    if (typeof projectName === "string") {
      updates.projectName = projectName.trim();
    }
    if (typeof projectDescription === "string") {
      updates.projectDescription = projectDescription;
    }
    if (typeof projectStatus === "string") {
      updates.projectStatus = projectStatus;
    }
    if (typeof progress === "number") {
      updates.progress = progress;
    }
    if (typeof completedTasks === "number") {
      updates.completedTasks = completedTasks;
    }
    if (typeof totalTasks === "number") {
      updates.totalTasks = totalTasks;
    }
    if (dueDate !== undefined) {
      updates.dueDate = parseDateOrNull(dueDate);
    }

    if (assignedTeams !== undefined) {
      const teamIds = parseTeamIds(assignedTeams);
      if (Array.isArray(assignedTeams) && assignedTeams.length !== teamIds.length) {
        return res.status(400).json({ message: "One or more team IDs are invalid" });
      }

      if (teamIds.length > 0) {
        const teamsCount = await Teams.countDocuments({ _id: { $in: teamIds }, companyId });
        if (teamsCount !== teamIds.length) {
          return res.status(400).json({ message: "One or more teams do not belong to this company" });
        }
      }

      updates.assignedTeams = teamIds;

      if (!managerCanTouchAllTeams(req, teamIds)) {
        return res.status(403).json({ message: "Cannot assign project to teams outside your scope" });
      }
    }

    const project = await Projects.findOneAndUpdate(applyProjectScopeFilter(req, { _id: req.params.id, companyId }), updates, {
      new: true,
      runValidators: true,
    }).populate("assignedTeams", "teamName teamDescription totalMembers");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await logActivity({
      req,
      action: "project.update",
      targetType: "project",
      targetId: project._id,
      metadata: {
        fields: Object.keys(updates),
      },
    });

    return res.json(project);
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

    const deleted = await Projects.findOneAndDelete({ _id: req.params.id, companyId });

    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    await logActivity({
      req,
      action: "project.delete",
      targetType: "project",
      targetId: deleted._id,
      metadata: {
        projectName: deleted.projectName,
      },
    });

    return res.json({ message: "Project discarded successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/assign-teams", authorizeRoles("CEO", "Manager"), authorizeCapability("projects:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const teamIds = parseTeamIds(req.body?.teamIds);

    if (teamIds.length === 0) {
      return res.status(400).json({ message: "teamIds must contain at least one valid team id" });
    }

    const teamsCount = await Teams.countDocuments({ _id: { $in: teamIds }, companyId });
    if (teamsCount !== teamIds.length) {
      return res.status(400).json({ message: "One or more teams do not belong to this company" });
    }

    if (!managerCanTouchAllTeams(req, teamIds)) {
      return res.status(403).json({ message: "Cannot assign teams outside your scope" });
    }

    const projectBeforeUpdate = await Projects.findOne(applyProjectScopeFilter(req, { _id: req.params.id, companyId })).populate(
      "assignedTeams",
      "teamName"
    );

    if (!projectBeforeUpdate) {
      return res.status(404).json({ message: "Project not found" });
    }

    const existingTeamIdSet = new Set(
      (projectBeforeUpdate.assignedTeams ?? []).map((team) => String(team._id))
    );

    const duplicateTeamIds = teamIds.filter((teamId) => existingTeamIdSet.has(String(teamId)));

    if (duplicateTeamIds.length > 0) {
      const duplicateTeams = await Teams.find({ _id: { $in: duplicateTeamIds } }).select("teamName");
      const duplicateTeamNames = duplicateTeams
        .map((team) => team.teamName)
        .filter(Boolean)
        .join(", ");

      return res.status(409).json({
        message: duplicateTeamNames
          ? `Team already assigned: ${duplicateTeamNames}`
          : "One or more selected teams are already assigned to this project",
      });
    }

    const project = await Projects.findOneAndUpdate(
      applyProjectScopeFilter(req, { _id: req.params.id, companyId }),
      { $addToSet: { assignedTeams: { $each: teamIds } } },
      { new: true, runValidators: true }
    ).populate("assignedTeams", "teamName teamDescription totalMembers");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await logActivity({
      req,
      action: "project.assign_teams",
      targetType: "project",
      targetId: project._id,
      metadata: {
        teamIds: teamIds.map((teamId) => String(teamId)),
      },
    });

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/revoke-teams", authorizeRoles("CEO", "Manager"), authorizeCapability("projects:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const teamIds = parseTeamIds(req.body?.teamIds);

    if (teamIds.length === 0) {
      return res.status(400).json({ message: "teamIds must contain at least one valid team id" });
    }

    if (!managerCanTouchAllTeams(req, teamIds)) {
      return res.status(403).json({ message: "Cannot revoke teams outside your scope" });
    }

    const project = await Projects.findOneAndUpdate(
      applyProjectScopeFilter(req, { _id: req.params.id, companyId }),
      { $pull: { assignedTeams: { $in: teamIds } } },
      { new: true, runValidators: true }
    ).populate("assignedTeams", "teamName teamDescription totalMembers");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await logActivity({
      req,
      action: "project.revoke_teams",
      targetType: "project",
      targetId: project._id,
      metadata: {
        teamIds: teamIds.map((teamId) => String(teamId)),
      },
    });

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
