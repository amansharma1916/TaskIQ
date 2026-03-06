import express from "express";
import Teams from "../database/Schemas/Teams.js";
import Members from "../database/Schemas/Members.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { teamName, teamDescription, teamTags, companyId } = req.body;

    if (!teamName || !companyId) {
      return res.status(400).json({ message: "teamName and companyId are required" });
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
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId query param is required" });
    }

    const teams = await Teams.find({ companyId }).populate("teamMembers");

    res.json(teams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({ message: "companyId query param is required" });
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

router.delete("/:id", async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId query param is required" });
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

    await Members.updateMany({ memberTeam: team._id }, { $set: { memberTeam: null } });
    await Teams.findByIdAndDelete(team._id);

    return res.json({ message: "Team disbanded successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/add-member", async (req, res) => {
  try {
    const { memberId, teamId, companyId } = req.body;

    if (!memberId || !teamId || !companyId) {
      return res.status(400).json({ message: "memberId, teamId, and companyId are required" });
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

router.patch("/set-lead", async (req, res) => {
  try {
    const { memberId, teamId, companyId } = req.body;

    if (!memberId || !teamId || !companyId) {
      return res.status(400).json({ message: "memberId, teamId, and companyId are required" });
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