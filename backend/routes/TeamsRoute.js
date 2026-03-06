import express from "express";
import Teams from "../database/Schemas/Teams.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { teamName, teamDescription, teamTags } = req.body;

    const team = await Teams.create({
      teamName,
      teamDescription,
      teamTags
    });

    res.status(201).json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {

    const teams = await Teams.find().populate("teamMembers");

    res.json(teams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {

    const team = await Teams.findById(req.params.id)
      .populate("teamMembers")
      .populate("teamLead");

    res.json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;