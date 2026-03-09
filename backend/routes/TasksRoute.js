import express from "express";
import mongoose from "mongoose";
import Tasks from "../database/Schemas/Task.js";
import Projects from "../database/Schemas/Project.js";
import Members from "../database/Schemas/Members.js";
import Teams from "../database/Schemas/Teams.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);

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
    .populate("teamId", "teamName");
};

router.post("/create", authorizeRoles("CEO", "Manager"), async (req, res) => {
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

    const { projectId, teamId, status, priority, q } = req.query;
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

    const tasks = await Tasks.find(filter)
      .sort({ createdAt: -1 })
      .populate("projectId", "projectName")
      .populate("teamId", "teamName");

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

    const task = await getTaskById(req.params.id, companyId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const existingTask = await Tasks.findOne({ _id: req.params.id, companyId });
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
      { _id: req.params.id, companyId },
      updates,
      { new: true, runValidators: true }
    )
      .populate("projectId", "projectName")
      .populate("teamId", "teamName");

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

router.patch("/:id/status", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const { status } = req.body;
    if (!isValidStatus(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Tasks.findOne({ _id: req.params.id, companyId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isManager = req.user?.role === "CEO" || req.user?.role === "Manager";
    let isTeamMember = false;

    if (task.teamId) {
      const member = await Members.findOne({
        companyId,
        userId: req.user?.userId,
        memberTeam: task.teamId,
      }).select("_id");
      isTeamMember = Boolean(member);
    }

    if (!isManager && !isTeamMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    task.status = status;
    await task.save();

    await syncProjectTaskStats(task.projectId, companyId);
    const populated = await getTaskById(task._id, companyId);

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/assign", authorizeRoles("CEO", "Manager"), async (_req, res) => {
  return res.status(410).json({ message: "Direct assignee assignment is deprecated. Assign team instead." });
});

router.delete("/:id", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const deletedTask = await Tasks.findOneAndDelete({ _id: req.params.id, companyId });
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    await syncProjectTaskStats(deletedTask.projectId, companyId);

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;