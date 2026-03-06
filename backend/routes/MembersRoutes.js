import express from "express";
import Members from "../database/Schemas/Members.js";
import Teams from "../database/Schemas/Teams.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  try {

    const { memberName, memberRole, teamId } = req.body;

    const member = await Members.create({
      memberName,
      memberRole,
      memberTeam: teamId
    });

    await Teams.findByIdAndUpdate(teamId, {
      $push: { teamMembers: member._id },
      $inc: { totalMembers: 1 }
    });

    res.status(201).json(member);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {

    const members = await Members.find().populate("memberTeam");

    res.json(members);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {

    const member = await Members.findByIdAndDelete(req.params.id);

    if (!member) return res.status(404).json({ message: "Member not found" });

    await Teams.findByIdAndUpdate(member.memberTeam, {
      $pull: { teamMembers: member._id },
      $inc: { totalMembers: -1 }
    });

    res.json({ message: "Member removed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;