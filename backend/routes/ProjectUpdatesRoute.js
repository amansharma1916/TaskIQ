import express from "express";
import mongoose from "mongoose";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";
import { roleResolution } from "../middleware/roleResolution.js";
import { authorizeCapability } from "../middleware/authorizeCapability.js";
import {
  applyProjectScopeFilter,
  getManagerScopeTeamIds,
  isCeo,
  isTeamInManagerScope,
} from "../middleware/scopeFilters.js";
import Teams from "../database/Schemas/Teams.js";
import Projects from "../database/Schemas/Project.js";
import ProjectUpdate from "../database/Schemas/ProjectUpdate.js";
import ProjectUpdateReadState from "../database/Schemas/ProjectUpdateReadState.js";
import logActivity from "../utilities/logActivity.js";

const router = express.Router();

const ROLES = ["CEO", "Manager", "Employee"];
const PRIORITIES = ["low", "medium", "high"];
const AUDIENCE_MODES = ["company", "teams", "projectTeams"];

router.use(authenticateJWT);
router.use(roleResolution);

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const uniqueObjectIdArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((value) => toObjectId(value))
    .filter(Boolean)
    .map((id) => String(id));

  return [...new Set(normalized)].map((value) => new mongoose.Types.ObjectId(value));
};

const uniqueRoleArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const roles = values
    .filter((value) => typeof value === "string" && ROLES.includes(value))
    .map((value) => value.trim());

  return [...new Set(roles)];
};

const requireCompanyScope = (req, res) => {
  const companyId = req.authz?.companyId ?? req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ message: "Authenticated user is not linked to a company" });
    return null;
  }
  return companyId;
};

const isCompanyManager = (req) =>
  req.authz?.effectiveRole === "Manager" &&
  (!req.authz?.scopedEnforcement || req.authz?.managerScope === "company");

const getViewerTeamIds = (req) => {
  if (isCeo(req) || !req.authz?.scopedEnforcement || req.authz?.managerScope === "company") {
    return [];
  }

  if (req.authz?.effectiveRole === "Manager") {
    return getManagerScopeTeamIds(req);
  }

  const memberTeamId = toObjectId(req.authz?.memberTeamId);
  return memberTeamId ? [memberTeamId] : [];
};

const canManageAnyUpdate = (req) => isCeo(req) || isCompanyManager(req);

const ensureTeamsBelongToCompany = async (companyId, teamIds) => {
  if (teamIds.length === 0) {
    return true;
  }

  const count = await Teams.countDocuments({ companyId, _id: { $in: teamIds } });
  return count === teamIds.length;
};

const resolveAudienceConfig = async ({ req, res, companyId, body, existingProjectId = null }) => {
  const audience = body?.audience ?? {};
  const audienceMode =
    typeof audience.mode === "string" && AUDIENCE_MODES.includes(audience.mode)
      ? audience.mode
      : "company";

  const projectIdRaw = body?.projectId ?? existingProjectId;
  const projectId = toObjectId(projectIdRaw);

  let project = null;
  if (projectId) {
    project = await Projects.findOne(
      applyProjectScopeFilter(req, {
        _id: projectId,
        companyId,
      })
    ).select("_id assignedTeams");

    if (!project) {
      res.status(404).json({ message: "Project not found or outside your scope" });
      return null;
    }
  }

  const visibleRoles = uniqueRoleArray(audience?.roles ?? body?.visibleRoles ?? []);
  if (Array.isArray(audience?.roles) && visibleRoles.length !== audience.roles.length) {
    res.status(400).json({ message: "One or more role filters are invalid" });
    return null;
  }

  let targetTeamIds = [];

  if (audienceMode === "teams") {
    targetTeamIds = uniqueObjectIdArray(audience?.teamIds);
    if (!Array.isArray(audience?.teamIds) || targetTeamIds.length === 0) {
      res.status(400).json({ message: "At least one valid team id is required for teams audience mode" });
      return null;
    }

    if (!(await ensureTeamsBelongToCompany(companyId, targetTeamIds))) {
      res.status(400).json({ message: "One or more selected teams do not belong to this company" });
      return null;
    }
  }

  if (audienceMode === "projectTeams") {
    if (!project) {
      res.status(400).json({ message: "projectId is required for projectTeams audience mode" });
      return null;
    }

    targetTeamIds = uniqueObjectIdArray(project.assignedTeams ?? []);
    if (targetTeamIds.length === 0) {
      res.status(400).json({ message: "This project has no assigned teams" });
      return null;
    }

    if (req.authz?.effectiveRole === "Manager" && req.authz?.scopedEnforcement && req.authz?.managerScope === "team") {
      targetTeamIds = targetTeamIds.filter((teamId) => isTeamInManagerScope(req, teamId));
      if (targetTeamIds.length === 0) {
        res.status(403).json({ message: "Cannot target this project because none of its teams are in your scope" });
        return null;
      }
    }
  }

  if (project && audienceMode === "teams") {
    const projectTeamSet = new Set((project.assignedTeams ?? []).map((id) => String(id)));
    const outsideProjectTeams = targetTeamIds.some((id) => !projectTeamSet.has(String(id)));
    if (outsideProjectTeams) {
      res.status(400).json({ message: "Selected teams must be assigned to the selected project" });
      return null;
    }
  }

  if (req.authz?.effectiveRole === "Manager" && req.authz?.scopedEnforcement && req.authz?.managerScope === "team") {
    const outOfScope = targetTeamIds.some((teamId) => !isTeamInManagerScope(req, teamId));
    if (outOfScope) {
      res.status(403).json({ message: "Cannot target teams outside your manager scope" });
      return null;
    }
  }

  return {
    audienceMode,
    targetTeamIds,
    visibleRoles,
    projectId: project?._id ?? projectId ?? null,
  };
};

const getVisibilityFilter = (req) => {
  const role = req.authz?.effectiveRole ?? req.user?.role ?? "Employee";
  const roleFilter = {
    $or: [{ visibleRoles: { $size: 0 } }, { visibleRoles: role }],
  };

  if (isCeo(req) || !req.authz?.scopedEnforcement || req.authz?.managerScope === "company") {
    return roleFilter;
  }

  const viewerTeamIds = getViewerTeamIds(req);
  if (viewerTeamIds.length === 0) {
    return {
      $and: [
        roleFilter,
        {
          audienceMode: "company",
        },
      ],
    };
  }

  return {
    $and: [
      roleFilter,
      {
        $or: [{ audienceMode: "company" }, { targetTeamIds: { $in: viewerTeamIds } }],
      },
    ],
  };
};

const withReadState = async ({ updates, companyId, userId }) => {
  const updateIds = updates.map((item) => item._id);
  if (updateIds.length === 0) {
    return [];
  }

  const readStates = await ProjectUpdateReadState.find({
    companyId,
    userId,
    updateId: { $in: updateIds },
  }).select("updateId readAt");

  const readMap = new Map(readStates.map((state) => [String(state.updateId), state.readAt]));

  return updates.map((update) => ({
    ...update.toObject(),
    isRead: readMap.has(String(update._id)),
    readAt: readMap.get(String(update._id)) ?? null,
  }));
};

router.post("/", authorizeRoles("CEO", "Manager"), authorizeCapability("updates:create"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }
    if (!body) {
      return res.status(400).json({ message: "body is required" });
    }

    const priority = PRIORITIES.includes(req.body?.priority) ? req.body.priority : "medium";
    const isPinned = Boolean(req.body?.isPinned);

    const audienceConfig = await resolveAudienceConfig({ req, res, companyId, body: req.body });
    if (!audienceConfig) {
      return;
    }

    const update = await ProjectUpdate.create({
      companyId,
      projectId: audienceConfig.projectId,
      title,
      body,
      priority,
      isPinned,
      audienceMode: audienceConfig.audienceMode,
      targetTeamIds: audienceConfig.targetTeamIds,
      visibleRoles: audienceConfig.visibleRoles,
      createdByUserId: req.user.userId,
      createdByRole: req.authz?.effectiveRole ?? req.user.role,
    });

    await logActivity({
      req,
      action: "update.create",
      targetType: "update",
      targetId: update._id,
      metadata: {
        projectId: update.projectId,
        audienceMode: update.audienceMode,
        priority: update.priority,
      },
    });

    const populated = await ProjectUpdate.findById(update._id).populate("createdByUserId", "name workEmail role");

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", authorizeCapability("updates:read"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const limitRaw = Number(req.query?.limit ?? 30);
    const pageRaw = Number(req.query?.page ?? 1);
    const limit = Number.isNaN(limitRaw) ? 30 : Math.min(Math.max(limitRaw, 1), 100);
    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const skip = (page - 1) * limit;

    const projectId = toObjectId(req.query?.projectId);
    const priority = PRIORITIES.includes(req.query?.priority) ? req.query.priority : null;
    const pinnedOnly = String(req.query?.pinnedOnly ?? "").toLowerCase() === "true";
    const unreadOnly = String(req.query?.unreadOnly ?? "").toLowerCase() === "true";

    const filter = {
      companyId,
      ...(projectId ? { projectId } : {}),
      ...(priority ? { priority } : {}),
      ...(pinnedOnly ? { isPinned: true } : {}),
      ...getVisibilityFilter(req),
    };

    const readStateFilter = {
      companyId,
      userId: req.user.userId,
    };

    if (unreadOnly) {
      const readStates = await ProjectUpdateReadState.find(readStateFilter).select("updateId");
      const readIds = readStates.map((item) => item.updateId);
      filter._id = { $nin: readIds };
    }

    const [items, total] = await Promise.all([
      ProjectUpdate.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdByUserId", "name workEmail role")
        .populate("projectId", "projectName")
        .populate("targetTeamIds", "teamName"),
      ProjectUpdate.countDocuments(filter),
    ]);

    const data = await withReadState({ updates: items, companyId, userId: req.user.userId });

    return res.json({
      items: data,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/unread-count", authorizeCapability("updates:read"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const visibleFilter = {
      companyId,
      ...getVisibilityFilter(req),
    };

    const [visibleIds, readStates] = await Promise.all([
      ProjectUpdate.find(visibleFilter).select("_id"),
      ProjectUpdateReadState.find({ companyId, userId: req.user.userId }).select("updateId"),
    ]);

    const visibleIdSet = new Set(visibleIds.map((item) => String(item._id)));
    const readCount = readStates.reduce((count, state) => {
      if (visibleIdSet.has(String(state.updateId))) {
        return count + 1;
      }
      return count;
    }, 0);

    return res.json({ unreadCount: Math.max(visibleIds.length - readCount, 0) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:id/read", authorizeCapability("updates:read"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const updateId = toObjectId(req.params.id);
    if (!updateId) {
      return res.status(400).json({ message: "Invalid update id" });
    }

    const visibleUpdate = await ProjectUpdate.findOne({
      _id: updateId,
      companyId,
      ...getVisibilityFilter(req),
    }).select("_id");

    if (!visibleUpdate) {
      return res.status(404).json({ message: "Update not found" });
    }

    await ProjectUpdateReadState.findOneAndUpdate(
      { updateId, companyId, userId: req.user.userId },
      { readAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorizeRoles("CEO", "Manager"), authorizeCapability("updates:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const updateId = toObjectId(req.params.id);
    if (!updateId) {
      return res.status(400).json({ message: "Invalid update id" });
    }

    const existing = await ProjectUpdate.findOne({ _id: updateId, companyId });
    if (!existing) {
      return res.status(404).json({ message: "Update not found" });
    }

    if (!canManageAnyUpdate(req) && String(existing.createdByUserId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "You can only edit your own updates" });
    }

    const updates = {};

    if (typeof req.body?.title === "string") {
      const nextTitle = req.body.title.trim();
      if (!nextTitle) {
        return res.status(400).json({ message: "title cannot be empty" });
      }
      updates.title = nextTitle;
    }

    if (typeof req.body?.body === "string") {
      const nextBody = req.body.body.trim();
      if (!nextBody) {
        return res.status(400).json({ message: "body cannot be empty" });
      }
      updates.body = nextBody;
    }

    if (req.body?.priority !== undefined) {
      if (!PRIORITIES.includes(req.body.priority)) {
        return res.status(400).json({ message: "Invalid priority value" });
      }
      updates.priority = req.body.priority;
    }

    if (req.body?.isPinned !== undefined) {
      updates.isPinned = Boolean(req.body.isPinned);
    }

    if (req.body?.audience || req.body?.projectId || req.body?.visibleRoles) {
      const audienceConfig = await resolveAudienceConfig({
        req,
        res,
        companyId,
        body: req.body,
        existingProjectId: existing.projectId,
      });

      if (!audienceConfig) {
        return;
      }

      updates.audienceMode = audienceConfig.audienceMode;
      updates.targetTeamIds = audienceConfig.targetTeamIds;
      updates.visibleRoles = audienceConfig.visibleRoles;
      updates.projectId = audienceConfig.projectId;
    }

    updates.lastEditedByUserId = req.user.userId;
    updates.lastEditedAt = new Date();

    const updated = await ProjectUpdate.findOneAndUpdate({ _id: updateId, companyId }, updates, {
      new: true,
      runValidators: true,
    })
      .populate("createdByUserId", "name workEmail role")
      .populate("projectId", "projectName")
      .populate("targetTeamIds", "teamName");

    await logActivity({
      req,
      action: "update.edit",
      targetType: "update",
      targetId: updateId,
      metadata: { fields: Object.keys(updates) },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/pin", authorizeRoles("CEO", "Manager"), authorizeCapability("updates:pin"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const updateId = toObjectId(req.params.id);
    if (!updateId) {
      return res.status(400).json({ message: "Invalid update id" });
    }

    const existing = await ProjectUpdate.findOne({ _id: updateId, companyId });
    if (!existing) {
      return res.status(404).json({ message: "Update not found" });
    }

    if (!canManageAnyUpdate(req) && String(existing.createdByUserId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "You can only pin your own updates" });
    }

    const isPinned = Boolean(req.body?.isPinned);

    const updated = await ProjectUpdate.findOneAndUpdate(
      { _id: updateId, companyId },
      { isPinned, lastEditedByUserId: req.user.userId, lastEditedAt: new Date() },
      { new: true }
    )
      .populate("createdByUserId", "name workEmail role")
      .populate("projectId", "projectName")
      .populate("targetTeamIds", "teamName");

    await logActivity({
      req,
      action: isPinned ? "update.pin" : "update.unpin",
      targetType: "update",
      targetId: updateId,
      metadata: null,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorizeRoles("CEO", "Manager"), authorizeCapability("updates:delete"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const updateId = toObjectId(req.params.id);
    if (!updateId) {
      return res.status(400).json({ message: "Invalid update id" });
    }

    const existing = await ProjectUpdate.findOne({ _id: updateId, companyId });
    if (!existing) {
      return res.status(404).json({ message: "Update not found" });
    }

    if (!canManageAnyUpdate(req) && String(existing.createdByUserId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "You can only delete your own updates" });
    }

    await ProjectUpdateReadState.deleteMany({ updateId, companyId });
    await ProjectUpdate.deleteOne({ _id: updateId, companyId });

    await logActivity({
      req,
      action: "update.delete",
      targetType: "update",
      targetId: updateId,
      metadata: {
        title: existing.title,
      },
    });

    return res.json({ message: "Update deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
