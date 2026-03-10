import express from "express";
import mongoose from "mongoose";
import Tasks from "../database/Schemas/Task.js";
import Projects from "../database/Schemas/Project.js";
import Members from "../database/Schemas/Members.js";
import Teams from "../database/Schemas/Teams.js";
import { roleResolution } from "../middleware/roleResolution.js";
import { authorizeCapability } from "../middleware/authorizeCapability.js";
import { applyTaskScopeFilter, isTeamInManagerScope } from "../middleware/scopeFilters.js";
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

const parseObjectIdOrNull = (value) => {
  if (!value || typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const parseDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isValidStatus = (value) => ["todo", "in-progress", "done"].includes(value);
const isValidPriority = (value) => ["low", "medium", "high"].includes(value);

const syncProjectTaskStats = async (projectId, companyId) => {
  if (!projectId) {
    return;
  }

  const [totalTasks, completedTasks] = await Promise.all([
    Tasks.countDocuments({ companyId, projectId }),
    Tasks.countDocuments({ companyId, projectId, status: "done" }),
  ]);

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await Projects.findOneAndUpdate(
    { _id: projectId, companyId },
    {
      totalTasks,
      completedTasks,
      progress,
    }
  );
};

const ensureCompanyProject = async (projectId, companyId) => {
  if (!projectId) {
    return null;
  }

  return Projects.findOne({ _id: projectId, companyId });
};

const ensureCompanyMember = async (memberId, companyId) => {
  if (!memberId) {
    return null;
  }

  return Members.findOne({ _id: memberId, companyId });
};

const ensureCompanyTeam = async (teamId, companyId) => {
  if (!teamId) {
    return null;
  }

  return Teams.findOne({ _id: teamId, companyId });
};

const isTeamAssignedToProject = (project, teamId) => {
  if (!project || !teamId) {
    return false;
  }

  return (project.assignedTeams ?? []).some((assignedTeamId) => String(assignedTeamId) === String(teamId));
};

const getTaskById = async (taskId, companyId) => {
  return Tasks.findOne({ _id: taskId, companyId })
    .populate("projectId", "projectName")
    .populate("teamId", "teamName")
    .populate("assignee", "memberName memberRole userId");
};

router.post("/create", authorizeRoles("CEO", "Manager"), authorizeCapability("tasks:create"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const { title, description, status, priority, dueDate, projectId, teamId } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    const parsedProjectId = parseObjectIdOrNull(projectId);
    if (!parsedProjectId) {
      return res.status(400).json({ message: "Valid projectId is required" });
    }

    const project = await ensureCompanyProject(parsedProjectId, companyId);
    if (!project) {
      return res.status(404).json({ message: "Project not found in your company" });
    }

    const parsedTeamId = parseObjectIdOrNull(teamId);
    if (teamId !== undefined && teamId !== null && teamId !== "" && !parsedTeamId) {
      return res.status(400).json({ message: "teamId must be a valid team id" });
    }

    if (parsedTeamId) {
      const team = await ensureCompanyTeam(parsedTeamId, companyId);
      if (!team) {
        return res.status(404).json({ message: "Team not found in your company" });
      }

      if (!isTeamAssignedToProject(project, parsedTeamId)) {
        return res.status(400).json({ message: "Selected team is not assigned to the selected project" });
      }

      if (!isTeamInManagerScope(req, parsedTeamId)) {
        return res.status(403).json({ message: "Cannot create tasks for teams outside your scope" });
      }
    }

    if (req.authz?.effectiveRole === "Manager" && req.authz?.scopedEnforcement && req.authz?.managerScope === "team" && !parsedTeamId) {
      return res.status(400).json({ message: "teamId is required for team-scoped manager task creation" });
    }

    if (status && !isValidStatus(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (priority && !isValidPriority(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }

    const createdTask = await Tasks.create({
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: parseDateOrNull(dueDate),
      projectId: parsedProjectId,
      teamId: parsedTeamId,
      assignee: null,
      companyId,
      createdBy: req.user?.userId,
    });

    await syncProjectTaskStats(parsedProjectId, companyId);

    const populated = await getTaskById(createdTask._id, companyId);

    await logActivity({
      req,
      action: "task.create",
      targetType: "task",
      targetId: createdTask._id,
      teamId: createdTask.teamId,
      metadata: {
        title: createdTask.title,
        projectId: String(createdTask.projectId),
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

    const { projectId, teamId, status, priority, q, assigneeMemberId, createdBy } = req.query;
    const filter = { companyId };

    const parsedProjectId = parseObjectIdOrNull(projectId);
    if (projectId !== undefined) {
      if (!parsedProjectId) {
        return res.status(400).json({ message: "Invalid projectId filter" });
      }
      filter.projectId = parsedProjectId;
    }

    const parsedTeamId = parseObjectIdOrNull(teamId);
    if (teamId !== undefined) {
      if (!parsedTeamId) {
        return res.status(400).json({ message: "Invalid teamId filter" });
      }
      filter.teamId = parsedTeamId;
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = status;
    }

    if (priority !== undefined) {
      if (!isValidPriority(priority)) {
        return res.status(400).json({ message: "Invalid priority filter" });
      }
      filter.priority = priority;
    }

    if (typeof q === "string" && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
      ];
    }

    if (assigneeMemberId !== undefined) {
      if (assigneeMemberId === "unassigned") {
        filter.assignee = null;
      } else {
        const parsedAssigneeId = parseObjectIdOrNull(assigneeMemberId);
        if (!parsedAssigneeId) {
          return res.status(400).json({ message: "Invalid assigneeMemberId filter" });
        }
        filter.assignee = parsedAssigneeId;
      }
    }

    if (createdBy !== undefined) {
      const parsedCreatedById = parseObjectIdOrNull(createdBy);
      if (!parsedCreatedById) {
        return res.status(400).json({ message: "Invalid createdBy filter" });
      }
      filter.createdBy = parsedCreatedById;
    }

    const tasks = await Tasks.find(applyTaskScopeFilter(req, filter))
      .sort({ createdAt: -1 })
      .populate("projectId", "projectName")
      .populate("teamId", "teamName")
      .populate("assignee", "memberName memberRole userId");

    return res.json(tasks);
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

    const task = await Tasks.findOne(applyTaskScopeFilter(req, { _id: req.params.id, companyId }))
      .populate("projectId", "projectName")
      .populate("teamId", "teamName")
      .populate("assignee", "memberName memberRole userId");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorizeRoles("CEO", "Manager"), authorizeCapability("tasks:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const existingTask = await Tasks.findOne(applyTaskScopeFilter(req, { _id: req.params.id, companyId }));
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, status, priority, dueDate, projectId, teamId } = req.body;
    const updates = {};
    const nextProjectId = projectId !== undefined ? parseObjectIdOrNull(projectId) : existingTask.projectId;

    if (projectId !== undefined && !nextProjectId) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const project = await ensureCompanyProject(nextProjectId, companyId);
    if (!project) {
      return res.status(404).json({ message: "Project not found in your company" });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "title cannot be empty" });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ message: "description must be a string" });
      }
      updates.description = description;
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updates.status = status;
    }

    if (priority !== undefined) {
      if (!isValidPriority(priority)) {
        return res.status(400).json({ message: "Invalid priority value" });
      }
      updates.priority = priority;
    }

    if (dueDate !== undefined) {
      updates.dueDate = parseDateOrNull(dueDate);
    }

    if (projectId !== undefined) {
      updates.projectId = nextProjectId;
    }

    const nextTeamId =
      teamId !== undefined
        ? (teamId === null || teamId === "" ? null : parseObjectIdOrNull(teamId))
        : existingTask.teamId;

    if (teamId !== undefined) {
      if (teamId !== null && teamId !== "" && !nextTeamId) {
        return res.status(400).json({ message: "Invalid teamId" });
      }

      if (nextTeamId) {
        const team = await ensureCompanyTeam(nextTeamId, companyId);
        if (!team) {
          return res.status(404).json({ message: "Team not found in your company" });
        }

        if (!isTeamAssignedToProject(project, nextTeamId)) {
          return res.status(400).json({ message: "Selected team is not assigned to the selected project" });
        }

        if (!isTeamInManagerScope(req, nextTeamId)) {
          return res.status(403).json({ message: "Cannot move tasks outside your scope" });
        }
      }

      updates.teamId = nextTeamId;
    }

    if (projectId !== undefined && teamId === undefined && existingTask.teamId) {
      if (!isTeamAssignedToProject(project, existingTask.teamId)) {
        return res.status(400).json({ message: "Current team is not assigned to the selected project" });
      }
    }

    updates.assignee = null;

    const updatedTask = await Tasks.findOneAndUpdate(
      applyTaskScopeFilter(req, { _id: req.params.id, companyId }),
      updates,
      { new: true, runValidators: true }
    )
      .populate("projectId", "projectName")
      .populate("teamId", "teamName")
      .populate("assignee", "memberName memberRole userId");

    await logActivity({
      req,
      action: "task.update",
      targetType: "task",
      targetId: updatedTask._id,
      teamId: updatedTask.teamId,
      metadata: {
        fields: Object.keys(updates),
      },
    });

    const currentProjectId = updates.projectId || existingTask.projectId;
    await syncProjectTaskStats(currentProjectId, companyId);
    if (updates.projectId && String(existingTask.projectId) !== String(updates.projectId)) {
      await syncProjectTaskStats(existingTask.projectId, companyId);
    }

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", authorizeCapability("tasks:status:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const { status } = req.body;
    if (!isValidStatus(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Tasks.findOne(applyTaskScopeFilter(req, { _id: req.params.id, companyId }));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = status;
    await task.save();

    await logActivity({
      req,
      action: "task.status.update",
      targetType: "task",
      targetId: task._id,
      teamId: task.teamId,
      metadata: {
        status,
      },
    });

    await syncProjectTaskStats(task.projectId, companyId);
    const populated = await getTaskById(task._id, companyId);

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/assign", authorizeRoles("CEO", "Manager"), authorizeCapability("tasks:assign"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const { assigneeMemberId } = req.body;

    if (assigneeMemberId !== null && !parseObjectIdOrNull(assigneeMemberId)) {
      return res.status(400).json({ message: "assigneeMemberId must be a valid member id or null" });
    }

    const task = await Tasks.findOne(applyTaskScopeFilter(req, { _id: req.params.id, companyId }));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.teamId) {
      return res.status(400).json({ message: "Task must be linked to a team before assignment" });
    }

    let assignee = null;
    if (assigneeMemberId) {
      assignee = await ensureCompanyMember(assigneeMemberId, companyId);
      if (!assignee) {
        return res.status(404).json({ message: "Assignee member not found" });
      }

      if (!assignee.memberTeam || String(assignee.memberTeam) !== String(task.teamId)) {
        return res.status(400).json({ message: "Assignee must belong to task team" });
      }
    }

    task.assignee = assignee?._id ?? null;
    await task.save();

    await logActivity({
      req,
      action: "task.assign",
      targetType: "task",
      targetId: task._id,
      teamId: task.teamId,
      metadata: {
        assigneeMemberId: assignee?._id ? String(assignee._id) : null,
      },
    });

    const populated = await getTaskById(task._id, companyId);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorizeRoles("CEO", "Manager"), authorizeCapability("tasks:update"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const deletedTask = await Tasks.findOneAndDelete(applyTaskScopeFilter(req, { _id: req.params.id, companyId }));
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    await logActivity({
      req,
      action: "task.delete",
      targetType: "task",
      targetId: deletedTask._id,
      teamId: deletedTask.teamId,
      metadata: {
        title: deletedTask.title,
      },
    });

    await syncProjectTaskStats(deletedTask.projectId, companyId);

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;