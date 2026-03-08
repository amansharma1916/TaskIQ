import express from "express";
import Teams from "../database/Schemas/Teams.js";
import Members from "../database/Schemas/Members.js";
import Projects from "../database/Schemas/Project.js";
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

router.post("/create", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const { teamName, teamDescription, teamTags } = req.body;
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    if (!teamName) {
      return res.status(400).json({ message: "teamName is required" });
    }

    const team = await Teams.create({
      teamName,
      teamDescription,
      teamTags,
      companyId,
    });

    res.status(201).json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const teams = await Teams.find({ companyId }).populate("teamMembers");

    res.json(teams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const team = await Teams.findOne({ _id: req.params.id, companyId })
      .populate("teamMembers")
      .populate("teamLead");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const team = await Teams.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.companyId) {
      team.companyId = companyId;
      await team.save();
    }

    if (String(team.companyId) !== String(companyId)) {
      return res.status(403).json({ message: "Team not in this company" });
    }

    const forceDisband = req.query.force === "true";

    const relatedProjects = await Projects.find({
      companyId,
      assignedTeams: team._id,
    }).select("projectName");

    if (relatedProjects.length > 0 && !forceDisband) {
      const projectNames = relatedProjects.map((project) => project.projectName).filter(Boolean);
      return res.status(409).json({
        code: "TEAM_ASSIGNED_TO_PROJECTS",
        projects: projectNames,
        message:
          projectNames.length > 0
            ? `This team is assigned to: ${projectNames.join(", ")}. Disbanding will remove the team from these projects.`
            : "This team is assigned to one or more projects. Disbanding will remove the team from those projects.",
      });
    }

    if (relatedProjects.length > 0 && forceDisband) {
      await Projects.updateMany(
        { companyId, assignedTeams: team._id },
        { $pull: { assignedTeams: team._id } }
      );
    }

    await Members.updateMany({ memberTeam: team._id }, { $set: { memberTeam: null } });
    await Teams.findByIdAndDelete(team._id);

    return res.json({ message: "Team disbanded successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/add-member", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const { memberId, teamId } = req.body;
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    if (!memberId || !teamId) {
      return res.status(400).json({ message: "memberId and teamId are required" });
    }

    const member = await Members.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const team = await Teams.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.companyId) {
      team.companyId = companyId;
      await team.save();
    }

    if (String(team.companyId) !== String(companyId)) {
      return res.status(403).json({ message: "Team not in this company" });
    }

    if (!member.companyId) {
      member.companyId = companyId;
      await member.save();
    }

    if (member.companyId && team.companyId && String(member.companyId) !== String(team.companyId)) {
      return res.status(403).json({ message: "Member not in this company" });
    }

    if (member.memberTeam && String(member.memberTeam) === String(teamId)) {
      return res.status(409).json({ message: "Member already in this team" });
    }

    if (member.memberTeam && String(member.memberTeam) !== String(teamId)) {
      await Teams.findByIdAndUpdate(member.memberTeam, {
        $pull: { teamMembers: member._id },
        $inc: { totalMembers: -1 },
      });
    }

    const alreadyInTeam = team.teamMembers.some((id) => String(id) === String(member._id));
    if (!alreadyInTeam) {
      await Teams.findByIdAndUpdate(teamId, {
        $push: { teamMembers: member._id },
        $inc: { totalMembers: 1 },
      });
    }

    member.memberTeam = teamId;
    await member.save();

    return res.json({ message: "Member added to team" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/remove-member", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const { memberId, teamId } = req.body;
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    if (!memberId || !teamId) {
      return res.status(400).json({ message: "memberId and teamId are required" });
    }

    const member = await Members.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const team = await Teams.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.companyId) {
      team.companyId = companyId;
      await team.save();
    }

    if (String(team.companyId) !== String(companyId)) {
      return res.status(403).json({ message: "Team not in this company" });
    }

    if (!member.companyId) {
      member.companyId = companyId;
      await member.save();
    }

    if (member.companyId && String(member.companyId) !== String(companyId)) {
      return res.status(403).json({ message: "Member not in this company" });
    }

    if (!member.memberTeam || String(member.memberTeam) !== String(teamId)) {
      return res.status(409).json({ message: "Member is not assigned to this team" });
    }

    await Teams.findByIdAndUpdate(teamId, {
      $pull: { teamMembers: member._id },
      $inc: { totalMembers: -1 },
    });

    member.memberTeam = null;
    await member.save();

    return res.json({ message: "Member removed from team" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/set-lead", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const { memberId, teamId } = req.body;
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    if (!memberId || !teamId) {
      return res.status(400).json({ message: "memberId and teamId are required" });
    }

    const member = await Members.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const team = await Teams.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.companyId) {
      team.companyId = companyId;
      await team.save();
    }

    if (String(team.companyId) !== String(companyId)) {
      return res.status(403).json({ message: "Team not in this company" });
    }

    if (!member.companyId) {
      member.companyId = companyId;
      await member.save();
    }

    if (member.companyId && team.companyId && String(member.companyId) !== String(team.companyId)) {
      return res.status(403).json({ message: "Member not in this company" });
    }

    await Teams.findByIdAndUpdate(teamId, { teamLead: memberId });

    return res.json({ message: "Team lead set successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;