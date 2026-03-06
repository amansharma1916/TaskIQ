import express from "express";
import Members from "../database/Schemas/Members.js";
import Teams from "../database/Schemas/Teams.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  try {

    const { memberName, memberRole, teamId, userId, companyId } = req.body;

    let resolvedCompanyId = companyId || null;
    if (teamId && !resolvedCompanyId) {
      const team = await Teams.findById(teamId);
      resolvedCompanyId = team?.companyId ?? null;
    }

    const member = await Members.create({
      memberName,
      memberRole,
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

    res.status(201).json(member);

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

    const members = await Members.find({ companyId }).populate("memberTeam");

    res.json(members);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {

    const member = await Members.findByIdAndDelete(req.params.id);

    if (!member) return res.status(404).json({ message: "Member not found" });

    if (member.memberTeam) {
      await Teams.findByIdAndUpdate(member.memberTeam, {
        $pull: { teamMembers: member._id },
        $inc: { totalMembers: -1 }
      });
    }

    res.json({ message: "Member removed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;